import React from 'react';

const STATUS_STYLES = {
  OPEN: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  CLOSED: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  DRAFT: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  CANCELLED: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  ACTIVE: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  UNASSIGNED: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  LOST: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  REVOKED: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  REPLACED: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  DISABLED: 'bg-red-500/15 text-red-300 border-red-500/30',
  PENDING: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  INVITED: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  ACCEPTED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  DECLINED: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  ADMIN: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  OPERATOR: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  USER: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  SUCCESS: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  PASSED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  FAILED: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  INFO: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  WARNING: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  DANGER: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

/**
 * Badge — Standardized status pill for statuses, roles, and labels.
 * Accepts optional children to override the default uppercase label.
 */
export default function Badge({ status, className = '', children }) {
  const key = String(status || '').toUpperCase();
  const style =
    STATUS_STYLES[key] ||
    'bg-slate-500/15 text-slate-300 border-slate-500/30';

  const label = children != null ? children : key || 'UNKNOWN';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border tracking-wide uppercase ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
