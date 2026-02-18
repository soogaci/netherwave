export type MusicPost = {
  id: string;
  user: string;
  time: string;
  track: string;
  artist: string;
  mood: string;
  tags: string[];
  coverColor?: string;
};

export type PeoplePost = {
  id: string;
  user: string;
  time: string;
  text: string;
  tags: string[];
  hasPhoto?: boolean;
};

export type FeedMixItem =
  | { type: "music"; id: string }
  | { type: "people"; id: string };

export type Comment = {
  id: string;
  user: string;
  text: string;
  time: string;
  replyTo?: string;
};

export type NotificationItem = {
  id: string;
  type: "like" | "comment" | "follow";
  user: string;
  text: string;
  time: string;
};

export type Chat = {
  id: string;
  type: "dm" | "group";
  title: string;
  subtitle: string;
  time: string;
  unread?: number;
  pinned?: boolean;
};

export type Msg = {
  id: string;
  chatId?: string;
  from: "me" | "other";
  text: string;
  time: string;
  reactions?: Record<string, string[]>;
  sticker?: string;
  attachment?: { name: string; size: string };
  saved?: boolean;
};

export type Story = {
  id: string;
  user: string;
  track?: string;
  artist?: string;
  text?: string;
  time: string;
  seen?: boolean;
};

export type UserProfile = {
  username: string;
  displayName: string;
  bio: string;
  tags: string[];
  followers: number;
  following: number;
  posts: number;
};
