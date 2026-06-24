import type { Config } from 'tailwindcss';

/**
 * GhestShop — Tailwind configuration.
 * "Liquid Glass" fintech theme: gold-trust + purple-tech on deep slate.
 * Semantic colors resolve to the CSS variables declared in globals.css so the
 * same utilities work in light and dark token sets.
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens (CSS-variable backed)
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-on-primary)',
        },
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
        destructive: 'var(--color-destructive)',
        ring: 'var(--color-ring)',
        // Contrast-safe gold TEXT token (amber-700 on light, vivid gold on dark).
        gold: 'var(--color-gold)',

        // Raw brand palette (Liquid Glass)
        'gold-trust': '#F59E0B',
        'purple-tech': '#8B5CF6',
        'slate-glass': '#0F172A',
      },
      fontFamily: {
        sans: ['var(--font-vazir)', 'var(--font-plex)', 'system-ui', 'sans-serif'],
        plex: ['var(--font-plex)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backgroundImage: {
        'glass-radial':
          'radial-gradient(circle at 20% 0%, rgba(245,158,11,0.18), transparent 45%), radial-gradient(circle at 90% 100%, rgba(139,92,246,0.16), transparent 45%)',
      },
      boxShadow: {
        glass: '0 8px 40px -12px rgba(0,0,0,0.55)',
        'glow-gold': '0 0 0 1px rgba(245,158,11,0.25), 0 8px 30px -8px rgba(245,158,11,0.35)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.0)' },
          '50%': { boxShadow: '0 0 0 6px rgba(239,68,68,0.18)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 1.8s ease-in-out infinite',
        'fade-up': 'fade-up 0.4s ease-out both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
