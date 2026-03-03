"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type { PeoplePost, MusicPost, Feel } from "@/lib/types";
import { getPosts, createPeoplePost, createMusicPost } from "@/lib/supabase/posts";
import { getFeels as getFeelsApi, createFeel as createFeelApi } from "@/lib/supabase/feels";
import { toggleLike as toggleLikeApi } from "@/lib/supabase/likes-comments";
import { useAuth } from "./AuthProvider";
import { useProfile } from "./ProfileProvider";

type FeedContextType = {
  feed: PeoplePost[];
  subs: PeoplePost[];
  musicFeed: MusicPost[];
  feelsFeed: Feel[];
  loading: boolean;
  refresh: () => Promise<void>;
  refreshFeels: () => Promise<void>;
  addPeoplePost: (post: Omit<PeoplePost, "id" | "user" | "time">) => Promise<{ error: Error | null }>;
  addMusicPost: (post: Omit<MusicPost, "id" | "user" | "time">) => Promise<{ error: Error | null }>;
  addFeel: (post: { video_url: string; description: string }) => Promise<{ error: Error | null }>;
  toggleLike: (postId: string) => Promise<void>;
};

const FeedContext = createContext<FeedContextType | null>(null);

export function FeedProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [feed, setFeed] = useState<PeoplePost[]>([]);
  const [subs, setSubs] = useState<PeoplePost[]>([]);
  const [musicFeed, setMusicFeed] = useState<MusicPost[]>([]);
  const [feelsFeed, setFeelsFeed] = useState<Feel[]>([]);
  const [loading, setLoading] = useState(true);

  const hasLoadedRef = useRef(false);
  const refresh = useCallback(async () => {
    if (!hasLoadedRef.current) setLoading(true);
    const [postsResult, feels] = await Promise.all([getPosts(user?.id), getFeelsApi(user?.id)]);
    setFeed(postsResult.people);
    setSubs(postsResult.people);
    setMusicFeed(postsResult.music);
    setFeelsFeed(feels);
    hasLoadedRef.current = true;
    setLoading(false);
  }, [user?.id]);

  const refreshFeels = useCallback(async () => {
    const feels = await getFeelsApi(user?.id);
    setFeelsFeed(feels);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addPeoplePost = useCallback(
    async (post: Omit<PeoplePost, "id" | "user" | "time">) => {
      if (!user || !profile) return { error: new Error("Войди в аккаунт") };
      const photoUrls = post.photo_urls ?? [];
      const { error } = await createPeoplePost(user.id, profile.username, {
        text: post.text,
        tags: post.tags ?? [],
        hasPhoto: post.hasPhoto ?? photoUrls.length > 0,
        photo_urls: photoUrls,
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

  const addFeel = useCallback(
    async (post: { video_url: string; description: string }) => {
      if (!user) return { error: new Error("Войди в аккаунт") };
      const { error } = await createFeelApi(user.id, post);
      if (!error) await refreshFeels();
      return { error };
    },
    [user?.id, refreshFeels]
  );

  const toggleLike = useCallback(
    async (postId: string) => {
      if (!user) return;
      await toggleLikeApi(postId, user.id);
      await refresh();
    },
    [user?.id, refresh]
  );

  return (
    <FeedContext.Provider
      value={{
        feed,
        subs,
        musicFeed,
        feelsFeed,
        loading,
        refresh,
        refreshFeels,
        addPeoplePost,
        addMusicPost,
        addFeel,
        toggleLike,
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
