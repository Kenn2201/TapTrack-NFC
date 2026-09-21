import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import CardStatusBadge from '../components/cards/CardStatusBadge';
import { useAuth } from '../hooks/useAuth';
import useNFC from '../hooks/useNFC';

export default function NfcReaderPage() {
  const { user } = useAuth();
  const {
    status,
    result,
    error,
    startScan,
    stopScan,
    resetScan,
  } = useNFC();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5 mb-1.5">
              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-full">
                WEB NFC READER
              </span>
              <span className="text-xs text-slate-500">v0.4.0 ALPHA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              NFC Card Reader
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Read and verify physical NTAG215 cards directly using Android Web NFC.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-400 hidden sm:inline">
              Operator: <strong className="text-slate-200">{user?.firstName} {user?.lastName}</strong> ({user?.role})
            </span>
            <Link
              to="/operator"
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-lg border border-slate-800 transition-colors"
            >
              Operator Console
            </Link>
          </div>
        </div>

        {/* Milestone Boundary Banner */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start space-x-3 text-xs text-blue-300">
          <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="leading-relaxed">
            <strong className="font-semibold text-blue-200">v0.4 Validation Mode:</strong> This scanner validates physical card credentials against the TapTrack registry.
            <span className="text-blue-100 font-semibold ml-1">No attendance records or check-ins will be created.</span> Attendance sessions and check-in tracking are scheduled for v0.6.0.
          </div>
        </div>

        {/* Reader Core Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          {/* STATE: UNSUPPORTED BROWSER */}
          {status === 'UNSUPPORTED' && (
            <div className="text-center py-8 px-4 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mx-auto flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-lg font-semibold text-white">Web NFC Unavailable on this Device</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  The standard W3C <code className="text-amber-400 font-mono">NDEFReader</code> API is supported exclusively on <strong>Chromium browsers for Android</strong> (such as Google Chrome on Android).
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Desktop browsers, iOS Safari, and non-Chromium mobile browsers cannot access the device NFC antenna directly.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <Link
                  to="/compatibility"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                >
                  View Compatibility Guide
                </Link>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                >
                  Return to Dashboard
                </Link>
              </div>
              <div className="text-xs text-slate-500 italic pt-2">
                Note: All other TapTrack features (card provisioning, admin console, profiles) remain fully operational on desktop.
              </div>
            </div>
          )}

          {/* STATE: INSECURE CONTEXT */}
          {status === 'INSECURE' && (
            <div className="text-center py-8 px-4 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mx-auto flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-lg font-semibold text-white">Secure Context (HTTPS) Required</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Web NFC requires a secure origin. Please open TapTrack over HTTPS at <span className="text-white font-mono">https://nfc.kenncode.me</span>.
                </p>
              </div>
            </div>
          )}

          {/* STATE: READY */}
          {status === 'READY' && (
            <div className="text-center py-10 px-4 space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/5">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h2 className="text-xl font-bold text-white">Scanner Ready</h2>
                <p className="text-sm text-slate-400">
                  Ready to scan physical cards. Tap the button below to activate your phone’s NFC antenna.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={startScan}
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  Start NFC Scanner
                </button>
              </div>

              <div className="text-xs text-slate-500 max-w-sm mx-auto">
                Ensure NFC is turned ON in Android settings before starting.
              </div>
            </div>
          )}

          {/* STATE: REQUESTING PERMISSION */}
          {status === 'REQUESTING_PERMISSION' && (
            <div className="text-center py-12 px-4 space-y-5">
              <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mx-auto" />
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-lg font-semibold text-white">Requesting NFC Permission...</h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Please tap &ldquo;Allow&rdquo; if Chrome prompts for permission to use NFC devices.
                </p>
              </div>
            </div>
          )}

          {/* STATE: SCANNING */}
          {status === 'SCANNING' && (
            <div className="text-center py-10 px-4 space-y-6">
              {/* Radar pulse animation */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
                <div className="relative w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
                  <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  LISTENING FOR NFC TAG
                </div>
                <h2 className="text-xl font-bold text-white">
                  Hold an NFC card near the back of your phone
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Position physical tag <strong className="text-slate-200">NFC-001</strong> against your phone’s NFC antenna. Keep it steady until recognized.
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={stopScan}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                >
                  Stop Scanner
                </button>
              </div>
            </div>
          )}

          {/* STATE: VERIFYING */}
          {status === 'VERIFYING' && (
            <div className="text-center py-12 px-4 space-y-5">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mx-auto" />
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-lg font-semibold text-white">Verifying Card Credential...</h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Authoritatively matching token hash against TapTrack database.
                </p>
              </div>
            </div>
          )}

          {/* STATE: SUCCESS */}
          {status === 'SUCCESS' && result && (
            <div className="py-4 space-y-6">
              <div className="flex items-center space-x-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Card Verified Successfully</h3>
                  <p className="text-xs text-emerald-300">
                    Cryptographic HMAC matched; assigned member resolved.
                  </p>
                </div>
              </div>

              {/* Resolved Card Details Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Card Label</span>
                    <div className="text-2xl font-black text-white tracking-wide mt-0.5">
                      {result.card?.cardLabel}
                    </div>
                  </div>
                  <CardStatusBadge status={result.card?.status} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Assigned Member</span>
                    <div className="text-base font-semibold text-white mt-0.5">
                      {result.member?.displayName || 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Email</span>
                    <div className="text-sm font-mono text-slate-300 mt-0.5 break-all">
                      {result.member?.email}
                    </div>
                  </div>
                </div>

                {/* Explicit notice */}
                <div className="pt-4 border-t border-slate-800">
                  <p className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <strong>Notice:</strong> No attendance has been recorded. v0.4 validates NFC reading only. Attendance sessions and check-in tracking will be introduced in v0.6.0.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetScan}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
                >
                  Scan Another Card
                </button>
                <button
                  type="button"
                  onClick={stopScan}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                >
                  Stop Scanner
                </button>
              </div>
            </div>
          )}

          {/* STATE: ERROR / INVALID CARD */}
          {status === 'ERROR' && error && (
            <div className="py-4 space-y-6">
              <div className="flex items-start space-x-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-white">Card Read Failed</h3>
                    {error.code && (
                      <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 font-mono text-[10px] rounded border border-rose-500/30">
                        {error.code}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-rose-200 mt-1">
                    {error.message}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetScan}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                >
                  Try Again / Scan Another Card
                </button>
                <button
                  type="button"
                  onClick={stopScan}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                >
                  Stop Scanner
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Operating Instructions */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Operator Reader Instructions
          </h4>
          <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>Ensure you are using <strong>Google Chrome on Android</strong> with active HTTPS (<span className="text-slate-300 font-mono">https://nfc.kenncode.me</span>).</li>
            <li>Tap <strong>Start NFC Scanner</strong> and approve any browser permission dialog.</li>
            <li>Tap the physical <strong>NFC-001</strong> card against your phone antenna (usually near the top-rear or camera cluster).</li>
            <li>The app parses the opaque URL fragment (<span className="text-slate-300 font-mono">/t#token</span>) and securely verifies it with the backend.</li>
            <li>Verify the card label, active status, and member identity.</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
