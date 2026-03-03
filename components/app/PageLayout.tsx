"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { DesktopSidebar } from "./DesktopSidebar";
import BottomNav from "./BottomNav";
import { PullToRefresh } from "./PullToRefresh";
import { useRefreshContext } from "@/components/providers/RefreshProvider";

const CONTENT_CLASS = "mx-auto w-full max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl px-4 pt-[max(1.5rem,env(safe-area-inset-top))] content-pb-dock md:pb-8 min-h-0 flex-1 flex flex-col md:min-h-[calc(100vh-1px)]";
const MESSAGES_LIST_CLASS = "w-full px-4 pt-[max(1.5rem,env(safe-area-inset-top))] content-pb-dock md:pb-8 min-h-0 flex-1 flex flex-col md:min-h-[calc(100vh-1px)] md:mx-auto md:max-w-2xl lg:max-w-3xl xl:max-w-4xl";

export function PageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChatPage = pathname?.startsWith("/messages/") && pathname !== "/messages";
  const isMessagesList = pathname === "/messages";
  const isFeelsPage = pathname === "/feels";
  const contentClass = [
    isMessagesList ? MESSAGES_LIST_CLASS : CONTENT_CLASS,
    isFeelsPage ? "bg-black" : "",
  ].filter(Boolean).join(" ");
  const refreshCtx = useRefreshContext();
  const onRefresh = React.useCallback(() => refreshCtx?.getRefresh()?.(), [refreshCtx]);

  return (
    <div className="flex flex-col min-h-0 flex-1 w-full md:flex-row md:min-h-screen md:h-screen md:overflow-hidden">
      <DesktopSidebar />
      <PullToRefresh onRefresh={onRefresh} className="flex-1 min-h-0 flex flex-col">
        <div className={contentClass}>
          {children}
        </div>
      </PullToRefresh>
      {!isChatPage && (
        <div className="md:hidden">
          <BottomNav />
        </div>
      )}
    </div>
  );
}
