import React from 'react';
import CountUp from '../bits/CountUp';

/**
 * StatCard — Operational and activity metric card.
 * Uses CountUp for numbers, handles 0, null, 'N/A' safely.
 */
export default function StatCard({
  label,
  value,
  description,
  icon,
  color = 'blue', // blue | emerald | amber | purple | slate
  useCountUp = true,
  className = '',
}) {
  const colorMap = {
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    purple: 'text-purple-400',
    slate: 'text-slate-300',
  };

  const isNumber = typeof value === 'number' || (!isNaN(parseFloat(value)) && isFinite(value));

  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5 flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
          {label}
        </span>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>
      <div className="mt-2">
        <div className={`text-2xl sm:text-3xl font-bold tracking-tight ${colorMap[color] || 'text-white'}`}>
          {useCountUp && isNumber ? <CountUp to={value} /> : (value ?? '—')}
        </div>
        {description && (
          <p className="mt-1 text-xs text-slate-400 leading-tight">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
