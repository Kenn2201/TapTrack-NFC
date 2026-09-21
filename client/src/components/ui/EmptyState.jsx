import React from 'react';

/**
 * EmptyState — Standardized empty state presentation with icon, title,
 * description, and optional action buttons.
 */
export default function EmptyState({
  title = 'No items found',
  description = 'There are currently no items to display.',
  icon,
  action,
  className = '',
}) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900/60 p-8 sm:p-12 text-center flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-slate-800/80 text-slate-400 flex items-center justify-center mb-4">
        {icon || (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
