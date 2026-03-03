"use client";

import React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Reply, Heart, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Comment } from "@/lib/types";
import { AvatarInitials } from "@/components/ui/avatar-initials";

type Props = {
  open: boolean;
  comments: Comment[];
  onAdd: (text: string) => void;
  onReply?: (commentId: string, username: string) => void;
  onLikeComment?: (commentId: string) => void;
  onEditComment?: (commentId: string, newText: string) => void;
  onDeleteComment?: (commentId: string) => void;
  currentUserId?: string | null;
  replyToUsername?: string | null;
  onClearReply?: () => void;
};

export function CommentSection({
  open,
  comments,
  onAdd,
  onReply,
  onLikeComment,
  onEditComment,
  onDeleteComment,
  currentUserId,
  replyToUsername,
  onClearReply,
}: Props) {
  const [text, setText] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editText, setEditText] = React.useState("");
  const [menuOpenId, setMenuOpenId] = React.useState<string | null>(null);
  const [menuPosition, setMenuPosition] = React.useState<{ top: number; left: number } | null>(null);
  const menuTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const isAuthor = (c: Comment) => currentUserId && (c.user_id === currentUserId);

  React.useEffect(() => {
    if (!menuOpenId) {
      setMenuPosition(null);
      return;
    }
    const trigger = menuTriggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuWidth = 120;
    setMenuPosition({
      top: rect.bottom + 4,
      left: Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8),
    });
  }, [menuOpenId]);

  function startEdit(c: Comment) {
    setEditingId(c.id);
    setEditText(c.text);
    setMenuOpenId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  function submitEdit() {
    const t = editText.trim();
    if (t && editingId && onEditComment) {
      onEditComment(editingId, t);
      setEditingId(null);
      setEditText("");
    }
  }

  function submit() {
    const t = text.trim();
    if (!t) return;
    onAdd(t);
    setText("");
    onClearReply?.();
  }

  React.useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments.length, open]);

  const openComment = menuOpenId ? comments.find((x) => x.id === menuOpenId) : null;

  return (
    <>
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="overflow-hidden"
          data-card-actions
        >
          <div className="mt-3 pt-3 border-t border-border/40 min-w-0">
            <div ref={listRef} className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {comments.map((c, i) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, x: -16, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 16, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 340, damping: 25, delay: i * 0.04 }}
                    className={`flex items-start gap-2 ${c.parent_id ? "ml-6 border-l-2 border-border/30 pl-2" : ""}`}
                  >
                    <Link href={`/profile/${c.user}`} className="shrink-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <AvatarInitials username={c.user} avatarUrl={c.avatar_url} size="sm" className="!h-7 !w-7 !text-[10px] !rounded-lg mt-0.5" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <Link href={`/profile/${c.user}`} className="text-xs font-semibold hover:underline">@{c.user}</Link>
                        {c.reply_to_username && (
                          <span className="text-[10px] text-muted-foreground">→ @{c.reply_to_username}</span>
                        )}
                        <span className="text-[10px] text-muted-foreground">{c.time}</span>
                        {isAuthor(c) && (onEditComment || onDeleteComment) && (
                          <div className="relative ml-auto">
                            <button
                              ref={menuOpenId === c.id ? menuTriggerRef : undefined}
                              type="button"
                              onClick={() => setMenuOpenId(menuOpenId === c.id ? null : c.id)}
                              className="p-0.5 rounded text-muted-foreground hover:text-foreground"
                              aria-label="Ещё"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      {editingId === c.id ? (
                        <div className="mt-1 space-y-1">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border bg-background/60 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                          />
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={submitEdit}
                              disabled={!editText.trim()}
                              className="rounded-lg bg-foreground px-2 py-1 text-[10px] text-background disabled:opacity-50"
                            >
                              Сохранить
                            </button>
                            <button type="button" onClick={cancelEdit} className="rounded-lg border px-2 py-1 text-[10px]">
                              Отмена
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground leading-snug mt-0.5">{c.text}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {onReply && (
                              <button
                                type="button"
                                onClick={() => onReply(c.id, c.user)}
                                className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition"
                              >
                                <Reply className="h-3 w-3" />
                                Ответить
                              </button>
                            )}
                            {onLikeComment && (
                              <button
                                type="button"
                                onClick={() => onLikeComment(c.id)}
                                className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition"
                              >
                                <Heart className={`h-3 w-3 ${c.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                                {c.like_count ? <span>{c.like_count}</span> : null}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {comments.length === 0 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground py-1">
                  Пока нет комментариев — будь первым
                </motion.p>
              )}
            </div>

            {replyToUsername && (
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Ответ для @{replyToUsername}</span>
                <button type="button" onClick={onClearReply} className="hover:text-foreground">✕</button>
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 24 }}
              className="mt-3 flex items-center gap-2 min-w-0 w-full"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                placeholder={replyToUsername ? `Ответ для @${replyToUsername}...` : "Написать комментарий..."}
                className="min-w-0 flex-1 w-0 rounded-xl border bg-background/60 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30 transition"
              />
              <motion.button
                type="button"
                onClick={submit}
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.06 }}
                disabled={!text.trim()}
                className="shrink-0 grid h-9 w-9 place-items-center rounded-xl bg-foreground text-background transition disabled:opacity-30"
                aria-label="Отправить"
              >
                <Send className="h-3.5 w-3.5" />
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {menuOpenId && menuPosition && openComment && typeof document !== "undefined" &&
      createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998]"
            aria-hidden
            onClick={() => setMenuOpenId(null)}
          />
          <div
            className="fixed z-[9999] min-w-[120px] rounded-lg border bg-card py-1 shadow-lg"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            {onEditComment && (
              <button
                type="button"
                onClick={() => startEdit(openComment)}
                className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-xs hover:bg-muted"
              >
                <Pencil className="h-3 w-3" /> Изменить
              </button>
            )}
            {onDeleteComment && (
              <button
                type="button"
                onClick={() => { onDeleteComment(openComment.id); setMenuOpenId(null); }}
                className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-xs text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3" /> Удалить
              </button>
            )}
          </div>
        </>,
        document.body
      )}
    </>
  );
}
