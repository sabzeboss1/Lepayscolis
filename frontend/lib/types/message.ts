export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  read: boolean;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  participants: [string, string]; // user IDs
  lastMessage: Message;
  unreadCount: number;
  updatedAt: Date;
  otherUser?: {
    id: string;
    name: string;
    avatar?: string;
  };
}
