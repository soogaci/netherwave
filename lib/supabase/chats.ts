import { createClient } from "./client";
import { getProfile } from "./profiles";
import type { Chat } from "../types";

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const min = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return "сейчас";
  if (min < 60) return `${min} мин`;
  if (h < 24) return `${h}ч`;
  if (day < 2) return "вчера";
  return `${day} дн`;
}

export async function getChatsForUser(userId: string): Promise<Chat[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data: allRows } = await supabase
    .from("messages")
    .select("chat_id, text, created_at, user_id")
    .like("chat_id", "dm-%")
    .order("created_at", { ascending: false });
  const byChat = new Map<string, { text: string; created_at: string }>();
  for (const r of allRows ?? []) {
    const cid = (r as any).chat_id;
    if (!cid || !cid.includes(userId)) continue;
    if (!byChat.has(cid)) byChat.set(cid, { text: (r as any).text ?? "", created_at: (r as any).created_at });
  }
  const chatIds = [...byChat.keys()];
  const countByChat = new Map<string, number>();
  const unreadByChat = new Map<string, number>();
  if (chatIds.length > 0) {
    const { data: msgRows } = await supabase.from("messages").select("chat_id, user_id, read_at").in("chat_id", chatIds);
    for (const row of msgRows ?? []) {
      const r = row as { chat_id: string; user_id: string; read_at: string | null };
      countByChat.set(r.chat_id, (countByChat.get(r.chat_id) ?? 0) + 1);
      if (r.user_id !== userId && r.read_at == null) {
        unreadByChat.set(r.chat_id, (unreadByChat.get(r.chat_id) ?? 0) + 1);
      }
    }
  }
  const chats: Chat[] = [];
  for (const [chatId, last] of byChat) {
    const rest = chatId.replace(/^dm-/, "");
    const parts = rest.split("_");
    const otherId = parts[0] === userId ? parts[1] : parts[0];
    const profile = await getProfile(otherId);
    chats.push({
      id: chatId,
      type: "dm",
      title: profile?.username ?? "user",
      subtitle: last.text || "Нет сообщений",
      time: formatTime(last.created_at),
      avatar_url: profile?.avatar_url ?? null,
      message_count: countByChat.get(chatId) ?? 0,
      unread: unreadByChat.get(chatId) ?? 0,
      last_seen: profile?.last_seen ?? null,
    });
  }
  chats.sort((a, b) => {
    const aT = byChat.get(a.id)?.created_at ?? "";
    const bT = byChat.get(b.id)?.created_at ?? "";
    return bT.localeCompare(aT);
  });
  return chats;
}

/** Для DM чата возвращает username собеседника (для заголовка). */
export async function getDmChatTitle(chatId: string, currentUserId: string): Promise<string | null> {
  if (!chatId.startsWith("dm-") || !currentUserId) return null;
  const rest = chatId.replace(/^dm-/, "").trim();
  const parts = rest.split("_").filter(Boolean);
  if (parts.length < 2) return null;
  const otherId = parts[0] === currentUserId ? parts[1] : parts[0];
  const profile = await getProfile(otherId);
  return profile?.username ?? null;
}

export type DmChatPartner = {
  username: string;
  avatar_url: string | null;
  last_seen: string | null;
};

/** Данные собеседника для шапки чата (аватар, статус). */
export async function getDmChatPartner(chatId: string, currentUserId: string): Promise<DmChatPartner | null> {
  if (!chatId.startsWith("dm-") || !currentUserId) return null;
  const rest = chatId.replace(/^dm-/, "").trim();
  const parts = rest.split("_").filter(Boolean);
  if (parts.length < 2) return null;
  const otherId = parts[0] === currentUserId ? parts[1] : parts[0];
  const profile = await getProfile(otherId);
  if (!profile) return null;
  return {
    username: profile.username,
    avatar_url: profile.avatar_url ?? null,
    last_seen: profile.last_seen ?? null,
  };
}
