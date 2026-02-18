import type { Chat, Msg } from "../types";

export const SAVED_MSG_KEY = "netherwave-saved-messages";
export const SAVED_NOTES_KEY = "netherwave-saved-notes";

export const DMS: Chat[] = [
  { id: "dm-1", type: "dm", title: "kira", subtitle: "Скинь трек, который вчера писал 👀", time: "сейчас", unread: 2 },
  { id: "dm-2", type: "dm", title: "alina", subtitle: "Очень понравилась твоя подборка", time: "сегодня", unread: 0 },
  { id: "dm-3", type: "dm", title: "den", subtitle: "Давай завтра обсудим", time: "вчера", unread: 1 },
];

export const GROUPS: Chat[] = [
  { id: "saved", type: "group", title: "Избранное", subtitle: "Сохранённые сообщения", time: "", unread: 0 },
  { id: "gr-1", type: "group", title: "Synth Night", subtitle: "max: новый плейлист в закрепе", time: "вчера", unread: 5 },
  { id: "gr-2", type: "group", title: "Radiohead fans", subtitle: "den: обсуждаем альбомы", time: "2 дн", unread: 0 },
];

export const CHAT_MESSAGES: Record<string, { title: string; messages: Msg[] }> = {
  "dm-1": {
    title: "kira",
    messages: [
      { id: "1", from: "other", text: "Привет!", time: "18:40" },
      { id: "2", from: "me", text: "Привет! Как дела?", time: "18:41" },
      { id: "3", from: "other", text: "Норм, слушаю новый альбом The Weeknd", time: "18:42" },
      { id: "4", from: "me", text: "О, какой? After Hours или новый?", time: "18:43" },
      { id: "5", from: "other", text: "Новый, Dawn FM. Просто космос 🚀", time: "18:44" },
      { id: "6", from: "other", sticker: "🎵", text: "", time: "18:44" },
      { id: "7", from: "me", text: "Надо послушать, спасибо за наводку", time: "18:45" },
      { id: "8", from: "other", text: "Скинь трек который вчера писал 👀", time: "19:21" },
      { id: "9", from: "me", text: "Ща, держи. Это M83 — Midnight City", time: "19:22" },
      { id: "10", from: "me", attachment: { name: "midnight_city.mp3", size: "4.2 МБ" }, text: "", time: "19:22" },
      { id: "11", from: "other", text: "Оооо, ностальгия! Классика", time: "19:23" },
      { id: "12", from: "other", sticker: "🔥", text: "", time: "19:23" },
      { id: "13", from: "me", text: "Вообще, у них весь альбом Hurry Up, We're Dreaming топ", time: "19:24" },
      { id: "14", from: "other", text: "Согласна. Ещё Outro обожаю", time: "19:25" },
      { id: "15", from: "me", sticker: "❤️", text: "", time: "19:25" },
    ],
  },
  "dm-2": {
    title: "alina",
    messages: [
      { id: "1", from: "other", text: "Привет! Видела твой плейлист в ленте", time: "14:10" },
      { id: "2", from: "me", text: "О, привет! Какой именно?", time: "14:12" },
      { id: "3", from: "other", text: "Тот с электроникой, ночной вайб", time: "14:12" },
      { id: "4", from: "other", text: "Очень понравилась твоя подборка", time: "14:13" },
      { id: "5", from: "me", text: "Спасибо! Я долго его собирал", time: "14:15" },
      { id: "6", from: "other", text: "Можешь ещё что-нибудь посоветовать?", time: "14:16" },
      { id: "7", from: "me", text: "Попробуй послушать Tycho — Dive", time: "14:17" },
      { id: "8", from: "me", text: "И ещё ODESZA — A Moment Apart", time: "14:17" },
      { id: "9", from: "other", sticker: "🙏", text: "", time: "14:18" },
      { id: "10", from: "other", text: "Спасибо, сейчас включу!", time: "14:18" },
      { id: "11", from: "me", text: "Скоро соберу ещё одну подборку под ночь", time: "14:20" },
      { id: "12", from: "other", text: "Буду ждать 💜", time: "14:21" },
    ],
  },
  "dm-3": {
    title: "den",
    messages: [
      { id: "1", from: "other", text: "Привет, слушай", time: "20:00" },
      { id: "2", from: "other", text: "Я тут нашёл крутой подкаст про электронную музыку", time: "20:00" },
      { id: "3", from: "me", text: "О, скинь!", time: "20:02" },
      { id: "4", from: "other", attachment: { name: "podcast_link.txt", size: "0.1 КБ" }, text: "", time: "20:03" },
      { id: "5", from: "me", text: "Спасибо, послушаю вечером", time: "20:05" },
      { id: "6", from: "other", text: "Там ещё про Aphex Twin есть выпуск", time: "20:06" },
      { id: "7", from: "me", sticker: "👀", text: "", time: "20:06" },
      { id: "8", from: "other", text: "Давай завтра обсудим?", time: "20:10" },
      { id: "9", from: "me", text: "Давай, напиши когда свободен", time: "20:11" },
      { id: "10", from: "other", sticker: "👍", text: "", time: "20:11" },
    ],
  },
  "gr-1": {
    title: "Synth Night",
    messages: [
      { id: "1", from: "other", text: "max: Народ, собрал новый плейлист!", time: "вчера" },
      { id: "2", from: "other", text: "max: Закрепил в описании группы", time: "вчера" },
      { id: "3", from: "me", text: "О, кайф. Сейчас заценю", time: "вчера" },
      { id: "4", from: "other", text: "kira: Там Kavinsky есть? 👀", time: "вчера" },
      { id: "5", from: "other", text: "max: Конечно, Nightcall первым треком", time: "вчера" },
      { id: "6", from: "other", sticker: "🎹", text: "", time: "вчера" },
      { id: "7", from: "me", text: "Nightcall вечная классика", time: "вчера" },
      { id: "8", from: "other", text: "alina: Добавьте ещё Perturbator", time: "вчера" },
      { id: "9", from: "other", text: "max: Уже! Dangerous Days целиком", time: "вчера" },
      { id: "10", from: "me", text: "Надо устроить синт-вечер с этим плейлистом", time: "вчера" },
      { id: "11", from: "other", text: "kira: Я за!", time: "вчера" },
      { id: "12", from: "other", sticker: "🔥", text: "", time: "вчера" },
      { id: "13", from: "other", text: "max: В пятницу?", time: "сегодня" },
      { id: "14", from: "me", text: "Идеально, я свободен", time: "сегодня" },
    ],
  },
  "saved": {
    title: "Избранное",
    messages: [],
  },
  "gr-2": {
    title: "Radiohead fans",
    messages: [
      { id: "1", from: "other", text: "den: Какой альбом Radiohead лучший?", time: "2 дн" },
      { id: "2", from: "other", text: "mira: OK Computer, без вариантов", time: "2 дн" },
      { id: "3", from: "me", text: "In Rainbows топ, но Kid A тоже легенда", time: "2 дн" },
      { id: "4", from: "other", text: "den: Kid A для меня номер один", time: "2 дн" },
      { id: "5", from: "other", text: "mira: Everything In Its Right Place — шедевр", time: "2 дн" },
      { id: "6", from: "me", text: "Reckoner из In Rainbows тоже невероятный", time: "2 дн" },
      { id: "7", from: "other", sticker: "🎸", text: "", time: "2 дн" },
      { id: "8", from: "other", text: "den: А кто слышал A Moon Shaped Pool?", time: "вчера" },
      { id: "9", from: "me", text: "True Love Waits оттуда — самый грустный трек", time: "вчера" },
      { id: "10", from: "other", text: "mira: Согласна, он разрывает 💔", time: "вчера" },
    ],
  },
};
