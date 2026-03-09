import { NextRequest, NextResponse } from 'next/server';
import { mockAdminMessages } from '@/lib/api/adminMockData';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('per_page') || '10');
  const flagged = searchParams.get('flagged');
  const sortBy = searchParams.get('sort_by') || 'newest';

  let filtered = [...mockAdminMessages];

  if (flagged === 'true') {
    filtered = filtered.filter(m => m.flagged);
  }

  // Sort
  if (sortBy === 'newest') {
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } else if (sortBy === 'oldest') {
    filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  const start = (page - 1) * perPage;
  const end = start + perPage;
  const paginated = filtered.slice(start, end);

  // Group messages by conversation
  const conversationMap = new Map<string, any>();
  
  paginated.forEach(message => {
    if (!conversationMap.has(message.conversationId)) {
      conversationMap.set(message.conversationId, {
        id: message.conversationId,
        participants: [
          { id: message.senderId, name: message.senderName, email: 'sender@example.com' },
          { id: message.recipientId, name: message.recipientName, email: 'recipient@example.com' }
        ],
        last_message: {
          content: message.content,
          sent_at: message.createdAt.toISOString()
        },
        message_count: 1,
        reported_count: message.flagged ? 1 : 0,
        has_reported_messages: message.flagged
      });
    }
  });

  const transformed = Array.from(conversationMap.values());

  return NextResponse.json({
    data: transformed,
    meta: {
      total: transformed.length,
      page,
      per_page: perPage,
      totalPages: Math.ceil(transformed.length / perPage),
    },
  });
}
