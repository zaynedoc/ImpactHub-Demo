import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary color palette
        'muted-main': '#2C3531',
        'main': '#116466',
        'muted-accent': '#D9B08C',
        'accent': '#FFCB9A',
        'bright-accent': '#D1E8E2',
        // Semantic aliases
        background: '#2C3531',
        foreground: '#D1E8E2',
        primary: {
          DEFAULT: '#116466',
          hover: '#0d5052',
          muted: '#2C3531',
        },
        secondary: {
          DEFAULT: '#D9B08C',
          hover: '#c9a07c',
        },
        border: 'rgba(17, 100, 102, 0.3)',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.6s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'border-glow': 'borderGlow 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'spin-slow': 'spin 20s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'aurora': 'aurora 4s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #116466, 0 0 10px #116466, 0 0 15px #116466' },
          '100%': { boxShadow: '0 0 10px #FFCB9A, 0 0 20px #FFCB9A, 0 0 30px #FFCB9A' },
        },
        borderGlow: {
          '0%, 100%': { borderColor: 'rgba(17, 100, 102, 0.5)' },
          '50%': { borderColor: 'rgba(255, 203, 154, 0.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        aurora: {
          '0%, 100%': { backgroundPosition: '0% center' },
          '50%': { backgroundPosition: '100% center' },
        },
      },
      boxShadow: {
        'glow-main': '0 0 15px rgba(17, 100, 102, 0.5)',
        'glow-accent': '0 0 15px rgba(255, 203, 154, 0.5)',
        'glow-bright': '0 0 15px rgba(209, 232, 226, 0.5)',
        'lift': '0 10px 40px -10px rgba(0, 0, 0, 0.3)',
        'lift-accent': '0 10px 40px -10px rgba(17, 100, 102, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [],
};

export default config;
