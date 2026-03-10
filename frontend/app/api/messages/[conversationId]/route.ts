import { NextRequest, NextResponse } from 'next/server';
import { mockMessages, mockUsers } from '@/lib/api/mockData';

// In-memory storage (shared with conversations route)
const allMessages = [...mockMessages];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { conversationId } = await params;

    // Get messages for this conversation
    const messages = allMessages
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return NextResponse.json({
      messages,
      total: messages.length,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
