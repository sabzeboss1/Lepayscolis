import { NextRequest, NextResponse } from 'next/server';
import { mockMessages } from '@/lib/api/mockData';

// In-memory storage (shared with other message routes)
const allMessages = [...mockMessages];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { messageId } = await params;
    const messageIndex = allMessages.findIndex(msg => msg.id === messageId);

    if (messageIndex === -1) {
      return NextResponse.json(
        { message: 'Message not found' },
        { status: 404 }
      );
    }

    // Mark message as read
    allMessages[messageIndex] = {
      ...allMessages[messageIndex],
      read: true,
    };

    return NextResponse.json({
      message: allMessages[messageIndex],
    });
  } catch (error) {
    console.error('Mark message as read error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
