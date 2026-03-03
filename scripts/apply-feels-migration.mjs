#!/usr/bin/env node
/**
 * Применяет миграцию 20260219120000_feels_video_reposts к удалённой Supabase БД.
 *
 * Рекомендуемый способ — через Management API (без пароля БД):
 *   1. Зайди на https://supabase.com/dashboard/account/tokens
 *   2. Создай Personal Access Token (PAT)
 *   3. В .env.local добавь: SUPABASE_ACCESS_TOKEN=твой_токен
 *
 * Альтернатива — пароль БД: SUPABASE_DB_PASSWORD=пароль (проект подставится из NEXT_PUBLIC_SUPABASE_URL).
 * Запуск: npm run db:migrate-feels
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Загружаем .env.local и .env (без кавычек и \r)
function loadEnv(fileName) {
  const envPath = join(root, fileName);
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i > 0) {
      const k = line.slice(0, i).trim().replace(/\r$/, "");
      let v = line.slice(i + 1).trim().replace(/\r$/, "");
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      else if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
      process.env[k] = v;
    }
  }
}
loadEnv(".env.local");
loadEnv(".env");

function getDatabaseUrl() {
  const full = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (full) return full;
  let ref = process.env.SUPABASE_PROJECT_REF;
  if (!ref && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const m = process.env.NEXT_PUBLIC_SUPABASE_URL.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/);
    if (m) ref = m[1];
  }
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!ref || !password) return null;
  return { ref, password };
}

function buildPoolerUrl(ref, password, region, port = 5432, awsNum = "0") {
  const enc = encodeURIComponent(password);
  return `postgresql://postgres.${ref}:${enc}@aws-${awsNum}-${region}.pooler.supabase.com:${port}/postgres`;
}

function buildDirectUrl(ref, password) {
  const enc = encodeURIComponent(password);
  return `postgresql://postgres:${enc}@db.${ref}.supabase.co:5432/postgres`;
}

function getAllPoolerUrls(ref, password, preferredRegion) {
  const regions = preferredRegion
    ? [preferredRegion, "eu-west-1", "us-east-1", "eu-central-1"]
    : ["eu-west-1", "us-east-1", "eu-central-1", "eu-west-2", "ap-southeast-1"];
  const urls = [];
  for (const region of regions) {
    for (const aws of ["1", "0"]) {
      urls.push(buildPoolerUrl(ref, password, region, 5432, aws));
      urls.push(buildPoolerUrl(ref, password, region, 6543, aws));
    }
  }
  return urls;
}

function getPoolerUrlForRegion(ref, password, region) {
  return buildPoolerUrl(ref, password, region, 5432, "1");
}

function getLinkedProjectRegion() {
  const result = spawnSync("npx", ["supabase", "projects", "list", "-o", "json"], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0 || !result.stdout) return null;
  try {
    const list = JSON.parse(result.stdout);
    const linked = Array.isArray(list) ? list.find((p) => p.linked) : null;
    return linked?.region || null;
  } catch {
    return null;
  }
}

function getProjectRef() {
  const ref = process.env.SUPABASE_PROJECT_REF;
  if (ref) return ref;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url) {
    const m = url.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/);
    if (m) return m[1];
  }
  return null;
}

const projectRef = getProjectRef();
const accessToken = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_PAT;
const dbCreds = getDatabaseUrl();
let urlsToTry = [];
if (typeof dbCreds === "string") {
  urlsToTry = [dbCreds];
} else if (dbCreds && dbCreds.ref && dbCreds.password) {
  const region = getLinkedProjectRegion() || "eu-west-1";
  const pass = dbCreds.password.trim();
  urlsToTry = [
    {
      host: `aws-1-${region}.pooler.supabase.com`,
      port: 5432,
      user: `postgres.${dbCreds.ref}`,
      password: pass,
      database: "postgres",
      ssl: { rejectUnauthorized: true },
    },
    getPoolerUrlForRegion(dbCreds.ref, dbCreds.password, region),
    buildPoolerUrl(dbCreds.ref, dbCreds.password, region, 6543, "1"),
    buildDirectUrl(dbCreds.ref, dbCreds.password),
    ...getAllPoolerUrls(dbCreds.ref, dbCreds.password, region),
  ];
}

if (!accessToken && urlsToTry.length === 0) {
  console.error(
    "Добавь в .env.local один из вариантов:\n\n" +
      "1) SUPABASE_ACCESS_TOKEN=... (создай на https://supabase.com/dashboard/account/tokens)\n" +
      "2) SUPABASE_DB_PASSWORD=пароль_от_бд (Settings → Database → Database password)"
  );
  process.exit(1);
}

const MIGRATION_VERSION = "20260219120000";

async function runMigrationViaApi() {
  if (!accessToken || !projectRef) return false;
  const sqlPath = join(root, "supabase", "migrations", "20260219120000_feels_video_reposts.sql");
  const sql = readFileSync(sqlPath, "utf8");
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`API ${res.status}: ${t || res.statusText}`);
  }
  return true;
}

async function recordMigrationInHistoryViaApi() {
  if (!accessToken || !projectRef) return false;
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/migrations`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: MIGRATION_VERSION, query: "SELECT 1" }),
  });
  return res.ok;
}

async function main() {
  const sqlPath = join(root, "supabase", "migrations", "20260219120000_feels_video_reposts.sql");
  const sql = readFileSync(sqlPath, "utf8");

  let applied = false;

  if (accessToken && projectRef) {
    try {
      await runMigrationViaApi();
      applied = true;
      console.log("Миграция 014 применена (через Management API).");
    } catch (err) {
      console.warn("Management API:", err.message);
    }
  }

  if (!applied && urlsToTry.length > 0) {
    let pg;
    try {
      pg = (await import("pg")).default;
    } catch (e) {
      console.error("Установи pg: npm install -D pg");
      process.exit(1);
    }
    let lastErr = null;
    for (const conn of urlsToTry) {
      const client =
        typeof conn === "string"
          ? new pg.Client({ connectionString: conn })
          : new pg.Client(conn);
      try {
        await client.connect();
        await client.query(sql);
        await client.end();
        applied = true;
        console.log("Миграция 014 применена.");
        break;
      } catch (err) {
        lastErr = err;
        await client.end().catch(() => {});
      }
    }
    if (!applied) {
      console.error("Ошибка применения миграции:", lastErr?.message);
      process.exit(1);
    }
  }

  if (!applied) {
    console.error("Не удалось применить миграцию. Добавь SUPABASE_ACCESS_TOKEN в .env.local.");
    process.exit(1);
  }

  let historyRecorded = false;
  if (accessToken && projectRef) {
    historyRecorded = await recordMigrationInHistoryViaApi();
    if (historyRecorded) console.log("Миграция записана в историю (API).");
  }
  if (!historyRecorded) {
    const repair = spawnSync("npx", ["supabase", "migration", "repair", MIGRATION_VERSION, "--status", "applied", "--linked"], {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env },
    });
    historyRecorded = repair.status === 0;
    if (repair.status !== 0) {
      console.warn(
        "История миграций не обновлена (repair требует пароль БД).\n" +
          "Миграция уже применена — это не мешает работе. При следующем db push миграция может выполниться повторно (это безопасно)."
      );
    } else {
      console.log("Готово. Миграция помечена как applied.");
    }
  }
}

main();
