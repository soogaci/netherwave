import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Новый пост — Netherwave",
  description: "Опубликовать пост",
};

export default function AddLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
