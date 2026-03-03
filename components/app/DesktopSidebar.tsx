"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Settings, Bell, User, Clapperboard } from "lucide-react";
import { MiniPlayerDesktop } from "./MiniPlayerDesktop";
import { usePlayer } from "@/components/providers/PlayerProvider";

const NAV_ITEMS = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/feels", label: "Feels", icon: Clapperboard },
  { href: "/messages", label: "Чаты", icon: MessageCircle },
  { href: "/hub", label: "Настройки", icon: Settings },
  { href: "/notifications", label: "Уведомления", icon: Bell },
  { href: "/profile", label: "Профиль", icon: User },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const player = usePlayer();

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen overflow-hidden border-r bg-background/80 backdrop-blur">
      <div className="p-4 border-b">
        <Link href="/" className="font-semibold text-lg text-foreground hover:opacity-80 transition">
          FeelReal
        </Link>
      </div>
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1 min-h-0">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm font-medium transition",
                active ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              ].join(" ")}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      {(player?.visible && player?.current) ? (
        <div className="shrink-0 p-3 pt-0 border-t">
          <MiniPlayerDesktop />
        </div>
      ) : null}
    </aside>
  );
}
