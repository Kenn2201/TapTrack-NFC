import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import Header from '../components/layout/Header';
import ActivityPulse from '../components/metrics/ActivityPulse';
import { attendanceService } from '../services/attendanceService';

export default function Dashboard() {
  const { user } = useAuth();
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);
  const [activityPulse, setActivityPulse] = useState(null);
  useEffect(() => { attendanceService.getActivityPulse().then((r) => setActivityPulse(r.activityPulse)).catch(() => setActivityPulse({ totalCheckIns: 0, eventsAttended: 0, attendanceRateLabel: 'N/A', attendanceRateReason: 'Activity is temporarily unavailable.', currentStreak: 0, streakUnit: 'consecutive calendar weeks with at least one check-in' })); }, []);

  const handleResendVerification = async () => {
    setResending(true);
    setResendStatus(null);
    try {
      const res = await authService.resendVerification(user.email);
      setResendStatus({ type: 'success', message: res.message || 'Verification link sent to your email.' });
    } catch (err) {
      setResendStatus({ type: 'error', message: err.message || 'Failed to resend verification email.' });
    } finally {
      setResending(false);
    }
  };

  const isVerified = !!user?.emailVerifiedAt;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Verification Alert Banner */}
        {!isVerified && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-amber-300">Email Verification Required</h3>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  Your email address is unverified. Please check your inbox or request a new verification link.
                </p>
                {resendStatus && (
                  <p className={`text-xs mt-1.5 font-medium ${resendStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {resendStatus.message}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleResendVerification}
              disabled={resending}
              className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend Verification'}
            </button>
          </div>
        )}

        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Welcome back, {user?.firstName || 'User'}!
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                TapTrack NFC Identity & Attendance Console
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                user?.role === 'ADMIN'
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                  : user?.role === 'OPERATOR'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
              }`}>
                {user?.role}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {user?.status}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Account Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Account Role</span>
            <div className="mt-2 text-xl font-bold text-white flex items-center gap-2">
              {user?.role}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {user?.role === 'ADMIN' ? 'Full administrative privileges' : user?.role === 'OPERATOR' ? 'Session check-in & event operations' : 'Standard member account'}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Status</span>
            <div className="mt-2 text-xl font-bold text-white flex items-center gap-2">
              {isVerified ? (
                <span className="text-emerald-400 flex items-center gap-1.5 text-base font-semibold">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Verified
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1.5 text-base font-semibold">
                  Pending Verification
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">{user?.email}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Member Since</span>
            <div className="mt-2 text-base font-bold text-white">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}
            </div>
            <p className="text-xs text-slate-500 mt-1">ID: #{user?.id}</p>
          </div>
        </div>

        <div className="mb-8"><ActivityPulse metrics={activityPulse} /></div>

        {/* Quick Navigation Cards */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-white mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/profile"
              className="p-5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl transition-all flex flex-col justify-between"
            >
              <div>
                <h3 className="font-semibold text-white">Account Profile</h3>
                <p className="text-xs text-slate-400 mt-1">
                  View and manage your personal account settings and name.
                </p>
              </div>
              <span className="text-xs text-blue-400 font-medium mt-4 inline-flex items-center gap-1">
                View Profile &rarr;
              </span>
            </Link>

            {(user?.role === 'OPERATOR' || user?.role === 'ADMIN') && (
              <Link
                to="/operator"
                className="p-5 bg-slate-900 hover:bg-slate-850 border border-amber-500/20 hover:border-amber-500/40 rounded-xl transition-all flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-semibold text-amber-300">Operator Console</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Console for session monitoring and NFC check-ins.
                  </p>
                </div>
                <span className="text-xs text-amber-400 font-medium mt-4 inline-flex items-center gap-1">
                  Open Operator &rarr;
                </span>
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin/users"
                className="p-5 bg-slate-900 hover:bg-slate-850 border border-purple-500/20 hover:border-purple-500/40 rounded-xl transition-all flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-semibold text-purple-300">Admin User Management</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage users, promote to OPERATOR, and toggle account statuses.
                  </p>
                </div>
                <span className="text-xs text-purple-400 font-medium mt-4 inline-flex items-center gap-1">
                  Manage Users &rarr;
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Roadmap Notice */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Development Scope Note: </span>
          TapTrack NFC v0.2.0 implements core authentication, user management, and transactional email. Physical NFC card provisioning (v0.3.0), Android Web NFC reader (v0.4.0), and universal NFC URL fallback (v0.5.0) are actively scheduled in upcoming milestones.
        </div>
      </main>
    </div>
  );
}
