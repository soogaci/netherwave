"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Plus, Bell, User } from "lucide-react";
import { NetherwaveLogo } from "@/components/ui/NetherwaveLogo";
import { MiniPlayerDesktop } from "./MiniPlayerDesktop";
import { usePlayer } from "@/components/providers/PlayerProvider";

const NAV_ITEMS = [
  { href: "/", label: "Лента", icon: Home },
  { href: "/messages", label: "Чаты", icon: MessageCircle },
  { href: "/add", label: "Добавить", icon: Plus },
  { href: "/notifications", label: "Уведомления", icon: Bell },
  { href: "/profile", label: "Профиль", icon: User },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const player = usePlayer();

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen overflow-hidden border-r bg-background/80 backdrop-blur">
      <div className="p-4 border-b">
        <Link href="/" className="flex items-center gap-2">
          <NetherwaveLogo size="sm" />
          <span className="font-semibold text-lg">Netherwave</span>
        </Link>
      </div>
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1 min-h-0">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const isAdd = href === "/add";
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm font-medium transition",
                active ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                isAdd && "mt-2",
              ].join(" ")}
            >
              {isAdd ? (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-foreground text-background">
                  <Plus className="h-4 w-4" />
                </span>
              ) : (
                <Icon className="h-5 w-5 shrink-0" />
              )}
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0 p-3 pt-0 border-t min-h-[72px]">
        <MiniPlayerDesktop />
      </div>
    </aside>
  );
}
