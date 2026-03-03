"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Type, ImagePlus, X, Video } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useToast } from "@/components/providers/ToastProvider";
import { useFeed } from "@/components/providers/FeedProvider";
import { uploadPostImage } from "@/lib/supabase/posts";
import { uploadFeelVideo } from "@/lib/supabase/feels";
import { useAuth } from "@/components/providers/AuthProvider";
import { hapticSuccess } from "@/lib/haptic";

const MAX_PHOTOS = 5;

type PostType = "people" | "music" | "feels";

export default function AddPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { addPeoplePost, addMusicPost, addFeel } = useFeed();

  const [postType, setPostType] = React.useState<PostType>("people");
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [postText, setPostText] = React.useState("");
  const [track, setTrack] = React.useState("");
  const [artist, setArtist] = React.useState("");
  const [mood, setMood] = React.useState("");
  const [publishing, setPublishing] = React.useState(false);
  const [photoFiles, setPhotoFiles] = React.useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = React.useState<string[]>([]);
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const previewUrlsRef = React.useRef<string[]>([]);
  const [feelVideoFile, setFeelVideoFile] = React.useState<File | null>(null);
  const [feelVideoPreview, setFeelVideoPreview] = React.useState<string | null>(null);
  const [feelDescription, setFeelDescription] = React.useState("");
  const feelVideoInputRef = React.useRef<HTMLInputElement>(null);
  const feelPreviewRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    previewUrlsRef.current.forEach(URL.revokeObjectURL);
    const urls = photoFiles.map((f) => URL.createObjectURL(f));
    previewUrlsRef.current = urls;
    setPhotoPreviews(urls);
    return () => {
      urls.forEach(URL.revokeObjectURL);
      previewUrlsRef.current = [];
    };
  }, [photoFiles]);

  React.useEffect(() => {
    if (feelPreviewRef.current) URL.revokeObjectURL(feelPreviewRef.current);
    if (feelVideoFile) {
      const url = URL.createObjectURL(feelVideoFile);
      feelPreviewRef.current = url;
      setFeelVideoPreview(url);
      return () => {
        URL.revokeObjectURL(url);
        feelPreviewRef.current = null;
      };
    }
    setFeelVideoPreview(null);
  }, [feelVideoFile]);

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

  function addPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const images = files.filter((f) => f.type.startsWith("image/"));
    setPhotoFiles((prev) => {
      const next = [...prev, ...images].slice(0, MAX_PHOTOS);
      return next;
    });
    e.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function publishPost() {
    if (postType === "people") {
      if (!postText.trim() && photoFiles.length === 0) {
        toast?.("Напиши текст или добавь фото");
        return;
      }
      setPublishing(true);
      let photoUrls: string[] = [];
      if (photoFiles.length > 0 && user) {
        for (const file of photoFiles) {
          const { url, error } = await uploadPostImage(user.id, file);
          if (error) {
            toast?.(error.message);
            setPublishing(false);
            return;
          }
          if (url) photoUrls.push(url);
        }
      }
      const { error } = await addPeoplePost({
        text: postText.trim(),
        tags,
        hasPhoto: photoUrls.length > 0,
        photo_urls: photoUrls,
      });
      if (error) {
        setPublishing(false);
        toast?.(error.message);
        return;
      }
      hapticSuccess();
      toast?.("Пост опубликован!");
      setPublishing(false);
      setPostText("");
      setTags([]);
      setPhotoFiles([]);
      router.push("/");
      return;
    }
    if (postType === "feels") {
      if (!feelVideoFile) {
        toast?.("Загрузи видео");
        return;
      }
      setPublishing(true);
      const { url, error: uploadErr } = await uploadFeelVideo(user!.id, feelVideoFile);
      if (uploadErr || !url) {
        toast?.(uploadErr?.message ?? "Ошибка загрузки");
        setPublishing(false);
        return;
      }
      const { error } = await addFeel({ video_url: url, description: feelDescription.trim() });
      if (error) {
        toast?.(error.message);
        setPublishing(false);
        return;
      }
      hapticSuccess();
      toast?.("Feels опубликован!");
      setPublishing(false);
      setFeelVideoFile(null);
      setFeelDescription("");
      router.push("/feels");
      return;
    }
    // music
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
      setPhotoFiles([]);
      router.push("/");
    }, 500);
  }

  const canPublish =
    postType === "people"
      ? postText.trim().length > 0 || photoFiles.length > 0
      : postType === "feels"
        ? !!feelVideoFile
        : track.trim().length > 0 && artist.trim().length > 0;

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <header className="shrink-0 mb-4">
        <div className="text-lg font-semibold">Новый пост</div>
        <div className="text-sm text-muted-foreground">FeelReal</div>
      </header>

      {/* Скролл только внутри формы — интерфейс не двигается пальцем */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden -mx-4 px-4 pb-8 touch-manipulation">
        {/* Type selector */}
      <div className="mb-4 flex gap-2 shrink-0">
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
        <motion.button
          type="button"
          onClick={() => setPostType("feels")}
          whileTap={{ scale: 0.96 }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-medium transition ${
            postType === "feels"
              ? "bg-foreground text-background"
              : "border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Video className="h-4 w-4" />
          Feels
        </motion.button>
      </div>

      <Card className="rounded-3xl border-0 bg-card p-5">
        <div className="space-y-4">
          {postType === "feels" ? (
            <>
              <p className="text-sm text-muted-foreground">
                Короткие видео в ленту Feels — как в TikTok. Показываются только в разделе Feels, не в основной ленте.
              </p>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Видео</label>
                <input
                  ref={feelVideoInputRef}
                  type="file"
                  accept="video/*"
                  className="sr-only"
                  onChange={(e) => setFeelVideoFile(e.target.files?.[0] ?? null)}
                />
                {feelVideoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden bg-muted aspect-[9/16] max-h-[280px]">
                    <video src={feelVideoPreview} className="w-full h-full object-cover" muted playsInline />
                    <button
                      type="button"
                      onClick={() => setFeelVideoFile(null)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
                      aria-label="Удалить"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => feelVideoInputRef.current?.click()}
                    className="w-full aspect-video rounded-2xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-foreground/40 hover:text-foreground transition"
                  >
                    <Video className="h-10 w-10" />
                    <span className="text-sm">Загрузить видео</span>
                  </button>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Описание</label>
                <textarea
                  value={feelDescription}
                  onChange={(e) => setFeelDescription(e.target.value)}
                  placeholder="Опиши свой Feels..."
                  className="min-h-[80px] w-full rounded-2xl border bg-background/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
                />
              </div>
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  className="w-full rounded-2xl"
                  onClick={publishPost}
                  disabled={publishing || !canPublish}
                >
                  {publishing ? "Публикуем…" : "Опубликовать в Feels"}
                </Button>
              </motion.div>
            </>
          ) : postType === "people" ? (
            <>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Текст</label>
                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="Напиши что-то..."
                  className="min-h-[100px] w-full rounded-2xl border bg-background/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Фото (до {MAX_PHOTOS})</label>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={addPhotos}
                />
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence mode="popLayout">
                    {photoFiles.map((file, i) => (
                      <motion.div
                        key={i}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0"
                      >
                        <img
                          src={photoPreviews[i] ?? ""}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
                          aria-label="Удалить"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {photoFiles.length < MAX_PHOTOS && (
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:border-foreground/40 hover:text-foreground transition shrink-0"
                    >
                      <ImagePlus className="h-8 w-8" />
                    </button>
                  )}
                </div>
              </div>
            </>
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

          {postType !== "feels" && (
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
          )}

          {postType !== "feels" && (
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              className="w-full rounded-2xl"
              onClick={publishPost}
              disabled={publishing || !canPublish}
            >
              {publishing ? "Публикуем…" : "Опубликовать"}
            </Button>
          </motion.div>
          )}
        </div>
      </Card>
      </div>
    </div>
  );
}
