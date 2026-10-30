/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Paleta del logo oficial (tokens en src/styles/tokens.css). Los nombres king-* se conservan
      // para no romper las vistas existentes; ahora apuntan a los colores reales de la marca.
      colors: {
        king: {
          ink: v('--brand-navy'),
          deep: v('--brand-navy-900'),
          royal: v('--brand-navy-700'),
          gold: v('--brand-gold-300'),
          goldlogo: v('--brand-gold'),
        },
        state: { free: v('--state-free'), reserved: v('--state-reserved'), occupied: v('--state-occupied') },
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'] },
      borderRadius: { glass: 'var(--radius-lg)' },
    },
  },
  plugins: [],
};
