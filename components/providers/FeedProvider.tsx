"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { PeoplePost, MusicPost } from "@/lib/types";
import { FEED, SUBS } from "@/lib/mock";

const MUSIC_MOCK: MusicPost[] = [
  { id: "m1", user: "kira", time: "2ч", track: "Midnight City", artist: "M83", mood: "ностальгия по 2012", tags: ["синтвейв", "инди"], coverColor: "oklch(0.5 0.18 280)" },
  { id: "m2", user: "alina", time: "5ч", track: "Blinding Lights", artist: "The Weeknd", mood: "под ночь", tags: ["поп", "синт"], coverColor: "oklch(0.5 0.2 30)" },
];

type FeedContextType = {
  feed: PeoplePost[];
  subs: PeoplePost[];
  musicFeed: MusicPost[];
  addPeoplePost: (post: Omit<PeoplePost, "id" | "user" | "time">) => void;
  addMusicPost: (post: Omit<MusicPost, "id" | "user" | "time">) => void;
};

const FeedContext = createContext<FeedContextType | null>(null);

export function FeedProvider({ children }: { children: React.ReactNode }) {
  const [feed, setFeed] = useState<PeoplePost[]>(() => [...FEED]);
  const [subs, setSubs] = useState<PeoplePost[]>(() => [...SUBS]);
  const [musicFeed, setMusicFeed] = useState<MusicPost[]>(() => [...MUSIC_MOCK]);

  const addPeoplePost = useCallback((post: Omit<PeoplePost, "id" | "user" | "time">) => {
    const newPost: PeoplePost = {
      ...post,
      id: `p-${Date.now()}`,
      user: "s1dead",
      time: "сейчас",
    };
    setFeed((prev) => [newPost, ...prev]);
    setSubs((prev) => [newPost, ...prev]);
  }, []);

  const addMusicPost = useCallback((post: Omit<MusicPost, "id" | "user" | "time">) => {
    const newPost: MusicPost = {
      ...post,
      id: `m-${Date.now()}`,
      user: "s1dead",
      time: "сейчас",
    };
    setMusicFeed((prev) => [newPost, ...prev]);
  }, []);

  return (
    <FeedContext.Provider value={{ feed, subs, musicFeed, addPeoplePost, addMusicPost }}>
      {children}
    </FeedContext.Provider>
  );
}

export function useFeed() {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error("useFeed must be used within FeedProvider");
  return ctx;
}
