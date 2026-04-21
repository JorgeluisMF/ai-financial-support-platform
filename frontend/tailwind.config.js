/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#020617',
        foreground: '#e2e8f0',
        primary: {
          DEFAULT: '#4f46e5',
          foreground: '#e5e7eb',
        },
        muted: '#0f172a',
        border: '#1e293b',
      },
      borderRadius: {
        '2xl': '1rem',
      },
      boxShadow: {
        'soft-xl': '0 18px 45px rgba(15,23,42,0.65)',
      },
    },
  },
  plugins: [],
}

