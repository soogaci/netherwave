"use client";

import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthProvider";
import { useProfile } from "./ProfileProvider";
import { useFeed } from "./FeedProvider";
import { useChats } from "./ChatsProvider";
import { useNotifications } from "./NotificationsProvider";
import { SplashScreen } from "@/components/app/SplashScreen";
import TabBar from "@/components/app/TabBar";
import { useSafeAreaFix } from "@/hooks/useSafeAreaFix";

const SPLASH_MIN_MS = 1400;

const AppReadyContext = createContext(false);
export function useAppReady() {
  return useContext(AppReadyContext);
}

type Props = {
  children: React.ReactNode;
  /** Показывать нижнюю панель TabBar (только когда ready). */
  showBottomBar?: boolean;
};

export function AppReadyProvider({ children, showBottomBar }: Props) {
  useSafeAreaFix();
  const { user } = useAuth();
  const { loading: profileLoading } = useProfile();
  const { loading: feedLoading } = useFeed();
  const { loading: chatsLoading } = useChats();
  const { loading: notificationsLoading } = useNotifications();
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <AppReadyContext.Provider value={ready}>
      <div className="flex flex-col flex-1 min-h-0 w-full">
        <div className="app-content">
          <AnimatePresence mode="wait">
            {!ready ? (
              <SplashScreen key="splash" />
            ) : null}
          </AnimatePresence>
          {ready ? children : null}
        </div>
        {mounted && ready && showBottomBar ? <TabBar /> : null}
      </div>
    </AppReadyContext.Provider>
  );
}
