"use client";

import React from "react";
import { motion } from "framer-motion";
import { Heart, UserPlus, MessageCircle } from "lucide-react";
import { Card } from "../ui/card";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { NotificationSkeleton } from "@/components/ui/skeletons";
import { NOTIFICATIONS } from "@/lib/mock";

const ICONS = {
  like: Heart,
  follow: UserPlus,
  comment: MessageCircle,
} as const;

const LABELS = {
  like: "лайкнул(а) твой трек",
  follow: "подписал(а)ся на тебя",
  comment: "прокомментировал(а) твой пост",
} as const;

export default function NotificationsPage() {
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div>
      <header className="mb-5">
        <div className="text-lg font-semibold">Уведомления</div>
        <div className="text-sm text-muted-foreground">лайки • комментарии • подписки</div>
      </header>

      <div className="space-y-3">
        {loading ? (
          <>
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </>
        ) : (
          NOTIFICATIONS.map((n, i) => {
            const Icon = ICONS[n.type];
            const label = LABELS[n.type];
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 26 }}
              >
                <Card className="rounded-3xl border-0 bg-card p-5 gap-0 shadow-none">
                  <div className="flex items-start gap-3">
                    <AvatarInitials username={n.user} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">@{n.user}</span>
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
                      <div className="mt-1 text-xs text-muted-foreground/80">{n.time}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
