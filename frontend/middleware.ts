import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  const { pathname } = request.nextUrl;

  // Define route patterns
  const isAuthPage = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register');
  const isAdminPage = pathname.startsWith('/admin');
  const isAppPage =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/kyc') ||
    pathname.startsWith('/travel') ||
    pathname.startsWith('/trips') ||
    pathname.startsWith('/shipment') ||
    pathname.startsWith('/shipments') ||
    pathname.startsWith('/messages') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/ratings') ||
    pathname.startsWith('/wallet') ||
    pathname.startsWith('/payments') ||
    pathname.startsWith('/notifications');

  // Admin pages: require auth token (role check is done client-side by the layout)
  if (isAdminPage && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // App pages: require auth token
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
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)',
  ],
};
