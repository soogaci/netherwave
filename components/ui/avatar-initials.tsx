"use client";

import { getInitials, getAvatarColor } from "@/lib/utils";

export function AvatarInitials({
  username,
  size = "md",
  className = "",
}: {
  username: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = getInitials(username);
  const bg = getAvatarColor(username);
  const sizeClass =
    size === "sm" ? "h-9 w-9 text-xs" : size === "lg" ? "h-16 w-16 text-lg" : "h-11 w-11 text-sm";

  return (
    <div
      className={`rounded-2xl grid place-items-center font-semibold text-white/95 shrink-0 ${sizeClass} ${className}`}
      style={{ backgroundColor: bg }}
      aria-hidden
    >
      {initials}
    </div>
  );
}
