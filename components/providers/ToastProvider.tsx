"use client";

import React from "react";
import { createContext, useContext, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ToastContextValue = ((message: string) => void) | undefined;

const ToastContext = createContext<ToastContextValue>(undefined);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const toast = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2500);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-28 left-4 right-4 z-[100] mx-auto max-w-md rounded-2xl bg-foreground text-background px-4 py-3 text-center text-sm shadow-lg"
            role="status"
            aria-live="polite"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}
