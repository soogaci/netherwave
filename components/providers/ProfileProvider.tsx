"use client";

import React from "react";
import { useAuth } from "./AuthProvider";
import { getProfile, upsertProfile, updateProfile as updateProfileDb, type Profile } from "@/lib/supabase/profiles";

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
      const { error } = await updateProfileDb(user.id, data);
      if (!error) await refresh();
      return { error };
    },
    [user?.id, refresh]
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
