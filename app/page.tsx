"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Search, X } from "lucide-react";

import { PeopleCard } from "@/components/feed/PeopleCard";
import { MusicCard } from "@/components/feed/MusicCard";
import { FeedCardSkeleton } from "@/components/feed/FeedCardSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetherwaveLogo } from "@/components/ui/NetherwaveLogo";
import { TABS } from "@/lib/mock";
import { useFeed } from "@/components/providers/FeedProvider";
import type { PeoplePost, MusicPost } from "@/lib/types";

/* ── Search bar (Google widget style) ── */
function SearchBar({
  query,
  setQuery,
  open,
  setOpen,
}: {
  query: string;
  setQuery: (q: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div className="mb-4">
      <motion.div
        layout
        onClick={() => !open && setOpen(true)}
        className={[
          "flex items-center gap-2 rounded-2xl border backdrop-blur overflow-hidden transition-colors",
          open ? "bg-background/80 p-2.5" : "bg-card/80 px-4 py-3 cursor-pointer hover:bg-card",
        ].join(" ")}
      >
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        {open ? (
          <motion.input
            ref={inputRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Люди, посты, теги, музыка..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            onKeyDown={(e) => { if (e.key === "Escape") { setOpen(false); setQuery(""); } }}
          />
        ) : (
          <motion.span layout="position" className="text-sm text-muted-foreground">
            Поиск
          </motion.span>
        )}
        <AnimatePresence>
          {open && (
            <motion.button
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(false); setQuery(""); }}
              className="text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Закрыть"
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function matchPeopleQuery(item: PeoplePost, q: string) {
  const lower = q.trim().toLowerCase();
  if (!lower) return true;
  const parts = [item.text, item.user, ...(item.tags ?? [])].filter(Boolean).join(" ").toLowerCase();
  return parts.includes(lower) || item.tags?.some((t) => t.toLowerCase().includes(lower));
}

function matchMusicQuery(item: MusicPost, q: string) {
  const lower = q.trim().toLowerCase();
  if (!lower) return true;
  const parts = [item.track, item.artist, item.mood, item.user, ...(item.tags ?? [])].filter(Boolean).join(" ").toLowerCase();
  return parts.includes(lower) || item.tags?.some((t) => t.toLowerCase().includes(lower));
}

/* ── Main feed content ── */
function HomeContent() {
  const searchParams = useSearchParams();
  const tagFromUrl = searchParams.get("tag");
  const { feed, subs, musicFeed, loading: feedLoading, refresh } = useFeed();
  const [tabIndex, setTabIndex] = React.useState(0);
  const [searchOpen, setSearchOpen] = React.useState(!!tagFromUrl);
  const [searchQuery, setSearchQuery] = React.useState(tagFromUrl ?? "");
  const [refreshing, setRefreshing] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setInitialLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const filteredFeed = React.useMemo(() => {
    if (!searchQuery.trim()) return feed;
    return feed.filter((p) => matchPeopleQuery(p, searchQuery));
  }, [feed, searchQuery]);

  const filteredSubs = React.useMemo(() => {
    if (!searchQuery.trim()) return subs;
    return subs.filter((p) => matchPeopleQuery(p, searchQuery));
  }, [subs, searchQuery]);

  const filteredMusic = React.useMemo(() => {
    if (!searchQuery.trim()) return musicFeed;
    return musicFeed.filter((m) => matchMusicQuery(m, searchQuery));
  }, [musicFeed, searchQuery]);

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const feedPanel = (
    <>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="text-sm font-medium">Рекомендации</div>
          <div className="text-xs text-muted-foreground">новые сверху</div>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-xs text-muted-foreground/80 hover:text-muted-foreground disabled:opacity-50 transition rounded-lg px-1"
        >
          <RefreshCw className={`inline h-3.5 w-3.5 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          Обновить
        </button>
      </div>
      <section className="space-y-4">
        {initialLoading || refreshing || feedLoading ? (
          <>
            <FeedCardSkeleton />
            <FeedCardSkeleton />
            <FeedCardSkeleton />
          </>
        ) : filteredFeed.length || filteredMusic.length ? (
          <>
            {filteredFeed.map((item, i) => (
              <PeopleCard key={item.id} item={item} index={i} />
            ))}
                  {filteredMusic.map((item) => (
                    <MusicCard key={item.id} item={item} />
                  ))}
          </>
        ) : (
          <EmptyState type="no-results" />
        )}
      </section>
    </>
  );

  const subsPanel = (
    <>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="text-sm font-medium">Подписки</div>
          <div className="text-xs text-muted-foreground">посты тех, на кого подписан</div>
        </div>
      </div>
      <section className="space-y-4">
        {initialLoading || feedLoading ? (
          <>
            <FeedCardSkeleton />
            <FeedCardSkeleton />
          </>
        ) : filteredSubs.length || filteredMusic.length ? (
          <>
            {filteredSubs.map((p, i) => <PeopleCard key={p.id} item={p} index={i} />)}
                  {filteredMusic.map((m) => <MusicCard key={m.id} item={m} />)}
          </>
        ) : (
          <EmptyState type="no-posts" />
        )}
      </section>
    </>
  );

  return (
    <div className="relative">
      {/* Subtle gradient orbs */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-violet-500/5 blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-40 left-0 w-32 h-32 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none -z-10" />

      <header className="mb-3 flex flex-col items-start gap-0 pt-1">
        <div className="text-lg font-semibold leading-tight tracking-tight">Netherwave</div>
        <NetherwaveLogo size="sm" className="mt-1" />
      </header>

      <SearchBar
        query={searchQuery}
        setQuery={setSearchQuery}
        open={searchOpen}
        setOpen={setSearchOpen}
      />

      <div className="relative rounded-2xl bg-background/60 p-1 border backdrop-blur overflow-hidden">
        <div className="grid grid-cols-2 relative z-10">
          {TABS.map((t, i) => {
            const active = i === tabIndex;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTabIndex(i)}
                className={[
                  "py-2 text-sm rounded-xl transition",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <div
          className="absolute bottom-1 h-[2px] bg-foreground/80 rounded-full transition-all duration-200"
          style={{
            width: `calc((100% - 8px) / ${TABS.length})`,
            left: `calc(4px + ${tabIndex} * ((100% - 8px) / ${TABS.length}))`,
          }}
        />
      </div>

          <div className="mt-4">
        {tabIndex === 0 ? feedPanel : subsPanel}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div>
            <div className="mb-5 h-9 w-48 rounded-lg bg-muted animate-pulse" />
            <div className="h-12 w-full rounded-2xl bg-muted animate-pulse" />
            <div className="mt-4 h-64 w-full rounded-2xl bg-muted animate-pulse" />
          </div>
        }
      >
        <HomeContent />
      </Suspense>
    </ErrorBoundary>
  );
}
