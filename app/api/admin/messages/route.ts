import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Build query parameters for Laravel backend
    const params = new URLSearchParams();
    
    if (searchParams.get('page')) {
      params.append('page', searchParams.get('page')!);
    }
    if (searchParams.get('per_page')) {
      params.append('per_page', searchParams.get('per_page')!);
    }
    if (searchParams.get('search')) {
      params.append('search', searchParams.get('search')!);
    }
    if (searchParams.get('reported_only') === 'yes') {
      params.append('reported', 'true');
    }

    // Make request to Laravel backend
    const response = await makeAdminRequest(
      request,
      `/api/admin/messages/conversations?${params.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch conversations' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform backend response to match frontend expectations
    const transformed = Array.isArray(data.data) ? data.data.map((conversation: any) => ({
      id: conversation.id,
      participants: [
        conversation.user1 || { id: conversation.user1_id, name: 'Unknown', email: '' },
        conversation.user2 || { id: conversation.user2_id, name: 'Unknown', email: '' }
      ],
      last_message: conversation.last_message ? {
        content: conversation.last_message.content || '',
        sent_at: conversation.last_message.created_at || conversation.updated_at
      } : {
        content: 'No messages yet',
        sent_at: conversation.created_at
      },
      message_count: conversation.messages_count || 0,
      reported_count: conversation.reported_messages_count || 0,
      has_reported_messages: (conversation.reported_messages_count || 0) > 0
    })) : [];

    return NextResponse.json({
      data: transformed,
      meta: {
        total: data.meta?.total || 0,
        page: data.meta?.current_page || 1,
        per_page: data.meta?.per_page || 50,
        totalPages: data.meta?.last_page || 1,
      },
    });
  } catch (error) {
    console.error('Admin messages API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', data: [] },
      { status: 500 }
    );
  }
}
