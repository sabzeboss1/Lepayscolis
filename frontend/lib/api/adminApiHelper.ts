import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Helper function to make authenticated requests to Laravel backend from Next.js API routes
 * Extracts admin token from cookies and forwards it to the backend
 */
export async function makeAdminRequest(
  request: NextRequest,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get admin token from cookies
  const adminToken = request.cookies.get('auth-token')?.value;
  
  if (!adminToken) {
    throw new Error('Unauthorized - No admin token found');
  }

  // Merge headers with authentication
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${adminToken}`,
    ...options.headers,
  };

  // Make request to Laravel backend
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}

/**
 * Extract admin token from request cookies
 */
export function getAdminToken(request: NextRequest): string | null {
  return request.cookies.get('auth-token')?.value || null;
}
