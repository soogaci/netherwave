import type { Chat, Msg } from "../types";

export const SAVED_MSG_KEY = "netherwave-saved-messages";
export const SAVED_NOTES_KEY = "netherwave-saved-notes";

export const DMS: Chat[] = [];

export const GROUPS: Chat[] = [
  { id: "saved", type: "group", title: "Избранное", subtitle: "Сохранённые сообщения", time: "", unread: 0 },
];

export const CHAT_MESSAGES: Record<string, { title: string; messages: Msg[] }> = {
  saved: { title: "Избранное", messages: [] },
};
