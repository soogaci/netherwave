"use client";

import React from "react";

export type PlayerTrack = { track: string; artist: string; color: string };

const PlayerContext = React.createContext<{
  visible: boolean;
  current: PlayerTrack | null;
  playing: boolean;
  progress: number;
  playTrack: (t: PlayerTrack) => void;
  togglePlay: () => void;
  skip: () => void;
  hide: () => void;
} | null>(null);

const QUEUE: PlayerTrack[] = [
  { track: "Midnight City", artist: "M83", color: "oklch(0.5 0.18 280)" },
  { track: "Starboy", artist: "The Weeknd", color: "oklch(0.45 0.2 320)" },
  { track: "Blinding Lights", artist: "The Weeknd", color: "oklch(0.55 0.2 30)" },
];

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);
  const [queueIdx, setQueueIdx] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [customQueue, setCustomQueue] = React.useState<PlayerTrack[] | null>(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const queue = customQueue ?? QUEUE;
  const current = queue[queueIdx % queue.length] ?? null;

  React.useEffect(() => {
    if (playing && visible) {
      intervalRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            setQueueIdx((i) => i + 1);
            return 0;
          }
          return p + 0.5;
        });
      }, 100);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, visible]);

  const playTrack = React.useCallback((t: PlayerTrack) => {
    setCustomQueue([t, ...QUEUE.filter((q) => q.track !== t.track || q.artist !== t.artist)]);
    setQueueIdx(0);
    setProgress(0);
    setPlaying(true);
    setVisible(true);
  }, []);

  const togglePlay = React.useCallback(() => setPlaying((v) => !v), []);
  const skip = React.useCallback(() => {
    setQueueIdx((i) => i + 1);
    setProgress(0);
  }, []);
  const hide = React.useCallback(() => {
    setVisible(false);
    setPlaying(false);
  }, []);

  const value = React.useMemo(
    () => ({ visible, current, playing, progress, playTrack, togglePlay, skip, hide }),
    [visible, current, playing, progress, playTrack, togglePlay, skip, hide]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  return React.useContext(PlayerContext);
}
