import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Инициалы из ника: "s1dead" -> "S", "alina" -> "A" */
export function getInitials(username: string): string {
  const first = username.replace(/[^a-zA-Zа-яА-ЯёЁ]/g, "").slice(0, 1);
  return (first || username.slice(0, 1)).toUpperCase();
}

/** Цвет аватара по нику (стабильный хеш) */
export function getAvatarColor(username: string): string {
  const colors = [
    "oklch(0.55 0.2 280)",
    "oklch(0.5 0.18 320)",
    "oklch(0.55 0.15 200)",
    "oklch(0.6 0.2 50)",
    "oklch(0.5 0.2 160)",
  ];
  let n = 0;
  for (let i = 0; i < username.length; i++) n += username.charCodeAt(i);
  return colors[n % colors.length];
}
