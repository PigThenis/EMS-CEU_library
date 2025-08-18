/** @type {import('tailwindcss').Config} */
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef9ff',
          100: '#d6f0ff',
          200: '#aee0ff',
          300: '#7eceff',
          400: '#47b0ff',
          500: '#1f8fff',
          600: '#0a6fe6',
          700: '#0659b8',
          800: '#084d94',
          900: '#0b3e73'
        }
      }
    },
  },
  plugins: [],
};

