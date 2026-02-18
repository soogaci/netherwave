"use client";

import { Card } from "@/app/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function FeedCardSkeleton() {
  return (
    <Card className="rounded-3xl border-0 bg-card p-5">
      <div className="flex items-start gap-3">
        <Skeleton className="h-11 w-11 rounded-2xl shrink-0" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex justify-between gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
<Skeleton className="h-4 max-w-[75%]" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </Card>
  );
}
