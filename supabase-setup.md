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

## 4. Supabase: таблицы (важно)

1. **SQL Editor** в Supabase
2. Создай новый запрос
3. Скопируй и выполни содержимое файла `supabase/migrations/001_profiles_posts.sql`

## 5. Vercel: переменные окружения

1. [vercel.com](https://vercel.com) → твой проект → **Settings** → **Environment Variables**
2. Добавь:
   - `NEXT_PUBLIC_SUPABASE_URL` = твой Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = твой anon ключ
3. Сохрани и **Redeploy** проект

## 6. Supabase: Email

1. **Authentication** → **Providers** → **Email**
2. Включи **Confirm email**

## Готово

- Локально: `npm run dev`, зайди на `/auth`
- Vercel: после Redeploy всё будет работать на продакшене
