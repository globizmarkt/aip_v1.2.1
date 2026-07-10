// ============================================================
// ARCHIVO  : tailwind.config.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-07-10
// PROPÓSITO: Config Tailwind extraída del inline de index.html (DO-01).
//            0 hex literales — los 10 colores "Paleta Abisal" migrados a
//            variables CSS reales en crm-tokens-v13.css (R3 Zero-Hex).
// ============================================================
import containerQueries from '@tailwindcss/container-queries'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--theme-deep-ocean)',
        surface: 'var(--theme-surface)',
        'surface-alt': 'var(--theme-surface-alt)',
        secondary: 'var(--theme-accent)',
        'secondary-hover': 'var(--theme-accent-hover)',
        'on-background': 'var(--theme-foreground)',
        'on-surface': 'var(--theme-foreground)',
        'on-surface-variant': 'var(--theme-foreground-alt)',
        'outline-variant': 'var(--theme-border)',
        error: 'var(--theme-error)',

        /* [GADGET_0.2] Paleta Abisal — Migrada a variables CSS (R3 Zero-Hex) */
        'void':         'var(--tw-void)',
        'abyss':        'var(--tw-abyss)',
        'steel':        'var(--tw-steel)',
        'line':         'var(--tw-line)',
        'line-strong':  'var(--tw-line-strong)',
        'accent-cold':  'var(--tw-accent-cold)',
        'warning-amber':'var(--tw-warning-amber)',
        'ink':          'var(--tw-ink)',
        'ink-dim':      'var(--tw-ink-dim)',
        'ink-ghost':    'var(--tw-ink-ghost)',

        /* [H-04] Tokens gadgets landing — ausentes → colores no renderizaban */
        'institutional-gold': 'var(--abyss-gold, #C8A24A)',
        'abisal':             'var(--abyss-bg-deep, #070A10)',
        'surface-card':       'var(--abyss-surface, #0E1624)',
        'surface-muted':      'var(--abyss-text-dim, #6E7B8B)',
        'fiduciary-alt':      'var(--abyss-text-secondary, #9AA7B6)'
      },
      fontFamily: {
        serif: ["Noto Serif", "serif"],
        sans: ["Public Sans", "sans-serif"],
        mono: ["DM Mono", "monospace"]
      }
    }
  },
  plugins: [
    containerQueries
  ]
}
