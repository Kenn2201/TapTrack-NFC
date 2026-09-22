import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import CardStatusBadge from '../components/cards/CardStatusBadge';
import { cardService } from '../services/cardService';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useAuth from '../hooks/useAuth';
import { extractTokenFromHash, sanitizeUrlFragment } from '../utils/nfcParser';
import {
  classifyUrlCheckInFailure,
  clearAttendanceContext,
  decideTapMode,
  readAttendanceContext,
} from '../utils/attendanceContext';

/**
 * TapLanding — Universal NFC URL Credential Resolution (/t#token)
 * Milestone: v0.5.0 ALPHA + iPhone NFC_URL attendance
 *
 * Flow:
 * 1. Physical NFC card is tapped to iPhone or Android phone.
 * 2. Mobile OS reads NDEF URL: https://nfc.kenncode.me/t#<RAW_TOKEN>
 * 3. Browser navigates to /t#<RAW_TOKEN>.
 * 4. Component reads window.location.hash in memory.
 * 5. Sanitizes URL bar immediately via history.replaceState to prevent credential lingering in browser UI.
 * 6. Chooses the correct mode:
 *    - No active attendance context -> POST /api/nfc/resolve (verification only, NO attendance)
 *    - Active context + authenticated ADMIN/OPERATOR -> POST /api/nfc/check-in/url (attendance)
 *    - Active context + missing/expired/unauthorized -> explicit unauthorized state, NO attendance
 * 7. Raw token stays memory-only and is wiped after use. Never persisted to any storage.
 * 8. Successful attendance keeps the context ACTIVE so the operator can tap multiple cards.
 */
export default function TapLanding() {
  useDocumentTitle('Tap');
  const { authenticated, user, loading: authLoading } = useAuth();

  // 'resolve' | 'attendance' | null
  const [mode, setMode] = useState(null);
  const [resolutionState, setResolutionState] = useState('INITIALIZING'); // INITIALIZING | VERIFYING | SUCCESS | CARD_STATUS_ERROR | NOT_FOUND | MISSING_TOKEN | MALFORMED_TOKEN | NETWORK_ERROR | ATTENDANCE_*
  const [resultData, setResultData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [resolvedAt, setResolvedAt] = useState(null);
  const [credentialReady, setCredentialReady] = useState(false);

  // Guard against double execution in React StrictMode
  const hasExecutedRef = useRef(false);
  // Guard against setState on unmounted component
  const isMountedRef = useRef(true);
  // Ephemeral memory reference for network retry without writing to URL or browser storage
  const retryTokenRef = useRef(null);
  // Ephemeral attendance context for retry (contains ONLY sessionId/eventId/expiresAt)
  const attendanceContextRef = useRef(null);

  const isOperatorOrAdmin = authenticated && user && ['ADMIN', 'OPERATOR'].includes(user.role);

  const executeResolution = async (token) => {
    if (!isMountedRef.current) return;
    setResolutionState('VERIFYING');
    setErrorMessage('');
    setErrorCode('');

    try {
      const data = await cardService.resolveCardToken(token);
      if (!isMountedRef.current) return;
      retryTokenRef.current = null;
      setResultData(data);
      setResolvedAt(new Date());
      setResolutionState('SUCCESS');
    } catch (err) {
      if (!isMountedRef.current) return;
      const code = err.data?.code || err.code || 'UNKNOWN_ERROR';
      const message = err.data?.error || err.message || 'Unable to resolve NFC card credential.';
      setErrorCode(code);
      setErrorMessage(message);

      if (code === 'CARD_NOT_FOUND') {
        retryTokenRef.current = null;
        setResolutionState('NOT_FOUND');
      } else if (['CARD_UNASSIGNED', 'CARD_LOST', 'CARD_REVOKED', 'CARD_REPLACED', 'CARD_DISABLED', 'MEMBER_INACTIVE', 'MEMBER_NOT_ASSIGNED'].includes(code)) {
        retryTokenRef.current = null;
        setResolutionState('CARD_STATUS_ERROR');
      } else if (code === 'INVALID_TOKEN' || code === 'INVALID_TOKEN_FORMAT') {
        retryTokenRef.current = null;
        setResolutionState('MALFORMED_TOKEN');
      } else {
        // Retain token in memory strictly for immediate network retry
        setResolutionState('NETWORK_ERROR');
      }
    }
  };

  const executeUrlCheckIn = async (token, context) => {
    if (!isMountedRef.current) return;
    setResolutionState('VERIFYING');
    setErrorMessage('');
    setErrorCode('');

    try {
      const data = await cardService.recordUrlAttendance(token, context);
      if (!isMountedRef.current) return;
      // Wipe ephemeral token reference immediately upon successful attendance
      retryTokenRef.current = null;
      attendanceContextRef.current = context;
      setResultData(data);
      setResolvedAt(new Date());
      setResolutionState('ATTENDANCE_SUCCESS');
    } catch (err) {
      if (!isMountedRef.current) return;
      const classified = classifyUrlCheckInFailure(err);
      setErrorCode(classified.code);
      setErrorMessage(classified.message);

      const stateMap = {
        UNAUTHORIZED: 'ATTENDANCE_UNAUTHORIZED',
        CLOSED: 'ATTENDANCE_CLOSED',
        DUPLICATE: 'ATTENDANCE_DUPLICATE',
        INVALID_SESSION: 'ATTENDANCE_INVALID_SESSION',
        CARD_ERROR: 'ATTENDANCE_CARD_ERROR',
        NETWORK_ERROR: 'ATTENDANCE_ERROR',
      };
      setResolutionState(stateMap[classified.ui] || 'ATTENDANCE_ERROR');

      if (classified.clearContext) {
        clearAttendanceContext();
        attendanceContextRef.current = null;
      } else {
        // Keep context alive for continued tapping on transient card failures
        attendanceContextRef.current = context;
      }

      if (classified.ui === 'NETWORK_ERROR') {
        // Retain token in memory strictly for immediate network retry
      } else {
        retryTokenRef.current = null;
      }
    }
  };

  const handleRetry = () => {
    const token = retryTokenRef.current;
    if (!token) {
      setResolutionState('MISSING_TOKEN');
      return;
    }
    if (mode === 'attendance') {
      const context = attendanceContextRef.current || readAttendanceContext();
      if (context) {
        executeUrlCheckIn(token, context);
      } else {
        executeResolution(token);
      }
    } else {
      executeResolution(token);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    if (!hasExecutedRef.current) {
      hasExecutedRef.current = true;

      const currentHash = typeof window !== 'undefined' ? window.location?.hash : '';

      if (!currentHash || currentHash === '#') {
        setResolutionState('MISSING_TOKEN');
        return;
      }

      // 1. Extract and structurally validate credential fragment
      const parsed = extractTokenFromHash(currentHash);

      if (!parsed.valid) {
        setResolutionState('MALFORMED_TOKEN');
        setErrorMessage(parsed.error || 'Invalid credential format');
        setErrorCode(parsed.code || 'MALFORMED_TOKEN');
        // Clean fragment even on malformed to prevent lingering in browser history
        sanitizeUrlFragment();
        return;
      }

      // 2. Immediately strip raw token from the browser address bar for user privacy
      sanitizeUrlFragment();

      // 3. Transient memory reference for request and potential network retry
      retryTokenRef.current = parsed.token;
      setCredentialReady(true);
    }

    return () => {
      isMountedRef.current = false;
      // Wipe ephemeral memory on unmount
      retryTokenRef.current = null;
      attendanceContextRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!credentialReady || authLoading) return;
    const token = retryTokenRef.current;
    if (!token) return;

    // 4. Inspect attendance context + authentication, then choose the path
    const context = readAttendanceContext();
    const decision = decideTapMode(context);

    if (decision === 'resolve') {
      // No attendance context -> public verification only, NO attendance
      setMode('resolve');
      executeResolution(token);
      return;
    }

    // Attendance context exists -> attendance mode is required (never silent resolve)
    attendanceContextRef.current = context;

    if (!isOperatorOrAdmin) {
      // Authentication missing/expired/unauthorized -> explicit failure, NO attendance
      clearAttendanceContext();
      attendanceContextRef.current = null;
      retryTokenRef.current = null;
      setMode('attendance');
      setResolutionState('ATTENDANCE_UNAUTHORIZED');
      setErrorMessage('Attendance mode is no longer authorized.');
      return;
    }

    setMode('attendance');
    executeUrlCheckIn(token, context);
  }, [credentialReady, authLoading, isOperatorOrAdmin]);

  const isAttendanceMode = mode === 'attendance';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center">
        {/* Top Identification Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>{isAttendanceMode ? 'iPhone Attendance Mode' : 'Universal NFC URL Fallback'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {isAttendanceMode ? 'NFC Attendance Check-in' : 'NFC Credential Resolution'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            {isAttendanceMode
              ? 'Recording attendance from an operator tap bound to an open iPhone attendance session.'
              : 'Resolving physical NFC card credentials directly via mobile browser fallback.'}
          </p>
        </div>

        {/* Core Card Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden" role="region" aria-live="polite" aria-label={isAttendanceMode ? 'NFC Attendance Check-in Result' : 'NFC Credential Resolution Result'}>
          {/* Subtle Ambient Background Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* STATE: VERIFYING */}
          {resolutionState === 'VERIFYING' && (
            <div className="text-center py-10 space-y-5">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold text-white">Verifying NFC Credential</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {isAttendanceMode
                    ? 'Validating card and recording attendance into the open session...'
                    : 'Validating cryptographic token against TapTrack registry...'}
                </p>
              </div>
            </div>
          )}

          {/* STATE: SUCCESS (ACTIVE & ASSIGNED CARD — VERIFICATION ONLY) */}
          {resolutionState === 'SUCCESS' && resultData && (
            <div className="space-y-6">
              {/* Success Header */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Card Verified Authentic</h3>
                <p className="text-xs text-emerald-400 font-medium">
                  Active card registered in TapTrack system
                </p>
              </div>

              {/* Resolved Card Details */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Card Label</span>
                  <span className="text-sm font-bold font-mono text-white bg-slate-800/80 px-2.5 py-0.5 rounded border border-slate-700">
                    {resultData.card?.cardLabel || 'NFC-CARD'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Card Status</span>
                  <CardStatusBadge status={resultData.card?.status || 'ACTIVE'} size="sm" />
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Assigned Attendee</span>
                  <span className="text-sm font-semibold text-slate-200">
                    {resultData.member?.displayName || 'Active Attendee'}
                  </span>
                </div>

                {resultData.member?.email && (
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Email (Authorized)</span>
                    <span className="text-xs text-slate-300 font-mono">
                      {resultData.member.email}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Resolved At</span>
                  <span className="font-mono">
                    {resolvedAt ? resolvedAt.toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
              </div>

              {/* MANDATORY MILESTONE BOUNDARY NOTICE */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start space-x-3 text-xs text-blue-300">
                <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="leading-relaxed">
                  <strong className="font-semibold text-blue-200">No attendance has been recorded.</strong>
                  <div className="text-blue-200/80 mt-1">
                    Public NFC fallback resolves card authenticity and assignment only. Attendance requires an authenticated operator and an open event session.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/"
                  className="flex-1 text-center px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                >
                  Return to Home
                </Link>
                <Link
                  to="/compatibility"
                  className="flex-1 text-center px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold rounded-xl border border-blue-500/30 transition-colors"
                >
                  Device Compatibility
                </Link>
              </div>
            </div>
          )}

          {/* STATE: ATTENDANCE_SUCCESS (ATTENDANCE RECORDED VIA NFC_URL) */}
          {resolutionState === 'ATTENDANCE_SUCCESS' && resultData && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Attendance Recorded</h3>
                <p className="text-xs text-emerald-400 font-medium">
                  Verified and recorded into the open attendance session
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Card Label</span>
                  <span className="text-sm font-bold font-mono text-white bg-slate-800/80 px-2.5 py-0.5 rounded border border-slate-700">
                    {resultData.card?.cardLabel || 'NFC-CARD'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Method</span>
                  <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    NFC URL
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Session</span>
                  <span className="text-sm font-semibold text-slate-200">
                    #{resultData.record?.sessionId || '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Recorded At</span>
                  <span className="font-mono">
                    {resultData.record?.recordedAt ? new Date(resultData.record.recordedAt).toLocaleTimeString() : (resolvedAt ? resolvedAt.toLocaleTimeString() : 'Just now')}
                  </span>
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-xs text-emerald-300 leading-relaxed flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                <span>iPhone Attendance Mode is still active — ready for next card</span>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/operator"
                  className="flex-1 text-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm shadow-emerald-600/20"
                >
                  Open Operator Console
                </Link>
                <Link
                  to="/t"
                  className="flex-1 text-center px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                >
                  Return to Tap Page
                </Link>
              </div>
            </div>
          )}

          {/* STATE: ATTENDANCE_DUPLICATE (ALREADY RECORDED) */}
          {resolutionState === 'ATTENDANCE_DUPLICATE' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mx-auto flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Already Recorded</h3>
                <p className="text-xs text-amber-400 font-medium">
                  {errorMessage || 'This attendee has already checked into this attendance session.'}
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 text-xs text-slate-400 text-center">
                <strong className="text-slate-300">No duplicate attendance was created.</strong> The session stays active.
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-300 leading-relaxed flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
                <span>iPhone Attendance Mode remains active — ready for next card</span>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/operator"
                  className="flex-1 text-center px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm shadow-amber-600/20"
                >
                  Open Operator Console
                </Link>
                <Link
                  to="/t"
                  className="flex-1 text-center px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                >
                  Return to Tap Page
                </Link>
              </div>
            </div>
          )}

          {/* STATE: ATTENDANCE_UNAUTHORIZED (CONTEXT WITHOUT AUTH SESSION) */}
          {resolutionState === 'ATTENDANCE_UNAUTHORIZED' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mx-auto flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Attendance Mode Is No Longer Authorized</h3>
                <p className="text-xs text-rose-400 font-medium">
                  No attendance was recorded.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 leading-relaxed space-y-2">
                <p>
                  {errorMessage || 'The operator session was not authenticated when this card was tapped.'}
                </p>
                <p className="text-slate-500">
                  Sign in to TapTrack as an operator, select the open session, and tap the attendee&apos;s card again.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/login"
                  className="flex-1 text-center px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold rounded-xl border border-blue-500/30 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/operator"
                  className="flex-1 text-center px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                >
                  Operator Console
                </Link>
              </div>
            </div>
          )}

          {/* STATE: ATTENDANCE_CLOSED (SESSION CLOSED MID-TAP) */}
          {resolutionState === 'ATTENDANCE_CLOSED' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-slate-700/40 text-slate-300 border border-slate-600/40 mx-auto flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Attendance Session Closed</h3>
                <p className="text-xs text-slate-300 font-medium">
                  {errorMessage || 'This attendance session is no longer accepting taps.'}
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 text-xs text-slate-400 text-center">
                <strong className="text-slate-300">No attendance was recorded.</strong> The inactive attendance session has been cleared.
              </div>

              <div className="pt-2 flex justify-center">
                <Link
                  to="/operator"
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors text-center"
                >
                  Open Operator Console
                </Link>
              </div>
            </div>
          )}

          {/* STATE: ATTENDANCE_INVALID_SESSION */}
          {resolutionState === 'ATTENDANCE_INVALID_SESSION' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mx-auto flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Attendance Session No Longer Valid</h3>
                <p className="text-xs text-rose-400 font-medium">
                  {errorMessage || 'The attendance session could not be resolved.'}
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 text-xs text-slate-400 text-center">
                <strong className="text-slate-300">No attendance was recorded.</strong> The invalid attendance session has been cleared.
              </div>

              <div className="pt-2 flex justify-center">
                <Link
                  to="/operator"
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors text-center"
                >
                  Open Operator Console
                </Link>
              </div>
            </div>
          )}

          {/* STATE: ATTENDANCE_CARD_ERROR */}
          {resolutionState === 'ATTENDANCE_CARD_ERROR' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mx-auto flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Card Cannot Be Used</h3>
                <p className="text-xs text-rose-400 font-medium">
                  {errorMessage || 'This card cannot be used for attendance.'}
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Status Flag</span>
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {errorCode?.replace('CARD_', '') || 'INVALID'}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-400 leading-relaxed">
                  {errorCode === 'CARD_UNASSIGNED' && <p>This card credential has not been activated yet.</p>}
                  {errorCode === 'CARD_LOST' && <p>This physical card was reported lost.</p>}
                  {errorCode === 'CARD_REVOKED' && <p>This card was revoked by an administrator.</p>}
                  {errorCode === 'CARD_REPLACED' && <p>This card was replaced by a newly issued card.</p>}
                  {errorCode === 'CARD_DISABLED' && <p>This card is disabled by administrative policy.</p>}
                  {errorCode === 'CARD_NOT_ACTIVE' && <p>This card is not in an active state.</p>}
                  {!['CARD_UNASSIGNED', 'CARD_LOST', 'CARD_REVOKED', 'CARD_REPLACED', 'CARD_DISABLED', 'CARD_NOT_ACTIVE'].includes(errorCode) && (
                    <p>The session stays active. Check the card with an administrator before tapping again.</p>
                  )}
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 text-xs text-slate-400 text-center">
                <strong className="text-slate-300">No attendance recorded.</strong>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/t"
                  className="flex-1 text-center px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                >
                  Tap Again
                </Link>
                <Link
                  to="/operator"
                  className="flex-1 text-center px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                >
                  Operator Console
                </Link>
              </div>
            </div>
          )}

          {/* STATE: CARD_STATUS_ERROR (UNASSIGNED, LOST, REVOKED, REPLACED, DISABLED, MEMBER_INACTIVE) */}
          {resolutionState === 'CARD_STATUS_ERROR' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mx-auto flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Card Inactive or Restricted</h3>
                <p className="text-xs text-amber-400 font-medium">
                  {errorMessage || 'This card cannot be used for verification.'}
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Status Flag</span>
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {errorCode.replace('CARD_', '')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pt-1">
                  {errorCode === 'CARD_UNASSIGNED' && 'This card credential was written but has not yet been activated by an administrator.'}
                  {errorCode === 'CARD_LOST' && 'This physical card was reported lost and has been flagged for safety.'}
                  {errorCode === 'CARD_REVOKED' && 'This card was revoked by an administrator and is permanently invalidated.'}
                  {errorCode === 'CARD_REPLACED' && 'This card was replaced by a newly issued card. Please use your newest physical card.'}
                  {errorCode === 'CARD_DISABLED' && 'This card is currently disabled by administrative policy.'}
                  {errorCode === 'MEMBER_INACTIVE' && 'The user account associated with this card is inactive or disabled.'}
                  {errorCode === 'MEMBER_NOT_ASSIGNED' && 'This card does not have an assigned user.'}
                </p>
              </div>

              {/* No Attendance Notice */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 text-xs text-slate-400 text-center">
                  <strong className="text-slate-300">No attendance recorded.</strong> Card resolution did not alter any system logs or user records.
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/"
                  className="flex-1 text-center px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                >
                  Return to Home
                </Link>
                <Link
                  to="/login"
                  className="flex-1 text-center px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                >
                  Log In
                </Link>
              </div>
            </div>
          )}

          {/* STATE: NOT_FOUND (UNKNOWN TOKEN) */}
          {resolutionState === 'NOT_FOUND' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mx-auto flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Unrecognized Card</h3>
                <p className="text-xs text-rose-400 font-medium">
                  This NFC card credential does not exist in the TapTrack registry.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 leading-relaxed space-y-2">
                <p>
                  The tapped card credential could not be matched against any active or known card in the system.
                </p>
                <p className="text-slate-500">
                  Possible reasons: the card belongs to another system, the credential was never provisioned, or the tag contains arbitrary data.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 text-xs text-slate-400 text-center">
                <strong className="text-slate-300">No attendance recorded.</strong> Unrecognized cards produce no database side effects.
              </div>

              <div className="pt-2 flex justify-center">
                <Link
                  to="/"
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors text-center"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          )}

          {/* STATE: MISSING_TOKEN (DIRECT NAVIGATION TO /t WITHOUT FRAGMENT) */}
          {resolutionState === 'MISSING_TOKEN' && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mx-auto flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="text-xl font-bold text-white">Tap an NFC Card</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This resolution page is triggered when you tap a physical TapTrack NFC card to your smartphone.
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-left space-y-3 text-xs text-slate-300">
                <div className="font-semibold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-xs font-mono">
                    ?
                  </span>
                  <span>How to use Universal NFC Fallback:</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-slate-400 pl-1">
                  <li>Hold physical card <strong className="text-slate-200">NFC-001</strong> near top of iPhone or back of Android.</li>
                  <li>Tap the system notification popup when detected.</li>
                  <li>The mobile browser opens with the secure fragment to verify authenticity.</li>
                </ol>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/compatibility"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors text-center"
                >
                  View Compatibility Guide
                </Link>
                <Link
                  to="/"
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors text-center"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          )}

          {/* STATE: MALFORMED_TOKEN */}
          {resolutionState === 'MALFORMED_TOKEN' && (
            <div className="space-y-6 text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mx-auto flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-white">Invalid Credential Format</h3>
                <p className="text-xs text-amber-400">
                  {errorMessage || 'The URL fragment contains an invalid token structure.'}
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 text-left space-y-2">
                <p>TapTrack requires high-entropy base64url credential tokens encoded within the URL fragment.</p>
                <p className="text-slate-500">Query string parameters (?token=...) are rejected by design to prevent leakage in server access logs.</p>
              </div>

              <div className="pt-2 flex justify-center">
                <Link
                  to="/"
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          )}

          {/* STATE: NETWORK_ERROR (RESOLVE MODE) */}
          {resolutionState === 'NETWORK_ERROR' && (
            <div className="space-y-6 text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mx-auto flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-2.828-2.828m0 0l2.828-2.829m-2.828 2.829L3 21" />
                </svg>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-white">Connection Error</h3>
                <p className="text-xs text-rose-400">
                  {errorMessage || 'Unable to communicate with the TapTrack verification server.'}
                </p>
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  onClick={handleRetry}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* STATE: ATTENDANCE_ERROR (NETWORK FAILURE IN ATTENDANCE MODE) */}
          {resolutionState === 'ATTENDANCE_ERROR' && (
            <div className="space-y-6 text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mx-auto flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-2.828-2.828m0 0l2.828-2.829m-2.828 2.829L3 21" />
                </svg>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-white">Could Not Record Attendance</h3>
                <p className="text-xs text-rose-400">
                  {errorMessage || 'Unable to communicate with the TapTrack attendance server.'}
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 text-xs text-slate-400 text-center">
                Retry to record attendance for this card. The operator session remains active.
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  onClick={handleRetry}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security / Privacy Guarantee Footer */}
        <div className="mt-6 text-center space-y-1 text-xs text-slate-500">
          <div>TapTrack NFC Architecture • Zero Credential URL Logging • Ephemeral Token Resolution</div>
          <div>Compatible with iPhone Safari (iOS 13+) and all modern Android browsers.</div>
        </div>
      </main>
    </div>
  );
}