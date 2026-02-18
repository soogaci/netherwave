"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Pin, PinOff } from "lucide-react";

import { Card } from "../ui/card";

import { DMS, GROUPS } from "@/lib/mock";
import type { Chat } from "@/lib/types";

const TABS = [
    { key: "dm", label: "ЛС" },
    { key: "group", label: "Группы" },
];

const PINNED_KEY = "netherwave-pinned-chats";

function usePinnedChats() {
    const [pinned, setPinned] = React.useState<Set<string>>(() => {
        if (typeof window === "undefined") return new Set();
        try {
            const s = localStorage.getItem(PINNED_KEY);
            return s ? new Set(JSON.parse(s)) : new Set();
        } catch {
            return new Set();
        }
    });
    const toggle = React.useCallback((id: string) => {
        setPinned((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            try {
                localStorage.setItem(PINNED_KEY, JSON.stringify([...next]));
            } catch {}
            return next;
        });
    }, []);
    return { pinned, toggle };
}

function ChatRow({ chat, isPinned, onTogglePin }: { chat: Chat; isPinned: boolean; onTogglePin: (e: React.MouseEvent) => void }) {
    return (
        <div className="flex items-center gap-1 group">
            <Link href={`/messages/${chat.id}`} className="flex-1 min-w-0">
                <Card className="rounded-2xl border-0 bg-card px-3 py-2.5 gap-0 shadow-none hover:opacity-95 transition">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-muted" />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                                <div className="truncate text-sm font-semibold">{chat.title}</div>
                                <div className="text-[11px] text-muted-foreground shrink-0">{chat.time}</div>
                            </div>
                            <div className="mt-0.5 truncate text-xs text-muted-foreground">
                                {chat.subtitle}
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
            <button
                type="button"
                onClick={onTogglePin}
                className="shrink-0 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 opacity-0 group-hover:opacity-100 md:opacity-100 transition"
                aria-label={isPinned ? "Открепить" : "Закрепить"}
            >
                {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </button>
        </div>
    );
}

export default function MessagesPage() {
    const [tabIndex, setTabIndex] = React.useState(0);
    const { pinned, toggle } = usePinnedChats();

    const [searchOpen, setSearchOpen] = React.useState(false);
    const [q, setQ] = React.useState("");

    const rawList = q.trim()
        ? [...DMS, ...GROUPS]
        : tabIndex === 0 ? DMS : GROUPS;
    const filtered = rawList.filter((c) => {
        const s = (c.title + " " + c.subtitle).toLowerCase();
        return s.includes(q.trim().toLowerCase());
    });
    const sorted = React.useMemo(() => {
        const list = [...filtered];
        return list.sort((a, b) => {
            const aPin = pinned.has(a.id);
            const bPin = pinned.has(b.id);
            if (aPin && !bPin) return -1;
            if (!aPin && bPin) return 1;
            return 0;
        });
    }, [filtered, pinned]);

    return (
        <div>
            <header className="mb-4 flex items-center justify-between">
                <div>
                    <div className="text-lg font-semibold leading-tight">Чаты</div>
                    <div className="text-sm text-muted-foreground">ЛС • группы</div>
                </div>

                <button
                    onClick={() => setSearchOpen((v) => !v)}
                    className="rounded-full border px-3 py-1 text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
                >
                    <Search className="h-4 w-4" />
                    Поиск
                </button>
            </header>

            {/* Поиск как в TG: плавно раскрывается */}
            <AnimatePresence initial={false}>
                {searchOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, y: -6 }}
                        animate={{ height: "auto", opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -6 }}
                        transition={{ type: "spring", stiffness: 320, damping: 30 }}
                        className="overflow-hidden mb-4"
                    >
                        <div className="rounded-2xl border bg-background/60 backdrop-blur p-2 flex items-center gap-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Искать: аккаунты, посты, музыку..."
                                className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                                autoFocus
                            />
                            <button
                                onClick={() => setQ("")}
                                className="text-muted-foreground hover:text-foreground"
                                aria-label="Очистить"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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

            <div className="space-y-2">
                {sorted.length ? (
                    sorted.map((c) => (
                        <ChatRow
                            key={c.id}
                            chat={c}
                            isPinned={pinned.has(c.id)}
                            onTogglePin={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggle(c.id);
                            }}
                        />
                    ))
                ) : (
                    <div className="text-sm text-muted-foreground mt-6">
                        Ничего не найдено
                    </div>
                )}
            </div>
        </div>
    );
}
