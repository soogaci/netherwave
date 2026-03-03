import { createClient } from "./client";
import type { NotificationItem } from "../types";

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

export async function getNotifications(userId: string): Promise<NotificationItem[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data: rows } = await supabase
    .from("notifications")
    .select("id, type, from_user_id, post_id, comment_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (!rows?.length) return [];
  const userIds = [...new Set((rows as any[]).map((r) => r.from_user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);
  const profileList = (profiles as { id: string; username: string; avatar_url?: string | null }[] || []);
  const userMap = new Map(profileList.map((p) => [p.id, p.username]));
  const avatarMap = new Map(profileList.map((p) => [p.id, p.avatar_url ?? null]));
  return (rows as any[]).map((r) => {
    const user = userMap.get(r.from_user_id) ?? "user";
    const label = r.type === "like" ? "лайкнул(а)" : r.type === "comment" ? "прокомментировал(а)" : "подписал(а)ся на тебя";
    return {
      id: r.id,
      type: r.type as "like" | "comment" | "follow",
      user,
      text: r.type === "follow" ? "подписал(а)ся на тебя" : label,
      time: formatTime(r.created_at),
      avatar_url: avatarMap.get(r.from_user_id) ?? null,
    };
  });
}

export async function createNotification(params: {
  userId: string;
  type: "like" | "comment" | "follow";
  fromUserId: string;
  postId?: string;
  commentId?: string;
}): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  if (params.userId === params.fromUserId) return;
  await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    from_user_id: params.fromUserId,
    post_id: params.postId ?? null,
    comment_id: params.commentId ?? null,
  });
}
