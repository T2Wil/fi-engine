import { useEffect, useState } from "react";

const STORAGE_KEY = "fi-dashboard-theme";
type Theme = "light" | "dark";

function getStored(): Theme {
  if (typeof window === "undefined") return "light";
  const s = localStorage.getItem(STORAGE_KEY);
  if (s === "light" || s === "dark") return s;
  return "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getStored);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (next: Theme) => setThemeState(next);
  const toggleTheme = () => setThemeState((t) => (t === "dark" ? "light" : "dark"));

  return { theme, setTheme, toggleTheme };
}
