import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette reads CSS vars so Settings can swap the accent at runtime.
        scarlet: {
          50:  "rgb(var(--accent-50)  / <alpha-value>)",
          100: "rgb(var(--accent-100) / <alpha-value>)",
          200: "rgb(var(--accent-200) / <alpha-value>)",
          300: "rgb(var(--accent-300) / <alpha-value>)",
          400: "rgb(var(--accent-400) / <alpha-value>)",
          500: "rgb(var(--accent-500) / <alpha-value>)",
          600: "rgb(var(--accent-600) / <alpha-value>)",
          700: "rgb(var(--accent-700) / <alpha-value>)",
          800: "rgb(var(--accent-800) / <alpha-value>)",
          900: "rgb(var(--accent-900) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "#16161A",
          soft: "#3F3F46",
          faint: "#71717A",
        },
        paper: {
          DEFAULT: "#F7F7F4",
          raised: "#FFFFFF",
          line: "#E7E7E2",
        },
        night: {
          DEFAULT: "#0E0E11",
          raised: "#16161B",
          line: "#26262D",
          soft: "#A1A1AA",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        "march": {
          to: { strokeDashoffset: "-16" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
        "rise-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        march: "march 0.9s linear infinite",
        "pulse-soft": "pulse-soft 1.8s ease-in-out infinite",
        "rise-in": "rise-in 0.35s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
