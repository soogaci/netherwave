"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Music } from "lucide-react";
import type { MusicPost, Comment } from "@/lib/types";
import { Card } from "@/app/ui/card";
import { Badge } from "@/app/ui/badge";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { useToast } from "@/components/providers/ToastProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useProfile } from "@/components/providers/ProfileProvider";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { getComments, addComment as addCommentApi, toggleCommentLike, updateComment, deleteComment } from "@/lib/supabase/likes-comments";
import { deletePost, updateMusicPost } from "@/lib/supabase/posts";
import { useFeed } from "@/components/providers/FeedProvider";
import { hapticLight } from "@/lib/haptic";
import { CommentSection } from "./CommentSection";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

type MusicCardProps = {
  item: MusicPost;
  onLike?: (id: string) => void;
  likes?: number;
  comments?: Comment[];
  showListenLink?: boolean;
};

export function MusicCard({
  item,
  onLike,
  likes = 0,
  comments: initialComments,
  showListenLink = true,
}: MusicCardProps) {
  const liked = item.isLiked ?? false;
  const likeCount = item.like_count ?? likes;
  const [showComments, setShowComments] = React.useState(false);
  const [comments, setComments] = React.useState<Comment[]>(initialComments ?? []);
  const [replyTo, setReplyTo] = React.useState<{ id: string; username: string } | null>(null);
  const commentsLoadedRef = React.useRef(false);
  const toast = useToast();
  const player = usePlayer();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { refresh } = useFeed();
  const coverColor = item.coverColor ?? "oklch(0.35 0.05 260)";
  const [postMenuOpen, setPostMenuOpen] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [editTrack, setEditTrack] = React.useState(item.track);
  const [editArtist, setEditArtist] = React.useState(item.artist);
  const [editMood, setEditMood] = React.useState(item.mood);
  const [editTags, setEditTags] = React.useState(item.tags.join(", "));
  const isAuthor = user && item.user_id === user.id;

  React.useEffect(() => {
    if (showComments && !commentsLoadedRef.current) {
      commentsLoadedRef.current = true;
      getComments(item.id, user?.id).then(setComments);
    }
  }, [showComments, item.id, user?.id]);

  React.useEffect(() => {
    setEditTrack(item.track);
    setEditArtist(item.artist);
    setEditMood(item.mood);
    setEditTags(item.tags.join(", "));
  }, [item.track, item.artist, item.mood, item.tags]);

  async function handleDeletePost() {
    if (!user || !isAuthor) return;
    if (!confirm("Удалить пост?")) return;
    setPostMenuOpen(false);
    const { error } = await deletePost(item.id, user.id);
    if (error) {
      toast?.(error.message);
      return;
    }
    refresh();
  }

  async function handleSavePost() {
    if (!user || !isAuthor) return;
    const tags = editTags.split(",").map((t) => t.trim()).filter(Boolean);
    const { error } = await updateMusicPost(item.id, user.id, {
      track: editTrack.trim(),
      artist: editArtist.trim(),
      mood: editMood.trim(),
      tags,
    });
    if (error) {
      toast?.(error.message);
      return;
    }
    setEditMode(false);
    setPostMenuOpen(false);
    refresh();
  }

  async function handleEditComment(commentId: string, newText: string) {
    if (!user) return;
    const { error } = await updateComment(commentId, user.id, newText);
    if (error) {
      toast?.(error.message);
      return;
    }
    const list = await getComments(item.id, user.id);
    setComments(list);
  }

  async function handleDeleteComment(commentId: string) {
    if (!user) return;
    if (!confirm("Удалить комментарий?")) return;
    const { error } = await deleteComment(commentId, user.id);
    if (error) {
      toast?.(error.message);
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  function handlePlayTrack(e: React.MouseEvent) {
    e.preventDefault();
    player?.playTrack({ track: item.track, artist: item.artist, color: coverColor });
  }

  async function addComment(text: string) {
    if (!user || !profile) {
      toast?.("Войди, чтобы комментировать");
      return;
    }
    const { error } = await addCommentApi(item.id, user.id, profile.username, text.trim(), replyTo?.id);
    if (error) {
      toast?.(error.message);
      return;
    }
    const newComment: Comment = {
      id: String(Date.now()),
      user: profile.username,
      text: text.trim(),
      time: "сейчас",
      parent_id: replyTo?.id,
      reply_to_username: replyTo?.username,
    };
    setComments((prev) => [...prev, newComment]);
    setReplyTo(null);
  }

  async function handleLikeComment(commentId: string) {
    if (!user) return;
    await toggleCommentLike(commentId, user.id);
    const list = await getComments(item.id, user.id);
    setComments(list);
  }

  function handleLike() {
    hapticLight();
    onLike?.(item.id);
  }

  function handleShare() {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/post/music/${item.id}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast?.("Ссылка скопирована");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="rounded-3xl border-0 bg-card p-5 overflow-hidden">
        <div className="flex items-start gap-3">
          <Link href={`/profile/${item.user}`} className="shrink-0" aria-label={`Профиль ${item.user}`}>
            <AvatarInitials username={item.user} avatarUrl={item.avatar_url} size="md" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/profile/${item.user}`}
                className="min-w-0 truncate block text-sm font-semibold hover:underline"
              >
                @{item.user}
              </Link>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs text-muted-foreground">{item.time}</span>
                {isAuthor && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setPostMenuOpen((v) => !v)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground"
                      aria-label="Ещё"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {postMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" aria-hidden onClick={() => setPostMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-1 z-20 rounded-lg border bg-card py-1 shadow-lg min-w-[120px]">
                          <button
                            type="button"
                            onClick={() => { setEditMode(true); setPostMenuOpen(false); }}
                            className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-xs hover:bg-muted"
                          >
                            <Pencil className="h-3 w-3" /> Изменить
                          </button>
                          <button
                            type="button"
                            onClick={handleDeletePost}
                            className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-xs text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3" /> Удалить
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {editMode ? (
              <div className="mt-3 space-y-2">
                <input
                  type="text"
                  value={editTrack}
                  onChange={(e) => setEditTrack(e.target.value)}
                  className="w-full rounded-xl border bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                  placeholder="Трек"
                />
                <input
                  type="text"
                  value={editArtist}
                  onChange={(e) => setEditArtist(e.target.value)}
                  className="w-full rounded-xl border bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                  placeholder="Исполнитель"
                />
                <input
                  type="text"
                  value={editMood}
                  onChange={(e) => setEditMood(e.target.value)}
                  className="w-full rounded-xl border bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                  placeholder="Настроение"
                />
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full rounded-xl border bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                  placeholder="Теги через запятую"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={handleSavePost} className="rounded-xl bg-foreground px-3 py-1.5 text-sm text-background">
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditMode(false); setEditTrack(item.track); setEditArtist(item.artist); setEditMood(item.mood); setEditTags(item.tags.join(", ")); }}
                    className="rounded-xl border px-3 py-1.5 text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handlePlayTrack}
                  className="mt-3 flex gap-3 w-full text-left hover:opacity-90 transition rounded-xl -mx-1 px-1"
                >
                  <div
                    className="h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: coverColor }}
                    aria-hidden
                  >
                    <Music className="h-7 w-7 text-white/80" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-semibold">{item.track}</div>
                    <div className="text-sm text-muted-foreground">{item.artist}</div>
                  </div>
                </button>

                <div className="mt-3 text-sm">{item.mood}</div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {item.tags.map((t) => (
                    <Link key={t} href={`/feed?tag=${encodeURIComponent(t)}`}>
                      <Badge
                        variant="secondary"
                        className="rounded-full cursor-pointer hover:bg-muted/80 transition"
                      >
                        {t}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </>
            )}

            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={handleLike}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
                aria-label={liked ? "Убрать лайк" : "Лайк"}
              >
                <Heart
                  className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : ""}`}
                />
                <span>{likeCount}</span>
              </button>
              <button
                onClick={() => setShowComments((v) => !v)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
                aria-label="Комментарии"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{showComments ? comments.length : (item.comment_count ?? comments.length)}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
                aria-label="Поделиться"
              >
                <Share2 className="h-4 w-4" />
              </button>
              {showListenLink && (
                <a
                  href={`https://open.spotify.com/search/${encodeURIComponent(item.track + " " + item.artist)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                >
                  Слушать
                </a>
              )}
            </div>

            <CommentSection
              open={showComments}
              comments={comments}
              onAdd={addComment}
              onReply={(id, username) => setReplyTo({ id, username })}
              onLikeComment={user ? handleLikeComment : undefined}
              onEditComment={user ? handleEditComment : undefined}
              onDeleteComment={user ? handleDeleteComment : undefined}
              currentUserId={user?.id}
              replyToUsername={replyTo?.username ?? null}
              onClearReply={() => setReplyTo(null)}
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
