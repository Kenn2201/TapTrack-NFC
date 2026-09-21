import React from 'react';

/**
 * DotGrid — Subtle geometric background dot pattern with radial ambient glow.
 * Lightweight, zero-dependency, pure CSS & SVG.
 */
export default function DotGrid({ className = '', children }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Subtle radial glow in background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-blue-600/15 via-cyan-500/10 to-transparent blur-3xl opacity-80"
      />
      {/* Dot pattern overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />
      {children}
    </div>
  );
}
