import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#F97316',
          pink: '#EC4899',
        }
      },
      screens: {
        'xs': '320px',
        'sm': '480px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        'tablet-sm': '600px',
        'tablet-md': '768px',
        'tablet-lg': '1024px',
        'tablet-xl': '1280px',
        'ipad-mini': '744px',
        'ipad': '834px',
        'ipad-pro': '1024px',
        'ipad-pro-lg': '1366px',
        'landscape': { 'raw': '(orientation: landscape)' },
        'portrait': { 'raw': '(orientation: portrait)' },
        'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
        'tall': { 'raw': '(min-height: 800px)' },
        'short': { 'raw': '(max-height: 600px)' },
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      fontSize: {
        'responsive-xs': 'clamp(0.75rem, 2vw, 0.875rem)',
        'responsive-sm': 'clamp(0.875rem, 2.5vw, 1rem)',
        'responsive-base': 'clamp(1rem, 2.5vw, 1.125rem)',
        'responsive-lg': 'clamp(1.125rem, 3vw, 1.25rem)',
        'responsive-xl': 'clamp(1.25rem, 3.5vw, 1.5rem)',
        'responsive-2xl': 'clamp(1.5rem, 4vw, 1.875rem)',
        'responsive-3xl': 'clamp(1.875rem, 5vw, 2.25rem)',
        'responsive-4xl': 'clamp(2.25rem, 6vw, 3rem)',
        'responsive-5xl': 'clamp(3rem, 7vw, 4rem)',
      },
      minHeight: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        'touch-target': '48px',
      },
      minWidth: {
        'touch-target': '48px',
      },
    },
  },
  plugins: [],
} satisfies Config;
