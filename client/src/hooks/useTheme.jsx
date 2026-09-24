import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'taptrack.theme';

function resolveTheme(preference) {
  if (preference === 'light' || preference === 'dark') return preference;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => {
    if (typeof window === 'undefined') return 'system';
    return localStorage.getItem(STORAGE_KEY) || 'system';
  });

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: light)');
    const apply = () => {
      document.documentElement.dataset.theme = resolveTheme(preference);
      document.documentElement.dataset.themePreference = preference;
    };
    apply();
    if (preference === 'system') media?.addEventListener?.('change', apply);
    return () => media?.removeEventListener?.('change', apply);
  }, [preference]);

  const updatePreference = (next) => {
    const value = ['light', 'dark', 'system'].includes(next) ? next : 'system';
    localStorage.setItem(STORAGE_KEY, value);
    setPreference(value);
  };

  const value = useMemo(() => ({
    preference,
    resolvedTheme: resolveTheme(preference),
    setPreference: updatePreference,
  }), [preference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
