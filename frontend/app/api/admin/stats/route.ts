import { NextResponse } from 'next/server';
import { mockAdminStats } from '@/lib/api/adminMockData';

export async function GET() {
  return NextResponse.json(mockAdminStats);
}
