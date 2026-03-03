"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/app/ui/card";
import { Button } from "@/app/ui/button";
import { createClient } from "@/lib/supabase/client";
import { upsertProfile } from "@/lib/supabase/profiles";

type Step = "email" | "code" | "username";

export default function AuthPage() {
  const router = useRouter();
  const supabaseRaw = createClient();

  if (!supabaseRaw) {
    return (
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <Link href="/" className="font-bold text-xl text-foreground hover:opacity-80 transition">
          FeelReal
        </Link>
        <Card className="w-full p-6">
          <p className="text-sm text-muted-foreground mb-4">
            Для входа настрой Supabase. Создай проект на supabase.com и добавь <code className="text-xs bg-muted px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> и <code className="text-xs bg-muted px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> в .env.local
          </p>
          <Link
            href="/"
            className="text-sm font-medium text-foreground hover:underline"
          >
            На главную
          </Link>
        </Card>
      </div>
    );
  }

  const [step, setStep] = React.useState<Step>("email");
  const mode: "login" | "register" = "login";
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const supabase = supabaseRaw!;

  async function sendCode() {
    setError(null);
    setLoading(true);
    try {
      const { error: e } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          // Не используем ссылку — только код из письма (шаблон в Supabase должен показывать {{ .Token }})
        },
      });
      if (e) throw e;
      setStep("code");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка отправки кода");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setError(null);
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedToken = code.trim().replace(/\s/g, "");
    const types: Array<"email" | "magiclink" | "signup"> = ["email", "magiclink", "signup"];
    for (const otpType of types) {
      try {
        const { data, error: e } = await supabase.auth.verifyOtp({
          email: normalizedEmail,
          token: normalizedToken,
          type: otpType,
        });
        if (!e && data?.user) {
          if (mode === "register") {
            setStep("username");
          } else {
            router.replace("/");
            router.refresh();
          }
          setLoading(false);
          return;
        }
      } catch {
        continue;
      }
    }
    setError("Неверный или устаревший код. Запроси новый код и введи его сразу.");
    setLoading(false);
  }

  async function completeProfile() {
    setError(null);
    if (!username.trim()) {
      setError("Введи никнейм");
      return;
    }
    const u = username.trim().toLowerCase().replace(/\s+/g, "_");
    if (u.length < 3) {
      setError("Никнейм от 3 символов");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Нет сессии");
      const { error: e } = await supabase.auth.updateUser({
        data: { username: u },
      });
      if (e) throw e;
      const { error: err } = await upsertProfile(user.id, {
        username: u,
        display_name: u,
      });
      if (err) throw err;
      router.replace("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-8">
      <Link href="/" className="font-bold text-xl text-foreground hover:opacity-80 transition">
        FeelReal
      </Link>

      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="text-lg font-semibold">
            {step === "email" && "Вход"}
            {step === "code" && "Код из почты"}
            {step === "username" && "Придумай никнейм"}
          </div>
          {step === "email" && (
            <p className="text-sm text-muted-foreground">
              Введи почту — пришлём код для входа
            </p>
          )}
          {step === "code" && (
            <p className="text-sm text-muted-foreground">
              Введи 8-значный код из письма
            </p>
          )}
          {step === "username" && (
            <p className="text-sm text-muted-foreground">
              От 3 символов, латиница и цифры
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence mode="wait">
            {step === "email" && (
              <motion.div
                key="email"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  size="lg"
                  className="w-full"
                  onClick={sendCode}
                  disabled={loading || !email.trim()}
                >
                  {loading ? "Отправка…" : "Отправить код"}
                </Button>
              </motion.div>
            )}

            {step === "code" && (
              <motion.div
                key="code"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Назад
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="00000000"
                  className="w-full h-12 text-center text-lg tracking-[0.5em] rounded-xl border bg-background outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  size="lg"
                  className="w-full"
                  onClick={verifyCode}
                  disabled={loading || code.length !== 8}
                >
                  {loading ? "Проверка…" : "Подтвердить"}
                </Button>
              </motion.div>
            )}

            {step === "username" && (
              <motion.div
                key="username"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                  }
                  placeholder="username"
                  className="w-full h-11 px-4 rounded-xl border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  size="lg"
                  className="w-full"
                  onClick={completeProfile}
                  disabled={loading}
                >
                  {loading ? "Сохранение…" : "Готово"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
