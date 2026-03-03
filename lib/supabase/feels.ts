import { createClient } from "./client";
import type { Feel } from "../types";
import { getLikeCountsForPosts, getLikedByUser, getCommentCountsForPosts } from "./likes-comments";
import { getFollowingList, type FollowerRow } from "./follows";
import { sendMessage } from "./messages";

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

/** Только посты type = 'feels' с video_url (лента Feels) */
export async function getFeels(currentUserId?: string): Promise<Feel[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data: posts } = await supabase
    .from("posts")
    .select("id, user_id, video_url, description, created_at")
    .eq("type", "feels")
    .not("video_url", "is", null)
    .order("created_at", { ascending: false });
  if (!posts?.length) return [];
  const postIds = (posts as { id: string }[]).map((p) => p.id);
  const [likeCounts, likedSet, commentCounts] = await Promise.all([
    getLikeCountsForPosts(postIds),
    currentUserId ? getLikedByUser(postIds, currentUserId) : Promise.resolve(new Set<string>()),
    getCommentCountsForPosts(postIds),
  ]);
  const userIds = [...new Set((posts as { user_id: string }[]).map((p) => p.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);
  const profileList = (profiles as { id: string; username: string; avatar_url?: string | null }[]) ?? [];
  const userMap = new Map(profileList.map((p) => [p.id, p.username]));
  const avatarMap = new Map(profileList.map((p) => [p.id, p.avatar_url ?? null]));
  return (posts as { id: string; user_id: string; video_url: string; description: string | null; created_at: string }[]).map((row) => ({
    id: row.id,
    user: userMap.get(row.user_id) ?? "user",
    user_id: row.user_id,
    time: formatTime(row.created_at),
    video_url: row.video_url,
    description: row.description ?? "",
    avatar_url: avatarMap.get(row.user_id) ?? null,
    like_count: likeCounts.get(row.id) ?? 0,
    isLiked: likedSet.has(row.id),
    comment_count: commentCounts.get(row.id) ?? 0,
  }));
}

/** Загрузка видео в feel-videos (путь userId/uuid.ext) */
export async function uploadFeelVideo(
  userId: string,
  file: File
): Promise<{ url: string | null; error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { url: null, error: new Error("Supabase not настроен") };
  const ext = file.name.split(".").pop() || "mp4";
  const name = `${crypto.randomUUID()}.${ext}`;
  const path = `${userId}/${name}`;
  const { error: uploadError } = await supabase.storage.from("feel-videos").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { url: null, error: new Error(uploadError.message) };
  const { data } = supabase.storage.from("feel-videos").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export async function createFeel(
  userId: string,
  post: { video_url: string; description: string }
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase не настроен") };
  const { error } = await supabase.from("posts").insert({
    user_id: userId,
    type: "feels",
    video_url: post.video_url,
    description: post.description ?? "",
  });
  return { error: error ? new Error(error.message) : null };
}

/** Список пользователей, которым можно отправить филс (подписки текущего пользователя) */
export async function getUsersToSendFeel(currentUserId: string): Promise<FollowerRow[]> {
  return getFollowingList(currentUserId);
}

/** Отправить филс в чат выбранным пользователям (только доля, не репост) */
export async function sendFeelToChat(
  feel: { video_url: string; description?: string | null },
  fromUserId: string,
  toUserIds: string[]
): Promise<{ error: Error | null }> {
  for (const toUserId of toUserIds) {
    const chatId = `dm-${[fromUserId, toUserId].sort().join("_")}`;
    const { error } = await sendMessage(chatId, fromUserId, {
      text: feel.description?.trim() || "Feels",
      attachment: { url: feel.video_url, name: "feel" },
    });
    if (error) return { error };
  }
  return { error: null };
}

/** Репост филсу (добавить в профиль как репост) */
export async function toggleFeelRepost(
  feelId: string,
  userId: string,
  isReposting: boolean
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase не настроен") };
  
  if (isReposting) {
    // Добавить репост
    const { error } = await supabase.from("feel_reposts").insert({
      feel_id: feelId,
      from_user_id: userId,
      to_user_id: userId,
    });
    return { error: error ? new Error(error.message) : null };
  } else {
    // Удалить репост
    const { error } = await supabase
      .from("feel_reposts")
      .delete()
      .eq("feel_id", feelId)
      .eq("from_user_id", userId)
      .eq("to_user_id", userId);
    return { error: error ? new Error(error.message) : null };
  }
}

/** Feels, которые выложил данный пользователь */
export async function getFeelsByUserId(userId: string, currentUserId?: string): Promise<Feel[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data: posts } = await supabase
    .from("posts")
    .select("id, user_id, video_url, description, created_at")
    .eq("type", "feels")
    .eq("user_id", userId)
    .not("video_url", "is", null)
    .order("created_at", { ascending: false });
  if (!posts?.length) return [];
  const postIds = (posts as { id: string }[]).map((p) => p.id);
  const [likeCounts, likedSet, commentCounts] = await Promise.all([
    getLikeCountsForPosts(postIds),
    currentUserId ? getLikedByUser(postIds, currentUserId) : Promise.resolve(new Set<string>()),
    getCommentCountsForPosts(postIds),
  ]);
  const userIds = [...new Set((posts as { user_id: string }[]).map((p) => p.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);
  const profileList = (profiles as { id: string; username: string; avatar_url?: string | null }[]) ?? [];
  const userMap = new Map(profileList.map((p) => [p.id, p.username]));
  const avatarMap = new Map(profileList.map((p) => [p.id, p.avatar_url ?? null]));
  return (posts as { id: string; user_id: string; video_url: string; description: string | null; created_at: string }[]).map((row) => ({
    id: row.id,
    user: userMap.get(row.user_id) ?? "user",
    user_id: row.user_id,
    time: formatTime(row.created_at),
    video_url: row.video_url,
    description: row.description ?? "",
    avatar_url: avatarMap.get(row.user_id) ?? null,
    like_count: likeCounts.get(row.id) ?? 0,
    isLiked: likedSet.has(row.id),
    comment_count: commentCounts.get(row.id) ?? 0,
  }));
}

/** Мои репосты — филсы, которые я отправил (репостнул) */
export async function getMyReposts(userId: string, currentUserId?: string): Promise<Feel[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data: reposts } = await supabase
    .from("feel_reposts")
    .select("feel_id")
    .eq("from_user_id", userId)
    .order("created_at", { ascending: false });
  const feelIds = [...new Set((reposts ?? []).map((r: { feel_id: string }) => r.feel_id))];
  if (feelIds.length === 0) return [];
  const { data: posts } = await supabase
    .from("posts")
    .select("id, user_id, video_url, description, created_at")
    .eq("type", "feels")
    .in("id", feelIds);
  if (!posts?.length) return [];
  const postIds = (posts as { id: string }[]).map((p) => p.id);
  const [likeCounts, likedSet, commentCounts] = await Promise.all([
    getLikeCountsForPosts(postIds),
    currentUserId ? getLikedByUser(postIds, currentUserId) : Promise.resolve(new Set<string>()),
    getCommentCountsForPosts(postIds),
  ]);
  const userIds = [...new Set((posts as { user_id: string }[]).map((p) => p.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);
  const profileList = (profiles as { id: string; username: string; avatar_url?: string | null }[]) ?? [];
  const userMap = new Map(profileList.map((p) => [p.id, p.username]));
  const avatarMap = new Map(profileList.map((p) => [p.id, p.avatar_url ?? null]));
  const orderMap = new Map(feelIds.map((id, i) => [id, i]));
  return (posts as { id: string; user_id: string; video_url: string; description: string | null; created_at: string }[])
    .map((row) => ({
      id: row.id,
      user: userMap.get(row.user_id) ?? "user",
      user_id: row.user_id,
      time: formatTime(row.created_at),
      video_url: row.video_url,
      description: row.description ?? "",
      avatar_url: avatarMap.get(row.user_id) ?? null,
      like_count: likeCounts.get(row.id) ?? 0,
      isLiked: likedSet.has(row.id),
      comment_count: commentCounts.get(row.id) ?? 0,
    }))
    .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
}
