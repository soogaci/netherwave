import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Профиль — Netherwave",
  description: "Профиль и настройки",
};

export default function ProfileLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
