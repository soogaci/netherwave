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

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <RefreshProvider>
      <AppShell>
        <div className="min-h-[100dvh] h-[100dvh] max-h-[100dvh] md:h-screen md:max-h-none md:min-h-0 overflow-hidden flex flex-col bg-background">
          <AppReadyProvider>
            <BackgroundRefresh />
            <PageLayout>{children}</PageLayout>
          </AppReadyProvider>
        </div>
      </AppShell>
    </RefreshProvider>
  );
}
