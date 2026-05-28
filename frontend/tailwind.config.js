/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        "paper-2": "var(--paper-2)",
        card: "var(--card)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        "ink-dark": "var(--ink-dark)",
        rule: "var(--rule)",
        "rule-2": "var(--rule-2)",
        vermillion: "var(--vermillion)",
        copper: "var(--copper)",
        gold: "var(--gold)",
      },
      fontFamily: {
        display: ["Fraunces", "Noto Serif SC", "Songti SC", "serif"],
        serif: ["Newsreader", "Noto Serif SC", "Songti SC", "serif"],
        sans: [
          "Noto Sans SC",
          "PingFang SC",
          "Hiragino Sans GB",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      borderRadius: {
        none: "0",
        DEFAULT: "0",
        sm: "0",
        md: "0",
        lg: "0",
        xl: "0",
        "2xl": "0",
        "3xl": "0",
        full: "9999px",
      },
      maxWidth: {
        column: "1280px",
      },
      letterSpacing: {
        kicker: "0.18em",
      },
    },
  },
  corePlugins: {
    boxShadow: false,
  },
  plugins: [],
};
