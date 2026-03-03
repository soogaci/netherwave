/** Точное время последней активности: "онлайн" или "был(а) сегодня в 14:32" */
export function formatLastSeenExact(iso: string | null | undefined): string {
  if (!iso) return "давно";
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const min = Math.floor(diff / 60000);
  const h = d.getHours();
  const m = d.getMinutes();
  const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  if (min < 5) return "онлайн";
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();
  const dateStr = d.toDateString();
  if (dateStr === today) return `сегодня в ${timeStr}`;
  if (dateStr === yesterday) return `вчера в ${timeStr}`;
  const day = d.getDate();
  const months = "янв фев мар апр май июн июл авг сен окт ноя дек".split(" ");
  const month = months[d.getMonth()];
  return `${day} ${month} в ${timeStr}`;
}

/** true если last_seen в пределах 5 минут */
export function isOnline(lastSeen: string | null | undefined): boolean {
  if (!lastSeen) return false;
  const d = new Date(lastSeen);
  const now = new Date();
  return now.getTime() - d.getTime() < 5 * 60 * 1000;
}
