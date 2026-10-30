/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Todos los valores salen de src/styles/tokens.css. Los nombres king-* se conservan para no romper vistas.
      colors: {
        king: {
          ink: v("--brand-navy"),
          deep: v("--brand-navy-900"),
          royal: v("--brand-navy-700"),
          gold: v("--brand-gold-300"),
          goldlogo: v("--brand-gold"),
          goldtint: v("--brand-gold-100"),
        },
        surface: {
          app: v("--surface-app"),
          card: v("--surface-card"),
          sunken: v("--surface-sunken"),
        },
        line: { DEFAULT: v("--line"), strong: v("--line-strong") },
        fg: {
          strong: v("--text-strong"),
          body: v("--text-body"),
          muted: v("--text-muted"),
        },
        state: {
          free: v("--state-free"),
          "free-tint": v("--state-free-tint"),
          "free-ink": v("--state-free-ink"),
          reserved: v("--state-reserved"),
          "reserved-tint": v("--state-reserved-tint"),
          "reserved-ink": v("--state-reserved-ink"),
          occupied: v("--state-occupied"),
          "occupied-tint": v("--state-occupied-tint"),
          "occupied-ink": v("--state-occupied-ink"),
        },
      },
      fontFamily: {
        sans: ["var(--font-text)"],
        display: ["var(--font-display)"],
      },
      // Escala fija de producto, razón ≈ 1.25.
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.3rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.25rem", { lineHeight: "1.75rem" }],
        xl: ["1.5625rem", { lineHeight: "2rem" }],
        "2xl": ["1.9375rem", { lineHeight: "2.375rem" }],
        "3xl": ["2.4375rem", { lineHeight: "2.75rem" }],
        "4xl": ["3.0625rem", { lineHeight: "1" }],
      },
      borderRadius: {
        glass: "var(--radius-lg)",
        control: "var(--radius-sm)",
        tile: "var(--radius-md)",
      },
      boxShadow: {
        e1: "var(--shadow-1)",
        e2: "var(--shadow-2)",
        e3: "var(--shadow-3)",
      },
      transitionTimingFunction: { out: "var(--ease-out)" },
    },
  },
  plugins: [],
};
