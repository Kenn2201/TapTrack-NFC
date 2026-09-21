import React from 'react';

/**
 * AttendanceResult — High-visibility semantic feedback for check-in actions.
 * Explicitly states:
 * - ✓ Attendance Recorded (Success)
 * - Already Recorded (Duplicate)
 * - Card Cannot Be Used (Invalid)
 * - Attendance Session Closed (Closed)
 */
export default function AttendanceResult({
  type = 'SUCCESS', // SUCCESS | DUPLICATE | INVALID | CLOSED
  record,
  card,
  message,
  className = '',
}) {
  const configs = {
    SUCCESS: {
      title: '✓ Attendance Recorded',
      bg: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ),
      description: 'Check-in verified and successfully recorded into the event session.',
    },
    DUPLICATE: {
      title: 'Already Recorded',
      bg: 'bg-amber-500/10 border-amber-500/40 text-amber-300',
      iconBg: 'bg-amber-500/20 text-amber-400',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      description: 'This attendee has already been checked into the current session.',
    },
    INVALID: {
      title: 'Card Cannot Be Used',
      bg: 'bg-rose-500/10 border-rose-500/40 text-rose-300',
      iconBg: 'bg-rose-500/20 text-rose-400',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      description: message || 'Card credential is unassigned, revoked, disabled, or unrecognized.',
    },
    CLOSED: {
      title: 'Attendance Session Closed',
      bg: 'bg-slate-800 border-slate-700 text-slate-300',
      iconBg: 'bg-slate-700 text-slate-400',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      description: 'The operator has closed this attendance session. New check-ins are rejected.',
    },
  };

  const config = configs[type] || configs.SUCCESS;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-2xl border p-6 text-center flex flex-col items-center justify-center transition-all ${config.bg} ${className}`}
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${config.iconBg}`}>
        {config.icon}
      </div>
      <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">
        {config.title}
      </h3>
      <p className="text-xs sm:text-sm opacity-90 max-w-md mb-4">
        {config.description}
      </p>

      {(card || record) && (
        <div className="w-full max-w-sm rounded-xl bg-slate-950/60 border border-slate-800/80 p-3 text-xs text-left space-y-1 text-slate-300">
          {card?.cardLabel && (
            <div className="flex justify-between">
              <span className="text-slate-400">Card:</span>
              <span className="font-mono font-bold text-white">{card.cardLabel}</span>
            </div>
          )}
          {record?.method && (
            <div className="flex justify-between">
              <span className="text-slate-400">Method:</span>
              <span className="font-semibold text-slate-200">{record.method.replace('_', ' ')}</span>
            </div>
          )}
          {record?.recordedAt && (
            <div className="flex justify-between">
              <span className="text-slate-400">Time:</span>
              <span>{new Date(record.recordedAt).toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
