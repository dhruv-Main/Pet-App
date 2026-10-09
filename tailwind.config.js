/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand — warm, premium pet-tech identity
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
        success: { 500: '#22c55e', 600: '#16a34a' },
        warning: { 500: '#f59e0b' },
        danger: { 500: '#ef4444', 600: '#dc2626' },
        // Surfaces
        surface: {
          light: '#ffffff',
          'light-2': '#f6f7fb',
          dark: '#0b0f1a',
          'dark-2': '#141a2a',
        },
      },
      borderRadius: {
        xl: '16px',
        '2xl': '24px',
        '3xl': '32px',
      },
      fontFamily: {
        sans: ['Inter', 'System'],
        display: ['SpaceGrotesk', 'System'],
      },
    },
  },
  plugins: [],
};
