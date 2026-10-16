import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'internscope_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {
      // localStorage may fail in restricted environments
    }
    return 'system';
  });

  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  // Calculate resolved theme
  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme;

  // Listen for OS system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Listen for storage events (multi-tab sync)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) {
        const val = e.newValue as Theme | null;
        if (val === 'light' || val === 'dark' || val === 'system') {
          setThemeState(val);
        } else if (!val) {
          setThemeState('system');
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Apply to DOM & documentElement
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    // Set meta color-scheme
    let meta = document.querySelector('meta[name="color-scheme"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'color-scheme');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // ignore storage error
    }
  };

  const toggleTheme = () => {
    const next: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
