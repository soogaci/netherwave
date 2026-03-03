"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft, Heart, Share2, Send, Reply, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Comment } from "@/lib/types";
import { Card } from "@/app/ui/card";
import { Badge } from "@/app/ui/badge";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { useToast } from "@/components/providers/ToastProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useProfile } from "@/components/providers/ProfileProvider";
import { getPostById, updatePeoplePost, deletePost } from "@/lib/supabase/posts";
import { getComments, addComment as addCommentApi, toggleLike as toggleLikeApi, toggleCommentLike, updateComment, deleteComment } from "@/lib/supabase/likes-comments";
import { PhotoViewer } from "@/components/ui/PhotoViewer";

export default function PostPeoplePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";
  const { user } = useAuth();
  const { profile } = useProfile();
  const toast = useToast();

  const [post, setPost] = React.useState<Awaited<ReturnType<typeof getPostById>>>(null);
  const [loading, setLoading] = React.useState(true);
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [text, setText] = React.useState("");
  const [replyTo, setReplyTo] = React.useState<{ username: string; id: string } | null>(null);
  const [postMenuOpen, setPostMenuOpen] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [editText, setEditText] = React.useState("");
  const [editTags, setEditTags] = React.useState("");
  const [editingCommentId, setEditingCommentId] = React.useState<string | null>(null);
  const [editCommentText, setEditCommentText] = React.useState("");
  const [commentMenuId, setCommentMenuId] = React.useState<string | null>(null);
  const [photoViewerOpen, setPhotoViewerOpen] = React.useState(false);
  const [photoViewerIndex, setPhotoViewerIndex] = React.useState(0);
  const [carouselIndex, setCarouselIndex] = React.useState(0);
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const photoOpenMovedRef = React.useRef(false);
  const photoOpenStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const photoUrls = post?.photo_urls ?? [];
  const hasPhotos = photoUrls.length > 0;

  const handleCarouselScroll = React.useCallback(() => {
    const el = carouselRef.current;
    if (!el || photoUrls.length <= 1) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setCarouselIndex(Math.min(index, photoUrls.length - 1));
  }, [photoUrls.length]);

  const isAuthor = post && user && post.user_id === user.id;
  const isCommentAuthor = (c: Comment) => user && c.user_id === user.id;

  React.useEffect(() => {
    getPostById(id, user?.id).then((p) => {
      setPost(p);
      setLoading(false);
    });
  }, [id, user?.id]);

  React.useEffect(() => {
    if (post) getComments(id, user?.id).then(setComments);
  }, [id, post, user?.id]);

  const liked = post?.isLiked ?? false;
  const likeCount = post?.like_count ?? 0;

  async function handleLike() {
    if (!user) return;
    await toggleLikeApi(id, user.id);
    const updated = await getPostById(id, user.id);
    if (updated) setPost(updated);
  }

  function handleShare() {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/post/people/${id}`;
    navigator.clipboard?.writeText(url);
    toast?.("Ссылка скопирована");
  }

  async function sendComment() {
    const t = text.trim();
    if (!t) return;
    if (!user || !profile) {
      toast?.("Войди, чтобы комментировать");
      return;
    }
    const commentText = replyTo ? `@${replyTo.username} ${t}` : t;
    const { error } = await addCommentApi(id, user.id, profile.username, commentText, replyTo?.id);
    if (error) {
      toast?.(error.message);
      return;
    }
    setComments((prev) => [...prev, {
      id: String(Date.now()),
      user: profile.username,
      text: commentText,
      time: "сейчас",
      parent_id: replyTo?.id,
      reply_to_username: replyTo?.username,
    }]);
    setText("");
    setReplyTo(null);
  }

  function startReply(username: string, commentId: string) {
    setReplyTo({ username, id: commentId });
    inputRef.current?.focus();
  }

  async function handleLikeComment(commentId: string) {
    if (!user) return;
    await toggleCommentLike(commentId, user.id);
    const list = await getComments(id, user.id);
    setComments(list);
  }

  React.useEffect(() => {
    if (post) {
      setEditText(post.text);
      setEditTags(post.tags.join(", "));
    }
  }, [post?.id, post?.text, post?.tags]);

  async function handleDeletePost() {
    if (!post || !user || !isAuthor) return;
    if (!confirm("Удалить пост?")) return;
    setPostMenuOpen(false);
    const { error } = await deletePost(post.id, user.id);
    if (error) {
      toast?.(error.message);
      return;
    }
    router.push("/");
  }

  async function handleSavePost() {
    if (!post || !user || !isAuthor) return;
    const tags = editTags.split(",").map((t) => t.trim()).filter(Boolean);
    const { error } = await updatePeoplePost(post.id, user.id, { text: editText.trim(), tags });
    if (error) {
      toast?.(error.message);
      return;
    }
    const updated = await getPostById(id, user.id);
    if (updated) setPost(updated);
    setEditMode(false);
    setPostMenuOpen(false);
  }

  async function handleEditComment(commentId: string, newText: string) {
    if (!user) return;
    const { error } = await updateComment(commentId, user.id, newText);
    if (error) {
      toast?.(error.message);
      return;
    }
    const list = await getComments(id, user.id);
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
    setCommentMenuId(null);
  }

  function startEditComment(c: Comment) {
    setEditingCommentId(c.id);
    setEditCommentText(c.text);
    setCommentMenuId(null);
  }

  async function saveEditComment() {
    if (!editingCommentId || !user) return;
    const { error } = await updateComment(editingCommentId, user.id, editCommentText.trim());
    if (error) {
      toast?.(error.message);
      return;
    }
    const list = await getComments(id, user.id);
    setComments(list);
    setEditingCommentId(null);
    setEditCommentText("");
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground">Загрузка...</div>
    );
  }

  if (!post) {
    return (
      <div>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← На главную</Link>
        <div className="mt-8 text-center text-muted-foreground">Пост не найден</div>
      </div>
    );
  }

  return (
    <div className="pb-32">
      <header className="mb-4 flex items-center gap-2">
        <Link
          href="/"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border text-muted-foreground hover:text-foreground transition"
          aria-label="Назад"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="text-base font-semibold">Пост</div>
      </header>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={hasPhotos ? "overflow-hidden" : ""}>
        <Card className={`rounded-3xl border-0 bg-card gap-0 shadow-none ${hasPhotos ? "p-0 overflow-hidden" : "p-5"}`}>
          {hasPhotos && (
            <>
              <div className="-mx-4 w-[calc(100%+2rem)]">
                <div
                  ref={carouselRef}
                  onScroll={handleCarouselScroll}
                  className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide overscroll-x-contain touch-pan-x-y"
                  style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
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
                        <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" draggable={false} />
                      </div>
                    </div>
                  ))}
                </div>
                {photoUrls.length > 1 && (
                  <div className="flex justify-center gap-1.5 py-2">
                    {photoUrls.map((_, i) => (
                      <span
                        key={i}
                        className={`inline-block h-1.5 rounded-full transition-all ${i === carouselIndex ? "w-4 bg-foreground/80" : "w-1.5 bg-foreground/30"}`}
                        aria-hidden
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="px-5 pb-5 pt-3">
                <div className="flex items-start gap-3">
                  <Link href={`/profile/${post.user}`}>
                    <AvatarInitials username={post.user} avatarUrl={post.avatar_url} size="md" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/profile/${post.user}`} className="truncate text-sm font-semibold hover:underline">
                        @{post.user}
                      </Link>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-muted-foreground">{post.time}</span>
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
                          <button type="button" onClick={handleSavePost} className="rounded-xl bg-foreground px-3 py-1.5 text-sm text-background">
                            Сохранить
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditMode(false); setEditText(post.text); setEditTags(post.tags.join(", ")); }}
                            className="rounded-xl border px-3 py-1.5 text-sm"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {post.text ? <div className="mt-2 text-sm leading-relaxed">{post.text}</div> : null}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {post.tags.map((t) => (
                            <Link key={t} href={`/?tag=${encodeURIComponent(t)}`}>
                              <Badge variant="secondary" className="rounded-full cursor-pointer hover:bg-muted/80 transition">{t}</Badge>
                            </Link>
                          ))}
                        </div>
                      </>
                    )}
                    <div className="mt-4 flex items-center gap-4">
                      <button
                        type="button"
                        onClick={handleLike}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
                      >
                        <motion.span animate={liked ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }} className="inline-flex">
                          <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
                        </motion.span>
                        <span>{likeCount}</span>
                      </button>
                      <button type="button" onClick={handleShare} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          {!hasPhotos && (
            <div className="flex items-start gap-3">
              <Link href={`/profile/${post.user}`}>
                <AvatarInitials username={post.user} avatarUrl={post.avatar_url} size="md" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/profile/${post.user}`} className="truncate text-sm font-semibold hover:underline">
                    @{post.user}
                  </Link>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground">{post.time}</span>
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
                      <button type="button" onClick={handleSavePost} className="rounded-xl bg-foreground px-3 py-1.5 text-sm text-background">
                        Сохранить
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditMode(false); setEditText(post.text); setEditTags(post.tags.join(", ")); }}
                        className="rounded-xl border px-3 py-1.5 text-sm"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mt-3 text-sm leading-relaxed">{post.text}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.map((t) => (
                        <Link key={t} href={`/?tag=${encodeURIComponent(t)}`}>
                          <Badge variant="secondary" className="rounded-full cursor-pointer hover:bg-muted/80 transition">{t}</Badge>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
                <div className="mt-4 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleLike}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
                  >
                    <motion.span animate={liked ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }} className="inline-flex">
                      <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
                    </motion.span>
                    <span>{likeCount}</span>
                  </button>
                  <button type="button" onClick={handleShare} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      <PhotoViewer
        open={photoViewerOpen}
        onClose={() => setPhotoViewerOpen(false)}
        sources={photoUrls.map((url) => ({ url, name: "photo.jpg" }))}
        initialIndex={photoViewerIndex}
      />

      {/* Comments */}
      <div className="mt-5">
        <div className="text-sm font-medium text-muted-foreground mb-3 px-1">
          Комментарии ({comments.length})
        </div>
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {comments.map((c, i) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, x: -16, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 16, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 340, damping: 25, delay: i * 0.03 }}
              >
                <Card className={`rounded-2xl border-0 bg-card px-4 py-3 gap-0 shadow-none ${c.parent_id ? "ml-6 border-l-2 border-border/30" : ""}`}>
                  <div className="flex items-start gap-2.5">
                    <Link href={`/profile/${c.user}`} className="shrink-0">
                      <AvatarInitials username={c.user} avatarUrl={c.avatar_url} size="sm" className="!h-8 !w-8 !text-[10px] !rounded-lg mt-0.5" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <Link href={`/profile/${c.user}`} className="text-xs font-semibold hover:underline">@{c.user}</Link>
                        {c.reply_to_username && <span className="text-[10px] text-muted-foreground">→ @{c.reply_to_username}</span>}
                        <span className="text-[10px] text-muted-foreground">{c.time}</span>
                        {isCommentAuthor(c) && (
                          <div className="relative ml-auto">
                            <button
                              type="button"
                              onClick={() => setCommentMenuId(commentMenuId === c.id ? null : c.id)}
                              className="p-0.5 rounded text-muted-foreground hover:text-foreground"
                              aria-label="Ещё"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                            {commentMenuId === c.id && (
                              <>
                                <div className="fixed inset-0 z-10" aria-hidden onClick={() => setCommentMenuId(null)} />
                                <div className="absolute right-0 top-6 z-20 rounded-lg border bg-card py-1 shadow-lg">
                                  <button
                                    type="button"
                                    onClick={() => startEditComment(c)}
                                    className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-xs hover:bg-muted"
                                  >
                                    <Pencil className="h-3 w-3" /> Изменить
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(c.id)}
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
                      {editingCommentId === c.id ? (
                        <div className="mt-1 space-y-1">
                          <textarea
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border bg-background/60 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                          />
                          <div className="flex gap-1">
                            <button type="button" onClick={saveEditComment} disabled={!editCommentText.trim()} className="rounded-lg bg-foreground px-2 py-1 text-[10px] text-background disabled:opacity-50">
                              Сохранить
                            </button>
                            <button type="button" onClick={() => { setEditingCommentId(null); setEditCommentText(""); }} className="rounded-lg border px-2 py-1 text-[10px]">
                              Отмена
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-foreground/90 leading-snug mt-0.5">{c.text}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <button type="button" onClick={() => startReply(c.user, c.id)} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition">
                              <Reply className="h-3 w-3" /> Ответить
                            </button>
                            {user && (
                              <button type="button" onClick={() => handleLikeComment(c.id)} className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground transition">
                                <Heart className={`h-3 w-3 ${c.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                                {c.like_count ? <span>{c.like_count}</span> : null}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {comments.length === 0 && (
            <div className="text-xs text-muted-foreground py-4 text-center">Будь первым — оставь комментарий</div>
          )}
        </div>
      </div>

      {/* Comment input */}
      <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md px-4 pb-4 z-50">
        <div className="rounded-2xl border bg-background/80 backdrop-blur-md overflow-hidden">
          <AnimatePresence>
            {replyTo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-between px-3 pt-2 text-xs text-muted-foreground">
                  <span>Ответ для @{replyTo.username}</span>
                  <button type="button" onClick={() => setReplyTo(null)} className="hover:text-foreground"><span className="text-xs">✕</span></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-2 p-2">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendComment(); }}
              placeholder="Написать комментарий..."
              className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <motion.button
              type="button"
              onClick={sendComment}
              whileTap={{ scale: 0.88 }}
              disabled={!text.trim()}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-foreground text-background transition disabled:opacity-30"
              aria-label="Отправить"
            >
              <Send className="h-3.5 w-3.5" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
