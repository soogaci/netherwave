"use client";

import React from "react";
import { useAuth } from "./AuthProvider";
import { getProfile, upsertProfile, type Profile } from "@/lib/supabase/profiles";

type ProfileContextType = {
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  updateProfile: (data: { display_name?: string; bio?: string; tags?: string[] }) => Promise<{ error: Error | null }>;
};

const ProfileContext = React.createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const p = await getProfile(user.id);
    setProfile(p);
    setLoading(false);
  }, [user?.id]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const updateProfile = React.useCallback(
    async (data: { display_name?: string; bio?: string; tags?: string[] }) => {
      if (!user) return { error: new Error("Не авторизован") };
      const username = profile?.username ?? user.user_metadata?.username ?? "user_" + user.id.slice(0, 8);
      const { error } = await upsertProfile(user.id, {
        username,
        display_name: data.display_name ?? profile?.display_name ?? username,
        bio: data.bio ?? profile?.bio ?? "",
        tags: data.tags ?? profile?.tags ?? [],
      });
      if (!error) await refresh();
      return { error };
    },
    [user?.id, profile, refresh]
  );

  const value = React.useMemo(
    () => ({ profile, loading, refresh, updateProfile }),
    [profile, loading, refresh, updateProfile]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = React.useContext(ProfileContext);
  return ctx ?? { profile: null, loading: false, refresh: async () => {}, updateProfile: async () => ({ error: new Error("No provider") }) };
}
