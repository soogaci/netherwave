"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import type { PeoplePost, Comment } from "@/lib/types";
import { Card } from "@/app/ui/card";
import { Badge } from "@/app/ui/badge";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { useToast } from "@/components/providers/ToastProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useProfile } from "@/components/providers/ProfileProvider";
import { getComments, addComment as addCommentApi, toggleCommentLike, updateComment, deleteComment } from "@/lib/supabase/likes-comments";
import { deletePost, updatePeoplePost } from "@/lib/supabase/posts";
import { useFeed } from "@/components/providers/FeedProvider";
import { hapticLight } from "@/lib/haptic";
import { CommentSection } from "./CommentSection";
import { PhotoViewer } from "@/components/ui/PhotoViewer";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

type PeopleCardProps = {
  item: PeoplePost;
  onLike?: (id: string) => void;
  likes?: number;
  comments?: Comment[];
  index?: number;
};

export function PeopleCard({
  item,
  onLike,
  likes = 0,
  comments: initialComments,
  index = 0,
}: PeopleCardProps) {
  const router = useRouter();
  const liked = item.isLiked ?? false;
  const likeCount = item.like_count ?? likes;
  const [showComments, setShowComments] = React.useState(false);
  const [comments, setComments] = React.useState<Comment[]>(initialComments ?? []);
  const [replyTo, setReplyTo] = React.useState<{ id: string; username: string } | null>(null);
  const toast = useToast();
  const commentsLoaded = React.useRef(false);
  const { user } = useAuth();
  const { profile } = useProfile();
  const { refresh } = useFeed();
  const [postMenuOpen, setPostMenuOpen] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [editText, setEditText] = React.useState(item.text);
  const [editTags, setEditTags] = React.useState(item.tags.join(", "));
  const [photoViewerOpen, setPhotoViewerOpen] = React.useState(false);
  const [photoViewerIndex, setPhotoViewerIndex] = React.useState(0);
  const photoOpenMovedRef = React.useRef(false);
  const photoOpenStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const isAuthor = user && item.user_id === user.id;
  const photoUrls = item.photo_urls ?? [];
  const hasPhotos = photoUrls.length > 0;

  React.useEffect(() => {
    if (showComments && !commentsLoaded.current) {
      commentsLoaded.current = true;
      getComments(item.id, user?.id).then(setComments);
    }
  }, [showComments, item.id, user?.id]);

  React.useEffect(() => {
    setEditText(item.text);
    setEditTags(item.tags.join(", "));
  }, [item.text, item.tags]);

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
    const { error } = await updatePeoplePost(item.id, user.id, { text: editText.trim(), tags });
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

  function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    hapticLight();
    onLike?.(item.id);
  }

  function handleComments(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowComments((v) => !v);
  }

  function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/post/people/${item.id}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast?.("Ссылка скопирована");
    }
  }

  function goToPost(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest("[data-card-actions]")) return;
    if (target.closest("a[href^='/profile/']")) return;
    router.push(`/post/people/${item.id}`);
  }

  const [carouselIndex, setCarouselIndex] = React.useState(0);
  const carouselRef = React.useRef<HTMLDivElement>(null);

  const handleCarouselScroll = React.useCallback(() => {
    const el = carouselRef.current;
    if (!el || photoUrls.length <= 1) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setCarouselIndex(Math.min(index, photoUrls.length - 1));
  }, [photoUrls.length]);

  const renderActionsAndComments = () => (
    <>
      <div
        className="mt-4 flex items-center gap-4"
        data-card-actions
      >
        <button
          type="button"
          onClick={handleLike}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg px-1"
          aria-label={liked ? "Убрать лайк" : "Лайк"}
        >
          <motion.span
            animate={liked ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3 }}
            className="inline-flex"
          >
            <Heart
              className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : ""}`}
            />
          </motion.span>
          <span>{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={handleComments}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg px-1"
          aria-label="Комментарии"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{showComments ? comments.length : (item.comment_count ?? comments.length)}</span>
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg px-1"
          aria-label="Поделиться"
        >
          <Share2 className="h-4 w-4" />
        </button>
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
    </>
  );

  if (hasPhotos) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.06 }}
        className="overflow-hidden"
      >
        <div className="rounded-3xl border-0 bg-card overflow-x-clip overflow-y-hidden transition-shadow">
          {/* Над фото: ник и аватарка, привязаны к посту (без блока) */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
            <Link
              href={`/profile/${item.user}`}
              className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={`Профиль ${item.user}`}
              onClick={(e) => e.stopPropagation()}
            >
              <AvatarInitials username={item.user} avatarUrl={item.avatar_url} size="sm" className="!h-8 !w-8" />
            </Link>
            <Link
              href={`/profile/${item.user}`}
              className="min-w-0 truncate text-sm font-semibold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              @{item.user}
            </Link>
            <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
            {isAuthor && (
              <div className="relative ml-auto shrink-0" data-card-actions>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setPostMenuOpen((v) => !v); }}
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
                        onClick={(e) => { e.stopPropagation(); setEditMode(true); setPostMenuOpen(false); }}
                        className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-xs hover:bg-muted"
                      >
                        <Pencil className="h-3 w-3" /> Изменить
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeletePost(); }}
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

          {/* Карусель фото — как в полном посте: горизонтальный скролл, вертикальный уходит в ленту */}
          <div className="-mx-4 w-[calc(100%+2rem)] sm:-mx-4 sm:w-[calc(100%+2rem)]">
            <div
              ref={carouselRef}
              onScroll={handleCarouselScroll}
              className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide overscroll-x-contain touch-pan-x-y"
              style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
              data-card-actions
            >
              {photoUrls.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  role="button"
                  tabIndex={0}
                  className="shrink-0 w-full basis-full snap-start snap-always focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset cursor-pointer"
                  style={{ scrollSnapAlign: "start" }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    photoOpenMovedRef.current = false;
                    photoOpenStartRef.current = { x: e.clientX, y: e.clientY };
                  }}
                  onPointerMove={(e) => {
                    const start = photoOpenStartRef.current;
                    if (!start) return;
                    const dx = e.clientX - start.x;
                    const dy = e.clientY - start.y;
                    if (dx * dx + dy * dy > 144) photoOpenMovedRef.current = true;
                  }}
                  onPointerUp={() => { photoOpenStartRef.current = null; }}
                  onPointerCancel={() => { photoOpenStartRef.current = null; }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (photoOpenMovedRef.current) return;
                    setPhotoViewerIndex(i);
                    setPhotoViewerOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setPhotoViewerIndex(i);
                      setPhotoViewerOpen(true);
                    }
                  }}
                >
                  <div className="aspect-square w-full bg-muted pointer-events-none select-none">
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                      draggable={false}
                    />
                  </div>
                </div>
              ))}
            </div>
            {photoUrls.length > 1 && (
              <div className="flex justify-center gap-1.5 py-2">
                {photoUrls.map((_, i) => (
                  <span
                    key={i}
                    className={`inline-block h-1.5 rounded-full transition-all ${
                      i === carouselIndex ? "w-4 bg-foreground/80" : "w-1.5 bg-foreground/30"
                    }`}
                    aria-hidden
                  />
                ))}
              </div>
            )}
          </div>

          {/* Под фото: описание (троеточие если длинное), теги, лайки — клик ведёт в пост */}
          <div
            className="px-4 pb-5 pt-3 cursor-pointer transition-shadow hover:shadow-md active:scale-[0.99] rounded-b-3xl"
            onClick={goToPost}
          >
            {editMode ? (
              <div className="space-y-2" data-card-actions onClick={(e) => e.stopPropagation()}>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                  placeholder="Текст поста"
                />
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full rounded-xl border bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                  placeholder="Теги через запятую"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSavePost}
                    className="rounded-xl bg-foreground px-3 py-1.5 text-sm text-background"
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditMode(false); setEditText(item.text); setEditTags(item.tags.join(", ")); }}
                    className="rounded-xl border px-3 py-1.5 text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <>
                {item.text ? (
                  <p className="text-sm leading-relaxed line-clamp-3 text-foreground/95">{item.text}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.tags.map((t) => (
                    <Link
                      key={t}
                      href={`/?tag=${encodeURIComponent(t)}`}
                      onClick={(e) => e.stopPropagation()}
                    >
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

            {renderActionsAndComments()}
          </div>
        </div>

        <PhotoViewer
          open={photoViewerOpen}
          onClose={() => setPhotoViewerOpen(false)}
          sources={photoUrls.map((url) => ({ url, name: "photo.jpg" }))}
          initialIndex={photoViewerIndex}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
    >
      <Card
        className="rounded-3xl border-0 bg-card p-5 overflow-hidden cursor-pointer transition-shadow hover:shadow-md active:scale-[0.99]"
        onClick={goToPost}
      >
        <div className="flex items-start gap-3">
          <Link
            href={`/profile/${item.user}`}
            className="shrink-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`Профиль ${item.user}`}
            onClick={(e) => e.stopPropagation()}
          >
            <AvatarInitials username={item.user} avatarUrl={item.avatar_url} size="md" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/profile/${item.user}`}
                className="min-w-0 truncate block text-sm font-semibold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded"
                onClick={(e) => e.stopPropagation()}
              >
                @{item.user}
              </Link>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs text-muted-foreground">{item.time}</span>
                {isAuthor && (
                  <div className="relative" data-card-actions>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPostMenuOpen((v) => !v); }}
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
                            onClick={(e) => { e.stopPropagation(); setEditMode(true); setPostMenuOpen(false); }}
                            className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-xs hover:bg-muted"
                          >
                            <Pencil className="h-3 w-3" /> Изменить
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeletePost(); }}
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
              <div className="mt-3 space-y-2" data-card-actions onClick={(e) => e.stopPropagation()}>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                  placeholder="Текст поста"
                />
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full rounded-xl border bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                  placeholder="Теги через запятую"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSavePost}
                    className="rounded-xl bg-foreground px-3 py-1.5 text-sm text-background"
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditMode(false); setEditText(item.text); setEditTags(item.tags.join(", ")); }}
                    className="rounded-xl border px-3 py-1.5 text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-3 text-sm leading-relaxed">{item.text}</div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {item.tags.map((t) => (
                    <Link
                      key={t}
                      href={`/?tag=${encodeURIComponent(t)}`}
                      onClick={(e) => e.stopPropagation()}
                    >
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

            {renderActionsAndComments()}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
