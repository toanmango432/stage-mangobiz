export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      // ========================================
      // PREMIUM DESIGN SYSTEM TOKENS
      // ========================================

      colors: {
        // Brand colors (refined teal)
        brand: {
          50: '#EEFBF9',
          100: '#D6F5F1',
          200: '#ADE9E1',
          300: '#7DD8CF',
          400: '#4DC4BA',
          500: '#2AA79E',
          600: '#1F8B83',
          700: '#186F69',
          800: '#145854',
          900: '#104743',
        },
        // Surface colors (blue-tinted)
        surface: {
          primary: '#FAFBFC',
          secondary: '#F5F7FA',
          tertiary: '#EDF1F7',
          elevated: '#FFFFFF',
        },
      },

      fontSize: {
        '2xs': '0.625rem', // 10px for compact ticket labels
      },

      // Premium shadows
      boxShadow: {
        'premium-xs': '0 1px 2px rgba(15, 23, 42, 0.05)',
        'premium-sm': '0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.06)',
        'premium-md': '0 2px 8px rgba(15, 23, 42, 0.1), 0 1px 3px rgba(15, 23, 42, 0.08)',
        'premium-lg': '0 4px 12px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.08)',
        'premium-xl': '0 8px 24px rgba(15, 23, 42, 0.14), 0 4px 12px rgba(15, 23, 42, 0.10)',
        'premium-2xl': '0 16px 48px rgba(15, 23, 42, 0.16), 0 8px 24px rgba(15, 23, 42, 0.12)',
        'premium-3xl': '0 24px 60px rgba(15, 23, 42, 0.18), 0 12px 30px rgba(15, 23, 42, 0.14)',
      },

      // Glass morphism
      backdropBlur: {
        'premium': '20px',
        'premium-md': '24px',
        'premium-lg': '30px',
      },

      // Custom animations
      animation: {
        // Existing
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',

        // New premium animations
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'slide-left': 'slideLeft 0.4s ease-out',
        'scale-spring': 'scaleSpring 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',

        // Loading skeletons
        'shimmer': 'shimmer 2s infinite',
      },

      // Keyframes
      keyframes: {
        // Existing
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },

        // New
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleSpring: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },

      // Border radius
      borderRadius: {
        'premium-sm': '8px',
        'premium-md': '12px',
        'premium-lg': '16px',
        'premium-xl': '20px',
        'premium-2xl': '24px',
      },

      // Custom spacing (if needed beyond defaults)
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        // Safe area insets for notched devices
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-right': 'env(safe-area-inset-right, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-left': 'env(safe-area-inset-left, 0px)',
      },

      // Z-index scale
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },

      // Transition timing functions
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'elastic': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },

      // Transition durations
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
    },
  },
  plugins: [],
}