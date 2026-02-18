"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
import type { Comment } from "@/lib/types";
import { AvatarInitials } from "@/components/ui/avatar-initials";

type Props = {
  open: boolean;
  comments: Comment[];
  onAdd: (text: string) => void;
};

export function CommentSection({ open, comments, onAdd }: Props) {
  const [text, setText] = React.useState("");
  const listRef = React.useRef<HTMLDivElement>(null);

  function submit() {
    const t = text.trim();
    if (!t) return;
    onAdd(t);
    setText("");
  }

  React.useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments.length, open]);

  return (
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
          <div className="mt-3 pt-3 border-t border-border/40">
            {/* Comment list */}
            <div ref={listRef} className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {comments.map((c, i) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, x: -16, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 16, scale: 0.95 }}
                    transition={{
                      type: "spring",
                      stiffness: 340,
                      damping: 25,
                      delay: i * 0.04,
                    }}
                    className="flex items-start gap-2"
                  >
                    <AvatarInitials username={c.user} size="sm" className="!h-7 !w-7 !text-[10px] !rounded-lg mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-semibold">@{c.user}</span>
                        <span className="text-[10px] text-muted-foreground">{c.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-snug mt-0.5">{c.text}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {comments.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-muted-foreground py-1"
                >
                  Пока нет комментариев — будь первым
                </motion.p>
              )}
            </div>

            {/* Input */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 24 }}
              className="mt-3 flex items-center gap-2"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
                placeholder="Написать комментарий..."
                className="flex-1 rounded-xl border bg-background/60 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30 transition"
              />
              <motion.button
                type="button"
                onClick={submit}
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.06 }}
                disabled={!text.trim()}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-foreground text-background transition disabled:opacity-30"
                aria-label="Отправить"
              >
                <Send className="h-3.5 w-3.5" />
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
