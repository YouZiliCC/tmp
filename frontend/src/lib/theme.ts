export type Theme = "light" | "dark";

const KEY = "xcj-theme";

export function getTheme(): Theme {
  try {
    const t = localStorage.getItem(KEY);
    if (t === "dark" || t === "light") return t;
  } catch {
    /* ignore */
  }
  return "light"; // default light
}

export function applyTheme(t: Theme): void {
  document.documentElement.setAttribute("data-theme", t);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", t === "dark" ? "#0b0e14" : "#f4f6f9");
}

export function setTheme(t: Theme): void {
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* ignore */
  }
  applyTheme(t);
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}
