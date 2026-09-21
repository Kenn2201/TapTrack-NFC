import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/layout/Header';

export default function Operator() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold rounded-full">
              OPERATOR CONSOLE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Event Attendance Operations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Authenticated operator console for session management and real-time attendee check-ins.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Upcoming NFC & Session Milestones</h2>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                You are authenticated with <span className="text-amber-400 font-semibold">{user?.role}</span> permissions.
                In accordance with the TapTrack roadmap:
              </p>
              <ul className="mt-3 space-y-2 text-xs text-slate-400 list-disc list-inside">
                <li><strong className="text-slate-200">v0.3.0 ALPHA:</strong> Physical card provisioning and token generation</li>
                <li><strong className="text-slate-200">v0.4.0 ALPHA:</strong> Android Web NFC reader mode (NDEFReader API)</li>
                <li><strong className="text-slate-200">v0.5.0 ALPHA:</strong> Universal URL fallback resolution (/t#token)</li>
                <li><strong className="text-slate-200">v0.6.0 BETA:</strong> Operator attendance sessions and shared attendance engine</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Session Operator: {user?.firstName} {user?.lastName} ({user?.email})
            </span>
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
