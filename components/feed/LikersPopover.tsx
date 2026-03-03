"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import type { Liker } from "@/lib/supabase/likes-comments";

export function LikersPopover({
  open,
  onClose,
  likers,
  title = "Лайкнули",
}: {
  open: boolean;
  onClose: () => void;
  likers: Liker[];
  title?: string;
}) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md max-h-[60vh] rounded-t-3xl bg-background border-t shadow-xl flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b shrink-0">
            <span className="font-semibold">{title}</span>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto overscroll-contain p-2">
            {likers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Пока никого</p>
            ) : (
              <ul className="space-y-1">
                {likers.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/profile/${l.username}`}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/60 transition"
                    >
                      <AvatarInitials username={l.username} avatarUrl={l.avatar_url} size="sm" className="!h-10 !w-10" />
                      <span className="font-medium">@{l.username}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
