import React from 'react';

/**
 * PageContainer — Standardized page width, horizontal padding, and safe margins.
 */
export default function PageContainer({
  children,
  maxWidth = 'max-w-7xl',
  className = '',
}) {
  return (
    <main
      className={`mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${maxWidth} ${className}`}
    >
      {children}
    </main>
  );
}
