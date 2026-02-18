"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { PeoplePost, MusicPost } from "@/lib/types";
import { getPosts, createPeoplePost, createMusicPost } from "@/lib/supabase/posts";
import { useAuth } from "./AuthProvider";
import { useProfile } from "./ProfileProvider";

type FeedContextType = {
  feed: PeoplePost[];
  subs: PeoplePost[];
  musicFeed: MusicPost[];
  loading: boolean;
  refresh: () => Promise<void>;
  addPeoplePost: (post: Omit<PeoplePost, "id" | "user" | "time">) => Promise<{ error: Error | null }>;
  addMusicPost: (post: Omit<MusicPost, "id" | "user" | "time">) => Promise<{ error: Error | null }>;
};

const FeedContext = createContext<FeedContextType | null>(null);

export function FeedProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [feed, setFeed] = useState<PeoplePost[]>([]);
  const [subs, setSubs] = useState<PeoplePost[]>([]);
  const [musicFeed, setMusicFeed] = useState<MusicPost[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { people, music } = await getPosts();
    setFeed(people);
    setSubs(people);
    setMusicFeed(music);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addPeoplePost = useCallback(
    async (post: Omit<PeoplePost, "id" | "user" | "time">) => {
      if (!user || !profile) return { error: new Error("Войди в аккаунт") };
      const { error } = await createPeoplePost(user.id, profile.username, {
        text: post.text,
        tags: post.tags ?? [],
        hasPhoto: post.hasPhoto,
      });
      if (!error) await refresh();
      return { error };
    },
    [user?.id, profile?.username, refresh]
  );

  const addMusicPost = useCallback(
    async (post: Omit<MusicPost, "id" | "user" | "time">) => {
      if (!user || !profile) return { error: new Error("Войди в аккаунт") };
      const { error } = await createMusicPost(user.id, {
        track: post.track,
        artist: post.artist,
        mood: post.mood ?? "—",
        tags: post.tags ?? [],
        coverColor: post.coverColor,
      });
      if (!error) await refresh();
      return { error };
    },
    [user?.id, profile?.username, refresh]
  );

  return (
    <FeedContext.Provider
      value={{
        feed,
        subs,
        musicFeed,
        loading,
        refresh,
        addPeoplePost,
        addMusicPost,
      }}
    >
      {children}
    </FeedContext.Provider>
  );
}

export function useFeed() {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error("useFeed must be used within FeedProvider");
  return ctx;
}
