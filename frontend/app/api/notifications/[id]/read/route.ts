import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api/config';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const response = await fetch(`${getBackendUrl()}/api/notifications/${id}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }
      throw new Error('Failed to mark notification as read');
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      notification: data.notification,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
