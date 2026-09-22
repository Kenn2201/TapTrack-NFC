import React from 'react';
import { useAuth } from '../hooks/useAuth';
import useMediaQuery from '../hooks/useMediaQuery';

/**
 * AuthInitializer — Shows a lightweight branded loading state while
 * the auth/session initialization is occurring.
 * Respects prefers-reduced-motion.
 */
export default function AuthInitializer({ children }) {
  const { loading } = useAuth();
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  if (!loading) {
    return children;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4" role="status" aria-live="polite">
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="mx-auto w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-sm border border-blue-400/30">
            TT
          </div>
          {!prefersReducedMotion && (
            <>
              <div className="absolute inset-0 w-16 h-16 rounded-xl border-2 border-blue-500/30 animate-ping opacity-75" aria-hidden="true" />
              <div className="absolute inset-0 w-20 h-20 rounded-xl border-2 border-cyan-500/20 animate-ping opacity-50" style={{ animationDelay: '500ms' }} aria-hidden="true" />
            </>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-white">TapTrack NFC</p>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">Securing your session...</p>
        </div>
        <div className="w-32 mx-auto h-1 bg-slate-800 rounded-full overflow-hidden">
          {!prefersReducedMotion && (
            <div className="w-1/3 h-full bg-blue-500 animate-ping" aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  );
}