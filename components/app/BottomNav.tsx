"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Plus, Bell, User } from "lucide-react";

function NavIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-label={label}
      className={`flex flex-col items-center gap-0.5 rounded-2xl py-2 transition ${
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <span className="relative">
        {children}
        {active && (
          <span className="absolute -bottom-1 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-foreground" />
        )}
      </span>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md pb-[env(safe-area-inset-bottom)]">
      <div className="mx-4 mb-4 rounded-3xl border bg-background/80 backdrop-blur-md">
        <div className="grid grid-cols-5 items-center px-2 py-3">
          <NavIcon href="/" label="Лента">
            <Home className="h-5 w-5" />
          </NavIcon>

          <NavIcon href="/messages" label="Чаты">
            <MessageCircle className="h-5 w-5" />
          </NavIcon>

          <Link
            href="/add"
            aria-label="Добавить"
            className="-mt-8 flex flex-col items-center"
          >
            <div className="grid h-14 w-14 place-items-center rounded-full bg-foreground text-background shadow-md transition hover:opacity-95">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground mt-1">Добавить</span>
          </Link>

          <NavIcon href="/notifications" label="Уведомления">
            <Bell className="h-5 w-5" />
          </NavIcon>

          <NavIcon href="/profile" label="Профиль">
            <User className="h-5 w-5" />
          </NavIcon>
        </div>
      </div>
    </div>
  );
}
