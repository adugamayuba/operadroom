"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type DemoTheme = "light" | "dark";

const STORAGE_KEY = "operadroom-demo-theme";

const ThemeContext = createContext<{
  theme: DemoTheme;
  setTheme: (t: DemoTheme) => void;
  toggle: () => void;
} | null>(null);

export function DemoThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<DemoTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as DemoTheme | null;
    if (stored === "light" || stored === "dark") setThemeState(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-demo-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  const setTheme = (t: DemoTheme) => setThemeState(t);
  const toggle = () => setThemeState((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      <div data-demo-theme={mounted ? theme : "light"} className="demo-root min-h-screen">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useDemoTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useDemoTheme must be used within DemoThemeProvider");
  return ctx;
}
