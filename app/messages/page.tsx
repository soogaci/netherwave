"use client";

import React from "react";
import Link from "next/link";
import { Search, X, MessageCircle, Bell } from "lucide-react";

import { Card } from "../ui/card";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { useAuth } from "@/components/providers/AuthProvider";
import { useProfile } from "@/components/providers/ProfileProvider";
import { useChats } from "@/components/providers/ChatsProvider";
import { useRegisterRefresh } from "@/components/providers/RefreshProvider";
import { searchProfilesByUsername } from "@/lib/supabase/profiles";
import type { Profile } from "@/lib/supabase/profiles";
import { GROUPS } from "@/lib/mock";
import type { Chat } from "@/lib/types";

function HeaderAvatar() {
  const { profile } = useProfile();
  const username = profile?.username ?? "user";
  const avatarUrl = profile?.avatar_url ?? undefined;
  return (
    <AvatarInitials
      username={username}
      avatarUrl={avatarUrl}
      size="sm"
      className="!h-8 !w-8 !rounded-full"
    />
  );
}

function formatLastSeen(iso: string | null | undefined): string {
    if (!iso) return "давно";
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const min = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const day = Math.floor(diff / 86400000);
    if (min < 5) return "онлайн";
    if (min < 60) return `${min} мин назад`;
    if (h < 24) return `${h} ч назад`;
    if (day < 2) return "вчера";
    return `${day} дн назад`;
}

const TABS = [
    { key: "dm", label: "ЛС" },
    { key: "group", label: "Группы" },
];

function ChatRow({ chat }: { chat: Chat }) {
    const status = formatLastSeen(chat.last_seen);
    const isOnline = status === "онлайн";
    const [menuOpen, setMenuOpen] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);
    return (
        <div className="block w-full min-w-0 relative">
            <Link href={`/messages/${chat.id}`} className="block w-full min-w-0">
                <Card className="rounded-2xl border-0 bg-card px-3 py-2.5 gap-0 shadow-none hover:opacity-95 transition w-full">
                    <div className="flex items-center gap-3">
                        <div
                            className="shrink-0 rounded-xl relative"
                            ref={menuRef}
                            onClick={(e) => e.preventDefault()}
                        >
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen((v) => !v); }}
                                className="rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <AvatarInitials username={chat.title} avatarUrl={chat.avatar_url ?? undefined} size="md" className="!h-10 !w-10 !rounded-xl" />
                            </button>
                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" aria-hidden onClick={() => setMenuOpen(false)} />
                                    <div className="absolute left-0 top-full mt-1 z-50 min-w-[160px] rounded-xl border bg-card py-1 shadow-lg">
                                        <Link
                                            href={`/profile/${chat.title}`}
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted/60 transition"
                                        >
                                            Перейти в профиль
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-sm font-semibold">@{chat.title}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {(chat.message_count ?? 0) > 0 && (
                                        <span className="text-[11px] text-muted-foreground">
                                            {chat.message_count} сообщ.
                                        </span>
                                    )}
                                    <span className="text-[11px] text-muted-foreground">{chat.time}</span>
                                </div>
                            </div>
                            <div className="mt-0.5 truncate text-xs text-muted-foreground">
                                {chat.subtitle}
                            </div>
                            <div className={`mt-0.5 text-[11px] ${isOnline ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                                {status}
                            </div>
                        </div>
                        {!!chat.unread && chat.unread > 0 && (
                            <div className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-foreground text-background text-[10px] px-1.5 shrink-0">
                                {chat.unread}
                            </div>
                        )}
                    </div>
                </Card>
            </Link>
        </div>
    );
}

export default function MessagesPage() {
    const { user } = useAuth();
    const { chats: dmChats, loading: chatsLoading, refresh: refreshChats } = useChats();
    const [tabIndex, setTabIndex] = React.useState(0);
    const [q, setQ] = React.useState("");
    const [searchResults, setSearchResults] = React.useState<Profile[]>([]);
    const [searching, setSearching] = React.useState(false);

    useRegisterRefresh(refreshChats);

    React.useEffect(() => {
        const t = q.trim();
        if (t.length < 2) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        searchProfilesByUsername(t).then((list) => {
            setSearchResults(list);
            setSearching(false);
        });
    }, [q]);

    const rawList = tabIndex === 0 ? dmChats : GROUPS;
    const sorted = q.trim()
        ? rawList.filter((c) => {
            const s = (c.title + " " + c.subtitle).toLowerCase();
            return s.includes(q.trim().toLowerCase());
          })
        : rawList;

    return (
        <div>
            <PageHeader
                title="Чаты"
                right={
                  <>
                    <Link href="/notifications" className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition" aria-label="Уведомления">
                      <Bell className="h-5 w-5" />
                    </Link>
                    <Link href="/profile" className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Профиль">
                      <HeaderAvatar />
                    </Link>
                  </>
                }
            />

            {/* Поиск над ЛС/Группы как в TG */}
            <div className="rounded-2xl border bg-background/60 backdrop-blur overflow-hidden mb-4">
                <div className="flex items-center gap-2 px-4 py-3">
                    <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Поиск"
                        className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                    />
                    {q.trim() ? (
                        <button
                            type="button"
                            onClick={() => setQ("")}
                            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
                            aria-label="Очистить"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    ) : null}
                </div>
            </div>

            <div className="mb-4">
                <div className="relative rounded-2xl bg-background/60 p-1 border backdrop-blur overflow-hidden">
                    <div className="grid grid-cols-2 relative z-10">
                        {TABS.map((t, i) => {
                            const active = i === tabIndex;
                            return (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => setTabIndex(i)}
                                    className={[
                                        "py-2 text-sm rounded-xl transition",
                                        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                                    ].join(" ")}
                                >
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>
                    <div
                        className="absolute bottom-1 h-[2px] bg-foreground/80 rounded-full transition-all duration-200 ease-out"
                        style={{
                            width: `calc((100% - 8px) / ${TABS.length})`,
                            left: `calc(4px + ${tabIndex} * ((100% - 8px) / ${TABS.length}))`,
                        }}
                    />
                </div>
            </div>

            {q.trim().length >= 2 ? (
                <div className="space-y-2">
                    {searching ? (
                        <div className="text-sm text-muted-foreground py-4">Поиск...</div>
                    ) : searchResults.length > 0 ? (
                        searchResults.map((profile) => (
                            user && (
                                <Link
                                    key={profile.id}
                                    href={`/messages/dm-${[user.id, profile.id].sort().join("_")}`}
                                >
                                    <Card className="rounded-2xl border-0 bg-card px-3 py-2.5 gap-0 shadow-none hover:opacity-95 transition">
                                        <div className="flex items-center gap-3">
                                            <AvatarInitials username={profile.username} avatarUrl={profile.avatar_url} size="md" className="!h-10 !w-10" />
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-sm font-semibold">@{profile.username}</div>
                                                <div className="truncate text-xs text-muted-foreground">{profile.display_name || "—"}</div>
                                            </div>
                                            <MessageCircle className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </Card>
                                </Link>
                            )
                        ))
                    ) : (
                        <div className="text-sm text-muted-foreground py-4">Никого не найдено</div>
                    )}
                </div>
            ) : (
            <div className="space-y-2">
                {chatsLoading && tabIndex === 0 ? (
                    <div className="text-sm text-muted-foreground py-4">Загрузка чатов...</div>
                ) : sorted.length ? (
                    sorted.map((c) => <ChatRow key={c.id} chat={c} />)
                ) : (
                    <div className="mt-6">
                        {tabIndex === 0 ? (
                            <EmptyState type="no-chats" action={{ href: "/", label: "В ленту" }} />
                        ) : (
                            <EmptyState type="no-results" />
                        )}
                    </div>
                )}
            </div>
            )}
        </div>
    );
}
