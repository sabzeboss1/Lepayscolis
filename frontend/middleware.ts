import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  const adminToken = request.cookies.get('admin-token');
  const { pathname } = request.nextUrl;

  // Define route patterns
  const isAuthPage = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register');
  const isAdminPage = pathname.startsWith('/admin');
  const isAdminLoginPage = pathname === '/admin/login';
  const isAppPage = 
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/kyc') ||
    pathname.startsWith('/travel') ||
    pathname.startsWith('/trips') ||
    pathname.startsWith('/shipment') ||
    pathname.startsWith('/shipments') ||
    pathname.startsWith('/messages') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/ratings');

  // Admin route protection
  // NOTE: We let the admin layout handle authentication verification
  // The middleware only redirects authenticated admins away from the login page
  // This is because the cookie is httpOnly and the layout checks localStorage
  
  // Redirect authenticated admin from login page to dashboard
  if (isAdminLoginPage && adminToken) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }
  
  // For other admin pages, let the layout handle auth verification
  // The layout will check localStorage and redirect to login if needed

  // Redirect to login if accessing app pages without auth
  if (isAppPage && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing auth pages while authenticated
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)',
  ],
};
