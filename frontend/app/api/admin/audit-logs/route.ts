import { NextRequest, NextResponse } from 'next/server';
import { mockAuditLogs } from '@/lib/api/adminMockData';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const resource = searchParams.get('resource') || '';
  const action = searchParams.get('action') || '';

  let filtered = [...mockAuditLogs];

  if (resource) {
    filtered = filtered.filter(log => log.resource === resource);
  }

  if (action) {
    filtered = filtered.filter(log => log.action.toLowerCase().includes(action.toLowerCase()));
  }

  const start = (page - 1) * limit;
  const end = start + limit;
  const paginated = filtered.slice(start, end);

  return NextResponse.json({
    data: paginated,
    meta: {
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    },
  });
}
