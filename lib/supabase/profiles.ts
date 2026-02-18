import { createClient } from "./client";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  tags: string[];
  avatar_url: string | null;
  followers: number;
  following: number;
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

export async function upsertProfile(
  userId: string,
  data: Partial<{ username: string; display_name: string; bio: string; tags: string[] }>
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      ...data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  return { error: error ? new Error(error.message) : null };
}
