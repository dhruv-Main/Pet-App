import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { colorScheme as nwColorScheme } from 'nativewind';
import { AppTheme, ThemeMode, themes } from './themes';

type ThemePreference = ThemeMode | 'system';

interface ThemeContextValue {
  theme: AppTheme;
  mode: ThemeMode;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  const mode: ThemeMode = preference === 'system' ? (systemScheme ?? 'light') : preference;

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    const resolved = pref === 'system' ? undefined : pref;
    nwColorScheme.set(resolved ?? 'system');
  }, []);

  const toggle = useCallback(() => {
    setPreference(mode === 'light' ? 'dark' : 'light');
  }, [mode, setPreference]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: themes[mode], mode, preference, setPreference, toggle }),
    [mode, preference, setPreference, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
