"use client";

import { isOnline } from "@/lib/format-last-seen";

export function OnlineIndicator({
  lastSeen,
  className = "",
}: {
  lastSeen: string | null | undefined;
  className?: string;
}) {
  if (!isOnline(lastSeen)) return null;
  return (
    <span
      className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500 dark:bg-green-400 ${className}`}
      aria-label="онлайн"
    />
  );
}
