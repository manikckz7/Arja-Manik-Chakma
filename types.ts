
export enum AIMode {
  CHAT = 'CHAT',
  IMAGE = 'IMAGE',
  LIVE = 'LIVE',
  SEARCH = 'SEARCH'
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'search';
  imageUrl?: string;
  groundingLinks?: { title: string; uri: string }[];
}

export interface AppState {
  currentMode: AIMode;
  messages: Message[];
  isThinking: boolean;
  isStreaming: boolean;
}
