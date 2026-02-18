"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, X, Music } from "lucide-react";
import { usePlayer } from "@/components/providers/PlayerProvider";

export default function MiniPlayer() {
  const player = usePlayer();
  if (!player || !player.visible || !player.current) return null;

  const { current, playing, progress, togglePlay, skip, hide } = player;

  return (
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 mx-auto max-w-md px-4 md:hidden">
      <AnimatePresence>
        <motion.div
          key={current.track}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="relative rounded-2xl border bg-background/90 backdrop-blur-md overflow-hidden"
        >
          <div className="absolute top-0 left-0 h-[3px] rounded-full overflow-hidden right-0">
            <motion.div
              className="h-full"
              style={{ backgroundColor: current.color }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.15, ease: "linear" }}
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-3 pt-[3px]">
            <motion.div
              animate={playing ? { rotate: [0, 360] } : {}}
              transition={playing ? { duration: 4, repeat: Infinity, ease: "linear" } : {}}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
              style={{ backgroundColor: current.color }}
            >
              <Music className="h-5 w-5 text-white/80" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{current.track}</div>
              <div className="truncate text-xs text-muted-foreground">{current.artist}</div>
            </div>
            <div className="flex items-center gap-1">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={togglePlay}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-foreground text-background"
                aria-label={playing ? "Пауза" : "Играть"}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={playing ? "pause" : "play"}
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex"
                  >
                    {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={skip}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-foreground transition"
                aria-label="Дальше"
              >
                <SkipForward className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={hide}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-foreground transition"
                aria-label="Закрыть"
              >
                <X className="h-3.5 w-3.5" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
