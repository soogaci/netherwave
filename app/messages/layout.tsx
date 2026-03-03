import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Чаты — FeelReal",
  description: "Личные сообщения и группы",
};

export default function MessagesLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
