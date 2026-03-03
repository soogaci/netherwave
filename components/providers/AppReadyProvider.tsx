"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthProvider";
import { useProfile } from "./ProfileProvider";
import { useFeed } from "./FeedProvider";
import { useChats } from "./ChatsProvider";
import { useNotifications } from "./NotificationsProvider";
import { SplashScreen } from "@/components/app/SplashScreen";

const SPLASH_MIN_MS = 1400;

type Props = {
  children: React.ReactNode;
};

export function AppReadyProvider({ children }: Props) {
  const { user } = useAuth();
  const { loading: profileLoading } = useProfile();
  const { loading: feedLoading } = useFeed();
  const { loading: chatsLoading } = useChats();
  const { loading: notificationsLoading } = useNotifications();
  const [ready, setReady] = useState(false);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    if (ready) return;
    const minElapsed = () => Date.now() - startRef.current >= SPLASH_MIN_MS;
    const dataReady = () => !user || (!profileLoading && !feedLoading && !chatsLoading && !notificationsLoading);
    const id = setInterval(() => {
      if (minElapsed() && dataReady()) setReady(true);
    }, 100);
    return () => clearInterval(id);
  }, [ready, user, profileLoading, feedLoading, chatsLoading, notificationsLoading]);

  return (
    <>
      <AnimatePresence mode="wait">
        {!ready ? (
          <SplashScreen key="splash" />
        ) : null}
      </AnimatePresence>
      {ready ? children : null}
    </>
  );
}
