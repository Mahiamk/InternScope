/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        lexend: ['"Lexend"', 'sans-serif'],
        sans: ['"Lexend"', 'sans-serif'],
      },
      colors: {
        // Swiss palette: Black, White, Grays, Blood Red
        blood: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#e11d48',
          600: '#be123c',
          700: '#991b1b', // primary blood red
          800: '#881337', // deep blood red
          900: '#4c0519', // dark crimson
          DEFAULT: '#991b1b',
        },
        swiss: {
          black: '#0a0a0a',
          dark: '#171717',
          gray: '#525252',
          muted: '#737373',
          light: '#f5f5f5',
          border: '#e5e5e5',
          card: '#ffffff',
        }
      },
      borderRadius: {
        'swiss': '2px', // Swiss design favors crisp, minimalist geometry
      }
    },
  },
  plugins: [],
}
