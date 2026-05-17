import type { Config } from 'tailwindcss'
import tailwindAnimate from 'tailwindcss-animate'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        input: 'var(--border)',
        ring: 'var(--accent)',
        background: 'var(--bg)',
        foreground: 'var(--text-1)',
        primary: { DEFAULT: 'var(--accent)', foreground: 'var(--text-inv)' },
        secondary: { DEFAULT: 'var(--bg-2)', foreground: 'var(--text-1)' },
        destructive: { DEFAULT: 'var(--err)', foreground: 'var(--text-inv)' },
        muted: { DEFAULT: 'var(--bg-2)', foreground: 'var(--text-3)' },
        accent: { DEFAULT: 'var(--accent-bg)', foreground: 'var(--accent-text)' },
        popover: { DEFAULT: 'var(--surface)', foreground: 'var(--text-1)' },
        card: { DEFAULT: 'var(--surface)', foreground: 'var(--text-1)' },

        'bg-2': 'var(--bg-2)',
        'bg-3': 'var(--bg-3)',
        surface: { DEFAULT: 'var(--surface)', '2': 'var(--surface-2)' },
        'fg-2': 'var(--text-2)',
        'fg-3': 'var(--text-3)',
        'fg-inv': 'var(--text-inv)',
        'primary-hover': 'var(--accent-h)',
        'accent-raw': 'var(--accent)',
        'accent-bg': 'var(--accent-bg)',
        'accent-text': 'var(--accent-text)',
        'border-2': 'var(--border-2)',
        ok: { DEFAULT: 'var(--ok)', bg: 'var(--ok-bg)' },
        warn: { DEFAULT: 'var(--warn)', bg: 'var(--warn-bg)' },
        err: { DEFAULT: 'var(--err)', bg: 'var(--err-bg)' },
        info: { DEFAULT: 'var(--info)', bg: 'var(--info-bg)' },
      },
      fontFamily: {
        sans: ['var(--font)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        lg: 'var(--shadow-lg)',
      },
      transitionTimingFunction: {
        spring: 'var(--ease-spring)',
        out: 'var(--ease-out)',
      },
      transitionDuration: {
        fast: 'var(--dur-fast)',
        normal: 'var(--dur)',
        slow: 'var(--dur-slow)',
        400: '400ms',
        600: '600ms',
        800: '800ms',
        1100: '1100ms',
      },
      spacing: {
        'sidebar': 'var(--sidebar-w)',
        'topbar': 'var(--topbar-h)',
        'statusbar': 'var(--statusbar-h)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite linear',
      },
    },
  },
  plugins: [tailwindAnimate],
} satisfies Config
