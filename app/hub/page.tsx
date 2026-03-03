"use client";

import React from "react";
import Link from "next/link";
import { Settings, User, Bell, Home, Clapperboard, MessageCircle, Plus, Edit3 } from "lucide-react";
import { PageHeader, HeaderBackButton } from "@/components/app/PageHeader";
import { Card } from "@/app/ui/card";

export default function HubPage() {
  return (
    <div className="pb-4">
      <PageHeader left={<HeaderBackButton />} title="Настройки" />

      <p className="text-sm text-muted-foreground mb-5">
        Быстрые действия и настройки приложения.
      </p>

      <div className="mb-6">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Разделы</h2>
        <div className="space-y-2">
          <Link href="/">
            <Card className="rounded-2xl border-0 bg-card p-4 gap-0 shadow-none hover:opacity-95 transition flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted">
                <Home className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">Главная</div>
                <div className="text-sm text-muted-foreground truncate">Лента, рекомендации</div>
              </div>
            </Card>
          </Link>
          <Link href="/feels">
            <Card className="rounded-2xl border-0 bg-card p-4 gap-0 shadow-none hover:opacity-95 transition flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted">
                <Clapperboard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">Feels</div>
                <div className="text-sm text-muted-foreground truncate">Короткие видео</div>
              </div>
            </Card>
          </Link>
          <Link href="/messages">
            <Card className="rounded-2xl border-0 bg-card p-4 gap-0 shadow-none hover:opacity-95 transition flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">Чаты</div>
                <div className="text-sm text-muted-foreground truncate">Сообщения</div>
              </div>
            </Card>
          </Link>
          <Link href="/add">
            <Card className="rounded-2xl border-0 bg-card p-4 gap-0 shadow-none hover:opacity-95 transition flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">Добавить</div>
                <div className="text-sm text-muted-foreground truncate">Пост, музыка, Feels</div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Профиль</h2>
        <div className="space-y-2">
          <Link href="/profile">
            <Card className="rounded-2xl border-0 bg-card p-4 gap-0 shadow-none hover:opacity-95 transition flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">Мой профиль</div>
                <div className="text-sm text-muted-foreground truncate">Посты, Feels, репосты</div>
              </div>
            </Card>
          </Link>
          <Link href="/profile/edit">
            <Card className="rounded-2xl border-0 bg-card p-4 gap-0 shadow-none hover:opacity-95 transition flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted">
                <Edit3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">Редактировать профиль</div>
                <div className="text-sm text-muted-foreground truncate">Имя, био, теги</div>
              </div>
            </Card>
          </Link>
          <Link href="/profile/settings">
            <Card className="rounded-2xl border-0 bg-card p-4 gap-0 shadow-none hover:opacity-95 transition flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted">
                <Settings className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">Настройки</div>
                <div className="text-sm text-muted-foreground truncate">Тема, обои чата</div>
              </div>
            </Card>
          </Link>
          <Link href="/notifications">
            <Card className="rounded-2xl border-0 bg-card p-4 gap-0 shadow-none hover:opacity-95 transition flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">Уведомления</div>
                <div className="text-sm text-muted-foreground truncate">Лайки, комментарии</div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
