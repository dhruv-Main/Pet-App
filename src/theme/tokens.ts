/**
 * Design tokens â€” the single source of truth for the Pet Commerce design system.
 * These mirror tailwind.config.js and are consumed by non-className contexts
 * (gradients, charts, animated values, native components).
 */

import type { TextStyle } from 'react-native';

export const palette = {
  primary: {
    50: '#eef7ff',
    100: '#d9ecff',
    200: '#bcddff',
    300: '#8ec8ff',
    400: '#59a9ff',
    500: '#3086ff',
    600: '#1865f5',
    700: '#114fe1',
    800: '#1541b6',
    900: '#173b8f',
  },
  accent: {
    50: '#fff7ed',
    100: '#ffedd5',
    300: '#fdba74',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
  },
  neutral: {
    0: '#ffffff',
    50: '#f6f7fb',
    100: '#eceef5',
    200: '#dfe3ee',
    300: '#c3c9da',
    400: '#99a1bb',
    500: '#6b7390',
    600: '#4a5170',
    700: '#333a55',
    800: '#1e2436',
    900: '#141a2a',
    950: '#0b0f1a',
  },
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
} as const;

export const gradients = {
  twilight: ['#1e1b4b', '#3730a3', '#6d28d9'] as const,
  ink: ['#0b0f1a', '#141a2a', '#1e2436'] as const,
  gold: ['#1a1204', '#3a2a08', '#7a5a12'] as const,
  mint: ['#064e3b', '#047857', '#10b981'] as const,
  rose: ['#4c0519', '#9f1239', '#f43f5e'] as const,
  sky: ['#0c4a6e', '#0369a1', '#38bdf8'] as const,
  brand: ['#1865f5', '#3086ff', '#59a9ff'] as const,
  sunset: ['#f97316', '#f59e0b', '#ef4444'] as const,
  aurora: ['#0f172a', '#1e3a8a', '#2563eb'] as const,
  health: ['#16a34a', '#22c55e', '#86efac'] as const,
  premium: ['#f59e0b', '#fbbf24', '#fde68a'] as const,
  glassDark: ['rgba(20,26,42,0.72)', 'rgba(20,26,42,0.38)'] as const,
  glassLight: ['rgba(255,255,255,0.82)', 'rgba(255,255,255,0.45)'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  full: 9999,
} as const;

export interface TypeToken {
  fontSize: number;
  lineHeight: number;
  fontWeight: TextStyle['fontWeight'];
  letterSpacing?: number;
  textTransform?: TextStyle['textTransform'];
}

const scale = <K extends string>(t: Record<K, TypeToken>) => t;

/** Apple-style scale: tight tracking on large sizes, wide tracking on eyebrows. */
export const typography = scale({
  hero: { fontSize: 40, lineHeight: 44, fontWeight: '800', letterSpacing: -1.2 },
  display: { fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -0.9 },
  h1: { fontSize: 28, lineHeight: 33, fontWeight: '800', letterSpacing: -0.6 },
  h2: { fontSize: 22, lineHeight: 27, fontWeight: '700', letterSpacing: -0.4 },
  h3: { fontSize: 17, lineHeight: 22, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  eyebrow: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  metric: { fontSize: 26, lineHeight: 30, fontWeight: '800', letterSpacing: -0.6 },
});

export const elevation = {
  soft: {
    shadowColor: '#0b0f1a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  lifted: {
    shadowColor: '#0b0f1a',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 36,
    elevation: 10,
  },
  card: {
    shadowColor: '#0b0f1a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 4,
  },
  floating: {
    shadowColor: '#1865f5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
};

export const motion = {
  fast: 160,
  base: 240,
  slow: 420,
  spring: { damping: 16, stiffness: 180, mass: 0.9 },
};

