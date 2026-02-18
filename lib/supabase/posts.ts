import { createClient } from "./client";
import type { PeoplePost, MusicPost } from "../types";

export async function getPosts(): Promise<{ people: PeoplePost[]; music: MusicPost[] }> {
  const supabase = createClient();
  if (!supabase) return { people: [], music: [] };
  const { data: posts } = await supabase
    .from("posts")
    .select("id, user_id, type, text, tags, has_photo, track, artist, mood, cover_color, created_at")
    .order("created_at", { ascending: false });
  if (!posts?.length) return { people: [], music: [] };
  const userIds = [...new Set((posts as any[]).map((p) => p.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", userIds);
  const userMap = new Map(
    (profiles as { id: string; username: string }[] || []).map((p) => [p.id, p.username])
  );
  const people: PeoplePost[] = [];
  const music: MusicPost[] = [];
  for (const row of posts as any[]) {
    const user = userMap.get(row.user_id) ?? "user";
    const time = formatTime(row.created_at);
    if (row.type === "people") {
      people.push({
        id: row.id,
        user,
        time,
        text: row.text ?? "",
        tags: row.tags ?? [],
        hasPhoto: row.has_photo ?? false,
      });
    } else {
      music.push({
        id: row.id,
        user,
        time,
        track: row.track ?? "",
        artist: row.artist ?? "",
        mood: row.mood ?? "",
        tags: row.tags ?? [],
        coverColor: row.cover_color,
      });
    }
  }
  return { people, music };
}

export async function createPeoplePost(
  userId: string,
  username: string,
  post: { text: string; tags: string[]; hasPhoto?: boolean }
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const { error } = await supabase.from("posts").insert({
    user_id: userId,
    type: "people",
    text: post.text,
    tags: post.tags,
    has_photo: post.hasPhoto ?? false,
  });
  return { error: error ? new Error(error.message) : null };
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
