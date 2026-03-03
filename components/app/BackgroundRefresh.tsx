"use client";

import React, { useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useFeed } from "@/components/providers/FeedProvider";
import { useChats } from "@/components/providers/ChatsProvider";
import { useNotifications } from "@/components/providers/NotificationsProvider";

/** При возврате на вкладку обновляет ленту, чаты и уведомления в фоне. */
export function BackgroundRefresh() {
  const { user } = useAuth();
  const { refresh: refreshFeed } = useFeed();
  const { refresh: refreshChats } = useChats();
  const { refresh: refreshNotifications } = useNotifications();
  const prevVisible = useRef(true);

  useEffect(() => {
    if (!user) return;

    const onVisibility = () => {
      if (document.visibilityState === "visible" && !prevVisible.current) {
        prevVisible.current = true;
        refreshFeed();
        refreshChats();
        refreshNotifications();
      } else if (document.visibilityState === "hidden") {
        prevVisible.current = false;
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [user?.id, refreshFeed, refreshChats, refreshNotifications]);

  return null;
}
