import React from 'react';

const STATUS_CONFIG = {
  UNASSIGNED: {
    label: 'UNASSIGNED',
    subLabel: 'Pending Physical Write',
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  ACTIVE: {
    label: 'ACTIVE',
    subLabel: 'Ready for Tap',
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400 animate-pulse',
  },
  REVOKED: {
    label: 'REVOKED',
    subLabel: 'Invalidated',
    bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    dot: 'bg-rose-400',
  },
  LOST: {
    label: 'LOST',
    subLabel: 'Reported Missing',
    bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    dot: 'bg-orange-400',
  },
  REPLACED: {
    label: 'REPLACED',
    subLabel: 'Superseded',
    bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    dot: 'bg-slate-400',
  },
  DISABLED: {
    label: 'DISABLED',
    subLabel: 'Deactivated',
    bg: 'bg-red-500/10 text-red-400 border-red-500/30',
    dot: 'bg-red-400',
  },
};

export default function CardStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    label: status || 'UNKNOWN',
    subLabel: '',
    bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    dot: 'bg-slate-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}
