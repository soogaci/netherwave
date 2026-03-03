import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Уведомления — FeelReal",
  description: "Уведомления",
};

export default function NotificationsLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
