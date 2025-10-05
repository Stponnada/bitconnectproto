// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', 
  content: [
    "./index.html",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
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
        
        // Backgrounds
        'primary': '#020617',
        'secondary': '#0f172a',
        'tertiary': '#1e293b',

        'primary-light': '#F8FAFC',
        'secondary-light': '#FFFFFF',
        'tertiary-light': '#E2E8F0',

        // Text
        'text-main': '#e2e8f0',
        'text-secondary': '#94a3b8',
        'text-tertiary': '#64748b',

        'text-main-light': '#0F172A',
        'text-secondary-light': '#334155',
        'text-tertiary-light': '#64748B',
      }
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
  ],
}