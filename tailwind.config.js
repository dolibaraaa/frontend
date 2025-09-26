/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bb-primary': '#7C3AED',
        'bb-primary-dark': '#5B21B6',
        'bb-secondary': '#F59E0B',
        'bb-accent': '#10B981',
        'bb-bg-primary': '#0F172A'
      }
    },
  },
  plugins: [],
}
