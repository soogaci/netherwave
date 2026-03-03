"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  MessageSquare,
  Type,
  Bell,
  Volume2,
  Sparkles,
  RotateCcw,
  Check,
  LogOut,
} from "lucide-react";
import { Card } from "@/app/ui/card";
import { useTheme, type ThemeId } from "@/components/providers/ThemeProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  useSettings,
  type ChatSize,
  type FontSize,
} from "@/components/providers/SettingsProvider";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 26 } },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div variants={item}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
        {title}
      </p>
      <Card className="rounded-2xl border-0 bg-card p-0 gap-0 shadow-none overflow-hidden">
        {children}
      </Card>
    </motion.div>
  );
}

function Row({
  icon,
  label,
  desc,
  children,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  desc?: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${
        last ? "" : "border-b border-border/30"
      }`}
    >
      <span className="text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{label}</div>
        {desc && <div className="text-[11px] text-muted-foreground mt-0.5">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        on ? "bg-foreground" : "bg-muted"
      }`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`absolute top-0.5 left-0.5 block h-6 w-6 rounded-full shadow-sm ${
          on ? "bg-background" : "bg-background"
        }`}
        style={{ x: on ? 20 : 0 }}
      />
    </button>
  );
}

function SegmentPicker<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-muted/60 p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`relative rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              active ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {active && (
              <motion.div
                layoutId="seg-bg"
                className="absolute inset-0 rounded-lg bg-background shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              />
            )}
            <span className="relative z-10">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const THEMES: { id: ThemeId; label: string; preview: string }[] = [
  { id: "default", label: "Deep Night", preview: "linear-gradient(135deg, #0a0a0f 0%, #7b61ff 100%)" },
  { id: "light", label: "Blanc", preview: "linear-gradient(135deg, #fff 0%, #7b61ff 50%)" },
  { id: "mint", label: "Arctic", preview: "linear-gradient(135deg, #0a0a0f 0%, #2affd6 100%)" },
  { id: "warm", label: "Solar Flare", preview: "linear-gradient(135deg, #0a0a0f 0%, #ff8c42 100%)" },
  { id: "neon", label: "Neon", preview: "linear-gradient(135deg, #0a0a0f 0%, #ff3c5f 100%)" },
  { id: "glass", label: "Glass", preview: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, #7b61ff 70%)" },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const s = useSettings();
  const { user, signOut } = useAuth();

  return (
    <div>
      <header className="mb-5 flex items-center gap-2">
        <Link
          href="/profile"
          className="grid h-9 w-9 place-items-center rounded-full border text-muted-foreground hover:text-foreground transition"
          aria-label="Назад"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="text-base font-semibold">Настройки</div>
      </header>

      <motion.div
        className="space-y-5"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* ── Оформление ── */}
        <Section title="Оформление">
          <div className="p-3 pb-0">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Тема интерфейса</p>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((t) => {
                const active = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                      active ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-border"
                    }`}
                  >
                    <div
                      className="aspect-[4/3] w-full min-h-[56px]"
                      style={{ background: t.preview }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-2 py-1.5 text-left">
                      <span className="text-[11px] font-medium text-white">{t.label}</span>
                    </div>
                    {active && (
                      <span className="absolute top-1.5 right-1.5 rounded-full bg-primary p-0.5">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Section>

        {/* ── Чаты ── */}
        <Section title="Чаты">
          <Row icon={<MessageSquare className="h-4 w-4" />} label="Размер сообщений" desc="Как отображаются пузыри чата" last>
            <SegmentPicker<ChatSize>
              options={[
                { value: "compact", label: "Мини" },
                { value: "normal", label: "Обычный" },
                { value: "large", label: "Крупный" },
              ]}
              value={s.chatSize}
              onChange={(v) => s.set("chatSize", v)}
            />
          </Row>
        </Section>

        {/* ── Текст ── */}
        <Section title="Текст">
          <Row icon={<Type className="h-4 w-4" />} label="Размер шрифта" desc="Влияет на весь интерфейс" last>
            <SegmentPicker<FontSize>
              options={[
                { value: "small", label: "S" },
                { value: "medium", label: "M" },
                { value: "large", label: "L" },
              ]}
              value={s.fontSize}
              onChange={(v) => s.set("fontSize", v)}
            />
          </Row>
        </Section>

        {/* ── Уведомления ── */}
        <Section title="Уведомления">
          <Row icon={<Bell className="h-4 w-4" />} label="Push-уведомления" desc="Показывать уведомления">
            <Toggle on={s.notificationsEnabled} onChange={(v) => s.set("notificationsEnabled", v)} />
          </Row>
          <Row icon={<Volume2 className="h-4 w-4" />} label="Звуки" desc="Звук при новых событиях" last>
            <Toggle on={s.soundEnabled} onChange={(v) => s.set("soundEnabled", v)} />
          </Row>
        </Section>

        {/* ── Анимации ── */}
        <Section title="Система">
          <Row icon={<Sparkles className="h-4 w-4" />} label="Анимации" desc="Плавные переходы в интерфейсе">
            <Toggle on={s.animationsEnabled} onChange={(v) => s.set("animationsEnabled", v)} />
          </Row>
          <Row icon={<RotateCcw className="h-4 w-4" />} label="Сбросить настройки" desc="Вернуть всё по умолчанию" last={!user}>
            <motion.button
              type="button"
              onClick={s.reset}
              whileTap={{ scale: 0.9, rotate: -180 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="grid h-8 w-8 place-items-center rounded-xl bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Сбросить"
            >
              <RotateCcw className="h-4 w-4" />
            </motion.button>
          </Row>
          {user && (
            <Row icon={<LogOut className="h-4 w-4" />} label="Выйти" desc={user.email ?? ""} last>
              <motion.button
                type="button"
                onClick={() => signOut()}
                whileTap={{ scale: 0.95 }}
                className="rounded-xl px-4 py-2 text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition"
              >
                Выйти
              </motion.button>
            </Row>
          )}
        </Section>


        {/* Preview */}
        <motion.div variants={item}>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
            Предпросмотр чата
          </p>
          <ChatPreview size={s.chatSize} />
        </motion.div>
      </motion.div>
    </div>
  );
}

function ChatPreview({ size }: { size: ChatSize }) {
  const sizeStyles: Record<ChatSize, string> = {
    compact: "px-2.5 py-1 text-xs gap-0",
    normal: "px-3 py-1.5 text-sm gap-0",
    large: "px-4 py-2.5 text-base gap-0",
  };

  const messages = [
    { from: "other" as const, text: "Привет! Как дела?", time: "12:00" },
    { from: "me" as const, text: "Хорошо, слушаю музыку", time: "12:01" },
    { from: "other" as const, text: "Что слушаешь?", time: "12:02" },
  ];

  return (
    <Card className="rounded-2xl border-0 bg-card p-4 gap-0 shadow-none">
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {messages.map((m, i) => (
            <motion.div
              key={`${size}-${i}`}
              layout
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 24, delay: i * 0.06 }}
              className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl shadow-none ${sizeStyles[size]} ${
                  m.from === "me"
                    ? "bg-foreground text-background"
                    : "bg-muted"
                }`}
              >
                <div className="leading-snug">{m.text}</div>
                <div
                  className={`text-[10px] text-right mt-0.5 ${
                    m.from === "me" ? "text-background/50" : "text-muted-foreground"
                  }`}
                >
                  {m.time}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}
