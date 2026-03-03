"use client";

import React from "react";

type RefreshContextValue = {
  registerRefresh: (fn: () => Promise<void> | void) => void;
  unregisterRefresh: () => void;
  getRefresh: () => (() => Promise<void> | void) | null;
};

const RefreshContext = React.createContext<RefreshContextValue | null>(null);

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const refreshRef = React.useRef<(() => Promise<void> | void) | null>(null);

  const value = React.useMemo(
    () => ({
      registerRefresh: (fn: () => Promise<void> | void) => {
        refreshRef.current = fn;
      },
      unregisterRefresh: () => {
        refreshRef.current = null;
      },
      getRefresh: () => refreshRef.current,
    }),
    []
  );

  return (
    <RefreshContext.Provider value={value}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefreshContext() {
  return React.useContext(RefreshContext);
}

export function useRegisterRefresh(refreshFn: () => Promise<void> | void) {
  const ctx = useRefreshContext();
  const fnRef = React.useRef(refreshFn);
  fnRef.current = refreshFn;
  React.useEffect(() => {
    const stable = () => fnRef.current?.();
    ctx?.registerRefresh(stable);
    return () => ctx?.unregisterRefresh();
  }, [ctx]);
}
