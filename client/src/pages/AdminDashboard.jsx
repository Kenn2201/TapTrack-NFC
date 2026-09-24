import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Section from '../components/ui/Section';
import StatCard from '../components/ui/StatCard';
import Alert from '../components/ui/Alert';
import { adminService } from '../services/adminService';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function AdminDashboard() {
  useDocumentTitle('Admin Dashboard');
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getDashboard()
      .then((r) => {
        setMetrics(r.metrics);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || 'Failed to load administrative operational metrics.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Header />

      <PageContainer maxWidth="max-w-7xl">
        <PageHeader
          title="Admin Dashboard"
          description="Live operational metrics, card registry status, and attendance sessions from the TapTrack database."
          actions={
            <Link
              to="/admin/events"
              className="px-4 py-2 rounded-lg border border-slate-700 hover:border-blue-500/50 bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white transition-colors min-h-[44px] flex items-center"
            >
              Manage Events
            </Link>
          }
        />

        {error && (
          <div className="mb-6">
            <Alert type="error" title="Metrics Error" message={error} />
          </div>
        )}

        {loading && !error && (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center space-x-3 text-slate-400">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">Loading operational metrics…</span>
            </div>
          </div>
        )}

        {/* 1. Quick Operations Navigation */}
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link
            to="/admin/users"
            className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 hover:border-purple-500/40 hover:bg-slate-850 transition-all flex flex-col justify-between min-h-[72px]"
          >
            <span className="text-xs font-semibold text-purple-400">Users &rarr;</span>
            <span className="text-xs text-slate-400">Manage Roles & Accounts</span>
          </Link>
          <Link
            to="/admin/cards"
            className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 hover:border-blue-500/40 hover:bg-slate-850 transition-all flex flex-col justify-between min-h-[72px]"
          >
            <span className="text-xs font-semibold text-blue-400">NFC Cards &rarr;</span>
            <span className="text-xs text-slate-400">Provision & Replace</span>
          </Link>
          <Link
            to="/admin/events"
            className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 hover:border-cyan-500/40 hover:bg-slate-850 transition-all flex flex-col justify-between min-h-[72px]"
          >
            <span className="text-xs font-semibold text-cyan-400">Events &rarr;</span>
            <span className="text-xs text-slate-400">Create & Open Sessions</span>
          </Link>
          <Link
            to="/admin/audit"
            className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 hover:border-slate-600 hover:bg-slate-850 transition-all flex flex-col justify-between min-h-[72px]"
          >
            <span className="text-xs font-semibold text-slate-300">Audit Logs &rarr;</span>
            <span className="text-xs text-slate-400">Security History</span>
          </Link>
          <Link
            to="/operator"
            className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 hover:border-amber-500/40 hover:bg-slate-850 transition-all flex flex-col justify-between min-h-[72px]"
          >
            <span className="text-xs font-semibold text-amber-400">Operator &rarr;</span>
            <span className="text-xs text-slate-400">Active Check-ins</span>
          </Link>
        </div>

        {/* 1b. Secondary Admin Tools */}
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link
            to="/admin/feedback"
            className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 hover:border-emerald-500/40 hover:bg-slate-850 transition-all flex flex-col justify-between min-h-[72px]"
          >
            <span className="text-xs font-semibold text-emerald-400">Feedback &rarr;</span>
            <span className="text-xs text-slate-400">Triage Submissions</span>
          </Link>
          <Link
            to="/admin/email"
            className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 hover:border-rose-500/40 hover:bg-slate-850 transition-all flex flex-col justify-between min-h-[72px]"
          >
            <span className="text-xs font-semibold text-rose-400">Email Suite &rarr;</span>
            <span className="text-xs text-slate-400">Direct & Broadcast</span>
          </Link>
          <Link
            to="/admin/platform"
            className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 hover:border-amber-500/40 hover:bg-slate-850 transition-all flex flex-col justify-between min-h-[72px]"
          >
            <span className="text-xs font-semibold text-amber-400">Platform &rarr;</span>
            <span className="text-xs text-slate-400">Maintenance Mode</span>
          </Link>
          <Link
            to="/feedback"
            className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 hover:border-blue-500/40 hover:bg-slate-850 transition-all flex flex-col justify-between min-h-[72px]"
          >
            <span className="text-xs font-semibold text-blue-400">My Feedback &rarr;</span>
            <span className="text-xs text-slate-400">Submit Feedback</span>
          </Link>
        </div>

        {/* 2. User Operational Stats */}
        <Section title="User Accounts" subtitle="Registrations and active account statuses">
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
            <StatCard
              label="Total Users"
              value={metrics?.totalUsers ?? 0}
              color="purple"
              description="All registered platform users"
            />
            <StatCard
              label="Active Users"
              value={metrics?.activeUsers ?? 0}
              color="emerald"
              description="Users eligible for attendance and card assignment"
            />
          </div>
        </Section>

        {/* 3. NFC Card Lifecycle Stats */}
        <Section title="NFC Card Registry" subtitle="Physical hardware tokens and status breakdown">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <StatCard
              label="Active Cards"
              value={metrics?.activeCards ?? 0}
              color="emerald"
              description="Ready for live tap check-in"
            />
            <StatCard
              label="Unassigned Cards"
              value={metrics?.unassignedCards ?? 0}
              color="amber"
              description="Provisioned, awaiting user assignment"
            />
            <StatCard
              label="Lost Cards"
              value={metrics?.lostCards ?? 0}
              color="amber"
              description="Reported lost by cardholder"
            />
            <StatCard
              label="Revoked Cards"
              value={metrics?.revokedCards ?? 0}
              color="blue"
              description="Permanently invalidated credentials"
            />
            <StatCard
              label="Disabled Cards"
              value={metrics?.disabledCards ?? 0}
              color="slate"
              description="Temporarily deactivated cards"
            />
          </div>
        </Section>

        {/* 4. Events & Attendance Stats */}
        <Section title="Attendance Operations" subtitle="Live event activity and check-ins today">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Open Events"
              value={metrics?.activeEvents ?? 0}
              color="cyan"
              description="Events currently active in system"
            />
            <StatCard
              label="Open Sessions"
              value={metrics?.openSessions ?? 0}
              color="emerald"
              description="Sessions actively accepting attendee taps"
            />
            <StatCard
              label="Attendance Today"
              value={metrics?.attendanceToday ?? 0}
              color="blue"
              description="Total check-ins recorded since 00:00 UTC"
            />
          </div>
        </Section>
      </PageContainer>
    </div>
  );
}
