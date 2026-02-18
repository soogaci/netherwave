"use client";

import { Card } from "@/app/ui/card";
import { Skeleton } from "./skeleton";

export function ChatRowSkeleton() {
  return (
    <Card className="rounded-2xl border-0 bg-card px-3 py-2.5 gap-0 shadow-none">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex justify-between gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
    </Card>
  );
}

export function NotificationSkeleton() {
  return (
    <Card className="rounded-3xl border-0 bg-card p-5 gap-0 shadow-none">
      <div className="flex items-start gap-3">
        <Skeleton className="h-11 w-11 rounded-2xl shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </Card>
  );
}

export function ProfileSkeleton() {
  return (
    <Card className="rounded-3xl border-0 bg-card p-5 gap-0 shadow-none">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-2xl shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
      <div className="mt-4 flex gap-6">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </Card>
  );
}

export function StoriesSkeleton() {
  return (
    <div className="mb-4 flex gap-3 overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1 shrink-0">
          <Skeleton className="h-[50px] w-[50px] rounded-full" />
          <Skeleton className="h-2.5 w-10" />
        </div>
      ))}
    </div>
  );
}

export function MessageBubbleSkeleton({ align = "left" }: { align?: "left" | "right" }) {
  return (
    <div className={`flex ${align === "right" ? "justify-end" : "justify-start"}`}>
      <Skeleton className={`h-10 rounded-2xl ${align === "right" ? "w-48" : "w-40"}`} />
    </div>
  );
}
