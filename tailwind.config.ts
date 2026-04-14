import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Xpenses Brand Palette (basada en imagen) ──
        brand: {
          'rich-black':    '#000F0A',
          'dark-green':    '#032221',
          'bangladesh':   '#03624C',
          'meadow':        '#2CC295',
          'caribbean':     '#00DF81',
          'white':         '#F1F7F6',
        },
        // ── Semantic Tokens ──
        // Dark mode
        dark: {
          bg:        '#000F0A',
          surface:   '#0D1F15',
          'surface-2': '#143524',
          'surface-3': '#1C4229',
          border:    'rgba(0, 223, 129, 0.12)',
          'border-2': 'rgba(255, 255, 255, 0.06)',
          text:      '#E8FBF4',
          'text-2':  '#7AB89A',
          'text-3':  '#3D6B55',
        },
        // Light mode
        light: {
          bg:        '#F1F7F6',
          surface:   '#FFFFFF',
          'surface-2': '#F0F9F5',
          'surface-3': '#E6F5EE',
          border:    'rgba(0, 158, 73, 0.15)',
          'border-2': 'rgba(0, 0, 0, 0.06)',
          text:      '#0D1F15',
          'text-2':  '#3D6B55',
          'text-3':  '#7AB89A',
        },
        // ── Accent ──
        accent: {
          DEFAULT:  '#00DF81',
          light:    '#2CC295',
          dim:      'rgba(0, 223, 129, 0.12)',
          glow:     'rgba(0, 223, 129, 0.30)',
          dark:     '#00A85A',
        },
        // ── Status ──
        success: { DEFAULT: '#00DF81', dim: 'rgba(0, 223, 129, 0.12)' },
        warning: { DEFAULT: '#F59E0B', dim: 'rgba(245, 158, 11, 0.12)' },
        danger:  { DEFAULT: '#F43F5E', dim: 'rgba(244, 63, 94, 0.12)'  },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        'sm':   '0.375rem',
        'md':   '0.75rem',
        'lg':   '1rem',
        'xl':   '1.5rem',
        '2xl':  '2rem',
        '3xl':  '3rem',
      },
      boxShadow: {
        'accent':  '0 4px 24px rgba(0, 223, 129, 0.25)',
        'glow':    '0 0 48px rgba(0, 223, 129, 0.35)',
        'card':    '0 1px 3px rgba(0, 0, 0, 0.4)',
        'card-md': '0 4px 16px rgba(0, 0, 0, 0.5)',
        'card-lg': '0 8px 32px rgba(0, 0, 0, 0.6)',
      },
      backgroundImage: {
        'hero-dark':  'linear-gradient(135deg, #0D1F15 0%, #143524 50%, #03624C 100%)',
        'hero-light': 'linear-gradient(135deg, #E8F5EE 0%, #D0EDE0 50%, #B8E4D0 100%)',
        'accent-gradient': 'linear-gradient(135deg, #00DF81 0%, #2CC295 100%)',
      },
      animation: {
        'float':      'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up':   'slideUp 0.3s ease-out',
        'fade-in':    'fadeIn 0.2s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        slideUp: {
          from: { transform: 'translateY(16px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      screens: {
        'xs': '380px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      },
    },
  },
  plugins: [],
}

export default config
