"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, UserPlus, UserCheck, MessageCircle, X } from "lucide-react";
import { Card } from "@/app/ui/card";
import { Badge } from "@/app/ui/badge";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { PeopleCard } from "@/components/feed/PeopleCard";
import { FeedCardSkeleton } from "@/components/feed/FeedCardSkeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRegisterRefresh } from "@/components/providers/RefreshProvider";
import { useProfile } from "@/components/providers/ProfileProvider";
import { useFeed } from "@/components/providers/FeedProvider";
import { getProfileByUsername } from "@/lib/supabase/profiles";
import { isFollowing, follow, unfollow, getFollowerCount, getFollowingCount, getFollowersList, getFollowingList, type FollowerRow } from "@/lib/supabase/follows";
import { getTotalLikesForUser } from "@/lib/supabase/likes-comments";
import { getFeelsByUserId, getMyReposts } from "@/lib/supabase/feels";
import type { Feel } from "@/lib/types";
import { formatLastSeenExact } from "@/lib/format-last-seen";
import { OnlineIndicator } from "@/components/ui/OnlineIndicator";
import { LazyFeelCover } from "@/components/ui/LazyFeelCover";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 26 } },
};

export default function ProfileUsernamePage() {
  const params = useParams<{ username: string }>();
  const username = params?.username ?? "";
  const { user } = useAuth();
  const { profile: myProfile } = useProfile();
  const { feed, loading: feedLoading, refresh: refreshFeed, toggleLike } = useFeed();
  const [profile, setProfile] = React.useState<Awaited<ReturnType<typeof getProfileByUsername>>>(null);
  const [loading, setLoading] = React.useState(true);
  const [following, setFollowing] = React.useState(false);
  const [followerCount, setFollowerCount] = React.useState(0);
  const [followingCount, setFollowingCount] = React.useState(0);
  const [totalLikes, setTotalLikes] = React.useState(0);
  const [listOpen, setListOpen] = React.useState<"followers" | "following" | null>(null);
  const [listItems, setListItems] = React.useState<FollowerRow[]>([]);
  const [listLoading, setListLoading] = React.useState(false);
  type ProfileTab = "posts" | "feels" | "reposts";
  const [profileTab, setProfileTab] = React.useState<ProfileTab>("posts");
  const [userFeels, setUserFeels] = React.useState<Feel[]>([]);
  const [userReposts, setUserReposts] = React.useState<Feel[]>([]);
  const [loadingFeels, setLoadingFeels] = React.useState(false);
  const [loadingReposts, setLoadingReposts] = React.useState(false);

  React.useEffect(() => {
    getProfileByUsername(username).then(async (p) => {
      setProfile(p);
      if (p) {
        const [fc, foc, likes] = await Promise.all([
          getFollowerCount(p.id),
          getFollowingCount(p.id),
          getTotalLikesForUser(p.id),
        ]);
        setFollowerCount(fc);
        setFollowingCount(foc);
        setTotalLikes(likes);
      }
      setLoading(false);
    });
  }, [username]);

  React.useEffect(() => {
    if (!listOpen || !profile) return;
    setListLoading(true);
    (listOpen === "followers" ? getFollowersList(profile.id) : getFollowingList(profile.id))
      .then(setListItems)
      .finally(() => setListLoading(false));
  }, [listOpen, profile?.id]);

  React.useEffect(() => {
    if (!user || !profile) return;
    isFollowing(user.id, profile.id).then(setFollowing);
  }, [user?.id, profile?.id]);

  React.useEffect(() => {
    if (!profile) return;
    setLoadingFeels(true);
    setLoadingReposts(true);
    getFeelsByUserId(profile.id, user?.id).then((list) => {
      setUserFeels(list);
      setLoadingFeels(false);
    });
    getMyReposts(profile.id, user?.id).then((list) => {
      setUserReposts(list);
      setLoadingReposts(false);
    });
  }, [profile?.id, user?.id]);

  const peoplePosts = feed.filter((p) => p.user === username);
  const isMe = myProfile?.username === username;

  const doRefresh = React.useCallback(async () => {
    await refreshFeed();
    const p = await getProfileByUsername(username);
    setProfile(p);
    if (p) {
      const [fc, foc, likes] = await Promise.all([
        getFollowerCount(p.id),
        getFollowingCount(p.id),
        getTotalLikesForUser(p.id),
      ]);
      setFollowerCount(fc);
      setFollowingCount(foc);
      setTotalLikes(likes);
      if (user) isFollowing(user.id, p.id).then(setFollowing);
    }
  }, [username, user?.id, refreshFeed]);
  useRegisterRefresh(doRefresh);

  async function toggleFollow() {
    if (!user || !profile) return;
    if (following) {
      const { error } = await unfollow(user.id, profile.id);
      if (!error) {
        setFollowing(false);
        setFollowerCount((c) => Math.max(0, c - 1));
        setProfile((p) => p ? { ...p, followers: Math.max(0, (p.followers ?? 1) - 1) } : null);
      }
    } else {
      const { error } = await follow(user.id, profile.id);
      if (!error) {
        setFollowing(true);
        setFollowerCount((c) => c + 1);
        setProfile((p) => p ? { ...p, followers: (p.followers ?? 0) + 1 } : null);
      }
    }
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
              <span className="relative shrink-0">
                <AvatarInitials username={username} avatarUrl={profile?.avatar_url} size="lg" />
                <OnlineIndicator lastSeen={profile?.last_seen ?? undefined} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-base font-semibold">{profile.display_name || username}</div>
                <div className="text-sm text-muted-foreground">@{username}</div>
                {profile?.last_seen && (
                  <div className={`mt-1 text-xs ${formatLastSeenExact(profile.last_seen) === "онлайн" ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                    {formatLastSeenExact(profile.last_seen)}
                  </div>
                )}
                <div className="mt-2 text-sm text-foreground/90">{profile.bio || "—"}</div>
              </div>
            </div>

            <div className="mt-4 flex gap-6 text-center text-sm">
              <div><span className="font-semibold">{totalLikes}</span> <span className="text-muted-foreground">лайков</span></div>
              <button
                type="button"
                onClick={() => setListOpen("followers")}
                className="text-left hover:opacity-80 transition"
              >
                <motion.span
                  key={followerCount}
                  initial={{ y: -8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="font-semibold inline-block"
                >
                  {followerCount}
                </motion.span>{" "}
                <span className="text-muted-foreground">подписчиков</span>
              </button>
              <button
                type="button"
                onClick={() => setListOpen("following")}
                className="text-left hover:opacity-80 transition"
              >
                <span className="font-semibold">{followingCount}</span>{" "}
                <span className="text-muted-foreground">подписок</span>
              </button>
            </div>

            {(profile.tags?.length ?? 0) > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(profile.tags ?? []).map((t: string) => (
                  <Badge key={t} className="rounded-full" variant="secondary">{t}</Badge>
                ))}
              </div>
            )}

            {!isMe && (
              <div className="mt-5 flex gap-2">
                {user && (
                  <Link
                    href={`/messages/dm-${[user.id, profile.id].sort().join("_")}`}
                    className="flex-1 rounded-2xl py-2.5 text-sm font-medium border text-foreground hover:bg-muted/50 transition inline-flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Написать
                  </Link>
                )}
                <motion.button
                  type="button"
                  onClick={toggleFollow}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-1 rounded-2xl py-2.5 text-sm font-medium transition inline-flex items-center justify-center gap-2 ${
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

        <AnimatePresence>
          {listOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50"
                onClick={() => setListOpen(null)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] rounded-t-3xl bg-background flex flex-col shadow-xl"
              >
                <div className="p-4 border-b flex items-center justify-between shrink-0">
                  <span className="font-semibold">
                    {listOpen === "followers" ? "Подписчики" : "Подписки"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setListOpen(null)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground"
                    aria-label="Закрыть"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-2">
                  {listLoading ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">Загрузка...</div>
                  ) : listItems.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      {listOpen === "followers" ? "Нет подписчиков" : "Нет подписок"}
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {listItems.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={`/profile/${item.username}`}
                            onClick={() => setListOpen(null)}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/60 transition"
                          >
                            <AvatarInitials username={item.username} avatarUrl={item.avatar_url ?? undefined} size="sm" className="!h-10 !w-10" />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">{item.display_name || item.username}</div>
                              <div className="text-xs text-muted-foreground truncate">@{item.username}</div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <motion.div variants={fadeUp}>
          <div className="flex border-b border-border mb-3">
            {(
              [
                { id: "posts" as const, label: "Посты", count: peoplePosts.length },
                { id: "feels" as const, label: "Feels", count: userFeels.length },
                { id: "reposts" as const, label: "Репосты", count: userReposts.length },
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
              ) : peoplePosts.length ? (
                peoplePosts.map((p, i) => <PeopleCard key={p.id} item={p} index={i} onLike={toggleLike} />)
              ) : (
                <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Пока нет постов
                </div>
              )}
            </div>
          )}

          {profileTab === "feels" && (
            <div className="space-y-3">
              {loadingFeels ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Загрузка...</div>
              ) : userFeels.length ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {userFeels.map((feel) => (
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
                <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Пока нет Feels
                </div>
              )}
            </div>
          )}

          {profileTab === "reposts" && (
            <div className="space-y-3">
              {loadingReposts ? (
                <>
                  <FeedCardSkeleton />
                  <FeedCardSkeleton />
                  <FeedCardSkeleton />
                </>
              ) : userReposts.length ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {userReposts.map((feel) => (
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
                <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Пока нет репостов
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
