import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import Header from '../components/layout/Header';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Resend form state
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState(null);

  const verificationAttempted = useRef(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('No verification token provided in URL.');
      return;
    }

    if (verificationAttempted.current) return;
    verificationAttempted.current = true;

    async function executeVerification() {
      try {
        await authService.verifyEmail(token);
        setSuccess(true);
      } catch (err) {
        setError(err.message || 'Verification token is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    }

    executeVerification();
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendLoading(true);
    setResendMessage(null);

    try {
      const res = await authService.resendVerification(resendEmail);
      setResendMessage(res.message || 'Verification link sent if account exists.');
    } catch (err) {
      setResendMessage(err.message || 'Failed to resend verification.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl backdrop-blur-sm text-center">
          {loading ? (
            <div className="py-8 space-y-4">
              <LoadingSpinner />
              <p className="text-sm text-slate-300">Verifying your email address...</p>
            </div>
          ) : success ? (
            <div className="space-y-4">
              <div className="w-14 h-14 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Email Verified!</h2>
              <p className="text-sm text-slate-300">
                Your email address has been successfully confirmed. Your account is now fully active.
              </p>
              <div className="pt-4">
                <Link
                  to="/dashboard"
                  className="inline-block w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-md transition-all text-sm"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Verification Failed</h2>
              <p className="text-sm text-red-300">{error}</p>

              <div className="pt-6 border-t border-slate-800 text-left">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">Request a new verification link</h3>
                {resendMessage && (
                  <div className="bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs p-3 rounded-lg mb-3">
                    {resendMessage}
                  </div>
                )}
                <form onSubmit={handleResend} className="space-y-3">
                  <input
                    type="email"
                    required
                    placeholder="Enter your account email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={resendLoading}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-lg disabled:opacity-50"
                  >
                    {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                </form>
              </div>

              <div className="pt-2">
                <Link to="/login" className="text-xs text-blue-400 hover:text-blue-300">
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
