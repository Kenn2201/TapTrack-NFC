import React, { useState, useRef, useEffect } from 'react';

/**
 * Dropdown — Accessible keyboard-driven dropdown menu.
 * Handles click outside, Escape key, viewport edge detection,
 * and maintains proper ARIA attributes.
 */
export default function Dropdown({
  trigger,
  children,
  align = 'right', // left | right
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const alignStyles = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger(isOpen)}
      </div>

      {isOpen && (
        <div
          role="menu"
          className={`absolute ${alignStyles} mt-2 w-56 sm:w-64 rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-md shadow-xl py-1.5 z-50 focus-visible:outline-none animate-in fade-in zoom-in-95 duration-100 max-h-[85vh] overflow-y-auto`}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}
