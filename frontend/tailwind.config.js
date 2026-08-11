/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'var(--surface)',
          dim: '#cbdbf5',
          bright: 'var(--surface)',
        },
        'surface-container': {
          DEFAULT: 'var(--surface-container)',
          lowest: 'var(--surface-container-lowest)',
          low: 'var(--surface-container-low)',
          high: 'var(--surface-container-high)',
          highest: 'var(--surface-container-highest)',
        },
        'on-surface': {
          DEFAULT: 'var(--surface-on)',
          variant: 'var(--surface-on-variant)',
        },
        'inverse-surface': 'var(--inverse-surface)',
        'inverse-on-surface': 'var(--inverse-on-surface)',
        outline: {
          DEFAULT: 'var(--outline)',
          variant: 'var(--outline-variant)',
        },
        'surface-tint': '#494bd6',
        primary: {
          DEFAULT: 'var(--primary)',
          container: 'var(--primary-container)',
          fixed: '#e1e0ff',
          'fixed-dim': '#c0c1ff',
        },
        'on-primary': {
          DEFAULT: 'var(--primary-on)',
          container: 'var(--primary-container-on)',
          fixed: '#07006c',
          'fixed-variant': '#2f2ebe',
        },
        'inverse-primary': '#c0c1ff',
        secondary: {
          DEFAULT: 'var(--secondary)',
          container: 'var(--secondary-container)',
          fixed: '#acedff',
          'fixed-dim': '#4cd7f6',
        },
        'on-secondary': {
          DEFAULT: 'var(--secondary-on)',
          container: '#006172',
          fixed: '#001f26',
          'fixed-variant': '#004e5c',
        },
        tertiary: {
          DEFAULT: 'var(--tertiary)',
          container: 'var(--tertiary-container)',
          fixed: '#f0dbff',
          'fixed-dim': '#ddb7ff',
        },
        'on-tertiary': {
          DEFAULT: 'var(--tertiary-on)',
          container: '#fffbff',
          fixed: '#2c0051',
          'fixed-variant': '#6900b3',
        },
        error: {
          DEFAULT: 'var(--error)',
          container: 'var(--error-container)',
        },
        'on-error': {
          DEFAULT: 'var(--error-on)',
          container: 'var(--error-container-on)',
        },
        background: 'var(--bg)',
        'on-background': 'var(--bg-on)',
        'surface-variant': '#d3e4fe',
        'surface-info': '#e5eeff',
        success: '#22c55e',
        warning: '#f59e0b',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-sm': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-lg': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
}
