import { createClient } from "./client";
import type { Msg } from "../types";

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

export async function getMessages(chatId: string): Promise<Msg[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("messages")
    .select("id, text, sticker, attachment, from_me, created_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });
  return (data ?? []).map((r: any) => ({
    id: r.id,
    from: r.from_me ? "me" : "other",
    text: r.text ?? "",
    sticker: r.sticker ?? undefined,
    attachment: r.attachment ?? undefined,
    time: formatTime(r.created_at),
  }));
}

export async function sendMessage(
  chatId: string,
  userId: string,
  content: { text?: string; sticker?: string; attachment?: { name: string; size: string } }
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    user_id: userId,
    from_me: true,
    text: content.text ?? "",
    sticker: content.sticker ?? null,
    attachment: content.attachment ?? null,
  });
  return { error: error ? new Error(error.message) : null };
}
