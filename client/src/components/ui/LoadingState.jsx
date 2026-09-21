import React from 'react';

/**
 * LoadingState — Standardized loading indicator with skeleton pulses
 * and descriptive loading text.
 */
export default function LoadingState({
  text = 'Loading data...',
  rows = 3,
  className = '',
}) {
  return (
    <div className={`w-full py-8 text-center flex flex-col items-center justify-center ${className}`}>
      <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin mb-3" />
      <p className="text-xs sm:text-sm text-slate-400 font-medium mb-4">{text}</p>
      {rows > 0 && (
        <div className="w-full max-w-lg space-y-2 opacity-50 pointer-events-none">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-800/60 rounded-lg animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}
