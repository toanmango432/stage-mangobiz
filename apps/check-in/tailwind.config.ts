import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mango Design System
        mango: {
          primary: {
            DEFAULT: '#1a5f4a',
            50: '#e8f5f0',
            100: '#d1ebe1',
            200: '#a3d7c3',
            300: '#75c3a5',
            400: '#47af87',
            500: '#1a5f4a',
            600: '#154d3c',
            700: '#103b2e',
            800: '#0b2920',
            900: '#061712',
          },
          secondary: {
            DEFAULT: '#d4a853',
            50: '#fdf8eb',
            100: '#fbf1d7',
            200: '#f7e3af',
            300: '#f3d587',
            400: '#efc75f',
            500: '#d4a853',
            600: '#aa8642',
            700: '#7f6532',
            800: '#554321',
            900: '#2a2211',
          },
          bg: '#faf9f7',
          surface: '#ffffff',
          text: {
            DEFAULT: '#1f2937',
            secondary: '#6b7280',
            muted: '#9ca3af',
          },
        },
        // Legacy brand colors
        brand: {
          orange: '#F97316',
          pink: '#EC4899',
        }
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        body: ['Work Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
