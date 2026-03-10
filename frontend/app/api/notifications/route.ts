import { NextRequest, NextResponse } from 'next/server';
import { notifications } from '@/lib/api/mockData';

export async function GET(request: NextRequest) {
  try {
    // In production, this would fetch from the backend API
    // For now, return mock data
    
    const unreadNotifications = notifications.filter(n => !n.is_read);
    
    return NextResponse.json({
      notifications: notifications,
      unread_count: unreadNotifications.length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
