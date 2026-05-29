/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-2": "var(--bg-2)",
        "bg-3": "var(--bg-3)",
        line: "var(--line)",
        "line-2": "var(--line-2)",
        text: "var(--text)",
        "text-2": "var(--text-2)",
        "text-3": "var(--text-3)",
        cyan: "var(--cyan)",
        amber: "var(--amber)",
        violet: "var(--violet)",
        green: "var(--green)",
        red: "var(--red)",
      },
      fontFamily: {
        display: ["Sora", "Noto Sans SC", "system-ui", "sans-serif"],
        sans: [
          "Noto Sans SC",
          "Inter",
          "PingFang SC",
          "Hiragino Sans GB",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "IBM Plex Mono",
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      borderRadius: {
        none: "0",
        DEFAULT: "2px",
        sm: "2px",
        md: "4px",
        lg: "4px",
        xl: "4px",
        "2xl": "4px",
        "3xl": "4px",
        full: "9999px",
      },
      maxWidth: {
        column: "1180px",
      },
      letterSpacing: {
        kicker: "0.22em",
        wide2: "0.14em",
      },
      fontVariantNumeric: {
        tnum: "tabular-nums",
      },
    },
  },
  corePlugins: {
    boxShadow: true,
  },
  plugins: [],
};
