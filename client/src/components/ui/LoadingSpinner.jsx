export default function LoadingSpinner({ className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`} role="status" aria-live="polite">
      <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" />
      <span className="text-xs sm:text-sm text-slate-400 font-medium">Loading…</span>
    </div>
  );
}
