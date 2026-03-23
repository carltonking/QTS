import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface1: 'var(--surface-1)',
        surface2: 'var(--surface-2)',
        border: 'var(--border)',
        borderHi: 'var(--border-hi)',
        text1: 'var(--text-1)',
        text2: 'var(--text-2)',
        text3: 'var(--text-3)',
      },
      fontFamily: {
        mono: ['var(--font-mono)'],
        sans: ['var(--font-sans)'],
      },
      borderRadius: {
        none: '0px',
      },
    },
  },
  plugins: [],
} satisfies Config;
