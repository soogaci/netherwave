import { createClient } from "./client";
import type { Msg } from "../types";

function rowToMsg(
  r: {
    id: string;
    user_id: string;
    text?: string | null;
    sticker?: string | null;
    attachment?: unknown;
    created_at?: string;
    read_at?: string | null;
    reply_to_id?: string | null;
    reply_to_text?: string | null;
  },
  currentUserId?: string
): Msg {
  return {
    id: r.id,
    from: currentUserId && r.user_id === currentUserId ? "me" : "other",
    text: r.text ?? "",
    sticker: r.sticker ?? undefined,
    attachment: r.attachment as Msg["attachment"] ?? undefined,
    created_at: r.created_at,
    read_at: r.read_at ?? undefined,
    time: "",
    replyTo:
      r.reply_to_id && r.reply_to_text
        ? { id: r.reply_to_id, text: r.reply_to_text }
        : undefined,
  };
}

export async function getMessages(chatId: string, currentUserId?: string): Promise<Msg[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("messages")
    .select("id, text, sticker, attachment, user_id, created_at, read_at, reply_to_id, reply_to_text")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });
  return (data ?? []).map((r: Record<string, unknown>) =>
    rowToMsg(r as Parameters<typeof rowToMsg>[0], currentUserId)
  );
}

export type ConnectionStatus = "connecting" | "syncing" | "connected";

/**
 * Подписка на новые сообщения чата в реальном времени.
 * Возвращает функцию отписки.
 */
export function subscribeToChatMessages(
  chatId: string,
  currentUserId: string | undefined,
  onMessage: (msg: Msg) => void,
  onStatus: (status: ConnectionStatus) => void,
  onMessageUpdate?: (msg: Msg) => void
): () => void {
  const supabase = createClient();
  if (!supabase) {
    onStatus("connecting");
    return () => {};
  }
  onStatus("connecting");
  const channel = supabase
    .channel(`messages:${chatId}:${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      (payload) => {
        const row = payload.new as {
          chat_id?: string;
          id: string;
          user_id: string;
          text?: string | null;
          sticker?: string | null;
          attachment?: unknown;
          created_at?: string;
          read_at?: string | null;
          reply_to_id?: string | null;
          reply_to_text?: string | null;
        };
        if (row.chat_id !== chatId) return;
        onMessage(rowToMsg(row, currentUserId));
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
      },
      (payload) => {
        const row = payload.new as {
          chat_id?: string;
          id: string;
          user_id: string;
          text?: string | null;
          sticker?: string | null;
          attachment?: unknown;
          created_at?: string;
          read_at?: string | null;
          reply_to_id?: string | null;
          reply_to_text?: string | null;
        };
        if (row.chat_id !== chatId || !onMessageUpdate) return;
        onMessageUpdate(rowToMsg(row, currentUserId));
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        onStatus("syncing");
      }
      if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        onStatus("connecting");
      }
    });
  return () => {
    supabase.removeChannel(channel);
  };
}

/** Отметить сообщения собеседника в чате как прочитанные */
export async function markMessagesAsRead(chatId: string, readerUserId: string): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("chat_id", chatId)
    .neq("user_id", readerUserId)
    .is("read_at", null);
  return { error: error ? new Error(error.message) : null };
}

export async function sendMessage(
  chatId: string,
  userId: string,
  content: {
    text?: string;
    sticker?: string;
    attachment?: { name?: string; size?: string; url?: string; urls?: string[] };
    reply_to_id?: string;
    reply_to_text?: string;
  }
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
    reply_to_id: content.reply_to_id ?? null,
    reply_to_text: content.reply_to_text ?? null,
  });
  return { error: error ? new Error(error.message) : null };
}

export async function updateMessage(
  messageId: string,
  userId: string,
  updates: { text?: string }
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const { error } = await supabase
    .from("messages")
    .update(updates)
    .eq("id", messageId)
    .eq("user_id", userId);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteMessage(messageId: string, userId: string): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const { error } = await supabase.from("messages").delete().eq("id", messageId).eq("user_id", userId);
  return { error: error ? new Error(error.message) : null };
}

/** Загрузка файла во вложение чата. Путь: chatId/userId/uuid-name (для RLS [1]=userId) */
export async function uploadChatFile(
  chatId: string,
  userId: string,
  file: File
): Promise<{ url: string | null; error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { url: null, error: new Error("Supabase not configured") };
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const ext = file.name.split(".").pop() || "";
  const name = `${crypto.randomUUID()}${ext ? "." + ext : ""}-${safeName}`;
  const path = `${chatId}/${userId}/${name}`;
  const { error: uploadError } = await supabase.storage.from("chat-attachments").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { url: null, error: new Error(uploadError.message) };
  const { data } = supabase.storage.from("chat-attachments").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
