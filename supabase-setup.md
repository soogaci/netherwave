# Настройка Supabase и Vercel

## 1. Supabase: проект и ключи

1. Зайди на [supabase.com](https://supabase.com)
2. **Project Settings** → **API**
3. Скопируй **Project URL** и **anon public** ключ

## 2. Создай .env.local (локально)

```
NEXT_PUBLIC_SUPABASE_URL=https://твой-проект.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=твой-anon-key
```

## 3. Supabase: Redirect URLs

1. **Authentication** → **URL Configuration**
2. В **Redirect URLs** добавь:
   - `http://localhost:3000/auth/callback`
   - `https://твой-сайт.vercel.app/auth/callback`
3. **Site URL** — `https://твой-сайт.vercel.app` (или `http://localhost:3000` для локальной разработки)
4. Сохрани

## 4. Supabase: схема БД (все миграции по порядку)

Чтобы **локально и на проде** было всё актуально, нужно применить все миграции к твоему проекту Supabase.

**Вариант А — через Supabase CLI (рекомендуется):**

1. Установи [Supabase CLI](https://supabase.com/docs/guides/cli) и залогинься: `npx supabase login`
2. Привяжи проект: `npm run db:link` (введи project ref из дашборда)
3. Отправь миграции на удалённую БД: `npm run db:push`

**Вариант Б — вручную в SQL Editor:**

Открой **SQL Editor** в дашборде Supabase и выполни файлы **строго по порядку**:

1. `supabase/migrations/001_profiles_posts.sql`
2. `supabase/migrations/002_chats_messages.sql`
3. `supabase/migrations/003_avatars_bucket.sql`
4. `supabase/migrations/004_post_likes_comments.sql`
5. `supabase/migrations/005_follows_comment_replies_notifications.sql`
6. `supabase/migrations/006_posts_comments_update_policies.sql`
7. `supabase/migrations/007_profiles_last_seen_chat_attachments.sql`
8. `supabase/migrations/008_messages_read_at.sql`
9. `supabase/migrations/009_chat_attachments_rls_fix.sql`
10. `supabase/migrations/010_post_photos.sql`
11. `supabase/migrations/011_realtime_messages.sql`
12. `supabase/migrations/012_messages_delete_reply.sql`
13. `supabase/migrations/013_profiles_chat_wallpaper.sql`
14. `supabase/migrations/014_post_reposts.sql`
15. `supabase/migrations/20260219120000_feels_video_reposts.sql`

После этого схема в облаке и локальная кодовая база будут совпадать; локальный `npm run dev` будет работать с той же БД (если в `.env.local` указаны URL и ключ этого проекта).

## 5. Vercel: переменные окружения

1. [vercel.com](https://vercel.com) → твой проект → **Settings** → **Environment Variables**
2. Добавь:
   - `NEXT_PUBLIC_SUPABASE_URL` = твой Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = твой anon ключ
3. Сохрани и **Redeploy** проект

## 6. Supabase: Email

1. **Authentication** → **Providers** → **Email**
2. Включи **Confirm email**

## 7. Чтобы локально всё актуально загружалось

- В **.env.local** используй те же `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY`, что и на проде (или у своего актуального проекта Supabase). Тогда локальное приложение будет ходить в ту же БД — данные и схема будут актуальными.
- Убедись, что на этом проекте Supabase применены **все миграции** (см. пункт 4 выше).
- Запуск: `npm run dev` → http://localhost:3000

## Готово

- Локально: `npm run dev`, зайди на `/auth`
- Vercel: после Redeploy всё будет работать на продакшене
