/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kalvi: {
          red: '#EE3124',
          'red-dark': '#C91F13',
          'red-light': '#FEF2F2',
          black: '#09090B',
          dark: '#18181B',
          muted: '#71717A',
          border: '#E4E4E7',
          card: '#FFFFFF',
          bg: '#FAFAFA'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Courier New', 'monospace']
      }
    },
  },
  plugins: [],
}
