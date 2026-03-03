"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Settings, Edit3 } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { PageHeader, HeaderBackButton } from "@/components/app/PageHeader";
import { PeopleCard } from "@/components/feed/PeopleCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/components/providers/AuthProvider";
import { useProfile } from "@/components/providers/ProfileProvider";
import { useFeed } from "@/components/providers/FeedProvider";
import { getFollowerCount } from "@/lib/supabase/follows";
import { getFeelsByUserId, getMyReposts } from "@/lib/supabase/feels";
import { useRegisterRefresh } from "@/components/providers/RefreshProvider";
import { LazyFeelCover } from "@/components/ui/LazyFeelCover";
import type { Feel } from "@/lib/types";

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
  const { profile, loading, refresh: refreshProfile } = useProfile();
  const { feed, loading: feedLoading, refresh: refreshFeed, toggleLike } = useFeed();
  const [followerCount, setFollowerCount] = React.useState(0);
  const [myReposts, setMyReposts] = React.useState<Feel[]>([]);
  const [myFeels, setMyFeels] = React.useState<Feel[]>([]);
  const [loadingFeels, setLoadingFeels] = React.useState(false);
  const [loadingReposts, setLoadingReposts] = React.useState(false);
  type ProfileTab = "posts" | "feels" | "reposts";
  const [profileTab, setProfileTab] = React.useState<ProfileTab>("posts");
  const myPosts = feed.filter((p) => p.user === profile?.username);

  const doRefresh = React.useCallback(async () => {
    await Promise.all([refreshFeed(), refreshProfile()]);
    if (profile?.id) {
      const [count, reposts, feels] = await Promise.all([
        getFollowerCount(profile.id),
        getMyReposts(profile.id, user?.id),
        getFeelsByUserId(profile.id, user?.id),
      ]);
      setFollowerCount(count);
      setMyReposts(reposts);
      setMyFeels(feels);
    }
  }, [profile?.id, user?.id, refreshFeed, refreshProfile]);
  useRegisterRefresh(doRefresh);

  React.useEffect(() => {
    if (!profile?.id) return;
    getFollowerCount(profile.id).then(setFollowerCount);
  }, [profile?.id]);
  React.useEffect(() => {
    if (!profile?.id) return;
    setLoadingFeels(true);
    setLoadingReposts(true);
    getFeelsByUserId(profile.id, user?.id).then((list) => {
      setMyFeels(list);
      setLoadingFeels(false);
    });
    getMyReposts(profile.id, user?.id).then((list) => {
      setMyReposts(list);
      setLoadingReposts(false);
    });
  }, [profile?.id, user?.id]);

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
    avatar_url: null,
    followers: 0,
    following: 0,
  };
  const postCount = myPosts.length;

  return (
    <div>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
        <motion.header variants={fadeUp}>
          <PageHeader
            left={<HeaderBackButton />}
            right={
              <Link
                href="/profile/settings"
                className="rounded-full border p-2 text-muted-foreground hover:text-foreground transition"
                aria-label="Настройки"
              >
                <Settings className="h-5 w-5" />
              </Link>
            }
          />
        </motion.header>

        <motion.div variants={fadeUp}>
          <Card className="rounded-3xl border-0 bg-card p-5 gap-0 shadow-none">
            <div className="flex items-start gap-4">
              <AvatarInitials username={p.username} avatarUrl={p.avatar_url} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="text-base font-semibold">{p.display_name}</div>
                <div className="text-sm text-muted-foreground">@{p.username}</div>
                <div className="mt-2 text-sm text-foreground/90">{p.bio || "—"}</div>
              </div>
            </div>

            <div className="mt-4 flex gap-6 text-center text-sm">
              <div><span className="font-semibold">{postCount}</span> <span className="text-muted-foreground">постов</span></div>
              <div><span className="font-semibold">{followerCount}</span> <span className="text-muted-foreground">подписчиков</span></div>
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
          <div className="flex border-b border-border mb-3">
            {(
              [
                { id: "posts" as const, label: "Посты", count: myPosts.length },
                { id: "feels" as const, label: "Feels", count: myFeels.length },
                { id: "reposts" as const, label: "Репосты", count: myReposts.length },
              ] as const
            ).map(({ id, label, count }) => (
              <button
                key={id}
                type="button"
                onClick={() => setProfileTab(id)}
                className={`flex-1 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
                  profileTab === id
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {profileTab === "posts" && (
            <div className="space-y-3">
              {feedLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Обновление...</div>
              ) : myPosts.length ? (
                myPosts.map((post, i) => <PeopleCard key={post.id} item={post} index={i} onLike={toggleLike} />)
              ) : (
                <EmptyState type="no-posts" action={{ href: "/add", label: "Добавить пост" }} />
              )}
            </div>
          )}

          {profileTab === "feels" && (
            <div className="space-y-3">
              {loadingFeels ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Загрузка...</div>
              ) : myFeels.length ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {myFeels.map((feel) => (
                    <Link
                      key={feel.id}
                      href="/feels"
                      className="block relative rounded-xl overflow-hidden bg-muted aspect-[9/16] border border-border"
                    >
                      <LazyFeelCover videoUrl={feel.video_url} className="absolute inset-0 w-full h-full">
                        {feel.description ? (
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-xs line-clamp-2">
                            {feel.description}
                          </div>
                        ) : null}
                      </LazyFeelCover>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
                  <p className="text-sm text-muted-foreground">Пока нет Feels</p>
                  <Link href="/add" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition">
                    Добавить Feels
                  </Link>
                </div>
              )}
            </div>
          )}

          {profileTab === "reposts" && (
            <div className="space-y-3">
              {loadingReposts ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Загрузка...</div>
              ) : myReposts.length ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {myReposts.map((feel) => (
                    <Link
                      key={feel.id}
                      href="/feels"
                      className="block relative rounded-xl overflow-hidden bg-muted aspect-[9/16] border border-border"
                    >
                      <LazyFeelCover videoUrl={feel.video_url} className="absolute inset-0 w-full h-full">
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-xs">
                          {feel.description ? <span className="line-clamp-2">{feel.description}</span> : null}
                          <span className="text-white/80">от @{feel.user}</span>
                        </div>
                      </LazyFeelCover>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
                  <p className="text-sm text-muted-foreground">Пока нет репостов</p>
                  <Link href="/feels" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition">
                    Смотреть Feels
                  </Link>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
