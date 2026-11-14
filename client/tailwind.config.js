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
          bg: '#28301C',
          surface: '#323D25',
          surfaceLight: '#3D4A2E',
          surfaceHover: '#445334',
          border: '#485736',
          accent: '#9A7E3B',
          accentHover: '#B29246',
          accentDim: '#7A642E',
          accentLight: '#D2CF9A',
          text: '#D2CF9A',
          textMuted: '#AAA87D',
          textDim: '#7E7C58',
          success: '#75994C',
          danger: '#B34A4A',
          warning: '#C4973B',
        }
      }
    },
  },
  plugins: [],
}
