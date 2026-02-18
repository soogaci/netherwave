"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Music, Type } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useToast } from "@/components/providers/ToastProvider";
import { useFeed } from "@/components/providers/FeedProvider";
import { hapticSuccess } from "@/lib/haptic";

type PostType = "people" | "music";

export default function AddPage() {
  const router = useRouter();
  const toast = useToast();
  const { addPeoplePost, addMusicPost } = useFeed();

  const [postType, setPostType] = React.useState<PostType>("people");
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [postText, setPostText] = React.useState("");
  const [track, setTrack] = React.useState("");
  const [artist, setArtist] = React.useState("");
  const [mood, setMood] = React.useState("");
  const [publishing, setPublishing] = React.useState(false);

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t) return;
    if (tags.includes(t)) return;
    setTags([...tags, t]);
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  async function publishPost() {
    if (postType === "people") {
      if (!postText.trim()) {
        toast?.("Напиши текст поста");
        return;
      }
      const { error } = await addPeoplePost({ text: postText.trim(), tags, hasPhoto: false });
      if (error) {
        toast?.(error.message);
        return;
      }
    } else {
      if (!track.trim() || !artist.trim()) {
        toast?.("Укажи трек и исполнителя");
        return;
      }
      const { error } = await addMusicPost({
        track: track.trim(),
        artist: artist.trim(),
        mood: mood.trim() || "—",
        tags,
        coverColor: "oklch(0.5 0.18 280)",
      });
      if (error) {
        toast?.(error.message);
        return;
      }
    }

    setPublishing(true);
    hapticSuccess();
    toast?.("Пост опубликован!");
    setTimeout(() => {
      setPublishing(false);
      setPostText("");
      setTrack("");
      setArtist("");
      setMood("");
      setTags([]);
      router.push("/");
    }, 500);
  }

  const canPublish =
    postType === "people"
      ? postText.trim().length > 0
      : track.trim().length > 0 && artist.trim().length > 0;

  return (
    <div>
      <header className="mb-5">
        <div className="text-lg font-semibold">Новый пост</div>
        <div className="text-sm text-muted-foreground">Netherwave</div>
      </header>

      {/* Type selector */}
      <div className="mb-4 flex gap-2">
        <motion.button
          type="button"
          onClick={() => setPostType("people")}
          whileTap={{ scale: 0.96 }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-medium transition ${
            postType === "people"
              ? "bg-foreground text-background"
              : "border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Type className="h-4 w-4" />
          Текст
        </motion.button>
        <motion.button
          type="button"
          onClick={() => setPostType("music")}
          whileTap={{ scale: 0.96 }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-medium transition ${
            postType === "music"
              ? "bg-foreground text-background"
              : "border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Music className="h-4 w-4" />
          Музыка
        </motion.button>
      </div>

      <Card className="rounded-3xl border-0 bg-card p-5">
        <div className="space-y-4">
          {postType === "people" ? (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Текст</label>
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Напиши что-то..."
                className="min-h-[140px] w-full rounded-2xl border bg-background/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Трек</label>
                <input
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                  placeholder="Midnight City"
                  className="w-full rounded-2xl border bg-background/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Исполнитель</label>
                <input
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="M83"
                  className="w-full rounded-2xl border bg-background/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Настроение (необязательно)</label>
                <input
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  placeholder="ностальгия, под ночь..."
                  className="w-full rounded-2xl border bg-background/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Теги</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="rounded-full cursor-pointer hover:opacity-80 transition"
                  onClick={() => removeTag(t)}
                >
                  #{t} ×
                </Badge>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="добавить тег..."
                className="flex-1 rounded-2xl border bg-background/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              />
              <Button variant="secondary" className="rounded-2xl" onClick={addTag}>
                Добавить
              </Button>
            </div>
          </div>

          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              className="w-full rounded-2xl"
              onClick={publishPost}
              disabled={publishing || !canPublish}
            >
              {publishing ? "Публикуем…" : "Опубликовать"}
            </Button>
          </motion.div>
        </div>
      </Card>
    </div>
  );
}
