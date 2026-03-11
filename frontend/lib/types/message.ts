import { User } from './user';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
  sender?: User;
  recipient?: User;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  shipment_id?: string;
  other_user?: User;
  last_message?: Message;
  unread_count: number;
  created_at: string;
  updated_at: string;
}
