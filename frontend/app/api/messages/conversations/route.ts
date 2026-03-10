import { NextRequest, NextResponse } from 'next/server';
import { mockMessages, mockUsers, demoMessagesForNewUser, demoConversations } from '@/lib/api/mockData';
import type { Conversation } from '@/lib/types';

// In-memory storage for messages
const allMessages = [...mockMessages, ...demoMessagesForNewUser];

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract user ID from token
    const token = authHeader.substring(7);
    const tokenParts = token.split('-');
    const currentUserId = tokenParts.length >= 3 ? tokenParts.slice(2, -1).join('-') : mockUsers[0].id;

    // Group messages by conversation
    const conversationMap = new Map<string, Conversation>();

    allMessages.forEach(message => {
      // Only include conversations involving current user
      if (message.senderId !== currentUserId && message.recipientId !== currentUserId) {
        return;
      }

      const conversationId = message.conversationId;

      if (!conversationMap.has(conversationId)) {
        // Determine other participant
        const otherUserId = message.senderId === currentUserId
          ? message.recipientId
          : message.senderId;

        // Find other user info
        const otherUser = mockUsers.find(u => u.id === otherUserId);

        conversationMap.set(conversationId, {
          id: conversationId,
          participants: [currentUserId, otherUserId] as [string, string],
          lastMessage: message,
          unreadCount: 0,
          updatedAt: message.createdAt,
          otherUser: otherUser,
        });
      } else {
        const conversation = conversationMap.get(conversationId)!;

        // Update last message if this one is newer
        if (message.createdAt > conversation.lastMessage.createdAt) {
          conversation.lastMessage = message;
          conversation.updatedAt = message.createdAt;
        }
      }
    });

    // Calculate unread counts
    conversationMap.forEach(conversation => {
      const unreadMessages = allMessages.filter(msg =>
        msg.conversationId === conversation.id &&
        msg.recipientId === currentUserId &&
        !msg.read
      );
      conversation.unreadCount = unreadMessages.length;
    });

    // Convert to array and sort by last message date
    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return NextResponse.json({
      conversations,
      total: conversations.length,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
