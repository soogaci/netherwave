"use client";

import React from "react";
import dynamic from "next/dynamic";

const MiniPlayer = dynamic(() => import("./MiniPlayer"), { ssr: false });
const Onboarding = dynamic(
  () => import("./Onboarding").then((m) => ({ default: m.Onboarding })),
  { ssr: false }
);

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Onboarding />
      {children}
      <MiniPlayer />
    </>
  );
}
