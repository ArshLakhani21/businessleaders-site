/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0D1B2A',
        'navy-soft': '#1e3048',
        gold: '#F5A623',
        'gold-deep': '#e09600',
        ink: '#1A1A2E',
        muted: '#6B7280',
        rule: '#e5e7eb',
        'rule-soft': '#f3f4f6',
        canvas: '#f8f9fa',
        'up-green': '#16A34A',
        'down-red': '#DC2626',
        beat: {
          business: '#0D1B2A',
          finance: '#16A34A',
          international: '#2563EB',
          entertainment: '#7C3AED',
          sports: '#DC2626',
          lifestyle: '#D97706',
          health: '#0D9488',
          travel: '#0891B2',
          astro: '#6D28D9',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Courier New"', 'monospace'],
      },
      maxWidth: {
        page: '1260px',
        prose: '70ch',
      },
      keyframes: {
        'ticker-scroll': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'ticker-slow': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'ticker-scroll': 'ticker-scroll 45s linear infinite',
        'ticker-slow': 'ticker-slow 60s linear infinite',
        'pulse-dot': 'pulse 1.2s infinite',
      },
    },
  },
  plugins: [],
};
