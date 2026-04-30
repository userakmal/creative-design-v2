/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
      colors: {
        primary: '#1c1917',
        secondary: '#57534e',
        accent: '#d6d3d1',
        cream: '#fafaf9',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'fade-in': 'fadeIn 1s ease-out forwards',
        'spin-slow': 'spin 12s linear infinite',
        'scale-in': 'scaleIn 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards',
        'pulse-soft': 'pulseSoft 3s infinite',
        'ripple-elegant-1': 'rippleElegant 3s cubic-bezier(0, 0, 0.2, 1) infinite',
        'ripple-elegant-2': 'rippleElegant 3s cubic-bezier(0, 0, 0.2, 1) infinite 1s',
        'ripple-elegant-3': 'rippleElegant 3s cubic-bezier(0, 0, 0.2, 1) infinite 2s',
        'breathe': 'breathe 5s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        rippleElegant: {
          '0%': { transform: 'scale(0.8)', opacity: '0.3' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.05))' },
          '50%': { transform: 'scale(1.02)', filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.1))' },
        }
      }
    }
  },
  plugins: [],
}
