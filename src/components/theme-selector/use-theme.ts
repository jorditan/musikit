import { useEffect, useState } from "react";
type Theme = "light" | "dark" | "system";
const storageKey = "musikit-theme-v1";
function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark" || saved === "system")
      return saved;
  } catch {
    /* Storage may be unavailable. */
  }
  return "light";
}
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme);
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  function choose(next: Theme) {
    setTheme(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      /* Theme still works for this visit. */
    }
  }
  return { theme, choose };
}
