"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Users, MessageCircle, Sparkles, ArrowRight } from "lucide-react";
import { NetherwaveLogo } from "@/components/ui/NetherwaveLogo";

const SLIDES = [
  {
    icon: Music,
    color: "oklch(0.6 0.2 280)",
    title: "Netherwave",
    desc: "Музыкальная соцсеть нового поколения. Делись треками, настроением и вайбом.",
  },
  {
    icon: Users,
    color: "oklch(0.55 0.2 160)",
    title: "Находи своих",
    desc: "Подписывайся на людей с похожим вкусом. Без токсика — только музыка и общение.",
  },
  {
    icon: MessageCircle,
    color: "oklch(0.6 0.18 30)",
    title: "Общайся",
    desc: "Личные сообщения, группы и реакции. Комментируй посты и отвечай друзьям.",
  },
  {
    icon: Sparkles,
    color: "oklch(0.55 0.2 300)",
    title: "Готов?",
    desc: "Настрой профиль, выбери тему и начни. Netherwave ждёт.",
  },
];

const STORAGE_KEY = "mus-onboarding-done";

export function Onboarding() {
  const [visible, setVisible] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function finish() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function next() {
    if (index < SLIDES.length - 1) setIndex((i) => i + 1);
    else finish();
  }

  if (!visible) return null;

  const slide = SLIDES[index];
  const Icon = slide.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background px-6 overflow-hidden"
    >
      {/* Decorative wave blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 60, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -60, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="flex flex-col items-center text-center max-w-sm"
        >
          {index === 0 ? (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 20, delay: 0.1 }}
              className="mb-8"
            >
              <NetherwaveLogo size="lg" showText />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 250, damping: 18, delay: 0.1 }}
              className="grid h-24 w-24 place-items-center rounded-3xl mb-8"
              style={{ backgroundColor: slide.color }}
            >
              <Icon className="h-12 w-12 text-white/90" />
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-2xl font-bold mb-3"
          >
            {slide.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="text-sm text-muted-foreground leading-relaxed"
          >
            {slide.desc}
          </motion.p>

        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="mt-10 flex gap-2">
        {SLIDES.map((_, i) => (
          <motion.div
            key={i}
            animate={{
              width: i === index ? 24 : 8,
              backgroundColor: i === index ? "var(--foreground)" : "var(--muted)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="h-2 rounded-full"
          />
        ))}
      </div>

      {/* Buttons */}
      <div className="mt-8 flex w-full max-w-sm gap-3">
        {index < SLIDES.length - 1 && (
          <button
            type="button"
            onClick={finish}
            className="flex-1 rounded-2xl border py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition"
          >
            Пропустить
          </button>
        )}
        <motion.button
          type="button"
          onClick={next}
          whileTap={{ scale: 0.95 }}
          className="flex-1 rounded-2xl bg-foreground text-background py-3 text-sm font-medium hover:opacity-90 transition inline-flex items-center justify-center gap-2"
        >
          {index === SLIDES.length - 1 ? "Начать" : "Далее"}
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}
