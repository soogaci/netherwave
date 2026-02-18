"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "./AppShell";
import { PageLayout } from "./PageLayout";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <AppShell>
      <div className="safe-area-padding pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] md:h-screen md:overflow-hidden">
        <PageLayout>{children}</PageLayout>
      </div>
    </AppShell>
  );
}
