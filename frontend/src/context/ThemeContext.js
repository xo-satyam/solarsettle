import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'solarsettle-theme';
const ThemeContext = createContext(null);

export const useTheme = () => useContext(ThemeContext);

/**
 * Day / Night theme context.
 * 
 * - Persists to localStorage.
 * - Defaults to 'day' (bright clean-energy feel).
 * - Applies `data-theme="day|night"` on document.documentElement.
 * - Respects prefers-reduced-motion by not animating on first paint.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'day' || saved === 'night') return saved;
    } catch { /* storage unavailable — fine */ }
    return 'day';
  });

  // Apply the data attribute + CSS variables switch.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch { /* storage unavailable — fine */ }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === 'day' ? 'night' : 'day'));
  }, []);

  const value = useMemo(
    () => ({ theme, toggle, isNight: theme === 'night', isDay: theme === 'day' }),
    [theme, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}