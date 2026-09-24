import React, { useEffect, useRef } from 'react';

/**
 * Modal — Responsive accessible dialog.
 * Renders as a bottom sheet / full-width on mobile and a centered modal on desktop.
 * Traps focus, handles Escape key, locks body scroll, and supports close on backdrop click.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
  className = '',
}) {
  const modalRef = useRef(null);
  const onCloseRef = useRef(onClose);

  // Keep the latest close callback without making the focus-management effect
  // re-run on every parent render. Inline onClose callbacks are common across
  // TapTrack forms; depending on onClose directly caused the modal surface to
  // refocus after each keystroke and steal focus from the active input.
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    // Save previous overflow style
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus modal
    if (modalRef.current) {
      modalRef.current.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative z-10 w-full rounded-t-2xl sm:rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto focus-visible:outline-none ${maxWidth} ${className}`}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && (
              <h2 id="modal-title" className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 -mt-2"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-slate-200">{children}</div>
      </div>
    </div>
  );
}
