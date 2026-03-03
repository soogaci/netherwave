import { createClient } from "./client";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  tags: string[];
  avatar_url: string | null;
  chat_wallpaper_url?: string | null;
  followers: number;
  following: number;
  last_seen?: string | null;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data as Profile | null;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();
  return data as Profile | null;
}

export async function searchProfilesByUsername(query: string): Promise<Profile[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, tags, avatar_url, followers, following")
    .ilike("username", `%${q}%`)
    .limit(20);
  return (data ?? []) as Profile[];
}

export async function updateProfile(
  userId: string,
  data: { display_name?: string; bio?: string; tags?: string[]; chat_wallpaper_url?: string | null }
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.display_name !== undefined) payload.display_name = data.display_name;
  if (data.bio !== undefined) payload.bio = data.bio;
  if (data.tags !== undefined) payload.tags = data.tags;
  if (data.chat_wallpaper_url !== undefined) payload.chat_wallpaper_url = data.chat_wallpaper_url;
  const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
  return { error: error ? new Error(error.message) : null };
}

export async function upsertProfile(
  userId: string,
  data: Partial<{ username: string; display_name: string; bio: string; tags: string[]; avatar_url?: string; chat_wallpaper_url?: string | null }>
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const username = data.username ?? "user_" + userId.slice(0, 8);
  const payload: Record<string, unknown> = {
    id: userId,
    username,
    display_name: data.display_name ?? username,
    bio: data.bio ?? "",
    tags: data.tags ?? [],
    updated_at: new Date().toISOString(),
  };
  if (data.avatar_url !== undefined) payload.avatar_url = data.avatar_url;
  if (data.chat_wallpaper_url !== undefined) payload.chat_wallpaper_url = data.chat_wallpaper_url;
  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
  return { error: error ? new Error(error.message) : null };
}

export async function updateUsername(userId: string, newUsername: string): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const u = newUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
  if (u.length < 3) return { error: new Error("Никнейм от 3 символов") };
  const { data: existing } = await supabase.from("profiles").select("id").eq("username", u).single();
  if (existing && existing.id !== userId) return { error: new Error("Этот никнейм занят") };
  const { error } = await supabase
    .from("profiles")
    .update({ username: u, updated_at: new Date().toISOString() })
    .eq("id", userId);
  return { error: error ? new Error(error.message) : null };
}

export async function updateLastSeen(userId: string): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const { error } = await supabase
    .from("profiles")
    .update({ last_seen: new Date().toISOString() })
    .eq("id", userId);
  return { error: error ? new Error(error.message) : null };
}

export async function uploadAvatar(userId: string, file: File): Promise<{ url: string | null; error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { url: null, error: new Error("Supabase not configured") };
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/avatar.${ext}`;
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (uploadError) return { url: null, error: new Error(uploadError.message) };
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export async function uploadChatWallpaper(userId: string, file: File): Promise<{ url: string | null; error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { url: null, error: new Error("Supabase not configured") };
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  if (!/^(jpe?g|png|gif|webp)$/.test(ext)) return { url: null, error: new Error("Только JPG, PNG, GIF или WebP") };
  const path = `${userId}/chat-wallpaper.${ext}`;
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (uploadError) return { url: null, error: new Error(uploadError.message) };
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
