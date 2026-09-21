import React, { useState, useEffect } from 'react';

/**
 * Scanner — NFC hardware reader scanning visual.
 * Displays concentric pulsing NFC waves, a scanning beam laser line,
 * and a status-reactive glowing border.
 * Respects prefers-reduced-motion.
 */
export default function Scanner({
  status = 'READY', // READY | SCANNING | VERIFYING | SUCCESS | DUPLICATE | INVALID | ERROR
  className = '',
}) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
  }, []);

  const isScanning = status === 'SCANNING' || status === 'REQUESTING_PERMISSION';
  const isVerifying = status === 'VERIFYING';
  const isSuccess = status === 'SUCCESS';
  const isError = ['ERROR', 'INVALID', 'UNSUPPORTED', 'PERMISSION_DENIED'].includes(status);
  const isDuplicate = status === 'DUPLICATE';

  const getBorderGlow = () => {
    if (isSuccess) return 'border-emerald-500/60 shadow-[0_0_24px_rgba(16,185,129,0.25)]';
    if (isDuplicate) return 'border-amber-500/60 shadow-[0_0_24px_rgba(245,158,11,0.25)]';
    if (isError) return 'border-rose-500/60 shadow-[0_0_24px_rgba(244,63,94,0.25)]';
    if (isScanning || isVerifying) return 'border-cyan-500/60 shadow-[0_0_24px_rgba(6,182,212,0.3)]';
    return 'border-slate-800';
  };

  return (
    <div
      className={`relative mx-auto w-64 h-64 sm:w-72 sm:h-72 rounded-3xl border-2 bg-slate-950/80 flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${getBorderGlow()} ${className}`}
      role="img"
      aria-label={`NFC scanner in ${status} state`}
    >
      {/* Background concentric radar rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`w-48 h-48 rounded-full border border-slate-800 ${isScanning && !reducedMotion ? 'animate-ping opacity-20' : ''}`} />
        <div className="absolute w-36 h-36 rounded-full border border-slate-800/80" />
        <div className="absolute w-24 h-24 rounded-full border border-blue-500/20" />
      </div>

      {/* Laser scan line sweep */}
      {isScanning && !reducedMotion && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] pointer-events-none animate-bounce"
          style={{ animationDuration: '2s' }}
        />
      )}

      {/* Center Icon according to status */}
      <div className="relative z-10 flex flex-col items-center">
        {isSuccess ? (
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : isDuplicate ? (
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        ) : isError ? (
          <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        ) : isVerifying ? (
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center animate-spin">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        ) : (
          <div className={`w-16 h-16 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center ${isScanning && !reducedMotion ? 'animate-pulse' : ''}`}>
            {/* NFC Wave Icon */}
            <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.828a5 5 0 010-7.072m7.072 0a5 5 0 010 7.072M12 12h.01" />
            </svg>
          </div>
        )}

        <span className="mt-4 text-xs font-mono font-semibold uppercase tracking-widest text-slate-400">
          {status.replaceAll('_', ' ')}
        </span>
      </div>
    </div>
  );
}
