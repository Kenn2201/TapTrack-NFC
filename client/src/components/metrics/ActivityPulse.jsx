import React from 'react';
import StatCard from '../ui/StatCard';

/**
 * ActivityPulse — Attendance metrics panel.
 * Displays Total Check-ins, Events Attended, Attendance Rate, and Current Streak.
 * Never outputs NaN or Infinity; handles 0, 'N/A', empty cleanly.
 */
export default function ActivityPulse({ metrics, loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-900 border border-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  const safeTotalCheckIns = typeof metrics?.totalCheckIns === 'number' && !isNaN(metrics.totalCheckIns)
    ? metrics.totalCheckIns
    : 0;

  const safeEventsAttended = typeof metrics?.eventsAttended === 'number' && !isNaN(metrics.eventsAttended)
    ? metrics.eventsAttended
    : 0;

  const safeAttendanceRate =
    typeof metrics?.attendanceRate === 'number' && !isNaN(metrics.attendanceRate)
      ? `${metrics.attendanceRate}%`
      : metrics?.attendanceRateLabel && metrics.attendanceRateLabel !== 'N/A'
      ? metrics.attendanceRateLabel
      : 'Pending';

  const attendanceRateExplanation =
    metrics?.attendanceRateReason ||
    'Not enough eligible events yet. Attendance rate appears once TapTrack has events where your attendance eligibility is known.';

  const safeCurrentStreak = typeof metrics?.currentStreak === 'number' && !isNaN(metrics.currentStreak)
    ? `${metrics.currentStreak} ${metrics.currentStreak === 1 ? 'week' : 'weeks'}`
    : '0 weeks';

  return (
    <section aria-labelledby="activity-pulse-title">
      <div className="flex items-center justify-between mb-3">
        <h2 id="activity-pulse-title" className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Activity Pulse
        </h2>
        <span className="text-xs text-slate-400">
          Weekly Attendance Activity
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Check-ins"
          value={safeTotalCheckIns}
          color="emerald"
          useCountUp={true}
          description="Total recorded check-ins"
          icon={
            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        />

        <StatCard
          label="Events Attended"
          value={safeEventsAttended}
          color="blue"
          useCountUp={true}
          description="Distinct events checked into"
          icon={
            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />

        <StatCard
          label="Attendance Rate"
          value={safeAttendanceRate}
          color="purple"
          useCountUp={false}
          description={attendanceRateExplanation}
          icon={
            <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />

        <StatCard
          label="Current Streak"
          value={safeCurrentStreak}
          color="amber"
          useCountUp={false}
          description={metrics?.streakUnit || 'Consecutive calendar weeks'}
          icon={
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
      </div>
    </section>
  );
}
