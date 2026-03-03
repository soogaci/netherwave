export type MusicPost = {
  id: string;
  user: string;
  user_id?: string;
  time: string;
  track: string;
  artist: string;
  mood: string;
  tags: string[];
  coverColor?: string;
  avatar_url?: string | null;
  like_count?: number;
  isLiked?: boolean;
  comment_count?: number;
  last_seen?: string | null;
};

export type PeoplePost = {
  id: string;
  user: string;
  user_id?: string;
  time: string;
  text: string;
  tags: string[];
  hasPhoto?: boolean;
  photo_urls?: string[];
  avatar_url?: string | null;
  like_count?: number;
  isLiked?: boolean;
  comment_count?: number;
  last_seen?: string | null;
};

/** Feels — только видео, лента как в TikTok */
export type Feel = {
  id: string;
  user: string;
  user_id?: string;
  time: string;
  video_url: string;
  description: string;
  avatar_url?: string | null;
  like_count?: number;
  isLiked?: boolean;
  comment_count?: number;
};

export type FeedMixItem =
  | { type: "music"; id: string }
  | { type: "people"; id: string };

export type Comment = {
  id: string;
  user: string;
  user_id?: string;
  text: string;
  time: string;
  replyTo?: string;
  parent_id?: string;
  reply_to_username?: string;
  avatar_url?: string | null;
  like_count?: number;
  isLiked?: boolean;
};

export type NotificationItem = {
  id: string;
  type: "like" | "comment" | "follow";
  user: string;
  text: string;
  time: string;
  avatar_url?: string | null;
};

export type Chat = {
  id: string;
  type: "dm" | "group";
  title: string;
  subtitle: string;
  time: string;
  unread?: number;
  pinned?: boolean;
  avatar_url?: string | null;
  message_count?: number;
  last_seen?: string | null;
};

export type Msg = {
  id: string;
  chatId?: string;
  from: "me" | "other";
  text: string;
  time: string;
  created_at?: string;
  reactions?: Record<string, string[]>;
  sticker?: string;
  attachment?: { name?: string; size?: string; url?: string; urls?: string[] };
  saved?: boolean;
  read_at?: string | null;
  /** Цитируемое сообщение (ответ) */
  replyTo?: { id: string; text: string };
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
