import type { PeoplePost, Story, UserProfile } from "../types";

export const TABS = [
  { key: "feed", label: "Лента" },
  { key: "subs", label: "Подписки" },
] as const;

export const PEOPLE: PeoplePost[] = [
  {
    id: "p1",
    user: "alina",
    time: "сегодня",
    text: "Сделала профиль более строгим. Хочу найти людей с похожим вкусом.",
    tags: ["профиль", "серьёзно"],
    hasPhoto: true,
  },
  {
    id: "p2",
    user: "den",
    time: "вчера",
    text: "Хочется площадку без травли и ненависти. Обсуждать можно всё — но по-человечески.",
    tags: ["свобода", "без токсика"],
  },
  {
    id: "p3",
    user: "mira",
    time: "2 дня назад",
    text: "Профиль хочу сделать как мини-страницу настроения.",
    tags: ["вайб", "креатив"],
  },
  {
    id: "p4",
    user: "s1dead",
    time: "вчера",
    text: "Netherwave — место, где можно быть собой. Без лишнего шума.",
    tags: ["сообщество"],
  },
];

export const FEED = [PEOPLE[0], PEOPLE[3], PEOPLE[1], PEOPLE[2]];
export const SUBS = [PEOPLE[0], PEOPLE[2]];

export const STORIES: Story[] = [
  { id: "s1", user: "alina", track: "Starboy", artist: "The Weeknd", time: "2ч" },
  { id: "s2", user: "den", text: "Слушаю джаз ночью", time: "4ч" },
  { id: "s3", user: "mira", track: "Midnight City", artist: "M83", time: "1ч" },
  { id: "s4", user: "kira", track: "Blinding Lights", artist: "The Weeknd", time: "30м" },
  { id: "s5", user: "max", text: "Пишу новый бит", time: "5ч" },
];

export const USER_PROFILES: Record<string, UserProfile> = {
  s1dead: {
    username: "s1dead",
    displayName: "S1dead",
    bio: "Netherwave — место, где можно быть собой.",
    tags: ["сообщество", "лента"],
    followers: 128,
    following: 42,
    posts: 4,
  },
  alina: {
    username: "alina",
    displayName: "Алина",
    bio: "Профиль как подпись. Ищу своё.",
    tags: ["музыка", "вайб"],
    followers: 312,
    following: 87,
    posts: 12,
  },
  den: {
    username: "den",
    displayName: "Ден",
    bio: "Без токсика. Обсуждаем по-человечески.",
    tags: ["свобода", "общение"],
    followers: 89,
    following: 34,
    posts: 6,
  },
  mira: {
    username: "mira",
    displayName: "Мира",
    bio: "Мини-страница настроения.",
    tags: ["вайб", "креатив"],
    followers: 456,
    following: 120,
    posts: 18,
  },
  kira: {
    username: "kira",
    displayName: "Кира",
    bio: "Музыка — мой язык.",
    tags: ["электроника", "ночь"],
    followers: 210,
    following: 55,
    posts: 9,
  },
  max: {
    username: "max",
    displayName: "Макс",
    bio: "Битмейкер и мечтатель.",
    tags: ["биты", "продакшн"],
    followers: 178,
    following: 63,
    posts: 7,
  },
};
