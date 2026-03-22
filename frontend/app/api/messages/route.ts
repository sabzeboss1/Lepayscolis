import { NextRequest, NextResponse } from 'next/server';
import { generateMockMessage, mockMessages, mockUsers } from '@/lib/api/mockData';

// In-memory storage (shared with other message routes)
const allMessages = [...mockMessages];

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { conversationId, recipientId, content } = body;

    // Validate input
    if (!conversationId || !recipientId || !content) {
      return NextResponse.json(
        { message: 'Conversation ID, recipient ID, and content are required' },
        { status: 400 }
      );
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { message: 'Message content cannot be empty' },
        { status: 400 }
      );
    }

    // Mock: use first user as sender
    const senderId = mockUsers[0].id;

    // Create new message
    const newMessage = generateMockMessage({
      conversation_id: conversationId,
      sender_id: senderId,
      recipient_id: recipientId,
      content: content.trim(),
      read: false,
      created_at: new Date().toISOString(),
    });

    allMessages.push(newMessage);

    return NextResponse.json({
      message: newMessage,
    }, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
