"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, X, Music } from "lucide-react";
import { usePlayer } from "@/components/providers/PlayerProvider";

export function MiniPlayerDesktop() {
  const player = usePlayer();
  if (!player) return null;

  if (!player.visible || !player.current) {
    return (
      <div className="hidden md:flex items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 py-4 px-3">
        <span className="text-xs text-muted-foreground">Нажмите на трек</span>
      </div>
    );
  }

  const { current, playing, progress, togglePlay, skip, hide } = player;

  return (
    <div className="hidden md:block border-t p-3">
      <AnimatePresence>
        <motion.div
          key={current.track}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ type: "spring" as const, stiffness: 300, damping: 26 }}
          className="relative rounded-xl border bg-card overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted overflow-hidden">
            <motion.div
              className="h-full"
              style={{ backgroundColor: current.color }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.15, ease: "linear" }}
            />
          </div>
          <div className="p-3 pt-4 flex items-center gap-2">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
              style={{ backgroundColor: current.color }}
            >
              <Music className="h-5 w-5 text-white/80" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{current.track}</div>
              <div className="truncate text-xs text-muted-foreground">{current.artist}</div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={togglePlay}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition"
                aria-label={playing ? "Пауза" : "Играть"}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={skip}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition"
                aria-label="Дальше"
              >
                <SkipForward className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={hide}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition"
                aria-label="Закрыть"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
