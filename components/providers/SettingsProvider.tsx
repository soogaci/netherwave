"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ChatSize = "compact" | "normal" | "large";
export type FontSize = "small" | "medium" | "large";
export type AccentColor = "neutral" | "blue" | "violet" | "rose" | "orange" | "green";

export type Settings = {
  chatSize: ChatSize;
  fontSize: FontSize;
  accentColor: AccentColor;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  animationsEnabled: boolean;
};

const DEFAULTS: Settings = {
  chatSize: "normal",
  fontSize: "medium",
  accentColor: "neutral",
  notificationsEnabled: true,
  soundEnabled: true,
  animationsEnabled: true,
};

const STORAGE_KEY = "mus-settings";

type Ctx = Settings & {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  reset: () => void;
};

const SettingsContext = createContext<Ctx>({
  ...DEFAULTS,
  set: () => {},
  reset: () => {},
});

export function useSettings() {
  return useContext(SettingsContext);
}

const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
};

const ACCENT_MAP: Record<AccentColor, { light: string; dark: string }> = {
  neutral: { light: "oklch(0.145 0 0)", dark: "oklch(0.922 0 0)" },
  blue:    { light: "oklch(0.55 0.2 260)", dark: "oklch(0.65 0.2 260)" },
  violet:  { light: "oklch(0.55 0.2 300)", dark: "oklch(0.65 0.2 300)" },
  rose:    { light: "oklch(0.55 0.2 10)", dark: "oklch(0.7 0.18 10)" },
  orange:  { light: "oklch(0.6 0.2 55)", dark: "oklch(0.72 0.19 55)" },
  green:   { light: "oklch(0.55 0.17 155)", dark: "oklch(0.65 0.17 155)" },
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings((prev) => ({ ...prev, ...JSON.parse(raw) }));
    } catch {}
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings, mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.style.fontSize = FONT_SIZE_MAP[settings.fontSize];
  }, [settings.fontSize, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const isDark = document.documentElement.classList.contains("dark");
    const accent = ACCENT_MAP[settings.accentColor];
    const color = isDark ? accent.dark : accent.light;
    document.documentElement.style.setProperty("--accent-current", color);
  }, [settings.accentColor, mounted]);

  const set = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => setSettings(DEFAULTS), []);

  return (
    <SettingsContext.Provider value={{ ...settings, set, reset }}>
      {children}
    </SettingsContext.Provider>
  );
}
