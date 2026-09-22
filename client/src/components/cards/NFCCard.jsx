import React from 'react';
import CardStatusBadge from './CardStatusBadge';

/**
 * NFCCard — Modern digital NFC credential card presentation.
 * Displays safe metadata only: card label, status, and activation date.
 * Never displays raw tokens or hashes.
 */
export default function NFCCard({ card, className = '' }) {
  if (!card) return null;

  const formattedDate = card.issuedAt || card.createdAt
    ? new Date(card.issuedAt || card.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Pending';

  return (
    <div
      className={`relative w-full max-w-md aspect-[1.586/1] rounded-2xl p-6 sm:p-7 overflow-hidden shadow-2xl border border-blue-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/80 text-white flex flex-col justify-between select-none ${className}`}
      style={{
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Specular highlight diagonal sheen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent rotate-45"
      />

      {/* Top Header: Brand + NFC Wireless symbol */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center space-x-2.5">
          <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-md border border-blue-400/30">
            TT
          </span>
          <span className="font-bold tracking-tight text-sm sm:text-base text-slate-100">
            TapTrack <span className="text-blue-400">NFC</span>
          </span>
        </div>

        {/* Contactless symbol */}
        <div className="flex items-center text-blue-400/80" title="Contactless NFC Ready">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.828a5 5 0 010-7.072m7.072 0a5 5 0 010 7.072M12 12h.01" />
          </svg>
        </div>
      </div>

      {/* Middle: Smart Chip Graphic Simulation + Status */}
      <div className="flex items-center justify-between my-auto z-10">
        {/* Metallic Chip */}
        <div className="w-11 h-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-0.5 shadow-inner opacity-90 border border-amber-300/40">
          <div className="w-full h-full border border-amber-800/40 rounded-[3px] grid grid-cols-2 grid-rows-2 opacity-60">
            <div className="border-r border-b border-amber-900/40" />
            <div className="border-b border-amber-900/40" />
            <div className="border-r border-amber-900/40" />
            <div />
          </div>
        </div>

        <div>
          <CardStatusBadge status={card.status} />
        </div>
      </div>

      {/* Bottom: Card Label in Monospace + Activation Date */}
      <div className="z-10 mt-auto pt-2">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 block mb-0.5">
              Card Identifier
            </span>
            <span className="font-mono text-xl sm:text-2xl font-black tracking-wider text-slate-100">
              {card.cardLabel || 'NFC-XXX'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 block mb-0.5">
              Issued / Active
            </span>
            <span className="text-xs sm:text-sm font-medium text-slate-200">
              {formattedDate}
            </span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
          <span>Opaque Random Credential</span>
          <span>Zero Client Secrets</span>
        </div>
      </div>
    </div>
  );
}
