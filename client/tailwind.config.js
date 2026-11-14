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
          bg: '#0C0C0E',
          surface: '#151518',
          surfaceLight: '#1E1E23',
          surfaceHover: '#26262D',
          border: '#282830',
          accent: '#E11D48',
          accentHover: '#F43F5E',
          accentDim: '#9F1239',
          accentLight: '#FECDD3',
          text: '#F4F4F6',
          textMuted: '#A1A1AA',
          textDim: '#71717A',
          success: '#22C55E',
          danger: '#EF4444',
          warning: '#F59E0B',
        }
      }
    },
  },
  plugins: [],
}
