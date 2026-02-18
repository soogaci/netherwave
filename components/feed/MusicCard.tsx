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
import { usePlayer } from "@/components/providers/PlayerProvider";
import { hapticLight } from "@/lib/haptic";
import { CommentSection } from "./CommentSection";

type MusicCardProps = {
  item: MusicPost;
  onLike?: (id: string) => void;
  likes?: number;
  comments?: Comment[];
  showListenLink?: boolean;
};

const defaultComments: Record<string, Comment[]> = {
  m1: [{ id: "mc1", user: "kira", text: "ого, давно не слушала — вернулась в 2012", time: "2ч" }],
  m2: [{ id: "mc2", user: "alina", text: "под дождь идеально", time: "5ч" }],
};

export function MusicCard({
  item,
  onLike,
  likes = 0,
  comments: initialComments,
  showListenLink = true,
}: MusicCardProps) {
  const [liked, setLiked] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState(likes);
  const [showComments, setShowComments] = React.useState(false);
  const [comments, setComments] = React.useState<Comment[]>(
    initialComments ?? defaultComments[item.id] ?? []
  );
  const toast = useToast();
  const player = usePlayer();
  const coverColor = item.coverColor ?? "oklch(0.35 0.05 260)";

  function handlePlayTrack(e: React.MouseEvent) {
    e.preventDefault();
    player?.playTrack({ track: item.track, artist: item.artist, color: coverColor });
  }

  function addComment(text: string) {
    setComments((prev) => [
      ...prev,
      { id: String(Date.now()), user: "me", text, time: "сейчас" },
    ]);
  }

  function handleLike() {
    hapticLight();
    setLiked((v) => !v);
    setLikeCount((c) => c + (liked ? -1 : 1));
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
            <AvatarInitials username={item.user} size="md" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/profile/${item.user}`}
                className="truncate text-sm font-semibold hover:underline"
              >
                @{item.user}
              </Link>
              <span className="text-xs text-muted-foreground">{item.time}</span>
            </div>

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
                <span>{comments.length}</span>
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
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
