import React from 'react';

/**
 * Alert — Standardized alert component with semantic roles, accessible icons,
 * and automatic redaction of internal database errors if present.
 */
export default function Alert({
  type = 'info', // info | success | warning | error
  title,
  message,
  children,
  className = '',
  onClose,
}) {
  const sanitizeMessage = (msg) => {
    if (!msg || typeof msg !== 'string') return msg;
    // Redact accidental database or server internals
    if (/postgres|pg_|relation|syntax error|at \/.*node_modules/i.test(msg)) {
      return 'An unexpected server error occurred. Please try again.';
    }
    return msg;
  };

  const alertConfig = {
    info: {
      bg: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
      icon: (
        <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      role: 'status',
    },
    success: {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      icon: (
        <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      role: 'status',
    },
    warning: {
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
      icon: (
        <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      role: 'alert',
    },
    error: {
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
      icon: (
        <svg className="w-5 h-5 text-rose-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      role: 'alert',
    },
  }[type] || {
    bg: 'bg-slate-800 border-slate-700 text-slate-200',
    icon: null,
    role: 'status',
  };

  const content = sanitizeMessage(message) || children;

  return (
    <div
      role={alertConfig.role}
      className={`rounded-xl border p-4 flex items-start justify-between gap-3 text-sm ${alertConfig.bg} ${className}`}
    >
      <div className="flex items-start gap-3">
        {alertConfig.icon}
        <div>
          {title && <h3 className="font-semibold text-sm mb-0.5">{title}</h3>}
          <div className="text-xs sm:text-sm leading-relaxed">{content}</div>
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 -mr-1 -mt-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          aria-label="Dismiss alert"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
