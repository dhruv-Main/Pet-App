import { palette } from './tokens';

export type ThemeMode = 'light' | 'dark';

export interface AppTheme {
  mode: ThemeMode;
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    surfaceElevated: string;
    border: string;
    text: string;
    textMuted: string;
    textInverse: string;
    primary: string;
    primaryMuted: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    glass: string;
    overlay: string;
  };
}

export const lightTheme: AppTheme = {
  mode: 'light',
  colors: {
    background: palette.neutral[50],
    surface: palette.neutral[0],
    surfaceAlt: palette.neutral[100],
    surfaceElevated: palette.neutral[0],
    border: palette.neutral[200],
    text: palette.neutral[900],
    textMuted: palette.neutral[500],
    textInverse: palette.neutral[0],
    primary: palette.primary[600],
    primaryMuted: palette.primary[100],
    accent: palette.accent[500],
    success: palette.success,
    warning: palette.warning,
    danger: palette.danger,
    glass: 'rgba(255,255,255,0.72)',
    overlay: 'rgba(11,15,26,0.45)',
  },
};

export const darkTheme: AppTheme = {
  mode: 'dark',
  colors: {
    background: palette.neutral[950],
    surface: palette.neutral[900],
    surfaceAlt: palette.neutral[800],
    surfaceElevated: palette.neutral[800],
    border: 'rgba(255,255,255,0.08)',
    text: palette.neutral[50],
    textMuted: palette.neutral[400],
    textInverse: palette.neutral[950],
    primary: palette.primary[400],
    primaryMuted: 'rgba(48,134,255,0.16)',
    accent: palette.accent[300],
    success: palette.success,
    warning: palette.warning,
    danger: palette.danger,
    glass: 'rgba(20,26,42,0.6)',
    overlay: 'rgba(0,0,0,0.6)',
  },
};

export const themes: Record<ThemeMode, AppTheme> = {
  light: lightTheme,
  dark: darkTheme,
};
