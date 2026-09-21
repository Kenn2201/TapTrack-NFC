import React from 'react';

/**
 * Card — Standardized dark surface container.
 */
export default function Card({
  children,
  className = '',
  padding = 'p-5 sm:p-6',
  variant = 'default', // default | interactive | highlighted
  onClick,
  ...props
}) {
  const variantStyles = {
    default: 'bg-slate-900 border border-slate-800',
    interactive: 'bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all duration-200',
    highlighted: 'bg-slate-900 border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.1)]',
  }[variant] || 'bg-slate-900 border border-slate-800';

  return (
    <div
      onClick={onClick}
      className={`rounded-xl shadow-sm overflow-hidden text-slate-100 ${variantStyles} ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
