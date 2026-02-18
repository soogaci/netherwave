"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Settings, Edit3 } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { NetherwaveLogo } from "@/components/ui/NetherwaveLogo";
import { USER_PROFILES, PEOPLE } from "@/lib/mock";
import { PeopleCard } from "@/components/feed/PeopleCard";

const CURRENT_USER = "s1dead";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 26 } },
};

export default function ProfilePage() {
  const profile = USER_PROFILES[CURRENT_USER];
  const myPosts = PEOPLE.filter((p) => p.user === CURRENT_USER);

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
              <AvatarInitials username={CURRENT_USER} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="text-base font-semibold">{profile.displayName}</div>
                <div className="text-sm text-muted-foreground">@{profile.username}</div>
                <div className="mt-2 text-sm text-foreground/90">{profile.bio}</div>
              </div>
            </div>

            <div className="mt-4 flex gap-6 text-center text-sm">
              <div><span className="font-semibold">{profile.posts}</span> <span className="text-muted-foreground">постов</span></div>
              <div><span className="font-semibold">{profile.followers}</span> <span className="text-muted-foreground">подписчиков</span></div>
              <div><span className="font-semibold">{profile.following}</span> <span className="text-muted-foreground">подписок</span></div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {profile.tags.map((t) => (
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
              myPosts.map((p, i) => <PeopleCard key={p.id} item={p} index={i} />)
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
