import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Уведомления — Netherwave",
  description: "Лайки, комментарии, подписки",
};

export default function NotificationsLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
