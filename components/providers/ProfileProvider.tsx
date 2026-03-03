"use client";

import React from "react";
import { useAuth } from "./AuthProvider";
import {
  getProfile,
  upsertProfile,
  updateUsername as updateUsernameDb,
  updateProfile as updateProfileDb,
  uploadAvatar as uploadAvatarDb,
  uploadChatWallpaper as uploadChatWallpaperDb,
  type Profile,
} from "@/lib/supabase/profiles";
import { resizeImageForWallpaper } from "@/lib/resize-wallpaper";

type ProfileContextType = {
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  updateProfile: (data: { display_name?: string; bio?: string; tags?: string[]; username?: string; avatar_url?: string; chat_wallpaper_url?: string | null }) => Promise<{ error: Error | null }>;
  updateUsername: (username: string) => Promise<{ error: Error | null }>;
  uploadAvatar: (file: File) => Promise<{ error: Error | null }>;
  uploadChatWallpaper: (file: File) => Promise<{ error: Error | null }>;
};

const ProfileContext = React.createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);

  const hasLoadedRef = React.useRef(false);
  const refresh = React.useCallback(async () => {
    if (!user) {
      setProfile(null);
      hasLoadedRef.current = false;
      setLoading(false);
      return;
    }
    if (!hasLoadedRef.current) setLoading(true);
    const p = await getProfile(user.id);
    setProfile(p);
    hasLoadedRef.current = true;
    setLoading(false);
  }, [user?.id]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const updateProfile = React.useCallback(
    async (data: { display_name?: string; bio?: string; tags?: string[]; username?: string; avatar_url?: string; chat_wallpaper_url?: string | null }) => {
      if (!user) return { error: new Error("Не авторизован") };
      const username = data.username ?? profile?.username ?? user.user_metadata?.username ?? "user_" + user.id.slice(0, 8);
      const { error } = await upsertProfile(user.id, {
        username,
        display_name: data.display_name ?? profile?.display_name ?? username,
        bio: data.bio ?? profile?.bio ?? "",
        tags: data.tags ?? profile?.tags ?? [],
        avatar_url: data.avatar_url,
        chat_wallpaper_url: data.chat_wallpaper_url,
      });
      if (!error) await refresh();
      return { error };
    },
    [user?.id, profile, refresh]
  );

  const updateUsername = React.useCallback(
    async (newUsername: string) => {
      if (!user) return { error: new Error("Не авторизован") };
      const { error } = await updateUsernameDb(user.id, newUsername);
      if (!error) await refresh();
      return { error };
    },
    [user?.id, refresh]
  );

  const uploadAvatar = React.useCallback(
    async (file: File) => {
      if (!user) return { error: new Error("Не авторизован") };
      const { url, error } = await uploadAvatarDb(user.id, file);
      if (error) return { error };
      if (url) {
        const { error: e } = await upsertProfile(user.id, {
          username: profile?.username ?? "user",
          display_name: profile?.display_name ?? "User",
          bio: profile?.bio ?? "",
          tags: profile?.tags ?? [],
          avatar_url: url,
        });
        if (!e) await refresh();
        return { error: e };
      }
      return { error: new Error("Не удалось загрузить") };
    },
    [user?.id, profile, refresh]
  );

  const uploadChatWallpaper = React.useCallback(
    async (file: File) => {
      if (!user) return { error: new Error("Не авторизован") };
      const fileToUpload = await resizeImageForWallpaper(file);
      const { url, error } = await uploadChatWallpaperDb(user.id, fileToUpload);
      if (error) return { error };
      if (url) {
        const { error: e } = await updateProfileDb(user.id, { chat_wallpaper_url: url });
        if (!e) await refresh();
        return { error: e };
      }
      return { error: new Error("Не удалось загрузить") };
    },
    [user?.id, refresh]
  );

  const value = React.useMemo(
    () => ({ profile, loading, refresh, updateProfile, updateUsername, uploadAvatar, uploadChatWallpaper }),
    [profile, loading, refresh, updateProfile, updateUsername, uploadAvatar, uploadChatWallpaper]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = React.useContext(ProfileContext);
  return ctx ?? {
    profile: null,
    loading: false,
    refresh: async () => {},
    updateProfile: async () => ({ error: new Error("No provider") }),
    updateUsername: async () => ({ error: new Error("No provider") }),
    uploadAvatar: async () => ({ error: new Error("No provider") }),
    uploadChatWallpaper: async () => ({ error: new Error("No provider") }),
  };
}
