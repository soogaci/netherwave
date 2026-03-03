"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clapperboard, Plus, MessageCircle, User } from "lucide-react";

/**
 * Нижняя навигация в стиле Instagram (iOS HIG).
 * На iPhone: один блок с явной высотой (49px + safe-area), фон на нём — чтобы под индикатором дома не было «заплатки».
 */
const TAB_BAR_HEIGHT = 49;

function NavIcon({
  href,
  label,
  active,
  isAdd,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  isAdd?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`flex flex-1 flex-col items-center justify-center transition-colors ${
        active ? "text-foreground" : "text-muted-foreground active:opacity-70"
      } ${isAdd ? "scale-110" : ""}`}
      style={{ minHeight: TAB_BAR_HEIGHT }}
    >
      {children}
    </Link>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : href === "/add"
        ? pathname === "/add" || pathname?.startsWith("/add/")
        : pathname?.startsWith(href);

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-50 mx-auto max-w-md pointer-events-none"
      style={{
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
        /* Явная высота до физического низа: контент 49px + safe-area. Fallback 34px для iPhone, если env() даёт 0. */
        minHeight: "calc(49px + env(safe-area-inset-bottom, 34px))",
      }}
    >
      {/* Один блок с фоном на всю высоту — на iOS фон должен доходить до низа экрана, без padding-bottom. */}
      <div
        className="flex flex-col w-full border-t border-border/80 bg-background/80 backdrop-blur-xl pointer-events-auto"
        style={{
          minHeight: "inherit",
          /* Гарантируем растяжение на весь safe-area: высота = 49px + safe-area */
          height: "calc(49px + env(safe-area-inset-bottom, 34px))",
        }}
      >
        {/* Ряд иконок строго 49px */}
        <div className="flex flex-row items-stretch shrink-0" style={{ height: TAB_BAR_HEIGHT }}>
          <NavIcon href="/" label="Главная" active={isActive("/")}>
            <Home className="h-6 w-6" strokeWidth={isActive("/") ? 2.25 : 1.75} />
          </NavIcon>
          <NavIcon href="/feels" label="Feels" active={isActive("/feels")}>
            <Clapperboard className="h-6 w-6" strokeWidth={isActive("/feels") ? 2.25 : 1.75} />
          </NavIcon>
          <NavIcon href="/add" label="Добавить" active={isActive("/add")} isAdd>
            <Plus className="h-7 w-7" strokeWidth={2.25} />
          </NavIcon>
          <NavIcon href="/messages" label="Чаты" active={isActive("/messages")}>
            <MessageCircle className="h-6 w-6" strokeWidth={isActive("/messages") ? 2.25 : 1.75} />
          </NavIcon>
          <NavIcon href="/profile" label="Профиль" active={isActive("/profile")}>
            <User className="h-6 w-6" strokeWidth={isActive("/profile") ? 2.25 : 1.75} />
          </NavIcon>
        </div>
        {/* Spacer под иконками = safe-area; фон уже на родителе, заплатки не будет */}
        <div
          className="shrink-0 w-full"
          style={{ height: "env(safe-area-inset-bottom, 34px)" }}
          aria-hidden
        />
      </div>
    </div>
  );
}
