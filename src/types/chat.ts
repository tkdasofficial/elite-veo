export type VideoType = "short" | "reel" | "story" | "tutorial" | "clip";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  videoType: VideoType;
}
