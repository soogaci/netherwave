import type { NotificationItem } from "../types";

export const NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", type: "like", user: "kira", text: "лайкнула твой трек", time: "сейчас" },
  { id: "n2", type: "follow", user: "alina", text: "подписалась на тебя", time: "вчера" },
  { id: "n3", type: "comment", user: "max", text: "прокомментировал твой пост", time: "2 дня назад" },
];
