"use client";

import { FileQuestion, Search } from "lucide-react";

type EmptyStateProps = {
  type?: "no-results" | "no-posts";
  className?: string;
};

const config = {
  "no-results": {
    icon: Search,
    title: "Ничего не найдено",
    description: "Попробуй другой запрос или тег",
  },
  "no-posts": {
    icon: FileQuestion,
    title: "Пока нет постов",
    description: "Подпишись на кого-нибудь или обнови ленту позже",
  },
};

export function EmptyState({ type = "no-results", className = "" }: EmptyStateProps) {
  const { icon: Icon, title, description } = config[type];
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/30 p-10 text-center ${className}`}
      role="status"
    >
      <div className="mb-4 rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
