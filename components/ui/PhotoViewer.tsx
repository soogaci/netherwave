"use client";

import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Send, Search } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { getChatsForUser } from "@/lib/supabase/chats";
import { searchProfilesByUsername } from "@/lib/supabase/profiles";
import { sendMessage } from "@/lib/supabase/messages";
import type { Chat } from "@/lib/types";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { useToast } from "@/components/providers/ToastProvider";

export type PhotoViewerSource = {
  url: string;
  name?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  sources: PhotoViewerSource[];
  initialIndex?: number;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_HIDE_UI_THRESHOLD = 1.05;
const EDGE_ZONE_WIDTH = "15%";
const DISMISS_THRESHOLD = 80;
const PAN_CLAMP_FACTOR = 0.5;

export function PhotoViewer({ open, onClose, sources, initialIndex = 0 }: Props) {
  const { user } = useAuth();
  const toast = useToast();
  const [index, setIndex] = React.useState(initialIndex);
  const [forwardOpen, setForwardOpen] = React.useState(false);
  const [chats, setChats] = React.useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<{ id: string; username: string }[]>([]);
  const [selectedChatIds, setSelectedChatIds] = React.useState<Set<string>>(new Set());
  const [sending, setSending] = React.useState(false);

  const [scale, setScale] = React.useState(MIN_SCALE);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [uiVisible, setUiVisible] = React.useState(true);
  const [exiting, setExiting] = React.useState(false);
  const [dragDismissY, setDragDismissY] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const panStartRef = React.useRef<{ clientX: number; clientY: number; position: { x: number; y: number } } | null>(null);
  const gestureModeRef = React.useRef<"dismiss" | "horizontal" | null>(null);
  const positionRef = React.useRef(position);
  const scaleRef = React.useRef(scale);
  positionRef.current = position;
  scaleRef.current = scale;

  const source = sources[index];
  const hasMultiple = sources.length > 1;
  const showUi = uiVisible && scale <= ZOOM_HIDE_UI_THRESHOLD;

  React.useEffect(() => {
    if (!open) return;
    setIndex(Math.min(initialIndex, Math.max(0, sources.length - 1)));
    setScale(MIN_SCALE);
    setPosition({ x: 0, y: 0 });
    setUiVisible(true);
    setExiting(false);
    setDragDismissY(0);
  }, [open, initialIndex, sources.length]);

  React.useEffect(() => {
    if (!open || !user) return;
    getChatsForUser(user.id).then(setChats);
  }, [open, user?.id]);

  React.useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    searchProfilesByUsername(searchQuery).then((list) =>
      setSearchResults(list.map((p) => ({ id: p.id, username: p.username })))
    );
  }, [searchQuery]);

  const goPrev = React.useCallback(() => {
    if (index <= 0) return;
    setIndex((i) => i - 1);
    setScale(MIN_SCALE);
    setPosition({ x: 0, y: 0 });
  }, [index]);

  const goNext = React.useCallback(() => {
    if (index >= sources.length - 1) return;
    setIndex((i) => i + 1);
    setScale(MIN_SCALE);
    setPosition({ x: 0, y: 0 });
  }, [index, sources.length]);

  const clampPosition = React.useCallback((pos: { x: number; y: number }, s: number) => {
    if (s <= MIN_SCALE) return { x: 0, y: 0 };
    const maxX = (typeof window !== "undefined" ? window.innerWidth : 400) * PAN_CLAMP_FACTOR * (s - 1);
    const maxY = (typeof window !== "undefined" ? window.innerHeight : 600) * PAN_CLAMP_FACTOR * (s - 1);
    return {
      x: Math.max(-maxX, Math.min(maxX, pos.x)),
      y: Math.max(-maxY, Math.min(maxY, pos.y)),
    };
  }, []);

  const handleWheel = React.useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const cursorRelX = e.clientX - centerX;
      const cursorRelY = e.clientY - centerY;
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      setScale((s) => {
        const s2 = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta));
        setPosition((pos) => {
          const factor = 1 - s2 / s;
          const next = {
            x: pos.x + (cursorRelX - pos.x) * factor,
            y: pos.y + (cursorRelY - pos.y) * factor,
          };
          return clampPosition(next, s2);
        });
        return s2;
      });
    },
    [clampPosition]
  );

  const handleImageClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale > ZOOM_HIDE_UI_THRESHOLD) return;
    setUiVisible((v) => !v);
  }, [scale]);

  const requestClose = React.useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setExiting(true);
  }, []);
  const handleBackdropClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (justPannedRef.current) {
        justPannedRef.current = false;
        return;
      }
      if (scale > MIN_SCALE) {
        setScale(MIN_SCALE);
        setPosition({ x: 0, y: 0 });
      } else {
        requestClose();
      }
    },
    [scale, requestClose]
  );

  React.useEffect(() => {
    setUiVisible(scale <= ZOOM_HIDE_UI_THRESHOLD);
  }, [scale]);

  function handleSave() {
    if (!source?.url) return;
    const a = document.createElement("a");
    a.href = source.url;
    a.download = source.name || "photo.jpg";
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast?.("Сохранено");
  }

  function toggleChat(chatId: string) {
    setSelectedChatIds((prev) => {
      const next = new Set(prev);
      if (next.has(chatId)) next.delete(chatId);
      else next.add(chatId);
      return next;
    });
  }

  function toggleUser(userId: string) {
    if (!user) return;
    const chatId = `dm-${[user.id, userId].sort().join("_")}`;
    toggleChat(chatId);
  }

  async function handleForward() {
    if (!user || !source?.url || selectedChatIds.size === 0) return;
    setSending(true);
    const attachment = { name: source.name || "photo.jpg", size: "фото", url: source.url };
    let ok = 0;
    for (const chatId of selectedChatIds) {
      const { error } = await sendMessage(chatId, user.id, { attachment });
      if (!error) ok++;
    }
    setSending(false);
    setForwardOpen(false);
    setSelectedChatIds(new Set());
    onClose();
    toast?.(ok > 0 ? `Переслано в ${ok} диалог(ов)` : "Ошибка пересылки");
  }

  const touchStart = React.useRef<{ x: number; clientX: number; clientY: number } | null>(null);
  const pinchStart = React.useRef<{ distance: number; scale: number } | null>(null);
  const dismissStartYRef = React.useRef(0);
  const dismissDragStartRef = React.useRef<number | null>(null);
  const justPannedRef = React.useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      pinchStart.current = { distance: d, scale };
      touchStart.current = null;
      panStartRef.current = null;
      gestureModeRef.current = null;
    } else if (e.touches.length === 1) {
      const tx = e.touches[0].clientX;
      const ty = e.touches[0].clientY;
      if (scaleRef.current > MIN_SCALE) {
        panStartRef.current = { clientX: tx, clientY: ty, position: { ...positionRef.current } };
        touchStart.current = null;
        gestureModeRef.current = null;
      } else {
        touchStart.current = { x: tx, clientX: tx, clientY: ty };
        panStartRef.current = null;
        gestureModeRef.current = null;
        dismissStartYRef.current = ty;
        setDragDismissY(0);
      }
      pinchStart.current = null;
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStart.current) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const ratio = d / pinchStart.current.distance;
      setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchStart.current!.scale * ratio)));
      return;
    }
    if (e.touches.length === 1) {
      const tx = e.touches[0].clientX;
      const ty = e.touches[0].clientY;
      if (panStartRef.current) {
        const dx = tx - panStartRef.current.clientX;
        const dy = ty - panStartRef.current.clientY;
        setPosition((pos) => {
          const next = {
            x: panStartRef.current!.position.x + dx,
            y: panStartRef.current!.position.y + dy,
          };
          return clampPosition(next, scaleRef.current);
        });
        return;
      }
      if (touchStart.current) {
        const dx = tx - touchStart.current.clientX;
        const dy = ty - touchStart.current.clientY;
        if (gestureModeRef.current === null) {
          if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            gestureModeRef.current = Math.abs(dy) >= Math.abs(dx) ? "dismiss" : "horizontal";
          }
        }
        if (gestureModeRef.current === "dismiss") {
          setDragDismissY(dy);
        }
      }
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 2) return;
    pinchStart.current = null;
    if (e.touches.length === 0) {
      if (panStartRef.current) panStartRef.current = null;
      if (touchStart.current && gestureModeRef.current === "horizontal" && hasMultiple) {
        const dx = e.changedTouches[0].clientX - touchStart.current.clientX;
        if (dx > 50) goPrev();
        else if (dx < -50) goNext();
      }
      if (gestureModeRef.current === "dismiss" && Math.abs(dragDismissY) >= DISMISS_THRESHOLD) {
        setExiting(true);
      } else {
        setDragDismissY(0);
      }
      touchStart.current = null;
      gestureModeRef.current = null;
    }
  };

  const onMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (scale > MIN_SCALE) {
        e.preventDefault();
        panStartRef.current = { clientX: e.clientX, clientY: e.clientY, position: { ...position } };
        dismissDragStartRef.current = null;
      } else {
        dismissDragStartRef.current = e.clientY;
      }
    },
    [scale, position]
  );
  const onMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (panStartRef.current) {
        const dx = e.clientX - panStartRef.current.clientX;
        const dy = e.clientY - panStartRef.current.clientY;
        setPosition((pos) => {
          const next = {
            x: panStartRef.current!.position.x + dx,
            y: panStartRef.current!.position.y + dy,
          };
          return clampPosition(next, scale);
        });
        return;
      }
      if (dismissDragStartRef.current !== null) {
        setDragDismissY(e.clientY - dismissDragStartRef.current);
      }
    },
    [scale, clampPosition]
  );
  const onMouseUp = React.useCallback(() => {
    if (panStartRef.current) {
      justPannedRef.current = true;
      panStartRef.current = null;
    }
    if (dismissDragStartRef.current !== null) {
      if (Math.abs(dragDismissY) >= DISMISS_THRESHOLD) setExiting(true);
      else setDragDismissY(0);
      dismissDragStartRef.current = null;
    }
  }, [dragDismissY]);

  if (!open) return null;

  const overlay = (
    <AnimatePresence>
      <motion.div
        key="photo-viewer"
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: exiting ? 0 : 1, y: dragDismissY }}
        exit={{ opacity: 0 }}
        transition={{ duration: exiting ? 0.2 : 0.15 }}
        onAnimationComplete={() => {
          if (exiting) onClose();
        }}
        className="fixed inset-0 z-[200] flex flex-col bg-black touch-none"
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ touchAction: "none" }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          onClick={handleBackdropClick}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {source && (
            <motion.div
              key={source.url}
              initial={{ opacity: 0.95 }}
              animate={{ opacity: 1, scale, x: position.x, y: position.y }}
              transition={{ type: "tween", duration: 0.15 }}
              className="flex items-center justify-center w-full h-full origin-center"
              style={{ transformOrigin: "center center" }}
              onClick={handleImageClick}
            >
              <img
                ref={imageRef}
                src={source.url}
                alt=""
                className="max-w-full max-h-full object-contain select-none pointer-events-auto"
                draggable={false}
                style={{ touchAction: "none" }}
              />
            </motion.div>
          )}
        </div>

        {/* UI overlay */}
        <AnimatePresence>
          {showUi && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.6) 100%)" }}
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-auto"
              >
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); requestClose(e); }}
                  className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70"
                  aria-label="Закрыть"
                >
                  <X className="h-5 w-5" />
                </button>
                {hasMultiple && (
                  <span className="text-white/90 text-sm">
                    {index + 1} / {sources.length}
                  </span>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 py-4 px-4 safe-area-pb pointer-events-auto"
              >
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/15 text-white text-sm font-medium hover:bg-white/25"
                >
                  <Download className="h-4 w-4" />
                  Сохранить
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setForwardOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/15 text-white text-sm font-medium hover:bg-white/25"
                >
                  <Send className="h-4 w-4" />
                  Переслать
                </motion.button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {hasMultiple && (
          <>
            <div
              role="button"
              tabIndex={0}
              aria-label="Предыдущее фото"
              className="absolute left-0 top-0 bottom-0 z-10 cursor-default pointer-events-auto"
              style={{ width: EDGE_ZONE_WIDTH, minWidth: 40 }}
              onClick={(e) => { e.stopPropagation(); if (index > 0) goPrev(); }}
            />
            <div
              role="button"
              tabIndex={0}
              aria-label="Следующее фото"
              className="absolute right-0 top-0 bottom-0 z-10 cursor-default pointer-events-auto"
              style={{ width: EDGE_ZONE_WIDTH, minWidth: 40 }}
              onClick={(e) => { e.stopPropagation(); if (index < sources.length - 1) goNext(); }}
            />
          </>
        )}

        {/* Forward sheet */}
        <AnimatePresence>
          {forwardOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[210] bg-black/60"
                onClick={() => setForwardOpen(false)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-[220] max-h-[70vh] rounded-t-3xl bg-background flex flex-col"
              >
                <div className="p-4 border-b flex items-center justify-between">
                  <span className="font-semibold">Переслать</span>
                  <button
                    type="button"
                    onClick={() => setForwardOpen(false)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-2 border-b">
                  <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="По юзернейму..."
                      className="flex-1 bg-transparent outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto overscroll-contain p-2">
                  {searchQuery.trim().length >= 2 ? (
                    <ul className="space-y-0.5">
                      {searchResults.map((p) => {
                        const chatId = user ? `dm-${[user.id, p.id].sort().join("_")}` : "";
                        const selected = chatId ? selectedChatIds.has(chatId) : false;
                        return (
                          <li key={p.id}>
                            <button
                              type="button"
                              onClick={() => toggleUser(p.id)}
                              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${selected ? "bg-primary/15" : "hover:bg-muted/60"}`}
                            >
                              <AvatarInitials username={p.username} size="sm" className="!h-10 !w-10" />
                              <span className="font-medium">@{p.username}</span>
                              {selected && <span className="ml-auto text-xs text-primary">✓</span>}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <ul className="space-y-0.5">
                      {chats.map((c) => {
                        const selected = selectedChatIds.has(c.id);
                        return (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => toggleChat(c.id)}
                              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${selected ? "bg-primary/15" : "hover:bg-muted/60"}`}
                            >
                              <AvatarInitials username={c.title} avatarUrl={c.avatar_url} size="sm" className="!h-10 !w-10" />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate">@{c.title}</div>
                                <div className="text-xs text-muted-foreground truncate">{c.subtitle}</div>
                              </div>
                              {selected && <span className="text-primary">✓</span>}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <div className="p-4 border-t">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={handleForward}
                    disabled={selectedChatIds.size === 0 || sending}
                    className="w-full py-3 rounded-2xl bg-foreground text-background font-medium disabled:opacity-50"
                  >
                    {sending ? "Отправка…" : `Переслать в ${selectedChatIds.size}`}
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );

  if (typeof document !== "undefined") {
    return createPortal(overlay, document.body);
  }
  return overlay;
}
