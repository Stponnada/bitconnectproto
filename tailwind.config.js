// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        raleway: ['Raleway', 'sans-serif'], 
      },
      colors: {
        'brand-green': '#3cfba2',
        'brand-green-darker': '#2fae85',
        'dark-primary': '#020617',
        'dark-secondary': '#0f172a',
        'dark-tertiary': '#1e293b',
      }
    },
  },
  plugins: [],
}

