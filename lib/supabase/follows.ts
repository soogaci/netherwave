import { createClient } from "./client";
import { createNotification } from "./notifications";

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return !!data;
}

export async function getFollowerCount(userId: string): Promise<number> {
  const supabase = createClient();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", userId);
  return count ?? 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
  const supabase = createClient();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId);
  return count ?? 0;
}

export type FollowerRow = { id: string; username: string; display_name: string; avatar_url: string | null };

export async function getFollowersList(userId: string): Promise<FollowerRow[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("following_id", userId);
  const ids = (data ?? []).map((r: any) => r.follower_id).filter(Boolean);
  if (ids.length === 0) return [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", ids);
  return (profiles ?? []) as FollowerRow[];
}

export async function getFollowingList(userId: string): Promise<FollowerRow[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);
  const ids = (data ?? []).map((r: any) => r.following_id).filter(Boolean);
  if (ids.length === 0) return [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", ids);
  return (profiles ?? []) as FollowerRow[];
}

export async function follow(followerId: string, followingId: string): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  if (followerId === followingId) return { error: new Error("Нельзя подписаться на себя") };
  const { data: existing } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  if (existing) return { error: null };
  const { error } = await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
  if (error) return { error: new Error(error.message) };
  createNotification({ userId: followingId, type: "follow", fromUserId: followerId });
  const { data: p1 } = await supabase.from("profiles").select("followers").eq("id", followingId).single();
  const { data: p2 } = await supabase.from("profiles").select("following").eq("id", followerId).single();
  await supabase.from("profiles").update({ followers: ((p1 as any)?.followers ?? 0) + 1, updated_at: new Date().toISOString() }).eq("id", followingId);
  await supabase.from("profiles").update({ following: ((p2 as any)?.following ?? 0) + 1, updated_at: new Date().toISOString() }).eq("id", followerId);
  return { error: null };
}

export async function unfollow(followerId: string, followingId: string): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const { error } = await supabase.from("follows").delete().eq("follower_id", followerId).eq("following_id", followingId);
  if (error) return { error: new Error(error.message) };
  const { data: p1 } = await supabase.from("profiles").select("followers").eq("id", followingId).single();
  const { data: p2 } = await supabase.from("profiles").select("following").eq("id", followerId).single();
  const f1 = Math.max(0, ((p1 as any)?.followers ?? 1) - 1);
  const f2 = Math.max(0, ((p2 as any)?.following ?? 1) - 1);
  await supabase.from("profiles").update({ followers: f1, updated_at: new Date().toISOString() }).eq("id", followingId);
  await supabase.from("profiles").update({ following: f2, updated_at: new Date().toISOString() }).eq("id", followerId);
  return { error: null };
}
