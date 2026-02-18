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
import { hapticLight } from "@/lib/haptic";
import { CommentSection } from "./CommentSection";

type PeopleCardProps = {
  item: PeoplePost;
  onLike?: (id: string) => void;
  likes?: number;
  comments?: Comment[];
  index?: number;
};

const defaultComments: Record<string, Comment[]> = {
  p1: [{ id: "c1", user: "den", text: "привет! давай пообщаемся", time: "1ч" }],
  p2: [{ id: "c2", user: "mira", text: "поддерживаю", time: "3ч" }],
};

export function PeopleCard({
  item,
  onLike,
  likes = 0,
  comments: initialComments,
  index = 0,
}: PeopleCardProps) {
  const router = useRouter();
  const [liked, setLiked] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState(likes);
  const [showComments, setShowComments] = React.useState(false);
  const [comments, setComments] = React.useState<Comment[]>(
    initialComments ?? defaultComments[item.id] ?? []
  );
  const toast = useToast();

  function addComment(text: string) {
    setComments((prev) => [
      ...prev,
      { id: String(Date.now()), user: "me", text, time: "сейчас" },
    ]);
  }

  function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    hapticLight();
    setLiked((v) => !v);
    setLikeCount((c) => c + (liked ? -1 : 1));
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
            <AvatarInitials username={item.user} size="md" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/profile/${item.user}`}
                className="truncate text-sm font-semibold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded"
                onClick={(e) => e.stopPropagation()}
              >
                @{item.user}
              </Link>
              <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
            </div>

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

            {item.hasPhoto && (
              <div className="mt-4 h-40 w-full rounded-2xl bg-muted" />
            )}

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
                <span>{comments.length}</span>
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
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
