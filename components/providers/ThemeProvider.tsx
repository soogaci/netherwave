"use client";

import React from "react";
import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";

export type ThemeId =
  | "default"   // Deep Night — тёмный, primary #7B61FF
  | "light"    // Blanc — светлый
  | "mint"     // Arctic — бирюзовый акцент
  | "warm"     // Solar Flare — оранжево-алый
  | "neon"     // Яркие неоновые акценты
  | "glass";   // Стекло, размытие

const THEME_STORAGE_KEY = "feelreal-theme";

const ThemeContext = createContext<{
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
}>({ theme: "default", setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("default");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
      const valid: ThemeId[] = ["default", "light", "mint", "warm", "neon", "glass"];
      if (stored && valid.includes(stored)) setThemeState(stored);
    } catch {}
  }, []);

  useLayoutEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    const isDark = ["default", "mint", "warm", "neon"].includes(theme);
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}
  }, [theme, mounted]);

  const setTheme = (t: ThemeId) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
