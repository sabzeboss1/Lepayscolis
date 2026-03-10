import { NextRequest, NextResponse } from 'next/server';
import { mockAdminMessages } from '@/lib/api/adminMockData';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const message = mockAdminMessages.find(m => m.id === params.id);

  if (!message) {
    return NextResponse.json(
      { error: 'Message not found' },
      { status: 404 }
    );
  }

  // Transform to snake_case for frontend
  const transformed = {
    id: message.id,
    conversation_id: message.conversationId,
    sender_id: message.senderId,
    sender_name: message.senderName,
    recipient_id: message.recipientId,
    recipient_name: message.recipientName,
    content: message.content,
    read: message.read,
    flagged: message.flagged,
    created_at: message.createdAt.toISOString()
  };

  return NextResponse.json({ data: transformed });
}
