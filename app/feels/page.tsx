"use client";

// Build 2026-02-24 Repost feature implemented
import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Send, Play, Pause, Share2, Repeat2, Forward } from "lucide-react";
import { useFeed } from "@/components/providers/FeedProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useProfile } from "@/components/providers/ProfileProvider";
import { useRegisterRefresh } from "@/components/providers/RefreshProvider";
import { getComments, addComment as addCommentApi } from "@/lib/supabase/likes-comments";
import { getUsersToSendFeel, sendFeelToChat, toggleFeelRepost, getMyReposts } from "@/lib/supabase/feels";
import { CommentSection } from "@/components/feed/CommentSection";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import type { Feel } from "@/lib/types";
import type { Comment } from "@/lib/types";
import type { FollowerRow } from "@/lib/supabase/follows";

export default function FeelsPage() {
  const { feelsFeed, loading, refresh, refreshFeels, toggleLike } = useFeed();
  const { user } = useAuth();
  const { profile } = useProfile();
  useRegisterRefresh(refresh);
  const [commentPostId, setCommentPostId] = React.useState<string | null>(null);
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [replyTo, setReplyTo] = React.useState<{ id: string; username: string } | null>(null);
  const [sendFeelToUsersId, setSendFeelToUsersId] = React.useState<string | null>(null);
  const [sendUsers, setSendUsers] = React.useState<FollowerRow[]>([]);
  const [sendSelected, setSendSelected] = React.useState<Set<string>>(new Set());
  const [sendSending, setSendSending] = React.useState(false);
  const [myReposts, setMyReposts] = React.useState<Set<string>>(new Set());
  const [repostingId, setRepostingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!commentPostId || !user) {
      setComments([]);
      return;
    }
    getComments(commentPostId, user.id).then(setComments);
  }, [commentPostId, user?.id]);

  React.useEffect(() => {
    if (!sendFeelToUsersId || !user) {
      setSendUsers([]);
      setSendSelected(new Set());
      return;
    }
    getUsersToSendFeel(user.id).then(setSendUsers);
  }, [sendFeelToUsersId, user?.id]);

  React.useEffect(() => {
    if (!user) {
      setMyReposts(new Set());
      return;
    }
    getMyReposts(user.id).then((list) => {
      setMyReposts(new Set(list.map((f) => f.id)));
    });
  }, [user?.id]);

  const handleAddComment = React.useCallback(
    async (text: string) => {
      if (!commentPostId || !user || !profile) return;
      await addCommentApi(commentPostId, user.id, profile.username, text.trim(), replyTo?.id);
      const list = await getComments(commentPostId, user.id);
      setComments(list);
      setReplyTo(null);
      refresh();
    },
    [commentPostId, user?.id, profile?.username, replyTo?.id, refresh]
  );

  const toggleRepostFeel = (id: string) => {
    setSendSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSendSubmit = async () => {
    if (!sendFeelToUsersId || !user || sendSelected.size === 0) return;
    const feel = feelsFeed.find((f) => f.id === sendFeelToUsersId);
    if (!feel) return;
    setSendSending(true);
    const { error } = await sendFeelToChat(
      { video_url: feel.video_url, description: feel.description },
      user.id,
      [...sendSelected]
    );
    setSendSending(false);
    if (!error) {
      setSendFeelToUsersId(null);
      setSendSelected(new Set());
    }
  };

  const handleRepostClick = async (feelId: string) => {
    if (!user) return;
    setRepostingId(feelId);
    const isReposting = !myReposts.has(feelId);
    const { error } = await toggleFeelRepost(feelId, user.id, isReposting);
    if (!error) {
      setMyReposts((prev) => {
        const next = new Set(prev);
        if (isReposting) {
          next.add(feelId);
        } else {
          next.delete(feelId);
        }
        return next;
      });
      // Reload reposts to persist state
      getMyReposts(user.id).then((list) => {
        setMyReposts(new Set(list.map((f) => f.id)));
      });
    }
    setRepostingId(null);
  };

  if (loading && feelsFeed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
        Загрузка...
      </div>
    );
  }

  if (feelsFeed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground px-4 text-center">
        <p className="text-foreground font-medium">Пока нет Feels</p>
        <p className="text-sm mt-2">Добавь короткое видео в разделе «Добавить» → Feels.</p>
        <Link href="/add" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 transition">
          Добавить Feels
        </Link>
      </div>
    );
  }

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = React.useState<string | null>(() => feelsFeed[0]?.id ?? null);
  const [slideHeight, setSlideHeight] = React.useState("calc(100dvh - 7rem)");
  const [isDesktop, setIsDesktop] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => {
      setSlideHeight(mq.matches ? "calc(100vh - 4rem)" : "calc(100dvh - 7rem)");
      setIsDesktop(mq.matches);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const handleVisibility = React.useCallback((id: string, visible: boolean) => {
    setActiveId((prev) => (visible ? id : prev === id ? null : prev));
  }, []);

  const commentsPanelContent = (
    <>
      <div className="shrink-0 px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="font-semibold">Комментарии</span>
        <button
          type="button"
          onClick={() => setCommentPostId(null)}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground"
          aria-label="Закрыть"
        >
          ×
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        <CommentSection
          open={true}
          comments={comments}
          onAdd={handleAddComment}
          onReply={(id, username) => setReplyTo({ id, username })}
          currentUserId={user?.id}
          replyToUsername={replyTo?.username ?? null}
          onClearReply={() => setReplyTo(null)}
        />
      </div>
    </>
  );

  return (
    <div className="flex flex-col min-h-0 flex-1 -mx-4 md:mx-0 bg-black md:flex-row">
      {/* ПК: панель комментариев слева на всю высоту, выезжает и сдвигает видео */}
      {isDesktop && (
        <AnimatePresence>
          {commentPostId ? (
            <motion.div
              key="comments-panel"
              initial={{ width: 0 }}
              animate={{ width: 320 }}
              exit={{ width: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="flex flex-col shrink-0 overflow-hidden bg-background border-r border-border h-full"
              style={{ minHeight: slideHeight }}
            >
              {commentsPanelContent}
            </motion.div>
          ) : null}
        </AnimatePresence>
      )}

      {/* Блок с видео. На мобилке — фиксированная высота и snap по одному рилсу; на ПК — flex-1 для сдвига при комментариях */}
      <div
        ref={scrollContainerRef}
        className="overflow-y-auto overflow-x-hidden snap-y snap-mandatory overscroll-contain touch-manipulation w-full max-w-lg md:mx-auto bg-black md:flex-1 md:min-w-0 transition-[margin] duration-300 shrink-0 md:shrink"
        style={{ height: slideHeight, scrollSnapType: "y mandatory" }}
      >
        {feelsFeed.map((feel) => (
          <FeelSlide
            key={feel.id}
            feel={feel}
            slideHeight={slideHeight}
            scrollContainerRef={scrollContainerRef}
            isActive={activeId === feel.id}
            onVisibilityChange={handleVisibility}
            onLike={() => toggleLike(feel.id)}
            onComment={() => {
              setCommentPostId(feel.id);
              setReplyTo(null);
            }}
            onShare={() => setSendFeelToUsersId(feel.id)}
            onRepost={() => handleRepostClick(feel.id)}
            isReposted={myReposts.has(feel.id)}
            isReposting={repostingId === feel.id}
          />
        ))}
      </div>

      {/* Мобилки: шторка комментариев снизу */}
      {!isDesktop && (
        <AnimatePresence>
          {commentPostId && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/50"
                onClick={() => setCommentPostId(null)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="fixed left-0 right-0 bottom-0 z-[101] h-[50vh] rounded-t-2xl bg-background border-t border-border overflow-hidden flex flex-col"
              >
                {commentsPanelContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}

      {/* Отправить видео другу */}
      <AnimatePresence>
        {sendFeelToUsersId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[100] bg-black/40"
              onClick={() => !sendSending && setSendFeelToUsersId(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              className="fixed inset-0 z-[101] top-auto bg-background overflow-hidden flex flex-col will-change-transform"
              style={{ backfaceVisibility: "hidden" } as any}
            >
              <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border flex items-center justify-between">
                <span className="font-semibold text-lg">Отправить другу</span>
                <button
                  type="button"
                  onClick={() => !sendSending && setSendFeelToUsersId(null)}
                  className="p-1 -mr-2 text-2xl leading-none hover:bg-muted/50 rounded-full transition text-muted-foreground"
                  aria-label="Закрыть"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2">
                {sendUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Подпишись на кого-нибудь, чтобы отправить им Feels.</p>
                ) : (
                  <ul className="space-y-1">
                    {sendUsers.map((u) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => toggleRepostFeel(u.id)}
                          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/60 transition text-left"
                        >
                          <AvatarInitials username={u.username} avatarUrl={u.avatar_url ?? undefined} size="sm" className="!h-10 !w-10" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{u.display_name || u.username}</div>
                            <div className="text-xs text-muted-foreground truncate">@{u.username}</div>
                          </div>
                          {sendSelected.has(u.id) && (
                            <span className="text-primary text-sm font-medium">✓</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="shrink-0 p-4 border-t border-border">
                <button
                  type="button"
                  disabled={sendSending || sendSelected.size === 0}
                  onClick={handleSendSubmit}
                  className="w-full rounded-2xl py-3 bg-foreground text-background font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {sendSending ? "Отправка…" : "Отправить"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeelSlide({
  feel,
  slideHeight,
  scrollContainerRef,
  isActive,
  onVisibilityChange,
  onLike,
  onComment,
  onShare,
  onRepost,
  isReposted,
  isReposting,
}: {
  feel: Feel;
  slideHeight: string;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  isActive: boolean;
  onVisibilityChange: (id: string, visible: boolean) => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onRepost: () => void;
  isReposted: boolean;
  isReposting: boolean;
}) {
  const slideRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [showPlayPauseIcon, setShowPlayPauseIcon] = React.useState(false);
  const [playPauseIcon, setPlayPauseIcon] = React.useState<"play" | "pause">("pause");
  const iconTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleVideoTap = React.useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (iconTimeoutRef.current) clearTimeout(iconTimeoutRef.current);
    if (v.paused) {
      v.play();
      setPlayPauseIcon("play");
    } else {
      v.pause();
      setPlayPauseIcon("pause");
    }
    setShowPlayPauseIcon(true);
    iconTimeoutRef.current = setTimeout(() => setShowPlayPauseIcon(false), 800);
  }, []);

  React.useEffect(() => () => { if (iconTimeoutRef.current) clearTimeout(iconTimeoutRef.current); }, []);

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    const slide = slideRef.current;
    if (!container || !slide) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e) onVisibilityChange(feel.id, e.intersectionRatio >= 0.5);
      },
      { root: container, threshold: 0.5 }
    );
    obs.observe(slide);
    return () => obs.disconnect();
  }, [scrollContainerRef, feel.id, onVisibilityChange]);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) {
      v.currentTime = 0;
      v.muted = false;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [isActive]);

  return (
    <div
      ref={slideRef}
      className="snap-start snap-always shrink-0 w-full flex flex-col bg-black"
      style={{ height: slideHeight, minHeight: slideHeight, scrollSnapAlign: "start", scrollSnapStop: "always" }}
    >
      <div className="relative flex-1 min-h-0 bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          src={feel.video_url}
          className="w-full h-full object-contain"
          playsInline
          muted={false}
          loop
        />
        <button
          type="button"
          className="absolute inset-0 right-20 cursor-default"
          onClick={handleVideoTap}
          aria-label="Пауза / воспроизведение"
        />
        <AnimatePresence>
          {showPlayPauseIcon && (
            <motion.div
              key="play-pause-icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <span className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center">
                {playPauseIcon === "pause" ? (
                  <Pause className="h-10 w-10 text-white fill-white" />
                ) : (
                  <Play className="h-10 w-10 text-white fill-white ml-1" />
                )}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"
          aria-hidden
        />
        <div className="absolute right-3 bottom-24 flex flex-col gap-5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onLike(); }}
            className="flex flex-col items-center gap-0.5 text-white"
          >
            <span className={`p-2 rounded-full transition ${feel.isLiked ? "text-red-500 fill-red-500" : "hover:bg-white/20"}`}>
              <Heart className={`h-8 w-8 ${feel.isLiked ? "fill-current" : ""}`} />
            </span>
            <span className="text-xs font-medium">{feel.like_count ?? 0}</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onComment(); }}
            className="flex flex-col items-center gap-0.5 text-white hover:bg-white/20 p-2 rounded-full transition"
          >
            <MessageCircle className="h-8 w-8" />
            <span className="text-xs font-medium">{feel.comment_count ?? 0}</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRepost(); }}
            disabled={isReposting}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${isReposted ? "text-green-500 bg-green-500/10" : "text-white hover:bg-white/10"}`}
            aria-label="Репост"
          >
            <Repeat2 className={`h-6 w-6 ${isReposted ? "fill-current" : ""}`} />
            <span className="text-xs font-semibold">Репост</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onShare(); }}
            className="flex flex-col items-center gap-1 text-white hover:bg-white/10 p-2 rounded-lg transition"
            aria-label="Отправить другу"
          >
            <Forward className="h-6 w-6" />
            <span className="text-xs font-semibold">Отправить</span>
          </button>
        </div>
        <div className="absolute left-3 right-20 bottom-4 flex flex-col items-start gap-0.5 max-w-[75%] pointer-events-none">
          <Link
            href={`/profile/${feel.user}`}
            className="font-semibold text-sm text-white hover:underline shrink-0 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            @{feel.user}
          </Link>
          {feel.description && (
            <p className="text-sm text-white/95 line-clamp-3 text-left break-words">{feel.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
