import React from 'react';

/**
 * Button — Standardized interactive button with minimum 44px touch target,
 * clear states, and accessible focus indicators.
 */
export default function Button({
  children,
  variant = 'primary', // primary | secondary | success | danger | outline | ghost
  size = 'md', // sm | md | lg
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm border border-blue-500/30',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm border border-emerald-500/30',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm border border-rose-500/30',
    outline: 'border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white bg-transparent',
    ghost: 'text-slate-300 hover:text-white hover:bg-slate-800/60 border-transparent',
  }[variant] || 'bg-blue-600 hover:bg-blue-500 text-white';

  const sizeStyles = {
    sm: 'min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg',
    md: 'min-h-[44px] px-4 py-2 text-sm font-semibold rounded-lg',
    lg: 'min-h-[48px] px-5 py-3 text-base font-semibold rounded-xl',
  }[size] || 'min-h-[44px] px-4 py-2 text-sm font-semibold rounded-lg';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-1 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}
