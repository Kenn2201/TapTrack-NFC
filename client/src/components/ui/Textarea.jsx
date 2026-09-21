import React, { useId } from 'react';

/**
 * Textarea — Standardized accessible form textarea.
 */
export default function Textarea({
  label,
  id: propId,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  const generatedId = useId();
  const id = propId || generatedId;
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
          {label}
          {required && <span className="text-rose-400 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        id={id}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        className={`w-full px-3.5 py-2.5 rounded-lg border bg-slate-950 text-slate-100 text-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
          error ? 'border-rose-500/80 focus-visible:ring-rose-500' : 'border-slate-700 hover:border-slate-600 focus-visible:border-blue-500'
        }`}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-rose-400 font-medium">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className="mt-1 text-xs text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
}
