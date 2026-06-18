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
        gold: {
          50: '#fcfaf2',
          100: '#f7f2de',
          200: '#eddcb3',
          300: '#dfbe7e',
          400: '#cfa252',
          500: '#c5a880', // Primary theme Gold Accent
          600: '#b88d3d',
          700: '#99712f',
          800: '#7c5828',
          900: '#664722',
          950: '#3b2611',
        },
        darkbg: '#121212',
        darkcard: '#1e1e1e',
        darkborder: '#2a2a2a',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Montserrat', 'serif'],
      },
    },
  },
  plugins: [],
}
