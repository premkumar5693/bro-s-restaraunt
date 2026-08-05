/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./*.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        custom: {
          red: '#D62828',
          orange: '#F77F00',
          yellow: '#FCBF49',
          cream: '#FFF8F0',
          charcoal: '#1A1A1A', // Slightly darker for premium feel
        }
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'subtle-zoom': {
          '0%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        }
      },
      animation: {
        'fade-up': 'fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }
    },
  },
  plugins: [],
}
