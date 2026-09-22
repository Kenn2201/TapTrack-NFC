import React from 'react';
import { useLocation } from 'react-router-dom';
import FadeContent from './bits/FadeContent';

/**
 * RouteReveal — Subtle fade/slide reveal on route change.
 * Keyed by pathname so each navigation re-mounts the transition.
 * Respects prefers-reduced-motion via FadeContent.
 */
export default function RouteReveal({ children }) {
  const location = useLocation();
  return (
    <FadeContent key={location.pathname} duration={400} className="min-h-full">
      {children}
    </FadeContent>
  );
}