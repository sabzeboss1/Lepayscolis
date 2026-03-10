import { NextRequest, NextResponse } from 'next/server';
import { notifications } from '@/lib/api/mockData';

export async function PUT(request: NextRequest) {
  try {
    // In production, this would call the backend API
    // For now, update mock data
    notifications.forEach(notification => {
      notification.is_read = true;
    });
    
    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}
