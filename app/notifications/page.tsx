"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, UserPlus, MessageCircle } from "lucide-react";
import { Card } from "../ui/card";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader, HeaderBackButton } from "@/components/app/PageHeader";
import { NotificationSkeleton } from "@/components/ui/skeletons";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRegisterRefresh } from "@/components/providers/RefreshProvider";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import type { NotificationItem } from "@/lib/types";

const ICONS = {
  like: Heart,
  follow: UserPlus,
  comment: MessageCircle,
} as const;

export default function NotificationsPage() {
  const { user } = useAuth();
  const { list, loading, refresh } = useNotifications();
  useRegisterRefresh(refresh);

  return (
    <div>
      <PageHeader left={<HeaderBackButton />} title="Уведомления" />

      <div className="space-y-3">
        {loading ? (
          <>
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </>
        ) : !user ? (
          <div className="py-6">
            <EmptyState type="no-notifications" action={{ href: "/auth", label: "Войти" }} />
          </div>
        ) : list.length === 0 ? (
          <EmptyState type="no-notifications" action={{ href: "/", label: "В ленту" }} />
        ) : (
          list.map((n, i) => {
            const Icon = ICONS[n.type];
            const label = n.type === "follow" ? n.text : `${n.text} твой пост`;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 26 }}
              >
                <Link href={`/profile/${n.user}`}>
                  <Card className="rounded-3xl border-0 bg-card p-5 gap-0 shadow-none hover:opacity-95 transition">
                    <div className="flex items-start gap-3">
                      <AvatarInitials username={n.user} avatarUrl={n.avatar_url} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-semibold truncate">@{n.user}</span>
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground truncate">{label}</div>
                        <div className="mt-1 text-xs text-muted-foreground/80">{n.time}</div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
