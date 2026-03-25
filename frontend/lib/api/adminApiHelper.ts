import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Helper function to make authenticated requests to Laravel backend from Next.js API routes
 * Extracts auth token from cookies and forwards it to the backend
 */
export async function makeAdminRequest(
  request: NextRequest,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get auth token from cookies (unified token for all users including admins)
  const authToken = request.cookies.get('auth-token')?.value;
  
  if (!authToken) {
    throw new Error('Unauthorized - No auth token found');
  }

  // Merge headers with authentication
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${authToken}`,
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
 * Extract auth token from request cookies
 */
export function getAdminToken(request: NextRequest): string | null {
  return request.cookies.get('auth-token')?.value || null;
}
