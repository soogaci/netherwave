"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Send, Paperclip, Smile, FileText, Image, Mic, X, Star, User } from "lucide-react";
import { Card } from "../../ui/card";
import { useSettings, type ChatSize } from "@/components/providers/SettingsProvider";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { CHAT_MESSAGES, USER_PROFILES, SAVED_NOTES_KEY } from "@/lib/mock";
import { useSavedMessages } from "@/components/providers/SavedMessagesProvider";
import type { Msg } from "@/lib/types";

const BUBBLE_STYLES: Record<ChatSize, string> = {
    compact: "px-2.5 py-1 text-xs",
    normal: "px-3 py-1.5 text-sm",
    large: "px-4 py-2.5 text-base",
};

const REACTIONS = ["❤️", "😂", "😮", "😢", "🔥", "👍"];

const STICKERS = [
    "😀", "😂", "🥹", "😍", "🤩", "😎",
    "🥺", "😭", "🤯", "🫡", "🤝", "👋",
    "🔥", "❤️", "💜", "🎵", "🎸", "🎹",
    "🎧", "🎤", "🚀", "✨", "💫", "🌙",
    "👀", "🙏", "👍", "👎", "🤘", "🫶",
];

const ATTACH_OPTIONS = [
    { icon: Image, label: "Фото", color: "oklch(0.6 0.2 280)" },
    { icon: FileText, label: "Файл", color: "oklch(0.55 0.18 160)" },
    { icon: Mic, label: "Голосовое", color: "oklch(0.6 0.18 30)" },
];

const EMPTY_MESSAGES: Msg[] = [];

function useIsDesktop() {
    const [isDesktop, setIsDesktop] = React.useState(false);
    React.useEffect(() => {
        const mq = window.matchMedia("(min-width: 768px)");
        setIsDesktop(mq.matches);
        const fn = () => setIsDesktop(mq.matches);
        mq.addEventListener("change", fn);
        return () => mq.removeEventListener("change", fn);
    }, []);
    return isDesktop;
}

export default function ChatPage() {
    const params = useParams<{ id: string }>();
    const chatId = params?.id || "";
    const { add: saveMessage, remove: unsaveMessage, has: isSaved, saved: savedRefs } = useSavedMessages();
    const isSavedChat = chatId === "saved";
    const { chatSize } = useSettings();
    const isDesktop = useIsDesktop();

    const data = isSavedChat
        ? { title: "Избранное", messages: EMPTY_MESSAGES }
        : CHAT_MESSAGES[chatId] || { title: "Чат", messages: EMPTY_MESSAGES };
    const savedMessages = React.useMemo(() => {
        if (!isSavedChat) return [];
        return savedRefs.flatMap((r) => {
            const chatData = CHAT_MESSAGES[r.chatId];
            const msg = chatData?.messages.find((m) => m.id === r.msgId);
            return msg ? [{ ...msg, chatId: r.chatId }] : [];
        });
    }, [isSavedChat, savedRefs]);
    const savedNotes = React.useMemo(() => {
        if (!isSavedChat || typeof window === "undefined") return [];
        try {
            const s = localStorage.getItem(SAVED_NOTES_KEY);
            return s ? JSON.parse(s) : [];
        } catch {
            return [];
        }
    }, [isSavedChat]);
    const [messages, setMessages] = React.useState<Msg[]>(data.messages);
    React.useEffect(() => {
        if (isSavedChat) setMessages([...savedMessages, ...savedNotes]);
        else setMessages(data.messages);
    }, [isSavedChat, savedMessages, savedNotes, data.messages]);
    const [text, setText] = React.useState("");
    const [reactionMsgId, setReactionMsgId] = React.useState<string | null>(null);
    const [reactions, setReactions] = React.useState<Record<string, string[]>>({});
    const [stickerOpen, setStickerOpen] = React.useState(false);
    const [attachOpen, setAttachOpen] = React.useState(false);
    const [userPanelOpen, setUserPanelOpen] = React.useState(false);
    const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const bottomRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const scrollToBottom = React.useCallback(() => {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }, []);

    React.useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }, []);

    function persistNotes(notes: Msg[]) {
        try {
            localStorage.setItem(SAVED_NOTES_KEY, JSON.stringify(notes));
        } catch {}
    }

    function send() {
        const t = text.trim();
        if (!t) return;
        const newMsg: Msg = { id: String(Date.now()), from: "me", text: t, time: "сейчас" };
        setMessages((prev) => {
            const next = [...prev, newMsg];
            if (isSavedChat) persistNotes(next.slice(savedMessages.length));
            return next;
        });
        setText("");
        setStickerOpen(false);
        setAttachOpen(false);
        scrollToBottom();
    }

    function sendSticker(emoji: string) {
        const newMsg: Msg = { id: String(Date.now()), from: "me", text: "", sticker: emoji, time: "сейчас" };
        setMessages((prev) => {
            const next = [...prev, newMsg];
            if (isSavedChat) persistNotes(next.slice(savedMessages.length));
            return next;
        });
        setStickerOpen(false);
        scrollToBottom();
    }

    function sendAttachment(label: string) {
        const names: Record<string, { name: string; size: string }> = {
            "Фото": { name: "photo_2026.jpg", size: "1.8 МБ" },
            "Файл": { name: "document.pdf", size: "340 КБ" },
            "Голосовое": { name: "voice_message.ogg", size: "120 КБ" },
        };
        const att = names[label] ?? { name: "file.bin", size: "0 КБ" };
        const newMsg: Msg = { id: String(Date.now()), from: "me", text: "", attachment: att, time: "сейчас" };
        setMessages((prev) => {
            const next = [...prev, newMsg];
            if (isSavedChat) persistNotes(next.slice(savedMessages.length));
            return next;
        });
        setAttachOpen(false);
        scrollToBottom();
    }

    function startLongPress(msgId: string) {
        longPressTimer.current = setTimeout(() => setReactionMsgId(msgId), 400);
    }
    function cancelLongPress() {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }

    function addReaction(msgId: string, emoji: string) {
        setReactions((prev) => {
            const current = prev[msgId] ?? [];
            if (current.includes(emoji)) {
                return { ...prev, [msgId]: current.filter((e) => e !== emoji) };
            }
            return { ...prev, [msgId]: [...current, emoji] };
        });
        setReactionMsgId(null);
    }

    function closeOverlays() {
        setStickerOpen(false);
        setAttachOpen(false);
    }

    return (
        <div className="fixed inset-0 md:left-64 top-0 bottom-0 flex flex-col bg-background z-10">
            {/* Header — статично, всегда виден */}
            <header className="shrink-0 flex items-center gap-3 py-3 px-4 border-b">
                <Link
                    href="/messages"
                    className="grid h-9 w-9 place-items-center rounded-full border text-muted-foreground hover:text-foreground transition shrink-0"
                    aria-label="Назад"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <button
                    type="button"
                    onClick={() => setUserPanelOpen(true)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left"
                >
                    <AvatarInitials username={data.title} size="sm" />
                    <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{data.title}</div>
                        <div className="text-[11px] text-muted-foreground">онлайн</div>
                    </div>
                </button>
            </header>

            {/* User panel — справа налево */}
            <AnimatePresence>
                {userPanelOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setUserPanelOpen(false)}
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
                            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-background border-l z-50 flex flex-col shadow-xl"
                        >
                            <div className="flex items-center justify-between p-4 border-b">
                                <span className="text-sm font-medium">Информация</span>
                                <button
                                    type="button"
                                    onClick={() => setUserPanelOpen(false)}
                                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground"
                                    aria-label="Закрыть"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto p-4 space-y-4">
                                {/* Мини-профиль */}
                                <div className="flex flex-col items-center gap-3">
                                    <AvatarInitials username={data.title} size="lg" className="!h-20 !w-20 !text-2xl" />
                                    <div className="text-center">
                                        <div className="font-semibold">{USER_PROFILES[data.title]?.displayName ?? data.title}</div>
                                        <div className="text-sm text-muted-foreground">@{data.title}</div>
                                        {USER_PROFILES[data.title]?.bio && (
                                            <div className="mt-2 text-sm text-foreground/90">{USER_PROFILES[data.title].bio}</div>
                                        )}
                                    </div>
                                    {USER_PROFILES[data.title] && (
                                        <Link
                                            href={`/profile/${data.title}`}
                                            onClick={() => setUserPanelOpen(false)}
                                            className="flex items-center gap-2 rounded-2xl bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:opacity-90 transition"
                                        >
                                            <User className="h-4 w-4" />
                                            Перейти в профиль
                                        </Link>
                                    )}
                                </div>

                                {/* Медиа чата */}
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Медиа чата</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {messages
                                            .filter((m) => m.sticker || m.attachment)
                                            .slice(0, 12)
                                            .map((m) => (
                                                <div
                                                    key={m.id}
                                                    className="aspect-square rounded-xl bg-muted flex items-center justify-center text-2xl overflow-hidden"
                                                >
                                                    {m.sticker ? m.sticker : <FileText className="h-6 w-6 text-muted-foreground" />}
                                                </div>
                                            ))}
                                    </div>
                                    {!messages.some((m) => m.sticker || m.attachment) && (
                                        <div className="text-sm text-muted-foreground py-4 text-center">Пока нет медиа</div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-auto space-y-2 px-4 pt-2 pb-4">
                {messages.map((m) => {
                    const msgReactions = reactions[m.id] ?? [];
                    const isSticker = !!m.sticker;
                    const isAttachment = !!m.attachment;

                    const noAnim = isDesktop;
                    return (
                        <motion.div
                            key={m.id}
                            initial={noAnim ? false : { opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={noAnim ? { duration: 0 } : { duration: 0.2 }}
                            className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}
                        >
                            <div className="relative max-w-[85%]">
                                {/* Sticker message */}
                                {isSticker ? (
                                    <div
                                        className="select-none"
                                        onPointerDown={() => startLongPress(m.id)}
                                        onPointerUp={cancelLongPress}
                                        onPointerLeave={cancelLongPress}
                                        onContextMenu={(e) => { e.preventDefault(); setReactionMsgId(m.id); }}
                                    >
                                        <motion.div
                                            initial={noAnim ? false : { scale: 0.5 }}
                                            animate={{ scale: 1 }}
                                            transition={noAnim ? { duration: 0 } : { type: "spring" as const, stiffness: 400, damping: 18 }}
                                            className="text-5xl leading-none"
                                        >
                                            {m.sticker}
                                        </motion.div>
                                        <div className="text-[10px] text-muted-foreground mt-0.5">{m.time}</div>
                                    </div>
                                ) : isAttachment ? (
                                    /* File attachment message */
                                    <Card
                                        className={[
                                            "rounded-2xl border-0 gap-0 shadow-none select-none",
                                            BUBBLE_STYLES[chatSize],
                                            m.from === "me" ? "bg-foreground text-background" : "bg-card",
                                        ].join(" ")}
                                        onPointerDown={() => startLongPress(m.id)}
                                        onPointerUp={cancelLongPress}
                                        onPointerLeave={cancelLongPress}
                                        onContextMenu={(e) => { e.preventDefault(); setReactionMsgId(m.id); }}
                                    >
                                        <div className="flex items-center gap-2 py-0.5">
                                            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${m.from === "me" ? "bg-background/20" : "bg-muted"}`}>
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-medium truncate">{m.attachment!.name}</div>
                                                <div className={`text-[10px] ${m.from === "me" ? "text-background/60" : "text-muted-foreground"}`}>
                                                    {m.attachment!.size}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-[10px] text-right mt-0.5 ${m.from === "me" ? "text-background/60" : "text-muted-foreground"}`}>
                                            {m.time}
                                        </div>
                                    </Card>
                                ) : (
                                    /* Regular text message */
                                    <Card
                                        className={[
                                            "rounded-2xl border-0 gap-0 shadow-none select-none",
                                            BUBBLE_STYLES[chatSize],
                                            m.from === "me" ? "bg-foreground text-background" : "bg-card",
                                        ].join(" ")}
                                        onPointerDown={() => startLongPress(m.id)}
                                        onPointerUp={cancelLongPress}
                                        onPointerLeave={cancelLongPress}
                                        onContextMenu={(e) => { e.preventDefault(); setReactionMsgId(m.id); }}
                                    >
                                        <div className="leading-snug">{m.text}</div>
                                        <div className={`text-[10px] text-right ${m.from === "me" ? "text-background/60" : "text-muted-foreground"}`}>
                                            {m.time}
                                        </div>
                                    </Card>
                                )}

                                {/* Reactions */}
                                {msgReactions.length > 0 && (
                                    <motion.div
                                        initial={noAnim ? false : { opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={noAnim ? { duration: 0 } : undefined}
                                        className={`flex gap-0.5 mt-0.5 ${m.from === "me" ? "justify-end" : "justify-start"}`}
                                    >
                                        {msgReactions.map((e) => (
                                            <motion.span key={e} initial={noAnim ? false : { scale: 0 }} animate={{ scale: 1 }} transition={noAnim ? { duration: 0 } : undefined} className="text-sm bg-card rounded-full px-1 border">
                                                {e}
                                            </motion.span>
                                        ))}
                                    </motion.div>
                                )}

                                {/* Reaction picker */}
                                <AnimatePresence>
                                    {reactionMsgId === m.id && (
                                        <>
                                            <motion.div
                                                className="fixed inset-0 z-40"
                                                initial={noAnim ? false : { opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={noAnim ? undefined : { opacity: 0 }}
                                                transition={noAnim ? { duration: 0 } : undefined}
                                                onClick={() => setReactionMsgId(null)}
                                            />
                                            <motion.div
                                                initial={noAnim ? false : { opacity: 0, scale: 0.7, y: 8 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={noAnim ? undefined : { opacity: 0, scale: 0.7, y: 8 }}
                                                transition={noAnim ? { duration: 0 } : { type: "spring" as const, stiffness: 400, damping: 22 }}
                                                className={`absolute z-50 -top-11 flex gap-1 rounded-2xl border bg-background/95 backdrop-blur-md px-2 py-1.5 shadow-lg ${m.from === "me" ? "right-0" : "left-0"}`}
                                            >
                                                {REACTIONS.map((emoji, i) => (
                                                    <motion.button
                                                        key={emoji}
                                                        type="button"
                                                        initial={noAnim ? false : { scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={noAnim ? { duration: 0 } : { delay: i * 0.03, type: "spring" as const, stiffness: 400, damping: 18 }}
                                                        whileHover={noAnim ? undefined : { scale: 1.3 }}
                                                        whileTap={noAnim ? undefined : { scale: 0.8 }}
                                                        onClick={() => addReaction(m.id, emoji)}
                                                        className="text-lg h-8 w-8 grid place-items-center rounded-lg hover:bg-muted/50 transition"
                                                    >
                                                        {emoji}
                                                    </motion.button>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const srcChat = (m as Msg & { chatId?: string }).chatId ?? chatId;
                                                        if (isSaved(srcChat, m.id)) unsaveMessage(srcChat, m.id);
                                                        else saveMessage(srcChat, m.id);
                                                        setReactionMsgId(null);
                                                    }}
                                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-muted/50 transition ${isSaved((m as Msg & { chatId?: string }).chatId ?? chatId, m.id) ? "text-amber-500" : "text-muted-foreground"}`}
                                                >
                                                    <Star className={`h-3.5 w-3.5 ${isSaved((m as Msg & { chatId?: string }).chatId ?? chatId, m.id) ? "fill-current" : ""}`} />
                                                    {isSaved((m as Msg & { chatId?: string }).chatId ?? chatId, m.id) ? "В избранном" : "Сохранить"}
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    );
                })}

                {!messages.length && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="text-4xl mb-3">💬</div>
                        <div className="text-sm text-muted-foreground">Сообщений пока нет</div>
                        <div className="text-xs text-muted-foreground mt-1">Напиши первым!</div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Sticker panel */}
            <AnimatePresence>
                {stickerOpen && (
                    <motion.div
                        initial={isDesktop ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={isDesktop ? undefined : { height: 0, opacity: 0 }}
                        transition={isDesktop ? { duration: 0 } : { type: "spring" as const, stiffness: 300, damping: 26 }}
                        className="fixed bottom-24 left-0 right-0 md:left-64 mx-auto max-w-md px-4 z-40"
                    >
                        <div className="rounded-2xl border bg-background/95 backdrop-blur-md p-3 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-muted-foreground">Стикеры</span>
                                <button type="button" onClick={() => setStickerOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <div className="grid grid-cols-6 gap-1">
                                {STICKERS.map((s, i) => (
                                    <motion.button
                                        key={s}
                                        type="button"
                                        initial={isDesktop ? false : { scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={isDesktop ? { duration: 0 } : { delay: i * 0.015, type: "spring" as const, stiffness: 400, damping: 18 }}
                                        whileHover={isDesktop ? undefined : { scale: 1.25 }}
                                        whileTap={isDesktop ? undefined : { scale: 0.8 }}
                                        onClick={() => sendSticker(s)}
                                        className="text-2xl h-11 grid place-items-center rounded-xl hover:bg-muted/50 transition"
                                    >
                                        {s}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Attachment panel */}
            <AnimatePresence>
                {attachOpen && (
                    <motion.div
                        initial={isDesktop ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={isDesktop ? undefined : { height: 0, opacity: 0 }}
                        transition={isDesktop ? { duration: 0 } : { type: "spring" as const, stiffness: 300, damping: 26 }}
                        className="fixed bottom-24 left-0 right-0 md:left-64 mx-auto max-w-md px-4 z-40"
                    >
                        <div className="rounded-2xl border bg-background/95 backdrop-blur-md p-3 shadow-lg">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-muted-foreground">Вложение</span>
                                <button type="button" onClick={() => setAttachOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <div className="flex justify-center gap-6">
                                {ATTACH_OPTIONS.map((opt, i) => {
                                    const Icon = opt.icon;
                                    return (
                                        <motion.button
                                            key={opt.label}
                                            type="button"
                                            initial={isDesktop ? false : { scale: 0, y: 10 }}
                                            animate={{ scale: 1, y: 0 }}
                                            transition={isDesktop ? { duration: 0 } : { delay: i * 0.05, type: "spring" as const, stiffness: 350, damping: 20 }}
                                            whileTap={isDesktop ? undefined : { scale: 0.9 }}
                                            onClick={() => sendAttachment(opt.label)}
                                            className="flex flex-col items-center gap-1.5"
                                        >
                                            <div
                                                className="grid h-12 w-12 place-items-center rounded-2xl text-white"
                                                style={{ backgroundColor: opt.color }}
                                            >
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <span className="text-[11px] text-muted-foreground">{opt.label}</span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input bar — статично внизу */}
            <div className="shrink-0 px-4 py-3 border-t">
                <div className="rounded-3xl border bg-background/70 backdrop-blur-md p-2 flex items-center gap-1.5">
                    {/* Attach button */}
                    <motion.button
                        type="button"
                        whileTap={isDesktop ? undefined : { scale: 0.85, rotate: 45 }}
                        onClick={() => { setAttachOpen((v) => !v); setStickerOpen(false); }}
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition ${attachOpen ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                        aria-label="Вложение"
                    >
                        <Paperclip className="h-4 w-4" />
                    </motion.button>

                    {/* Text input */}
                    <input
                        ref={inputRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Сообщение..."
                        className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-muted-foreground px-1"
                        onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                        onFocus={closeOverlays}
                    />

                    {/* Sticker button */}
                    <motion.button
                        type="button"
                        whileTap={isDesktop ? undefined : { scale: 0.85 }}
                        onClick={() => { setStickerOpen((v) => !v); setAttachOpen(false); }}
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition ${stickerOpen ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                        aria-label="Стикеры"
                    >
                        <Smile className="h-4 w-4" />
                    </motion.button>

                    {/* Send button */}
                    <motion.button
                        whileTap={isDesktop ? undefined : { scale: 0.88 }}
                        onClick={send}
                        disabled={!text.trim()}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-foreground text-background hover:opacity-95 transition disabled:opacity-40"
                        aria-label="Отправить"
                    >
                        <Send className="h-4 w-4" />
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
