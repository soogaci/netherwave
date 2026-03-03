"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Send, Paperclip, Smile, FileText, X, Star, User, Image as ImageIcon, Search, ChevronDown, Wifi, Loader2, Reply } from "lucide-react";
import { useSettings, type ChatSize } from "@/components/providers/SettingsProvider";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { CHAT_MESSAGES, USER_PROFILES, SAVED_NOTES_KEY } from "@/lib/mock";
import { useSavedMessages } from "@/components/providers/SavedMessagesProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useProfile } from "@/components/providers/ProfileProvider";
import { useRegisterRefresh } from "@/components/providers/RefreshProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { getMessages, sendMessage as saveMessageToDb, uploadChatFile, markMessagesAsRead, subscribeToChatMessages, updateMessage, deleteMessage, type ConnectionStatus } from "@/lib/supabase/messages";
import { getDmChatTitle, getDmChatPartner, getChatsForUser } from "@/lib/supabase/chats";
import { updateLastSeen } from "@/lib/supabase/profiles";
import { PhotoViewer } from "@/components/ui/PhotoViewer";
import { MessageStatusIcon } from "@/components/ui/MessageStatusIcon";
import type { Msg } from "@/lib/types";

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

function formatMessageTime(createdAt?: string, fallback?: string): string {
    if (!createdAt) return fallback ?? "";
    const d = new Date(createdAt);
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", hour12: false });
}

const BUBBLE_STYLES: Record<ChatSize, string> = {
    compact: "px-3 py-1.5 text-sm",
    normal: "px-4 py-2 text-base",
    large: "px-5 py-3 text-lg",
};

const STICKERS = [
    "😀", "😂", "🥹", "😍", "🤩", "😎",
    "🥺", "😭", "🤯", "🫡", "🤝", "👋",
    "🔥", "❤️", "💜", "🎵", "🎸", "🎹",
    "🎧", "🎤", "🚀", "✨", "💫", "🌙",
    "👀", "🙏", "👍", "👎", "🤘", "🫶",
];

const EMPTY_MESSAGES: Msg[] = [];

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

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
    const { user } = useAuth();
    const { profile, uploadChatWallpaper, updateProfile, refresh: refreshProfile } = useProfile();
    const toast = useToast();
    const { add: saveMessage, remove: unsaveMessage, has: isSaved, saved: savedRefs } = useSavedMessages();
    const isSavedChat = chatId === "saved";
    const { chatSize } = useSettings();
    const isDesktop = useIsDesktop();

    const [chatTitle, setChatTitle] = React.useState<string | null>(null);
    const [partner, setPartner] = React.useState<{ avatar_url: string | null; last_seen: string | null } | null>(null);
    const data = isSavedChat
        ? { title: "Избранное", messages: EMPTY_MESSAGES }
        : CHAT_MESSAGES[chatId] || { title: "Чат", messages: EMPTY_MESSAGES };
    const displayTitle = isSavedChat ? "Избранное" : (chatTitle ?? data.title);
    const headerStatus = isSavedChat ? "" : (partner ? formatLastSeen(partner.last_seen) : "онлайн");
    const savedMessages = React.useMemo(() => {
        if (!isSavedChat) return [];
        return savedRefs.flatMap((r) => {
            const chatData = CHAT_MESSAGES[r.chatId];
            const msg = chatData?.messages.find((m) => m.id === r.msgId);
            return msg ? [{ ...msg, chatId: r.chatId }] : [];
        });
    }, [isSavedChat, savedRefs]);
    const savedNotesFromStorage = React.useMemo(() => {
        if (!isSavedChat || typeof window === "undefined") return [];
        try {
            const s = localStorage.getItem(SAVED_NOTES_KEY);
            return s ? JSON.parse(s) : [];
        } catch {
            return [];
        }
    }, [isSavedChat]);
    const [messages, setMessages] = React.useState<Msg[]>(data.messages);
    const [dbMessages, setDbMessages] = React.useState<Msg[]>([]);
    const [loadingMessages, setLoadingMessages] = React.useState(true);

    React.useEffect(() => {
        let cancelled = false;
        setLoadingMessages(true);
        getMessages(chatId, user?.id ?? undefined).then((msgs) => {
            if (!cancelled) {
                setDbMessages(msgs);
                setLoadingMessages(false);
            }
            if (user?.id && !chatId.startsWith("saved") && chatId.startsWith("dm-")) {
                markMessagesAsRead(chatId, user.id);
            }
        });
        return () => { cancelled = true; };
    }, [chatId, user?.id]);

    React.useEffect(() => {
        if (isSavedChat || !chatId.startsWith("dm-") || !user?.id) {
            setChatTitle(null);
            setPartner(null);
            return;
        }
        let cancelled = false;
        getDmChatTitle(chatId, user.id).then((name) => {
            if (!cancelled && name) setChatTitle(name);
        });
        getDmChatPartner(chatId, user.id).then((p) => {
            if (!cancelled && p) setPartner({ avatar_url: p.avatar_url, last_seen: p.last_seen });
        });
        return () => { cancelled = true; };
    }, [chatId, user?.id, isSavedChat]);

    React.useEffect(() => {
        if (!user?.id || isSavedChat) return;
        updateLastSeen(user.id);
    }, [chatId, user?.id, isSavedChat]);

    React.useEffect(() => {
        if (isSavedChat) {
            const notesFromDb = dbMessages.filter((m) => m.from === "me");
            const notes = notesFromDb.length > 0 ? notesFromDb : savedNotesFromStorage;
            setMessages([...savedMessages, ...notes]);
        } else {
            const fromDb = dbMessages.length > 0 ? dbMessages : data.messages;
            setMessages(fromDb);
        }
    }, [isSavedChat, savedMessages, savedNotesFromStorage, dbMessages, data.messages]);

    const [connectionStatus, setConnectionStatus] = React.useState<ConnectionStatus>("connecting");
    const [connectionCompact, setConnectionCompact] = React.useState(false);
    const connectionStableTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    /* Реалтайм: подписка на новые сообщения и статус соединения */
    React.useEffect(() => {
        if (isSavedChat || !chatId.startsWith("dm-") || !user?.id) {
            setConnectionStatus("connecting");
            setConnectionCompact(false);
            return;
        }
        const unsubscribe = subscribeToChatMessages(
            chatId,
            user.id,
            (msg) => {
                setDbMessages((prev) => {
                    if (prev.some((m) => m.id === msg.id)) return prev;
                    if (msg.from === "me" && prev.length > 0) {
                        const last = prev[prev.length - 1];
                        if (last.from === "me" && !last.created_at) return [...prev.slice(0, -1), msg];
                    }
                    return [...prev, msg];
                });
            },
            (status) => {
                setConnectionStatus(status);
                if (status !== "connected") setConnectionCompact(false);
            },
            (msg) => {
                setDbMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, read_at: msg.read_at } : m)));
                setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, read_at: msg.read_at } : m)));
            }
        );
        return () => {
            unsubscribe();
            if (connectionStableTimer.current) clearTimeout(connectionStableTimer.current);
        };
    }, [chatId, user?.id, isSavedChat]);

    /* Опрос сообщений каждые 2 с — гарантия доставки как в мессенджерах (даже если Realtime не сработал) */
    React.useEffect(() => {
        if (isSavedChat || !chatId.startsWith("dm-") || !user?.id) return;
        const poll = async () => {
            const serverMsgs = await getMessages(chatId, user?.id);
            setDbMessages((prev) => {
                const optimistic = prev.filter((m) => m.from === "me" && !m.created_at);
                const serverIds = new Set(serverMsgs.map((m) => m.id));
                const merged = [...serverMsgs];
                for (const o of optimistic) {
                    if (!serverIds.has(o.id)) merged.push(o);
                }
                merged.sort((a, b) => {
                    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
                    return ta - tb;
                });
                return merged;
            });
        };
        poll();
        const interval = setInterval(poll, 2000);
        return () => clearInterval(interval);
    }, [chatId, user?.id, isSavedChat]);

    /* После SUBSCRIBED переходим syncing → connected, через 1 с — в компактный индикатор */
    React.useEffect(() => {
        if (connectionStatus === "syncing") {
            const t = setTimeout(() => setConnectionStatus("connected"), 200);
            return () => clearTimeout(t);
        }
        if (connectionStatus === "connected") {
            if (connectionStableTimer.current) clearTimeout(connectionStableTimer.current);
            connectionStableTimer.current = setTimeout(() => setConnectionCompact(true), 1000);
            return () => {
                if (connectionStableTimer.current) clearTimeout(connectionStableTimer.current);
            };
        }
    }, [connectionStatus]);

    const [text, setText] = React.useState("");
    const [replyTo, setReplyTo] = React.useState<Msg | null>(null);
    const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null);
    const [editText, setEditText] = React.useState("");
    const [highlightedMessageId, setHighlightedMessageId] = React.useState<string | null>(null);
    const highlightShowRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const highlightHideRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const scrollToReply = React.useCallback((replyToId: string) => {
        const listEl = messagesListRef.current;
        const msgEl = listEl?.querySelector(`[data-msg-id="${replyToId}"]`) as HTMLElement | null;
        if (listEl && msgEl) {
            const top = msgEl.offsetTop - listEl.clientHeight / 2 + msgEl.offsetHeight / 2;
            listEl.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
        }
        if (highlightShowRef.current) clearTimeout(highlightShowRef.current);
        if (highlightHideRef.current) clearTimeout(highlightHideRef.current);
        setHighlightedMessageId(null);
        highlightShowRef.current = setTimeout(() => {
            setHighlightedMessageId(replyToId);
            highlightHideRef.current = setTimeout(() => setHighlightedMessageId(null), 1000);
        }, 450);
    }, []);
    const [pinnedMessageIds, setPinnedMessageIds] = React.useState<Set<string>>(new Set());
    const [forwardMessage, setForwardMessage] = React.useState<Msg | null>(null);
    const [forwardChats, setForwardChats] = React.useState<{ id: string; title: string }[]>([]);
    const [stickerOpen, setStickerOpen] = React.useState(false);
    const [chatSettingsOpen, setChatSettingsOpen] = React.useState(false);
    const [chatSearchQuery, setChatSearchQuery] = React.useState("");
    const [uploadingFile, setUploadingFile] = React.useState(false);
    type PendingUpload = { id: string; file: File; progress: number; previewUrl?: string };
    const [pendingUploads, setPendingUploads] = React.useState<PendingUpload[]>([]);
    type SelectedPhoto = { id: string; file: File; previewUrl: string };
    const [selectedPhotos, setSelectedPhotos] = React.useState<SelectedPhoto[]>([]);
    const MAX_PHOTOS = 7;
    const [photoViewerOpen, setPhotoViewerOpen] = React.useState(false);
    const [photoViewerSources, setPhotoViewerSources] = React.useState<{ url: string; name?: string }[]>([]);
    const [photoViewerInitialIndex, setPhotoViewerInitialIndex] = React.useState(0);
    const [uploadingWallpaper, setUploadingWallpaper] = React.useState(false);
    const wallpaperInputRef = React.useRef<HTMLInputElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const bottomRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const messagesListRef = React.useRef<HTMLDivElement>(null);
    const touchStartX = React.useRef(0);
    const touchStartY = React.useRef(0);
    const touchMessageRef = React.useRef<Msg | null>(null);
    const [swipeMessageId, setSwipeMessageId] = React.useState<string | null>(null);
    const [swipeOffset, setSwipeOffset] = React.useState(0);
    const initialScrollDone = React.useRef(false);
    const [showScrollToBottom, setShowScrollToBottom] = React.useState(false);
    const scrollHideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
        const el = messagesListRef.current;
        if (el) {
            if (behavior === "instant") {
                el.scrollTop = el.scrollHeight;
            } else {
                el.scrollTo({ top: el.scrollHeight, behavior });
            }
        }
        if (scrollHideTimer.current) clearTimeout(scrollHideTimer.current);
        scrollHideTimer.current = setTimeout(() => setShowScrollToBottom(false), 500);
    }, []);

    const checkScroll = React.useCallback(() => {
        const el = messagesListRef.current;
        if (!el) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        const atBottom = scrollHeight - scrollTop - clientHeight < 80;
        if (atBottom) {
            if (scrollHideTimer.current) clearTimeout(scrollHideTimer.current);
            scrollHideTimer.current = setTimeout(() => setShowScrollToBottom(false), 500);
        } else {
            if (scrollHideTimer.current) clearTimeout(scrollHideTimer.current);
            setShowScrollToBottom(true);
        }
    }, []);

    const swipedIdRef = React.useRef<string | null>(null);
    const swipeOffsetRef = React.useRef(0);
    const swipeRafRef = React.useRef<number | null>(null);

    const handleSwipeTouchStart = React.useCallback((e: React.TouchEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest?.("[data-msg-id]")) {
            touchMessageRef.current = null;
            swipedIdRef.current = null;
        }
    }, []);

    const handleSwipeTouchMove = React.useCallback((e: React.TouchEvent) => {
        const msg = touchMessageRef.current;
        if (!msg || !e.touches.length) return;
        const tx = e.touches[0].clientX;
        const ty = e.touches[0].clientY;
        const dx = tx - touchStartX.current;
        const dy = ty - touchStartY.current;
        if (swipedIdRef.current === null) {
            if (Math.abs(dx) > 24 && Math.abs(dx) > Math.abs(dy)) {
                swipedIdRef.current = msg.id;
                setSwipeMessageId(msg.id);
                const off = Math.max(-120, Math.min(0, dx));
                swipeOffsetRef.current = off;
                setSwipeOffset(off);
            }
        } else if (swipedIdRef.current === msg.id) {
            const off = Math.max(-120, Math.min(0, dx));
            swipeOffsetRef.current = off;
            if (swipeRafRef.current == null) {
                swipeRafRef.current = requestAnimationFrame(() => {
                    swipeRafRef.current = null;
                    setSwipeOffset(swipeOffsetRef.current);
                });
            }
        }
    }, []);
    const handleSwipeTouchEnd = React.useCallback(() => {
        if (swipeRafRef.current != null) {
            cancelAnimationFrame(swipeRafRef.current);
            swipeRafRef.current = null;
        }
        const msg = touchMessageRef.current;
        const id = swipedIdRef.current;
        const offset = swipeOffsetRef.current;
        const triggerReply = id && msg && offset < -50;
        if (triggerReply) {
            setReplyTo(msg);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
        touchMessageRef.current = null;
        swipedIdRef.current = null;
        if (id) {
            setSwipeOffset(0);
            setTimeout(() => setSwipeMessageId(null), 220);
        } else {
            setSwipeMessageId(null);
            setSwipeOffset(0);
        }
    }, []);

    React.useEffect(() => {
        const el = messagesListRef.current;
        if (!el) return;
        el.addEventListener("scroll", checkScroll, { passive: true });
        return () => el.removeEventListener("scroll", checkScroll);
    }, [checkScroll]);

    React.useEffect(() => () => {
        if (highlightShowRef.current) clearTimeout(highlightShowRef.current);
        if (highlightHideRef.current) clearTimeout(highlightHideRef.current);
    }, []);

    React.useEffect(() => {
        if (loadingMessages || !messages.length) return;
        if (!initialScrollDone.current) {
            initialScrollDone.current = true;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    scrollToBottom("instant");
                });
            });
        }
    }, [loadingMessages, messages.length, scrollToBottom]);

    React.useEffect(() => {
        if (chatId) initialScrollDone.current = false;
    }, [chatId]);

    const refreshChat = React.useCallback(async () => {
        if (!user?.id) return;
        const msgs = await getMessages(chatId, user.id);
        setDbMessages(msgs);
        setMessages(msgs.length > 0 ? msgs : data.messages);
        if (chatId.startsWith("dm-")) markMessagesAsRead(chatId, user.id);
    }, [chatId, user?.id]);
    useRegisterRefresh(refreshChat);

    function persistNotes(notes: Msg[]) {
        try {
            localStorage.setItem(SAVED_NOTES_KEY, JSON.stringify(notes));
        } catch {}
    }

    async function send() {
        const t = text.trim();
        if (!t) return;
        const newMsg: Msg = {
            id: String(Date.now()),
            from: "me",
            text: t,
            time: "сейчас",
            replyTo: replyTo ? { id: replyTo.id, text: getMessageBody(replyTo as Msg).slice(0, 100) } : undefined,
        };
        if (user) {
            const { error } = await saveMessageToDb(chatId, user.id, {
                text: t,
                reply_to_id: replyTo?.id ?? undefined,
                reply_to_text: replyTo ? getMessageBody(replyTo as Msg).slice(0, 200) : undefined,
            });
            if (error) return;
            updateLastSeen(user.id);
        }
        setMessages((prev) => {
            const next = [...prev, newMsg];
            if (isSavedChat && !user) persistNotes(next.slice(savedMessages.length));
            return next;
        });
        setText("");
        setReplyTo(null);
        setStickerOpen(false);
        scrollToBottom();
    }

    async function sendFile(file: File) {
        if (!user || isSavedChat) return;
        const tempId = `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
        setPendingUploads((prev) => [...prev, { id: tempId, file, progress: 0, previewUrl }]);
        setUploadingFile(true);
        scrollToBottom();
        const { url, error } = await uploadChatFile(chatId, user.id, file);
        setUploadingFile(false);
        setPendingUploads((prev) => {
            const next = prev.filter((p) => p.id !== tempId);
            const removed = prev.find((p) => p.id === tempId);
            if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
            return next;
        });
        if (error || !url) {
            toast?.(error?.message ?? "Не удалось загрузить файл");
            return;
        }
        const isImage = file.type.startsWith("image/");
        const att = { name: isImage ? "Фото" : file.name, size: formatFileSize(file.size), url };
        const newMsg: Msg = { id: String(Date.now()), from: "me", text: "", attachment: att, time: "сейчас" };
        const { error: saveErr } = await saveMessageToDb(chatId, user.id, { attachment: att });
        if (!saveErr) {
            setMessages((prev) => [...prev, newMsg]);
            scrollToBottom();
            updateLastSeen(user.id);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function addSelectedPhotos(files: FileList | null) {
        if (!files?.length || selectedPhotos.length >= MAX_PHOTOS) return;
        const toAdd: SelectedPhoto[] = [];
        for (let i = 0; i < files.length && selectedPhotos.length + toAdd.length < MAX_PHOTOS; i++) {
            const file = files[i];
            if (!file.type.startsWith("image/")) continue;
            toAdd.push({
                id: `sel-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
                file,
                previewUrl: URL.createObjectURL(file),
            });
        }
        if (toAdd.length) setSelectedPhotos((prev) => [...prev, ...toAdd]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function removeSelectedPhoto(id: string) {
        setSelectedPhotos((prev) => {
            const next = prev.filter((p) => p.id !== id);
            const removed = prev.find((p) => p.id === id);
            if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
            return next;
        });
    }

    async function sendSelectedPhotos() {
        if (!user || isSavedChat || selectedPhotos.length === 0) return;
        const list = [...selectedPhotos];
        setUploadingFile(true);
        const urls: string[] = [];
        for (const { file } of list) {
            const { url, error } = await uploadChatFile(chatId, user.id, file);
            if (error || !url) {
                toast?.(error?.message ?? "Не удалось загрузить фото");
                break;
            }
            urls.push(url);
        }
        list.forEach((p) => URL.revokeObjectURL(p.previewUrl));
        setSelectedPhotos([]);
        setUploadingFile(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (urls.length === 0) return;
        const attachment = urls.length === 1
            ? { name: "Фото", size: "", url: urls[0] }
            : { urls };
        const newMsg: Msg = { id: String(Date.now()), from: "me", text: "", attachment, time: "сейчас" };
        const { error: saveErr } = await saveMessageToDb(chatId, user.id, { attachment });
        if (!saveErr) {
            setMessages((prev) => [...prev, newMsg]);
            scrollToBottom();
            updateLastSeen(user.id);
        }
    }

    async function sendSticker(emoji: string) {
        const newMsg: Msg = { id: String(Date.now()), from: "me", text: "", sticker: emoji, time: "сейчас" };
        if (user) {
            const { error } = await saveMessageToDb(chatId, user.id, { sticker: emoji });
            if (error) return;
        }
        setMessages((prev) => {
            const next = [...prev, newMsg];
            if (isSavedChat && !user) persistNotes(next.slice(savedMessages.length));
            return next;
        });
        setStickerOpen(false);
        scrollToBottom();
    }

    function isImageAttachment(att: Msg["attachment"]): boolean {
        if (!att) return false;
        if (att.urls?.length) return true;
        if (att.url && (att.name === "Фото" || /\.(jpe?g|png|gif|webp)$/i.test(att.name ?? ""))) return true;
        return false;
    }
    function getAttachmentLabel(m: Msg): string {
        const a = m.attachment;
        if (!a) return "Вложение";
        if (a.urls?.length) return a.urls.length === 1 ? "Фото" : `Фото (${a.urls.length})`;
        if (a.url && /\.(jpe?g|png|gif|webp)$/i.test(a.name ?? "")) return "Фото";
        return a.name ?? "Вложение";
    }
    function getMessageBody(m: Msg): string {
        if (m.text) return m.text;
        if (m.attachment) return getAttachmentLabel(m);
        if (m.sticker) return m.sticker;
        return "";
    }

    async function saveEdit() {
        if (!editingMessageId || !user?.id) return;
        const t = editText.trim();
        if (!t) { setEditingMessageId(null); return; }
        const { error } = await updateMessage(editingMessageId, user.id, { text: t });
        if (error) {
            toast?.(error.message);
            return;
        }
        setDbMessages((prev) =>
            prev.map((msg) => (msg.id === editingMessageId ? { ...msg, text: t } : msg))
        );
        setEditingMessageId(null);
        setEditText("");
        toast?.("Сообщение изменено");
    }

    async function handleForwardToChat(targetChatId: string) {
        if (!forwardMessage || !user?.id) return;
        const body = getMessageBody(forwardMessage);
        const { error } = await saveMessageToDb(targetChatId, user.id, { text: `↪ ${body}` });
        if (error) {
            toast?.(error.message);
            return;
        }
        toast?.(`Переслано в @${forwardChats.find((c) => c.id === targetChatId)?.title ?? "чат"}`);
        setForwardMessage(null);
    }

    function closeOverlays() {
        setStickerOpen(false);
        setForwardMessage(null);
    }

    /* Группировка сообщений по дате для разделителей */
    const messagesWithDates = React.useMemo(() => {
        const out: ({ type: "date"; date: string } | { type: "msg"; msg: Msg })[] = [];
        let lastDate: string | null = null;
        for (const m of messages) {
            const d = m.created_at ? new Date(m.created_at).toDateString() : "";
            if (d && d !== lastDate) {
                lastDate = d;
                out.push({ type: "date", date: d });
            }
            out.push({ type: "msg", msg: m });
        }
        return out;
    }, [messages]);

    function formatDateLabel(dateStr: string): string {
        const d = new Date(dateStr);
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === now.toDateString()) return "Сегодня";
        if (d.toDateString() === yesterday.toDateString()) return "Вчера";
        return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
    }

    const wallpaperUrl = profile?.chat_wallpaper_url ?? null;

    return (
        <div className="fixed inset-0 md:left-64 flex flex-col z-[100] h-[100dvh] min-h-[100dvh] overflow-hidden">
            {/* Один слой фона: обои или тема */}
            <div
                className="absolute inset-0 -z-10"
                aria-hidden
                style={wallpaperUrl ? { backgroundImage: `url(${wallpaperUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
            >
                {!wallpaperUrl && <div className="absolute inset-0 chat-screen-bg" aria-hidden />}
            </div>
            {/* Header: отступ safe-area только у шапки, чтобы верхняя полоса была фоном чата */}
            <header
                className="shrink-0 flex items-center gap-3 h-14 px-4 pt-[env(safe-area-inset-top)] border-b border-border bg-[var(--chat-panel)]/90 backdrop-blur-md transition-colors duration-200"
                style={{ minHeight: "calc(3.5rem + env(safe-area-inset-top))" }}
            >
                <Link
                    href="/messages"
                    className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:text-foreground transition-colors duration-200 shrink-0"
                    aria-label="Назад"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <button
                    type="button"
                    onClick={() => setChatSettingsOpen(true)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left"
                >
                    <div className="relative shrink-0">
                        <AvatarInitials username={displayTitle} avatarUrl={partner?.avatar_url ?? undefined} size="sm" className="!h-9 !w-9" />
                        {!isSavedChat && headerStatus === "онлайн" && (
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-black/30 bg-green-500" aria-hidden />
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-white">{isSavedChat ? displayTitle : `@${displayTitle}`}</div>
                        <div className={`text-xs truncate ${headerStatus === "онлайн" ? "text-[var(--chat-online)]" : "text-[var(--chat-text-secondary)]"}`}>
                            {headerStatus || "—"}
                        </div>
                    </div>
                </button>
                {!isSavedChat && chatId.startsWith("dm-") && connectionCompact && (
                    <div className="shrink-0 flex items-center gap-1.5 text-[var(--chat-text-secondary)]" title="Соединение установлено" aria-label="Соединение установлено">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-[10px] hidden sm:inline">Соединено</span>
                    </div>
                )}
            </header>

            {/* Полоса статуса соединения (подключение / синхронизация), скрывается через 1 с */}
            {!isSavedChat && chatId.startsWith("dm-") && !connectionCompact && (
                <div className="shrink-0 px-4 py-2 flex items-center justify-center gap-2 text-xs border-b border-border bg-[var(--chat-panel)]/60 text-[var(--chat-text-secondary)] backdrop-blur-sm transition-colors duration-200">
                    {connectionStatus === "connecting" && (
                        <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                            <span>Подключение...</span>
                        </>
                    )}
                    {connectionStatus === "syncing" && (
                        <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                            <span>Синхронизация...</span>
                        </>
                    )}
                    {connectionStatus === "connected" && (
                        <>
                            <Wifi className="h-3.5 w-3.5 shrink-0 text-green-500" />
                            <span>Соединение установлено</span>
                        </>
                    )}
                </div>
            )}

            {/* Настройки чата — по клику на аватар */}
            <AnimatePresence>
                {chatSettingsOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setChatSettingsOpen(false)}
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
                            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-background border-l z-50 flex flex-col shadow-xl"
                        >
                            <div className="flex items-center justify-between p-4 border-b">
                                <span className="text-sm font-medium">Настройки чата</span>
                                <button
                                    type="button"
                                    onClick={() => setChatSettingsOpen(false)}
                                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground"
                                    aria-label="Закрыть"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto p-4 space-y-4">
                                {/* Перейти в профиль — как в Telegram */}
                                {!isSavedChat && (
                                    <Link
                                        href={`/profile/${displayTitle}`}
                                        onClick={() => setChatSettingsOpen(false)}
                                        className="flex items-center gap-3 rounded-2xl border bg-card p-3 hover:bg-muted/50 transition"
                                    >
                                        <AvatarInitials username={displayTitle} avatarUrl={partner?.avatar_url ?? undefined} size="md" className="!h-12 !w-12" />
                                        <div className="min-w-0 flex-1">
                                            <div className="font-semibold truncate">{USER_PROFILES[displayTitle]?.displayName ?? displayTitle}</div>
                                            <div className="text-xs text-muted-foreground">@{displayTitle}</div>
                                        </div>
                                        <span className="text-xs text-muted-foreground">Перейти в профиль</span>
                                        <User className="h-5 w-5 text-muted-foreground shrink-0" />
                                    </Link>
                                )}

                                {/* Обои чата */}
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Обои чата</div>
                                    <input
                                        ref={wallpaperInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/gif,image/webp"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            setUploadingWallpaper(true);
                                            try {
                                                const result = await uploadChatWallpaper(file);
                                                if (result.error) {
                                                    toast?.(result.error.message || "Не удалось загрузить фото");
                                                    return;
                                                }
                                                await refreshProfile();
                                                toast?.("Обои установлены");
                                            } catch (err) {
                                                toast?.(err instanceof Error ? err.message : "Не удалось загрузить фото");
                                            } finally {
                                                setUploadingWallpaper(false);
                                                e.target.value = "";
                                            }
                                        }}
                                    />
                                    {profile?.chat_wallpaper_url ? (
                                        <div className="space-y-2">
                                            <div className="aspect-video rounded-xl bg-muted overflow-hidden border">
                                                <img src={profile.chat_wallpaper_url} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    disabled={uploadingWallpaper}
                                                    onClick={() => wallpaperInputRef.current?.click()}
                                                    className="flex-1 rounded-xl border bg-muted/60 px-3 py-2 text-sm font-medium hover:bg-muted transition"
                                                >
                                                    {uploadingWallpaper ? (
                                                        <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Загрузка...</span>
                                                    ) : (
                                                        "Сменить фото"
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        try {
                                                            await updateProfile({ chat_wallpaper_url: null });
                                                            refreshProfile();
                                                            toast?.("Обои удалены");
                                                        } catch {
                                                            toast?.("Не удалось удалить обои");
                                                        }
                                                    }}
                                                    className="rounded-xl border border-destructive/50 text-destructive px-3 py-2 text-sm font-medium hover:bg-destructive/10 transition"
                                                >
                                                    Удалить
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled={uploadingWallpaper}
                                            onClick={() => wallpaperInputRef.current?.click()}
                                            className="w-full rounded-xl border border-dashed bg-muted/40 px-3 py-4 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition flex items-center justify-center gap-2"
                                        >
                                            {uploadingWallpaper ? (
                                                <><Loader2 className="h-4 w-4 animate-spin" /> Загрузка...</>
                                            ) : (
                                                <><ImageIcon className="h-5 w-5" /> Загрузить фото</>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Поиск по чату */}
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Поиск по чату</div>
                                    <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 mb-2">
                                        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <input
                                            value={chatSearchQuery}
                                            onChange={(e) => setChatSearchQuery(e.target.value)}
                                            placeholder="Поиск сообщений..."
                                            className="flex-1 bg-transparent outline-none text-sm min-w-0"
                                        />
                                    </div>
                                    {chatSearchQuery.trim() && (
                                        <ul className="space-y-1 max-h-40 overflow-auto">
                                            {messages
                                                .filter((m) => (m.text && m.text.toLowerCase().includes(chatSearchQuery.trim().toLowerCase())) || (m.attachment && getAttachmentLabel(m).toLowerCase().includes(chatSearchQuery.trim().toLowerCase())))
                                                .slice(0, 20)
                                                .map((m) => (
                                                    <li key={m.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setChatSettingsOpen(false);
                                                                setTimeout(() => {
                                                                    const listEl = messagesListRef.current;
                                                                    const msgEl = listEl?.querySelector(`[data-msg-id="${m.id}"]`) as HTMLElement | null;
                                                                    if (listEl && msgEl) {
                                                                        const top = msgEl.offsetTop - listEl.clientHeight / 2 + msgEl.offsetHeight / 2;
                                                                        listEl.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
                                                                    }
                                                                }, 300);
                                                            }}
                                                            className="w-full text-left rounded-xl px-3 py-2 hover:bg-muted/60 text-sm"
                                                        >
                                                            <span className="text-muted-foreground text-xs">{formatMessageTime(m.created_at, m.time)}</span>
                                                            <div className="truncate mt-0.5">{m.text || getAttachmentLabel(m)}</div>
                                                        </button>
                                                    </li>
                                                ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Медиа чата — реальные превью с открытием фото */}
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Медиа</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {messages
                                            .filter((m) => m.sticker || m.attachment)
                                            .slice(0, 30)
                                            .map((m) => (
                                                <div key={m.id} className="aspect-square rounded-xl bg-muted overflow-hidden">
                                                    {m.sticker ? (
                                                        <div className="w-full h-full flex items-center justify-center text-2xl">{m.sticker}</div>
                                                    ) : (m.attachment?.urls?.length || (m.attachment?.url && isImageAttachment(m.attachment))) ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (m.attachment!.urls?.length) {
                                                                    setPhotoViewerSources(m.attachment!.urls!.map((u) => ({ url: u })));
                                                                    setPhotoViewerInitialIndex(0);
                                                                } else {
                                                                    setPhotoViewerSources([{ url: m.attachment!.url! }]);
                                                                    setPhotoViewerInitialIndex(0);
                                                                }
                                                                setPhotoViewerOpen(true);
                                                                setChatSettingsOpen(false);
                                                            }}
                                                            className="block w-full h-full"
                                                        >
                                                            <img src={m.attachment!.urls?.[0] ?? m.attachment!.url!} alt="" className="w-full h-full object-cover" />
                                                        </button>
                                                    ) : (
                                                        <a
                                                            href={m.attachment?.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block w-full h-full flex items-center justify-center"
                                                            onClick={() => setChatSettingsOpen(false)}
                                                        >
                                                            <FileText className="h-6 w-6 text-muted-foreground" />
                                                        </a>
                                                    )}
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
            <div
                ref={messagesListRef}
                className="flex-1 min-h-0 overflow-auto overflow-x-hidden space-y-2 px-4 pt-2 pb-4 select-none overscroll-y-auto overscroll-x-contain"
                style={{ WebkitUserSelect: "none", WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
                onTouchStart={handleSwipeTouchStart}
                onTouchMove={handleSwipeTouchMove}
                onTouchEnd={handleSwipeTouchEnd}
                onTouchCancel={handleSwipeTouchEnd}
            >
                {messagesWithDates.map((item) => {
                    if (item.type === "date") {
                        return (
                            <div key={item.date} className="flex items-center gap-3 py-2">
                                <span className="flex-1 h-px bg-border" aria-hidden />
                                <span className="text-[11px] font-medium px-3 py-1 rounded-lg shrink-0 bg-[var(--chat-panel)] text-[var(--chat-text-secondary)]">
                                    {formatDateLabel(item.date)}
                                </span>
                                <span className="flex-1 h-px bg-border" aria-hidden />
                            </div>
                        );
                    }
                    const m = item.msg;
                    const isSticker = !!m.sticker;
                    const isAttachment = !!m.attachment;

                    const noAnim = isDesktop;

                    return (
                        <motion.div
                            key={m.id}
                            data-msg-id={m.id}
                            initial={noAnim ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={noAnim ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }}
                            className={`flex ${m.from === "me" ? "justify-end" : "justify-start"} ${highlightedMessageId === m.id ? "message-reply-highlight" : ""}`}
                        >
                            <div
                                className="relative max-w-[85%] rounded-xl transition-all duration-200 ease-out touch-manipulation"
                                onCopy={(e) => e.preventDefault()}
                                onTouchStart={(e) => {
                                    if (e.touches.length) {
                                        touchStartX.current = e.touches[0].clientX;
                                        touchStartY.current = e.touches[0].clientY;
                                        touchMessageRef.current = m;
                                        swipedIdRef.current = null;
                                    }
                                }}
                                style={{
                                    transform: swipeMessageId === m.id ? `translateX(${swipeOffset}px)` : undefined,
                                    transition: swipeMessageId === m.id && swipeOffset === 0 ? "transform 0.2s ease-out" : "none",
                                }}
                            >
                                {/* Sticker message */}
                                {isSticker ? (
                                    <div
                                        className="select-none user-select-none"
                                        style={{ WebkitUserSelect: "none" }}
                                    >
                                        <motion.div
                                            initial={noAnim ? false : { scale: 0.5 }}
                                            animate={{ scale: 1 }}
                                            transition={noAnim ? { duration: 0 } : { type: "spring" as const, stiffness: 400, damping: 18 }}
                                            className="text-5xl leading-none"
                                        >
                                            {m.sticker}
                                        </motion.div>
                                        <div className="text-[11px] mt-0.5 text-[var(--chat-text-secondary)]">{formatMessageTime(m.created_at, m.time)}</div>
                                    </div>
                                ) : isAttachment ? (
                                    /* File/photo attachment message */
                                    <div
                                        className={["rounded-xl gap-0 shadow-lg select-none overflow-hidden transition-all duration-300", BUBBLE_STYLES[chatSize], m.from === "me" ? "bg-[var(--chat-bubble-out)] text-foreground" : "bg-[var(--chat-bubble-in)] text-foreground"].join(" ")}
                                    >
                                        {m.replyTo && (
                                            <button
                                                type="button"
                                                onClick={() => scrollToReply(m.replyTo!.id)}
                                                className="flex rounded-tl-md rounded-tr-xl rounded-b-xl mx-2 mt-1 mb-0.5 min-h-[52px] w-full max-w-full overflow-hidden border border-[var(--chat-bubble-in-border)]/30 bg-white/10 text-left cursor-pointer hover:bg-white/15 transition-colors"
                                            >
                                                <div className="w-1.5 shrink-0 bg-white rounded-l self-stretch" aria-hidden />
                                                <div className="flex flex-col justify-between min-h-[52px] pl-2.5 pr-2.5 py-2 min-w-0 flex-1">
                                                    <div className="text-[11px] font-medium text-white truncate">@{m.from === "me" ? displayTitle : "Вы"}</div>
                                                    <div className="text-sm text-white truncate leading-tight mt-auto">{m.replyTo.text}</div>
                                                </div>
                                            </button>
                                        )}
                                        {m.attachment?.urls?.length ? (
                                            <div className="grid grid-cols-2 gap-1 p-2">
                                                {m.attachment.urls.map((url, i) => (
                                                    <button
                                                        key={url}
                                                        type="button"
                                                        onClick={() => {
                                                            setPhotoViewerSources(m.attachment!.urls!.map((u) => ({ url: u })));
                                                            setPhotoViewerInitialIndex(i);
                                                            setPhotoViewerOpen(true);
                                                        }}
                                                        className="block relative aspect-square rounded-lg overflow-hidden bg-black/10"
                                                    >
                                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                                    </button>
                                                ))}
                                            </div>
                                        ) : m.attachment?.url && isImageAttachment(m.attachment) ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPhotoViewerSources([{ url: m.attachment!.url!, name: "Фото" }]);
                                                    setPhotoViewerInitialIndex(0);
                                                    setPhotoViewerOpen(true);
                                                }}
                                                className="block w-full text-left relative"
                                            >
                                                <img src={m.attachment.url} alt="" className="max-w-full max-h-64 w-auto h-auto rounded-lg object-cover cursor-pointer" />
                                            </button>
                                        ) : m.attachment?.name === "feel" && m.attachment?.url ? (
                                            <a
                                                href="/feels"
                                                className="block w-full max-w-[240px] rounded-lg overflow-hidden bg-black border border-white/10"
                                            >
                                                <video
                                                    src={m.attachment.url}
                                                    className="w-full aspect-[9/16] object-cover"
                                                    muted
                                                    playsInline
                                                    preload="metadata"
                                                />
                                                {m.text ? <div className="p-2 text-xs text-white/90 line-clamp-2">{m.text}</div> : <div className="p-2 text-xs text-white/70">Feels</div>}
                                            </a>
                                        ) : null}
                                        {!isImageAttachment(m.attachment) && m.attachment && m.attachment?.name !== "feel" && (
                                            <div className="flex items-center gap-2 py-1.5 px-2">
                                                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-black/10">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    {m.attachment?.url ? (
                                                        <a
                                                            href={m.attachment.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs font-medium truncate block hover:underline"
                                                        >
                                                            {m.attachment.name ?? "Вложение"}
                                                        </a>
                                                    ) : (
                                                        <div className="text-xs font-medium truncate">{m.attachment?.name ?? "Вложение"}</div>
                                                    )}
                                                    {m.attachment?.size ? (
                                                        <div className="text-[11px] text-[var(--chat-text-secondary)]">{m.attachment.size}</div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        )}
                                        <div className={`text-[0.7em] leading-none mt-[0.5em] px-2 pb-1 text-[var(--chat-text-secondary)] flex items-center gap-0.5 ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                                            {formatMessageTime(m.created_at, m.time)}
                                            {m.from === "me" && <MessageStatusIcon read={!!m.read_at} className="h-[1em] min-h-[10px] w-[1em] min-w-[10px] text-[var(--chat-text-secondary)]" />}
                                        </div>
                                    </div>
                                ) : (
                                    /* Regular text message: время и галочки на нижней линии справа, блок компактный */
                                    <div
                                        className={["rounded-xl border-0 gap-0 shadow-lg select-none user-select-none", BUBBLE_STYLES[chatSize], "px-4 py-2.5 transition-all duration-300", m.from === "me" ? "bg-[var(--chat-bubble-out)] text-foreground" : "bg-[var(--chat-bubble-in)] text-foreground"].join(" ")}
                                        style={{ WebkitUserSelect: "none" }}
                                    >
                                        {m.replyTo && (
                                            <button
                                                type="button"
                                                onClick={() => scrollToReply(m.replyTo!.id)}
                                                className="flex rounded-tl-md rounded-tr-xl rounded-b-xl mb-1 min-h-[48px] min-w-[120px] max-w-full overflow-hidden border border-[var(--chat-bubble-in-border)]/30 bg-white/10 text-left cursor-pointer hover:bg-white/15 transition-colors"
                                            >
                                                <div className="w-1.5 shrink-0 bg-white rounded-l self-stretch" aria-hidden />
                                                <div className="flex flex-col justify-between min-h-[48px] pl-2.5 pr-2.5 py-2 min-w-0 flex-1">
                                                    <div className="text-[11px] font-medium text-white truncate">@{m.from === "me" ? displayTitle : "Вы"}</div>
                                                    <div className="text-sm text-white truncate leading-tight mt-auto">{m.replyTo.text}</div>
                                                </div>
                                            </button>
                                        )}
                                        {editingMessageId === m.id ? (
                                            <div className="space-y-2">
                                                <input
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    className="w-full rounded px-2 py-1 text-sm bg-black/20 outline-none text-foreground"
                                                    autoFocus
                                                    onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") { setEditingMessageId(null); setEditText(""); } }}
                                                />
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={saveEdit} className="text-xs px-2 py-1 rounded bg-white/20 text-foreground">Сохранить</button>
                                                    <button type="button" onClick={() => { setEditingMessageId(null); setEditText(""); }} className="text-xs px-2 py-1 rounded bg-white/10 text-muted-foreground">Отмена</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="leading-snug select-none break-words text-left" style={{ WebkitUserSelect: "none" }}>
                                                    {m.text}
                                                </div>
                                                <div className={`flex items-center gap-0.5 justify-end mt-0.5 text-[0.7em] leading-none text-[var(--chat-text-secondary)] whitespace-nowrap`} aria-label={m.from === "me" ? (m.read_at ? "Прочитано" : "Доставлено") : undefined}>
                                                    {formatMessageTime(m.created_at, m.time)}
                                                    {m.from === "me" && <MessageStatusIcon read={!!m.read_at} className="h-[1em] min-h-[10px] w-[1em] min-w-[10px] text-[var(--chat-text-secondary)]" />}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                            </div>
                        </motion.div>
                    );
                })}

                {/* Пузыри «Отправка» для загружаемых файлов */}
                {pendingUploads.map((pu) => (
                        <motion.div
                            key={pu.id}
                            initial={{ opacity: 0, y: 12, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 26 }}
                            className="flex justify-end"
                        >
                            <div className="rounded-xl border-0 shadow-lg overflow-hidden max-w-[85%] bg-[var(--chat-bubble-out)] text-foreground">
                                <div className="px-3 py-2 flex items-center gap-2">
                                    {pu.previewUrl ? (
                                        <img src={pu.previewUrl} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" />
                                    ) : (
                                        <div className="h-14 w-14 rounded-lg bg-white/20 grid place-items-center shrink-0">
                                            <FileText className="h-6 w-6" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <div className="text-xs font-medium truncate">{pu.file.name}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="h-1 flex-1 min-w-[60px] max-w-[120px] rounded-full bg-white/30 overflow-hidden">
                                                <motion.span
                                                    className="block h-full rounded-full bg-white/80"
                                                    initial={{ width: "0%" }}
                                                    animate={{ width: "70%" }}
                                                    transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                                                />
                                            </span>
                                            <span className="text-[10px] opacity-80">Отправка...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                ))}

                {!messages.length && pendingUploads.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-[var(--chat-text-secondary)]">
                        <div className="text-4xl mb-3">💬</div>
                        <div className="text-sm">Сообщений пока нет</div>
                        <div className="text-xs mt-1">Напиши первым!</div>
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

            {/* Кнопка «вниз» — показывается при прокрутке вверх, исчезает через 0.5 с после прокрутки вниз */}
            <AnimatePresence>
                {showScrollToBottom && (
                    <motion.button
                        type="button"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => scrollToBottom("smooth")}
                        className="fixed right-6 md:right-[calc(16rem+1.5rem)] z-30 w-11 h-11 rounded-full bg-[var(--chat-panel)] text-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-colors duration-200"
                        style={{ bottom: "calc(56px + env(safe-area-inset-bottom))" }}
                        aria-label="В конец чата"
                    >
                        <ChevronDown className="h-5 w-5" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Input bar — статично внизу */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                disabled={uploadingFile || isSavedChat || selectedPhotos.length >= MAX_PHOTOS}
                onChange={(e) => {
                    addSelectedPhotos(e.target.files);
                    e.target.value = "";
                }}
            />
            {selectedPhotos.length > 0 && (
                <div className="shrink-0 px-4 py-2 border-t flex gap-2 overflow-x-auto">
                    {selectedPhotos.map((p) => (
                        <div key={p.id} className="relative shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-muted group">
                            <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removeSelectedPhoto(p.id)}
                                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                                aria-label="Удалить"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            {replyTo && (
                <div className="shrink-0 px-4 py-1.5 flex items-center gap-2 border-t border-border bg-[var(--chat-panel)]/80 backdrop-blur-sm">
                    <div className="flex flex-1 min-w-0 rounded-tl-md rounded-tr-xl rounded-b-xl min-h-[44px] overflow-hidden border border-[var(--chat-bubble-in-border)]/30 bg-[var(--chat-input-bg)]">
                        <div className="w-1.5 shrink-0 bg-white/90 rounded-l self-stretch" aria-hidden />
                        <div className="flex flex-col justify-between min-h-[44px] pl-2.5 pr-2.5 py-2 min-w-0 flex-1 text-sm">
                            <div className="text-[11px] font-medium text-foreground truncate">@{displayTitle}</div>
                            <div className="truncate leading-tight text-foreground mt-auto">{replyTo.text || getAttachmentLabel(replyTo as Msg) || "Вложение"}</div>
                        </div>
                    </div>
                    <button type="button" onClick={() => setReplyTo(null)} className="shrink-0 p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors duration-200" aria-label="Отменить ответ">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
            <div
                className="shrink-0 px-4 flex items-center border-t border-border bg-[var(--chat-panel)]/90 backdrop-blur-md"
                style={{ paddingTop: 12, paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
            >
                <div className="rounded-2xl p-2 flex items-center gap-1.5 w-full bg-[var(--chat-input-bg)] border border-border transition-colors duration-200 min-h-[48px]">
                    {/* Attach */}
                    <motion.button
                        type="button"
                        whileTap={isDesktop ? undefined : { scale: 0.92 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => { fileInputRef.current?.click(); setStickerOpen(false); }}
                        disabled={uploadingFile || isSavedChat || selectedPhotos.length >= MAX_PHOTOS}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:text-foreground transition-colors duration-200 disabled:opacity-50"
                        aria-label="Прикрепить фото"
                    >
                        {uploadingFile ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                            <Paperclip className="h-4 w-4" />
                        )}
                    </motion.button>

                    <input
                        ref={inputRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Сообщение..."
                        className="flex-1 min-w-0 bg-transparent outline-none text-sm px-1 text-foreground placeholder:text-[var(--chat-text-secondary)]"
                        onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                        onFocus={closeOverlays}
                    />

                    <motion.button
                        type="button"
                        whileTap={isDesktop ? undefined : { scale: 0.92 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => { setStickerOpen((v) => !v); }}
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors duration-200 ${stickerOpen ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        aria-label="Стикеры"
                    >
                        <Smile className="h-4 w-4" />
                    </motion.button>

                    <motion.button
                        whileTap={isDesktop ? undefined : { scale: 0.92 }}
                        transition={{ duration: 0.12 }}
                        onClick={() => {
                            if (text.trim()) send();
                            if (selectedPhotos.length > 0) sendSelectedPhotos();
                        }}
                        disabled={!text.trim() && selectedPhotos.length === 0}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-colors duration-200 disabled:opacity-40"
                        aria-label="Отправить"
                    >
                        <Send className="h-4 w-4" />
                    </motion.button>
                </div>
            </div>

            {/* Модальное окно «Переслать в чат» */}
            <AnimatePresence>
                {forwardMessage && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setForwardMessage(null)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.2 }}
                            className="fixed left-4 right-4 top-1/2 z-50 -translate-y-1/2 rounded-2xl bg-gray-800/95 border border-gray-600 shadow-2xl overflow-hidden max-h-[70vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-4 py-3 border-b border-gray-600 flex items-center justify-between">
                                <span className="font-semibold text-gray-100">Переслать в чат</span>
                                <button type="button" onClick={() => setForwardMessage(null)} className="p-1 rounded-full hover:bg-gray-700 text-gray-400 transition-colors duration-200">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="overflow-auto flex-1 py-2">
                                {forwardChats.length === 0 && <p className="px-4 py-3 text-sm text-gray-400">Нет других чатов</p>}
                                {forwardChats.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => handleForwardToChat(c.id)}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-left text-gray-100 hover:bg-gray-700/80 transition-colors duration-200"
                                    >
                                        <span className="font-medium">@{c.title}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <PhotoViewer
                open={photoViewerOpen}
                onClose={() => { setPhotoViewerOpen(false); setPhotoViewerSources([]); }}
                sources={photoViewerSources}
                initialIndex={photoViewerInitialIndex}
            />
        </div>
    );
}
