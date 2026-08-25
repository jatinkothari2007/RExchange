/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F19',
        surface: '#111827',
        'surface-elevated': '#1F2937',
        'surface-border': '#374151',
        karma: {
          light: '#FBBF24',
          DEFAULT: '#F59E0B',
          dark: '#D97706',
        },
        urgency: {
          light: '#F87171',
          DEFAULT: '#EF4444',
          dark: '#DC2626',
        },
        eco: {
          light: '#34D399',
          DEFAULT: '#10B981',
          dark: '#059669',
        }
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-karma': 'floatUp 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        floatUp: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.9)' },
          '20%': { opacity: '1', transform: 'translateY(-5px) scale(1.05)' },
          '80%': { opacity: '0.9', transform: 'translateY(-25px) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-40px) scale(0.95)' },
        }
      }
    },
  },
  plugins: [],
}
