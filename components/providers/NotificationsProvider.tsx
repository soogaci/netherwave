"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type { NotificationItem } from "@/lib/types";
import { getNotifications } from "@/lib/supabase/notifications";
import { useAuth } from "./AuthProvider";

type NotificationsContextType = {
  list: NotificationItem[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [list, setList] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const hasLoadedRef = useRef(false);
  const refresh = useCallback(async () => {
    if (!user?.id) {
      setList([]);
      hasLoadedRef.current = false;
      setLoading(false);
      return;
    }
    if (!hasLoadedRef.current) setLoading(true);
    const data = await getNotifications(user.id);
    setList(data);
    hasLoadedRef.current = true;
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = React.useMemo(
    () => ({ list, loading, refresh }),
    [list, loading, refresh]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
