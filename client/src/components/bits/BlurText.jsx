import React, { useState, useEffect } from 'react';

/**
 * BlurText — Smooth blur-to-focus text animation.
 * Respects prefers-reduced-motion by rendering statically without delay.
 */
export default function BlurText({
  text = '',
  className = '',
  delay = 50,
  as: Component = 'span',
}) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const timer = setTimeout(() => setAnimated(true), 20);
    return () => clearTimeout(timer);
  }, []);

  const words = text.split(' ');

  if (reducedMotion) {
    return <Component className={className}>{text}</Component>;
  }

  return (
    <Component className={`inline-block ${className}`}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="inline-block transition-all duration-700 ease-out"
          style={{
            transitionDelay: `${index * delay}ms`,
            filter: animated ? 'blur(0px)' : 'blur(8px)',
            opacity: animated ? 1 : 0,
            transform: animated ? 'translateY(0)' : 'translateY(12px)',
            marginRight: index < words.length - 1 ? '0.28em' : '0',
          }}
        >
          {word}
        </span>
      ))}
    </Component>
  );
}
