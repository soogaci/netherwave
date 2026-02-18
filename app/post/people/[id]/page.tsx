"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Heart, Share2, Send, Reply } from "lucide-react";
import { Card } from "@/app/ui/card";
import { Badge } from "@/app/ui/badge";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { useToast } from "@/components/providers/ToastProvider";
import { PEOPLE } from "@/lib/mock";
import type { Comment } from "@/lib/types";

const MOCK_COMMENTS: Record<string, Comment[]> = {
  p1: [
    { id: "c1", user: "den", text: "привет! давай пообщаемся", time: "1ч" },
    { id: "c2", user: "mira", text: "красивый профиль получился!", time: "45м" },
  ],
  p2: [
    { id: "c3", user: "mira", text: "поддерживаю", time: "3ч" },
    { id: "c4", user: "s1dead", text: "именно для этого и создан Netherwave", time: "2ч" },
  ],
  p3: [{ id: "c5", user: "alina", text: "крутая идея!", time: "1д" }],
  p4: [{ id: "c6", user: "den", text: "согласен на все 100%", time: "5ч" }],
};

export default function PostPeoplePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const post = PEOPLE.find((p) => p.id === id);
  const toast = useToast();

  const [liked, setLiked] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState(3);
  const [comments, setComments] = React.useState<Comment[]>(MOCK_COMMENTS[id] ?? []);
  const [text, setText] = React.useState("");
  const [replyTo, setReplyTo] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleLike() {
    setLiked((v) => !v);
    setLikeCount((c) => c + (liked ? -1 : 1));
  }

  function handleShare() {
    const url = `${window.location.origin}/post/people/${id}`;
    navigator.clipboard?.writeText(url);
    toast?.("Ссылка скопирована");
  }

  function sendComment() {
    const t = text.trim();
    if (!t) return;
    setComments((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        user: "me",
        text: replyTo ? `@${replyTo} ${t}` : t,
        time: "сейчас",
        replyTo: replyTo ?? undefined,
      },
    ]);
    setText("");
    setReplyTo(null);
  }

  function startReply(user: string) {
    setReplyTo(user);
    inputRef.current?.focus();
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

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="rounded-3xl border-0 bg-card p-5 gap-0 shadow-none">
          <div className="flex items-start gap-3">
            <Link href={`/profile/${post.user}`}>
              <AvatarInitials username={post.user} size="md" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <Link href={`/profile/${post.user}`} className="truncate text-sm font-semibold hover:underline">
                  @{post.user}
                </Link>
                <span className="text-xs text-muted-foreground shrink-0">{post.time}</span>
              </div>
              <div className="mt-3 text-sm leading-relaxed">{post.text}</div>

              {post.hasPhoto && <div className="mt-4 h-48 w-full rounded-2xl bg-muted" />}

              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <Link key={t} href={`/?tag=${encodeURIComponent(t)}`}>
                    <Badge variant="secondary" className="rounded-full cursor-pointer hover:bg-muted/80 transition">{t}</Badge>
                  </Link>
                ))}
              </div>

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
        </Card>
      </motion.div>

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
                <Card className="rounded-2xl border-0 bg-card px-4 py-3 gap-0 shadow-none">
                  <div className="flex items-start gap-2.5">
                    <AvatarInitials username={c.user} size="sm" className="!h-8 !w-8 !text-[10px] !rounded-lg mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <Link href={`/profile/${c.user}`} className="text-xs font-semibold hover:underline">@{c.user}</Link>
                        <span className="text-[10px] text-muted-foreground">{c.time}</span>
                      </div>
                      <p className="text-sm text-foreground/90 leading-snug mt-0.5">{c.text}</p>
                      <button
                        type="button"
                        onClick={() => startReply(c.user)}
                        className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition"
                      >
                        <Reply className="h-3 w-3" />
                        Ответить
                      </button>
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
                  <span>Ответ для @{replyTo}</span>
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
