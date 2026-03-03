"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clapperboard, Plus, MessageCircle, User } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  isAdd?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/feels", label: "Feels", icon: Clapperboard },
  { href: "/add", label: "Добавить", icon: Plus, isAdd: true },
  { href: "/messages", label: "Чаты", icon: MessageCircle },
  { href: "/profile", label: "Профиль", icon: User },
];

function TabItem({ item, active }: { item: NavItem; active: boolean }) {
  const { href, label, icon: Icon, isAdd } = item;
  return (
    <Link
      href={href}
      className={[
        "flex flex-col items-center justify-center flex-1 h-full",
        "select-none outline-none transition-opacity duration-150",
        active ? "opacity-100" : "opacity-50 hover:opacity-75",
      ].join(" ")}
      aria-label={label}
      aria-current={active ? "page" : undefined}
    >
      {isAdd ? (
        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary">
          <Icon className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
        </span>
      ) : (
        <>
          <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
          <span className="text-[10px] mt-0.5 leading-none">{label}</span>
        </>
      )}
    </Link>
  );
}

export function TabBar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname?.startsWith(href);
  }

  return (
    <nav className="tab-bar" aria-label="Навигация">
      <div className="tab-bar__inner">
        {NAV_ITEMS.map((item) => (
          <TabItem key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </div>
    </nav>
  );
}

export default TabBar;
