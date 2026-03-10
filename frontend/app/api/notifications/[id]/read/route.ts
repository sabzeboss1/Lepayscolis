import { NextRequest, NextResponse } from 'next/server';
import { notifications } from '@/lib/api/mockData';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // In production, this would call the backend API
    // For now, update mock data
    const notification = notifications.find(n => n.id === id);
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    notification.is_read = true;
    
    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
