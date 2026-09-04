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
        background: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          hover: 'rgb(var(--color-surface-hover) / <alpha-value>)',
          subtle: 'rgb(var(--color-surface-subtle) / <alpha-value>)',
          border: 'rgb(var(--color-surface-border) / <alpha-value>)',
          active: 'rgb(var(--color-surface-active) / <alpha-value>)',
        },
        brand: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          500: '#E2E8F0',
          600: '#CBD5E1',
          700: '#94A3B8',
          accent: '#FFFFFF',
        },
        border: {
          DEFAULT: 'rgb(var(--color-surface-border) / <alpha-value>)',
          subtle: 'rgb(var(--color-surface-border) / <alpha-value>)',
          strong: 'rgb(var(--color-surface-active) / <alpha-value>)',
        },
        severity: {
          critical: '#F43F5E',
          important: '#F59E0B',
          watch: '#EAB308',
          normal: '#10B981',
        },
        market: {
          gain: '#10B981',
          loss: '#F43F5E',
          neutral: '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
