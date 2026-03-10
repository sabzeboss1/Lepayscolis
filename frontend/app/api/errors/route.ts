import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();
    
    // Log error to console (in production, send to logging service like Sentry)
    console.error('[Client Error]', {
      timestamp: errorData.timestamp,
      url: errorData.url,
      error: errorData.error,
      stack: errorData.stack,
      componentStack: errorData.componentStack,
      userAgent: errorData.userAgent,
    });

    // In production, you would send this to a logging service:
    // await sendToSentry(errorData);
    // await sendToDatadog(errorData);
    // await logToDatabase(errorData);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to log client error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
