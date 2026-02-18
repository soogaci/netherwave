"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, UserPlus, UserCheck } from "lucide-react";
import { Card } from "@/app/ui/card";
import { Badge } from "@/app/ui/badge";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { PeopleCard } from "@/components/feed/PeopleCard";
import { useProfile } from "@/components/providers/ProfileProvider";
import { useFeed } from "@/components/providers/FeedProvider";
import { getProfileByUsername } from "@/lib/supabase/profiles";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 26 } },
};

export default function ProfileUsernamePage() {
  const params = useParams<{ username: string }>();
  const username = params?.username ?? "";
  const { profile: myProfile } = useProfile();
  const { feed } = useFeed();
  const [profile, setProfile] = React.useState<Awaited<ReturnType<typeof getProfileByUsername>>>(null);
  const [loading, setLoading] = React.useState(true);
  const [following, setFollowing] = React.useState(false);
  const [followerCount, setFollowerCount] = React.useState(0);

  React.useEffect(() => {
    getProfileByUsername(username).then((p) => {
      setProfile(p);
      setFollowerCount(p?.followers ?? 0);
      setLoading(false);
    });
  }, [username]);

  const peoplePosts = feed.filter((p) => p.user === username);
  const isMe = myProfile?.username === username;

  function toggleFollow() {
    setFollowing((v) => !v);
    setFollowerCount((c) => c + (following ? -1 : 1));
  }

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← На главную</Link>
        <div className="mt-8 text-center text-muted-foreground">Пользователь не найден</div>
      </div>
    );
  }

  return (
    <div>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
        <motion.header variants={fadeUp} className="flex items-center gap-2">
          <Link
            href={isMe ? "/profile" : "/"}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border text-muted-foreground hover:text-foreground transition"
            aria-label="Назад"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <div className="truncate text-base font-semibold">@{username}</div>
            <div className="text-xs text-muted-foreground">профиль</div>
          </div>
        </motion.header>

        <motion.div variants={fadeUp}>
          <Card className="rounded-3xl border-0 bg-card p-5 gap-0 shadow-none">
            <div className="flex items-start gap-4">
              <AvatarInitials username={username} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="text-base font-semibold">{profile.display_name || username}</div>
                <div className="text-sm text-muted-foreground">@{username}</div>
                <div className="mt-2 text-sm text-foreground/90">{profile.bio || "—"}</div>
              </div>
            </div>

            <div className="mt-4 flex gap-6 text-center text-sm">
              <div><span className="font-semibold">{peoplePosts.length}</span> <span className="text-muted-foreground">постов</span></div>
              <div>
                <motion.span
                  key={followerCount}
                  initial={{ y: -8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="font-semibold inline-block"
                >
                  {followerCount}
                </motion.span>{" "}
                <span className="text-muted-foreground">подписчиков</span>
              </div>
              <div><span className="font-semibold">{profile.following}</span> <span className="text-muted-foreground">подписок</span></div>
            </div>

            {(profile.tags?.length ?? 0) > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(profile.tags ?? []).map((t: string) => (
                  <Badge key={t} className="rounded-full" variant="secondary">{t}</Badge>
                ))}
              </div>
            )}

            {!isMe && (
              <div className="mt-5">
                <motion.button
                  type="button"
                  onClick={toggleFollow}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full rounded-2xl py-2.5 text-sm font-medium transition inline-flex items-center justify-center gap-2 ${
                    following
                      ? "border text-muted-foreground hover:text-foreground"
                      : "bg-foreground text-background hover:opacity-90"
                  }`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {following ? (
                      <motion.span
                        key="following"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="inline-flex items-center gap-1.5"
                      >
                        <UserCheck className="h-4 w-4" />
                        Подписан
                      </motion.span>
                    ) : (
                      <motion.span
                        key="follow"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="inline-flex items-center gap-1.5"
                      >
                        <UserPlus className="h-4 w-4" />
                        Подписаться
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <div className="text-sm font-medium text-muted-foreground mb-3">
            Посты ({peoplePosts.length})
          </div>
          <div className="space-y-3">
            {peoplePosts.length ? (
              peoplePosts.map((p, i) => <PeopleCard key={p.id} item={p} index={i} />)
            ) : (
              <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Пока нет постов
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
