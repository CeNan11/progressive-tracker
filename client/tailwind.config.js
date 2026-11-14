/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tracker: {
          bg: 'var(--tracker-bg)',
          surface: 'var(--tracker-surface)',
          surfaceLight: 'var(--tracker-surface-light)',
          surfaceHover: 'var(--tracker-surface-hover)',
          border: 'var(--tracker-border)',
          accent: 'var(--tracker-accent)',
          accentHover: 'var(--tracker-accent-hover)',
          accentDim: 'var(--tracker-accent-dim)',
          accentLight: 'var(--tracker-accent-light)',
          text: 'var(--tracker-text)',
          textMuted: 'var(--tracker-text-muted)',
          textDim: 'var(--tracker-text-dim)',
          accentText: 'var(--tracker-accent-text)',
          success: '#688B46',
          danger: '#A64B4B',
          warning: '#C4973B',
        }
      }
    },
  },
  plugins: [],
}
