"use client";

import Link from "next/link";
import { FileQuestion, Search, Bell, MessageCircle, ImagePlus, Video, Plus } from "lucide-react";

type EmptyStateProps = {
  type?: "no-results" | "no-posts" | "no-notifications" | "no-chats" | "no-feels" | "no-reposts";
  className?: string;
  action?: { href: string; label: string };
};

const config: Record<string, { icon: typeof Search; title: string; description: string }> = {
  "no-results": {
    icon: Search,
    title: "Ничего не найдено",
    description: "Попробуй другой запрос или тег",
  },
  "no-posts": {
    icon: FileQuestion,
    title: "Пока нет постов",
    description: "Подпишись на кого-нибудь или добавь первый пост",
  },
  "no-notifications": {
    icon: Bell,
    title: "Пока нет уведомлений",
    description: "Лайки, комментарии и подписки появятся здесь",
  },
  "no-chats": {
    icon: MessageCircle,
    title: "Нет диалогов",
    description: "Напиши кому-нибудь из профиля или ленты",
  },
  "no-feels": {
    icon: Video,
    title: "Пока нет Feels",
    description: "Добавь короткое видео в разделе «Добавить»",
  },
  "no-reposts": {
    icon: ImagePlus,
    title: "Пока нет репостов",
    description: "Репосты филсов появятся здесь",
  },
};

export function EmptyState({ type = "no-results", className = "", action }: EmptyStateProps) {
  const c = config[type] ?? config["no-results"];
  const Icon = c.icon;
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/30 p-8 sm:p-10 text-center ${className}`}
      role="status"
    >
      <div className="mb-4 rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">{c.title}</p>
      <p className="mt-1 text-xs text-muted-foreground max-w-[260px]">{c.description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="h-4 w-4" />
          {action.label}
        </Link>
      )}
    </div>
  );
}
