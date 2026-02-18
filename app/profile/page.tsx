"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Settings, Edit3 } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { NetherwaveLogo } from "@/components/ui/NetherwaveLogo";
import { PeopleCard } from "@/components/feed/PeopleCard";
import { useAuth } from "@/components/providers/AuthProvider";
import { useProfile } from "@/components/providers/ProfileProvider";
import { useFeed } from "@/components/providers/FeedProvider";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 26 } },
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, loading } = useProfile();
  const { feed } = useFeed();
  const myPosts = feed.filter((p) => p.user === profile?.username);

  if (!user) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Войди, чтобы видеть профиль</p>
        <Link href="/auth" className="mt-4 inline-block text-sm font-medium text-foreground underline">
          Войти
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  const p = profile ?? {
    username: user.user_metadata?.username ?? "user",
    display_name: user.user_metadata?.username ?? "Пользователь",
    bio: "",
    tags: [],
    followers: 0,
    following: 0,
  };
  const postCount = myPosts.length;

  return (
    <div>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
        <motion.header variants={fadeUp} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <NetherwaveLogo size="sm" />
            <div>
              <div className="text-lg font-semibold">Профиль</div>
              <div className="text-sm text-muted-foreground">Netherwave</div>
            </div>
          </div>
          <Link
            href="/profile/settings"
            className="rounded-full border p-2 text-muted-foreground hover:text-foreground transition"
            aria-label="Настройки"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </motion.header>

        <motion.div variants={fadeUp}>
          <Card className="rounded-3xl border-0 bg-card p-5 gap-0 shadow-none">
            <div className="flex items-start gap-4">
              <AvatarInitials username={p.username} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="text-base font-semibold">{p.display_name}</div>
                <div className="text-sm text-muted-foreground">@{p.username}</div>
                <div className="mt-2 text-sm text-foreground/90">{p.bio || "—"}</div>
              </div>
            </div>

            <div className="mt-4 flex gap-6 text-center text-sm">
              <div><span className="font-semibold">{postCount}</span> <span className="text-muted-foreground">постов</span></div>
              <div><span className="font-semibold">{p.followers}</span> <span className="text-muted-foreground">подписчиков</span></div>
              <div><span className="font-semibold">{p.following}</span> <span className="text-muted-foreground">подписок</span></div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(p.tags || []).map((t: string) => (
                <Badge key={t} className="rounded-full" variant="secondary">{t}</Badge>
              ))}
            </div>

            <div className="mt-5">
              <Link
                href="/profile/edit"
                className="w-full rounded-2xl border py-2 text-center text-sm font-medium hover:bg-muted/50 transition inline-flex items-center justify-center gap-1.5"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Редактировать
              </Link>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <div className="text-sm font-medium text-muted-foreground mb-3">Мои посты</div>
          <div className="space-y-3">
            {myPosts.length ? (
              myPosts.map((post, i) => <PeopleCard key={post.id} item={post} index={i} />)
            ) : (
              <Card className="rounded-2xl border-0 bg-card p-5 gap-0 shadow-none">
                <div className="text-sm text-muted-foreground">Пока нет постов</div>
              </Card>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
