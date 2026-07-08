import type { Config } from 'tailwindcss';

/**
 * GhestShop — Tailwind configuration.
 * "Clarity" theme: trustworthy GhestShop blue (#407DC0) + sky accent on clean,
 * light-first neutrals. Semantic colors resolve to CSS-variable RGB channels
 * via `rgb(var(--color-x) / <alpha-value>)`, so opacity modifiers work across
 * both the light and dark token sets.
 */
const withAlpha = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

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
        // Semantic tokens (CSS-variable backed, alpha-capable)
        primary: {
          DEFAULT: withAlpha('--color-primary'),
          strong: withAlpha('--color-primary-strong'),
          foreground: withAlpha('--color-on-primary'),
        },
        secondary: withAlpha('--color-secondary'),
        accent: withAlpha('--color-accent'),
        success: withAlpha('--color-success'),
        background: withAlpha('--color-background'),
        surface: withAlpha('--color-surface'),
        foreground: withAlpha('--color-foreground'),
        muted: withAlpha('--color-muted'),
        border: withAlpha('--color-border'),
        destructive: withAlpha('--color-destructive'),
        ring: withAlpha('--color-ring'),
        // Contrast-safe brand-blue TEXT token.
        gold: withAlpha('--color-gold'),

        // Raw brand palette (Clarity)
        brand: {
          DEFAULT: '#407DC0',
          sky: '#38BDF8',
          ink: '#0F1D30',
        },
      },
      fontFamily: {
        sans: ['var(--font-vazir)', 'Tahoma', 'Arial', 'sans-serif'],
        plex: ['var(--font-plex)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        /* Live-site scale (16px root → body 15px) */
        caption: ['0.8125rem', { lineHeight: '1.6' }],
        body: ['0.9375rem', { lineHeight: '1.75' }],
        nav: ['0.9375rem', { lineHeight: '1.5' }],
        price: ['1rem', { lineHeight: '1.4', fontWeight: '700' }],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backgroundImage: {
        // Subtle brand aura — replaces the old gold/purple glass radial.
        'brand-aura':
          'radial-gradient(60rem 40rem at 15% -10%, rgb(var(--color-primary) / 0.10), transparent 60%), radial-gradient(50rem 40rem at 100% 0%, rgb(var(--color-accent) / 0.08), transparent 55%)',
        'brand-gradient': 'linear-gradient(135deg, #407DC0 0%, #38BDF8 100%)',
      },
      boxShadow: {
        // Soft, neutral elevation scale (light-first).
        card: '0 1px 2px rgba(15,29,48,0.04), 0 8px 24px -12px rgba(15,29,48,0.12)',
        'card-hover': '0 2px 4px rgba(15,29,48,0.06), 0 18px 40px -16px rgba(15,29,48,0.20)',
        float: '0 24px 60px -24px rgba(15,29,48,0.28)',
        'glow-brand': '0 8px 24px -8px rgba(64,125,192,0.45)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(220,38,38,0.0)' },
          '50%': { boxShadow: '0 0 0 6px rgba(220,38,38,0.16)' },
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
