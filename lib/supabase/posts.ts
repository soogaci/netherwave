import { createClient } from "./client";
import type { PeoplePost, MusicPost } from "../types";
import { getLikeCountsForPosts, getLikedByUser, getCommentCountsForPosts, getCommentCount } from "./likes-comments";

export async function getPosts(currentUserId?: string): Promise<{ people: PeoplePost[]; music: MusicPost[] }> {
  const supabase = createClient();
  if (!supabase) return { people: [], music: [] };
  const { data: posts } = await supabase
    .from("posts")
    .select("id, user_id, type, text, tags, has_photo, photo_urls, track, artist, mood, cover_color, created_at")
    .order("created_at", { ascending: false });
  if (!posts?.length) return { people: [], music: [] };
  const postIds = (posts as any[]).map((p) => p.id);
  const [likeCounts, likedSet, commentCounts] = await Promise.all([
    getLikeCountsForPosts(postIds),
    currentUserId ? getLikedByUser(postIds, currentUserId) : Promise.resolve(new Set<string>()),
    getCommentCountsForPosts(postIds),
  ]);
  const userIds = [...new Set((posts as any[]).map((p) => p.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);
  const profileList = (profiles as { id: string; username: string; avatar_url?: string | null }[]) || [];
  const userMap = new Map(profileList.map((p) => [p.id, p.username]));
  const avatarMap = new Map(profileList.map((p) => [p.id, p.avatar_url ?? null]));
  const people: PeoplePost[] = [];
  const music: MusicPost[] = [];
  for (const row of posts as any[]) {
    const user = userMap.get(row.user_id) ?? "user";
    const avatar_url = avatarMap.get(row.user_id) ?? null;
    const time = formatTime(row.created_at);
    const like_count = likeCounts.get(row.id) ?? 0;
    const comment_count = commentCounts.get(row.id) ?? 0;
    const isLiked = likedSet.has(row.id);
    if (row.type === "people") {
      const photoUrls = Array.isArray(row.photo_urls) ? row.photo_urls : [];
      people.push({
        id: row.id,
        user,
        user_id: row.user_id,
        time,
        text: row.text ?? "",
        tags: row.tags ?? [],
        hasPhoto: row.has_photo ?? false,
        photo_urls: photoUrls.length > 0 ? photoUrls : undefined,
        avatar_url,
        like_count,
        isLiked,
        comment_count,
      });
    } else {
      music.push({
        id: row.id,
        user,
        user_id: row.user_id,
        time,
        track: row.track ?? "",
        artist: row.artist ?? "",
        mood: row.mood ?? "",
        tags: row.tags ?? [],
        coverColor: row.cover_color,
        avatar_url,
        like_count,
        isLiked,
        comment_count,
      });
    }
  }
  return { people, music };
}

export async function getPostUserId(postId: string): Promise<string | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("posts").select("user_id").eq("id", postId).single();
  return (data as { user_id: string } | null)?.user_id ?? null;
}

export async function getPostById(
  postId: string,
  currentUserId?: string
): Promise<import("../types").PeoplePost | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data: row } = await supabase
    .from("posts")
    .select("id, user_id, type, text, tags, has_photo, photo_urls, created_at")
    .eq("id", postId)
    .eq("type", "people")
    .single();
  if (!row) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", (row as any).user_id)
    .single();
  const user = (profile as any)?.username ?? "user";
  const avatar_url = (profile as any)?.avatar_url ?? null;
  const [likeCounts, likedSet, commentCount] = await Promise.all([
    getLikeCountsForPosts([postId]),
    currentUserId ? getLikedByUser([postId], currentUserId) : Promise.resolve(new Set<string>()),
    getCommentCount(postId),
  ]);
  return {
    id: (row as any).id,
    user,
    user_id: (row as any).user_id,
    time: formatTime((row as any).created_at),
    text: (row as any).text ?? "",
    tags: (row as any).tags ?? [],
    hasPhoto: (row as any).has_photo ?? false,
    photo_urls: Array.isArray((row as any).photo_urls) ? (row as any).photo_urls : undefined,
    avatar_url,
    like_count: likeCounts.get(postId) ?? 0,
    isLiked: likedSet.has(postId),
    comment_count: commentCount,
  };
}

export async function updatePeoplePost(
  postId: string,
  userId: string,
  data: { text?: string; tags?: string[]; hasPhoto?: boolean }
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const payload: Record<string, unknown> = {};
  if (data.text !== undefined) payload.text = data.text;
  if (data.tags !== undefined) payload.tags = data.tags;
  if (data.hasPhoto !== undefined) payload.has_photo = data.hasPhoto;
  if (Object.keys(payload).length === 0) return { error: null };
  const { error } = await supabase
    .from("posts")
    .update(payload)
    .eq("id", postId)
    .eq("user_id", userId);
  return { error: error ? new Error(error.message) : null };
}

export async function updateMusicPost(
  postId: string,
  userId: string,
  data: { track?: string; artist?: string; mood?: string; tags?: string[]; coverColor?: string }
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const payload: Record<string, unknown> = {};
  if (data.track !== undefined) payload.track = data.track;
  if (data.artist !== undefined) payload.artist = data.artist;
  if (data.mood !== undefined) payload.mood = data.mood;
  if (data.tags !== undefined) payload.tags = data.tags;
  if (data.coverColor !== undefined) payload.cover_color = data.coverColor;
  if (Object.keys(payload).length === 0) return { error: null };
  const { error } = await supabase
    .from("posts")
    .update(payload)
    .eq("id", postId)
    .eq("user_id", userId);
  return { error: error ? new Error(error.message) : null };
}

export async function deletePost(postId: string, userId: string): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const { error } = await supabase.from("posts").delete().eq("id", postId).eq("user_id", userId);
  return { error: error ? new Error(error.message) : null };
}

export async function createPeoplePost(
  userId: string,
  username: string,
  post: { text: string; tags: string[]; hasPhoto?: boolean; photo_urls?: string[] }
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const photoUrls = post.photo_urls ?? [];
  const { error } = await supabase.from("posts").insert({
    user_id: userId,
    type: "people",
    text: post.text,
    tags: post.tags,
    has_photo: photoUrls.length > 0,
    photo_urls: photoUrls,
  });
  return { error: error ? new Error(error.message) : null };
}

/** Загрузка одного фото поста в Storage (путь userId/uuid.ext) */
export async function uploadPostImage(
  userId: string,
  file: File
): Promise<{ url: string | null; error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { url: null, error: new Error("Supabase not configured") };
  const ext = file.name.split(".").pop() || "jpg";
  const name = `${crypto.randomUUID()}.${ext}`;
  const path = `${userId}/${name}`;
  const { error: uploadError } = await supabase.storage.from("post-images").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { url: null, error: new Error(uploadError.message) };
  const { data } = supabase.storage.from("post-images").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export async function createMusicPost(
  userId: string,
  post: { track: string; artist: string; mood: string; tags: string[]; coverColor?: string }
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const { error } = await supabase.from("posts").insert({
    user_id: userId,
    type: "music",
    track: post.track,
    artist: post.artist,
    mood: post.mood,
    tags: post.tags,
    cover_color: post.coverColor,
  });
  return { error: error ? new Error(error.message) : null };
}

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
