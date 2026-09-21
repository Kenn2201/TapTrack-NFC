import React, { useState, useEffect } from 'react';

/**
 * CountUp — Smooth number ticker for metrics.
 * Safely handles 0, null, undefined, strings, and non-numeric inputs.
 * Never outputs NaN or Infinity.
 * Respects prefers-reduced-motion.
 */
export default function CountUp({
  to = 0,
  from = 0,
  duration = 1000,
  className = '',
  suffix = '',
  prefix = '',
}) {
  const numericTarget = typeof to === 'number' ? to : parseFloat(to);
  const isNumeric = !isNaN(numericTarget) && isFinite(numericTarget);

  const [count, setCount] = useState(isNumeric ? from : to);

  useEffect(() => {
    if (!isNumeric) {
      setCount(to);
      return;
    }

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) {
      setCount(numericTarget);
      return;
    }

    let startTime = null;
    let animationFrameId = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (numericTarget - from) * easeOut);
      setCount(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(numericTarget);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [to, from, duration, isNumeric, numericTarget]);

  if (!isNumeric) {
    return <span className={className}>{to ?? '—'}</span>;
  }

  return (
    <span className={className}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}
