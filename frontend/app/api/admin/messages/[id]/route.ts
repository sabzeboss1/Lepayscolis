import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const response = await makeAdminRequest(
      request,
      `/api/admin/messages/conversations/${params.id}`,
      { method: 'GET' }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Transform backend response to match frontend expectations
    const conv = data.data?.conversation;
    const messages = data.data?.messages || [];

    const transformed = {
      id: conv?.id || params.id,
      participants: [
        conv?.user1 ? {
          id: conv.user1.id,
          name: conv.user1.name,
          email: conv.user1.email,
          messaging_banned: conv.user1.messaging_banned || false,
          messaging_ban_reason: conv.user1.messaging_ban_reason || null,
        } : { id: '', name: 'Unknown', email: '', messaging_banned: false },
        conv?.user2 ? {
          id: conv.user2.id,
          name: conv.user2.name,
          email: conv.user2.email,
          messaging_banned: conv.user2.messaging_banned || false,
          messaging_ban_reason: conv.user2.messaging_ban_reason || null,
        } : { id: '', name: 'Unknown', email: '', messaging_banned: false },
      ],
      messages: messages.map((msg: any) => ({
        id: msg.id,
        sender: msg.sender ? {
          id: msg.sender.id,
          name: msg.sender.name,
          email: msg.sender.email || '',
          messaging_banned: false,
        } : { id: msg.sender_id, name: 'Unknown', email: '', messaging_banned: false },
        content: msg.content,
        sent_at: msg.created_at,
      })),
    };

    return NextResponse.json({ data: transformed });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Conversation not found' },
      { status: error.message?.includes('Unauthorized') ? 401 : 404 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();

    const response = await makeAdminRequest(
      request,
      `/api/admin/messages/${params.id}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: body.reason }),
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(data, { status: response.status });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to delete message' },
      { status: 500 }
    );
  }
}
