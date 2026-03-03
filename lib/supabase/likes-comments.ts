import { createClient } from "./client";
import type { Comment } from "../types";
import { createNotification } from "./notifications";

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

export async function getLikeCount(postId: string): Promise<number> {
  const supabase = createClient();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("post_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);
  return count ?? 0;
}

/** Суммарное число лайков на постах пользователя */
export async function getTotalLikesForUser(profileId: string): Promise<number> {
  const supabase = createClient();
  if (!supabase) return 0;
  const { data: posts } = await supabase.from("posts").select("id").eq("user_id", profileId);
  const postIds = (posts ?? []).map((p: { id: string }) => p.id);
  if (postIds.length === 0) return 0;
  const { count } = await supabase
    .from("post_likes")
    .select("*", { count: "exact", head: true })
    .in("post_id", postIds);
  return count ?? 0;
}

export async function isLikedBy(postId: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;
  const { data } = await supabase
    .from("post_likes")
    .select("user_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export async function toggleLike(postId: string, userId: string): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const { data: existing } = await supabase
    .from("post_likes")
    .select("user_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    return { error: error ? new Error(error.message) : null };
  }
  const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
  if (!error) {
    const { data: postRow } = await supabase.from("posts").select("user_id").eq("id", postId).single();
    const authorId = (postRow as { user_id?: string } | null)?.user_id;
    if (authorId) createNotification({ userId: authorId, type: "like", fromUserId: userId, postId });
  }
  return { error: error ? new Error(error.message) : null };
}

export async function getComments(postId: string, currentUserId?: string): Promise<Comment[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data: rows } = await supabase
    .from("post_comments")
    .select("id, user_id, username, text, created_at, parent_id")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  const comments = (rows ?? []) as { id: string; user_id: string; username: string; text: string; created_at: string; parent_id?: string }[];
  if (!comments.length) return [];
  const commentIds = comments.map((c) => c.id);
  const parentIds = comments.map((c) => c.parent_id).filter(Boolean) as string[];
  const usernames = [...new Set(comments.map((c) => c.username))];
  const [profiles, likeCounts, likedSet, parentRows] = await Promise.all([
    supabase.from("profiles").select("username, avatar_url").in("username", usernames),
    getCommentLikeCounts(commentIds),
    currentUserId ? getCommentLikedByUser(commentIds, currentUserId) : Promise.resolve(new Set<string>()),
    parentIds.length ? supabase.from("post_comments").select("id, username").in("id", parentIds) : Promise.resolve({ data: [] }),
  ]);
  const avatarMap = new Map((profiles.data as { username: string; avatar_url: string | null }[] || []).map((p) => [p.username, p.avatar_url]));
  const parentUserMap = new Map((parentRows.data as { id: string; username: string }[] || []).map((p) => [p.id, p.username]));
  return comments.map((r) => ({
    id: r.id,
    user: r.username,
    user_id: r.user_id,
    text: r.text ?? "",
    time: formatTime(r.created_at),
    parent_id: r.parent_id,
    reply_to_username: r.parent_id ? parentUserMap.get(r.parent_id) : undefined,
    avatar_url: avatarMap.get(r.username) ?? null,
    like_count: likeCounts.get(r.id) ?? 0,
    isLiked: likedSet.has(r.id),
  }));
}

export async function updateComment(
  commentId: string,
  userId: string,
  text: string
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const { error } = await supabase
    .from("post_comments")
    .update({ text: text.trim() })
    .eq("id", commentId)
    .eq("user_id", userId);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteComment(commentId: string, userId: string): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const { error } = await supabase
    .from("post_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", userId);
  return { error: error ? new Error(error.message) : null };
}

async function getCommentLikeCounts(commentIds: string[]): Promise<Map<string, number>> {
  const supabase = createClient();
  const out = new Map<string, number>();
  if (!supabase || commentIds.length === 0) return out;
  const { data } = await supabase.from("comment_likes").select("comment_id").in("comment_id", commentIds);
  for (const row of data ?? []) {
    const cid = (row as { comment_id: string }).comment_id;
    out.set(cid, (out.get(cid) ?? 0) + 1);
  }
  return out;
}

async function getCommentLikedByUser(commentIds: string[], userId: string): Promise<Set<string>> {
  const supabase = createClient();
  const out = new Set<string>();
  if (!supabase || commentIds.length === 0) return out;
  const { data } = await supabase.from("comment_likes").select("comment_id").eq("user_id", userId).in("comment_id", commentIds);
  for (const row of data ?? []) out.add((row as { comment_id: string }).comment_id);
  return out;
}

export async function toggleCommentLike(commentId: string, userId: string): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const { data: existing } = await supabase.from("comment_likes").select("user_id").eq("comment_id", commentId).eq("user_id", userId).maybeSingle();
  if (existing) {
    const { error } = await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", userId);
    return { error: error ? new Error(error.message) : null };
  }
  const { error } = await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: userId });
  return { error: error ? new Error(error.message) : null };
}

export async function addComment(
  postId: string,
  userId: string,
  username: string,
  text: string,
  parentId?: string
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase not configured") };
  const { error } = await supabase.from("post_comments").insert({
    post_id: postId,
    user_id: userId,
    username,
    text: text.trim(),
    parent_id: parentId ?? null,
  });
  if (!error) {
    const { data: postRow } = await supabase.from("posts").select("user_id").eq("id", postId).single();
    const authorId = (postRow as { user_id?: string } | null)?.user_id;
    if (authorId) createNotification({ userId: authorId, type: "comment", fromUserId: userId, postId });
  }
  return { error: error ? new Error(error.message) : null };
}

export async function getCommentCount(postId: string): Promise<number> {
  const supabase = createClient();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("post_comments")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);
  return count ?? 0;
}

export async function getCommentCountsForPosts(postIds: string[]): Promise<Map<string, number>> {
  const supabase = createClient();
  const out = new Map<string, number>();
  if (!supabase || postIds.length === 0) return out;
  const { data } = await supabase.from("post_comments").select("post_id").in("post_id", postIds);
  for (const row of data ?? []) {
    const pid = (row as { post_id: string }).post_id;
    out.set(pid, (out.get(pid) ?? 0) + 1);
  }
  return out;
}

export type Liker = { id: string; username: string; avatar_url: string | null };

export async function getPostLikers(postId: string): Promise<Liker[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data: likes } = await supabase
    .from("post_likes")
    .select("user_id")
    .eq("post_id", postId);
  if (!likes?.length) return [];
  const userIds = [...new Set((likes as { user_id: string }[]).map((l) => l.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);
  return (profiles ?? []) as Liker[];
}

export async function getCommentLikers(commentId: string): Promise<Liker[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data: likes } = await supabase
    .from("comment_likes")
    .select("user_id")
    .eq("comment_id", commentId);
  if (!likes?.length) return [];
  const userIds = [...new Set((likes as { user_id: string }[]).map((l) => l.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);
  return (profiles ?? []) as Liker[];
}

export async function getLikeCountsForPosts(postIds: string[]): Promise<Map<string, number>> {
  const supabase = createClient();
  const out = new Map<string, number>();
  if (!supabase || postIds.length === 0) return out;
  const { data } = await supabase.from("post_likes").select("post_id").in("post_id", postIds);
  for (const row of data ?? []) {
    const pid = (row as { post_id: string }).post_id;
    out.set(pid, (out.get(pid) ?? 0) + 1);
  }
  return out;
}

export async function getLikedByUser(postIds: string[], userId: string): Promise<Set<string>> {
  const supabase = createClient();
  const out = new Set<string>();
  if (!supabase || postIds.length === 0) return out;
  const { data } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);
  for (const row of data ?? []) out.add((row as { post_id: string }).post_id);
  return out;
}
