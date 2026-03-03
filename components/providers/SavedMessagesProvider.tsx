"use client";

import React from "react";
import { SAVED_MSG_KEY } from "@/lib/mock";

type SavedRef = { chatId: string; msgId: string };

const SavedMessagesContext = React.createContext<{
  saved: SavedRef[];
  add: (chatId: string, msgId: string) => void;
  remove: (chatId: string, msgId: string) => void;
  has: (chatId: string, msgId: string) => boolean;
} | null>(null);

export function SavedMessagesProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = React.useState<SavedRef[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const s = localStorage.getItem(SAVED_MSG_KEY);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });
  const add = React.useCallback((chatId: string, msgId: string) => {
    setSaved((prev) => {
      if (prev.some((r) => r.chatId === chatId && r.msgId === msgId)) return prev;
      const next = [...prev, { chatId, msgId }];
      try {
        localStorage.setItem(SAVED_MSG_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);
  const remove = React.useCallback((chatId: string, msgId: string) => {
    setSaved((prev) => {
      const next = prev.filter((r) => !(r.chatId === chatId && r.msgId === msgId));
      try {
        localStorage.setItem(SAVED_MSG_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);
  const has = React.useCallback(
    (chatId: string, msgId: string) => saved.some((r) => r.chatId === chatId && r.msgId === msgId),
    [saved]
  );
  return (
    <SavedMessagesContext.Provider value={{ saved, add, remove, has }}>
      {children}
    </SavedMessagesContext.Provider>
  );
}

export function useSavedMessages() {
  const ctx = React.useContext(SavedMessagesContext);
  if (!ctx) {
    return {
      saved: [] as SavedRef[],
      add: () => {},
      remove: () => {},
      has: () => false,
    };
  }
  return ctx;
}
