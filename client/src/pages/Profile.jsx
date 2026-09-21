import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import Header from '../components/layout/Header';

export default function Profile() {
  const { user, refreshUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      await authService.updateProfile({ firstName, lastName });
      await refreshUser();
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const isVerified = !!user?.emailVerifiedAt;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            User Profile
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your personal profile and view your account credentials status.
          </p>
        </div>

        {message && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-sm text-emerald-400">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Read-only Account Status Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm">
            <h2 className="text-base font-semibold text-white mb-4">Account Status & Authority</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Assigned Role</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                  user?.role === 'ADMIN'
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                    : user?.role === 'OPERATOR'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                }`}>
                  {user?.role}
                </span>
                <p className="text-xs text-slate-500 mt-1">Roles are managed strictly by system administrators.</p>
              </div>

              <div>
                <span className="text-xs text-slate-400 block font-medium">Account Status</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {user?.status}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block font-medium">Email Verification</span>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold mt-1 ${
                  isVerified ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {isVerified ? 'Verified' : 'Unverified'}
                </span>
                {user?.emailVerifiedAt && (
                  <p className="text-xs text-slate-500 mt-1">
                    Verified on {new Date(user.emailVerifiedAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div>
                <span className="text-xs text-slate-400 block font-medium">Account Created</span>
                <span className="text-slate-300 text-xs mt-1 block">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Editable Details Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm">
            <h2 className="text-base font-semibold text-white mb-4">Personal Information</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2.5 bg-slate-850 border border-slate-700/60 rounded-lg text-slate-400 text-sm cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Email address cannot be modified directly.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Saving changes...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
