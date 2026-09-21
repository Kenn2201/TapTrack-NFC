import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import Header from '../components/layout/Header';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.forgotPassword(email);
    } catch {
      // Regardless of error, show generic completion to prevent account enumeration
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl backdrop-blur-sm">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Check Your Inbox</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                If an account exists for <strong className="text-white">{email}</strong>, you will receive a secure password reset link shortly.
              </p>
              <p className="text-xs text-slate-500">
                Reset links are valid for 1 hour and single-use only.
              </p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-block w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-sm text-center border border-slate-700"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Reset Password
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Enter your registered email address to receive a secure reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="name@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Sending link...' : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/login" className="text-xs text-blue-400 hover:text-blue-300">
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
