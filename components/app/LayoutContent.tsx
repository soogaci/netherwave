"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "./AppShell";
import { PageLayout } from "./PageLayout";
import { RefreshProvider } from "@/components/providers/RefreshProvider";
import { AppReadyProvider } from "@/components/providers/AppReadyProvider";
import { BackgroundRefresh } from "./BackgroundRefresh";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");
  const isChatPage = pathname?.startsWith("/messages/") && pathname !== "/messages";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <RefreshProvider>
      <AppShell>
        <div className="app-shell">
          <AppReadyProvider showBottomBar={!isChatPage}>
            <BackgroundRefresh />
            <PageLayout>{children}</PageLayout>
          </AppReadyProvider>
        </div>
      </AppShell>
    </RefreshProvider>
  );
}
