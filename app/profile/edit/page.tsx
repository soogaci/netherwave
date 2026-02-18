"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Check, Plus, X } from "lucide-react";
import { Card } from "@/app/ui/card";
import { Badge } from "@/app/ui/badge";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { useToast } from "@/components/providers/ToastProvider";
import { USER_PROFILES } from "@/lib/mock";

const CURRENT_USER = "s1dead";

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 26 } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

export default function EditProfilePage() {
  const profile = USER_PROFILES[CURRENT_USER];
  const toast = useToast();

  const [displayName, setDisplayName] = React.useState(profile.displayName);
  const [bio, setBio] = React.useState(profile.bio);
  const [tags, setTags] = React.useState<string[]>([...profile.tags]);
  const [newTag, setNewTag] = React.useState("");
  const [saved, setSaved] = React.useState(false);

  function addTag() {
    const t = newTag.trim();
    if (!t || tags.includes(t)) return;
    setTags((prev) => [...prev, t]);
    setNewTag("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleSave() {
    setSaved(true);
    toast?.("Профиль сохранён");
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div>
      <header className="mb-5 flex items-center gap-2">
        <Link
          href="/profile"
          className="grid h-9 w-9 place-items-center rounded-full border text-muted-foreground hover:text-foreground transition"
          aria-label="Назад"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 text-base font-semibold">Редактирование</div>
        <motion.button
          type="button"
          onClick={handleSave}
          whileTap={{ scale: 0.9 }}
          className="rounded-2xl bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition inline-flex items-center gap-1.5"
        >
          <AnimatePresence mode="wait" initial={false}>
            {saved ? (
              <motion.span
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
              >
                <Check className="h-4 w-4" />
              </motion.span>
            ) : (
              <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Сохранить
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </header>

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
        {/* Avatar */}
        <motion.div variants={item} className="flex justify-center">
          <div className="relative">
            <AvatarInitials username={CURRENT_USER} size="lg" className="!h-20 !w-20 !text-2xl" />
            <div className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-foreground text-background text-xs border-2 border-background">
              <Plus className="h-3.5 w-3.5" />
            </div>
          </div>
        </motion.div>

        {/* Name */}
        <motion.div variants={item}>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block px-1">
            Имя
          </label>
          <Card className="rounded-2xl border-0 bg-card p-0 gap-0 shadow-none">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-2xl bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30 transition"
              placeholder="Как тебя зовут"
            />
          </Card>
        </motion.div>

        {/* Bio */}
        <motion.div variants={item}>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block px-1">
            О себе
          </label>
          <Card className="rounded-2xl border-0 bg-card p-0 gap-0 shadow-none">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={200}
              className="w-full resize-none rounded-2xl bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30 transition"
              placeholder="Расскажи о себе..."
            />
          </Card>
          <div className="text-right text-[10px] text-muted-foreground mt-1 px-1">{bio.length}/200</div>
        </motion.div>

        {/* Tags */}
        <motion.div variants={item}>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block px-1">
            Теги интересов
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            <AnimatePresence>
              {tags.map((t) => (
                <motion.div
                  key={t}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 350, damping: 22 }}
                >
                  <Badge variant="secondary" className="rounded-full pr-1 inline-flex items-center gap-1">
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="grid h-4 w-4 place-items-center rounded-full hover:bg-muted-foreground/20 transition"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="flex gap-2">
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addTag(); }}
              placeholder="Добавить тег..."
              className="flex-1 rounded-xl border bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30 transition"
            />
            <motion.button
              type="button"
              onClick={addTag}
              whileTap={{ scale: 0.9 }}
              disabled={!newTag.trim()}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-foreground text-background transition disabled:opacity-30"
            >
              <Plus className="h-4 w-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* Username (read-only) */}
        <motion.div variants={item}>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block px-1">
            Юзернейм
          </label>
          <Card className="rounded-2xl border-0 bg-card p-0 gap-0 shadow-none">
            <div className="px-4 py-3 text-sm text-muted-foreground">@{CURRENT_USER}</div>
          </Card>
          <div className="text-[10px] text-muted-foreground mt-1 px-1">Изменить нельзя</div>
        </motion.div>
      </motion.div>
    </div>
  );
}
