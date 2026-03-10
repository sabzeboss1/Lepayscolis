import { NextResponse } from 'next/server';
import { mockAnalytics } from '@/lib/api/adminMockData';

export async function GET() {
  return NextResponse.json(mockAnalytics);
}
