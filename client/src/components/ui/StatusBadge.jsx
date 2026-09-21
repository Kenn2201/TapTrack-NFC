import React from 'react';

const STATUS_MAP = {
  // Event & Session Statuses
  OPEN: { label: 'OPEN', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400 animate-pulse' },
  CLOSED: { label: 'CLOSED', bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30', dot: 'bg-slate-400' },
  DRAFT: { label: 'DRAFT', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30', dot: 'bg-blue-400' },
  CANCELLED: { label: 'CANCELLED', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30', dot: 'bg-rose-400' },

  // Card Statuses
  UNASSIGNED: { label: 'UNASSIGNED', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', dot: 'bg-amber-400' },
  ACTIVE: { label: 'ACTIVE', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' },
  REVOKED: { label: 'REVOKED', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30', dot: 'bg-rose-400' },
  LOST: { label: 'LOST', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30', dot: 'bg-orange-400' },
  REPLACED: { label: 'REPLACED', bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30', dot: 'bg-slate-400' },
  DISABLED: { label: 'DISABLED', bg: 'bg-red-500/10 text-red-400 border-red-500/30', dot: 'bg-red-400' },

  // Roles
  ADMIN: { label: 'ADMIN', bg: 'bg-purple-500/10 text-purple-300 border-purple-500/30', dot: 'bg-purple-400' },
  OPERATOR: { label: 'OPERATOR', bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30', dot: 'bg-amber-400' },
  USER: { label: 'USER', bg: 'bg-blue-500/10 text-blue-300 border-blue-500/30', dot: 'bg-blue-400' },

  // Generic
  SUCCESS: { label: 'SUCCESS', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' },
  WARNING: { label: 'WARNING', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', dot: 'bg-amber-400' },
  DANGER: { label: 'DANGER', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30', dot: 'bg-rose-400' },
  INFO: { label: 'INFO', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', dot: 'bg-cyan-400' },
};

/**
 * StatusBadge — Standardized semantic status indicator badge.
 */
export default function StatusBadge({ status, label, showDot = true, className = '' }) {
  const key = String(status || '').toUpperCase();
  const config = STATUS_MAP[key] || {
    label: label || status || 'UNKNOWN',
    bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    dot: 'bg-slate-400',
  };

  const displayLabel = label || config.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border tracking-wide uppercase ${config.bg} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />}
      <span>{displayLabel}</span>
    </span>
  );
}
