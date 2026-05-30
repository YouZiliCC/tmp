import { useEffect, useState } from "react";
import { getTheme, toggleTheme, type Theme } from "../lib/theme";

/** Small button that flips light/dark theme and reflects current state. */
export default function ThemeToggle() {
  const [theme, setLocal] = useState<Theme>("light");

  useEffect(() => {
    setLocal(getTheme());
  }, []);

  function flip() {
    setLocal(toggleTheme());
  }

  return (
    <button
      type="button"
      onClick={flip}
      className="kicker flex items-center gap-2 text-text-3 hover:text-cyan transition-colors"
      title="切换浅色/深色"
      aria-label="toggle theme"
    >
      <span className="font-mono">{theme === "dark" ? "☾" : "☀"}</span>
      <span>{theme === "dark" ? "dark" : "light"}</span>
    </button>
  );
}
