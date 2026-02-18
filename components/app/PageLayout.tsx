"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { DesktopSidebar } from "./DesktopSidebar";
import BottomNav from "./BottomNav";

const CONTENT_CLASS = "mx-auto w-full max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl px-4 pt-6 pb-28 md:pb-8 min-h-[calc(100vh-1px)]";

export function PageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChatPage = pathname?.startsWith("/messages/") && pathname !== "/messages";

  return (
    <div className="flex min-h-screen md:h-screen md:overflow-hidden">
      <DesktopSidebar />
      <div className="flex-1 min-w-0 min-h-0 overflow-auto">
        <div className={CONTENT_CLASS}>
          {children}
        </div>
      </div>
      {!isChatPage && (
        <div className="md:hidden">
          <BottomNav />
        </div>
      )}
    </div>
  );
}
