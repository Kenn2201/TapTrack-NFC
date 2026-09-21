import React from 'react';

/**
 * Section — Standardized section wrapper with accessible heading structure.
 */
export default function Section({
  title,
  subtitle,
  children,
  actions,
  className = '',
  id,
}) {
  const headingId = id ? `${id}-heading` : undefined;

  return (
    <section aria-labelledby={headingId} className={`mb-8 sm:mb-10 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            {title && (
              <h2 id={headingId} className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
