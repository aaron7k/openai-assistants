/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin-slow 8s linear infinite',
        'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
      },
      boxShadow: {
        'neon-purple': '0 0 5px #a855f7, 0 0 10px #a855f7, 0 0 15px #a855f7, 0 0 20px #a855f7',
      },
    },
  },
  plugins: [],
}
