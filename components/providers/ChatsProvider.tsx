"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type { Chat } from "@/lib/types";
import { getChatsForUser } from "@/lib/supabase/chats";
import { useAuth } from "./AuthProvider";

type ChatsContextType = {
  chats: Chat[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const ChatsContext = createContext<ChatsContextType | null>(null);

export function ChatsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  const hasLoadedRef = useRef(false);
  const refresh = useCallback(async () => {
    if (!user?.id) {
      setChats([]);
      hasLoadedRef.current = false;
      setLoading(false);
      return;
    }
    if (!hasLoadedRef.current) setLoading(true);
    const list = await getChatsForUser(user.id);
    setChats(list);
    hasLoadedRef.current = true;
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = React.useMemo(
    () => ({ chats, loading, refresh }),
    [chats, loading, refresh]
  );

  return (
    <ChatsContext.Provider value={value}>
      {children}
    </ChatsContext.Provider>
  );
}

export function useChats() {
  const ctx = useContext(ChatsContext);
  if (!ctx) throw new Error("useChats must be used within ChatsProvider");
  return ctx;
}
