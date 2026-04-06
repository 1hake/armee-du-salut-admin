import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get('session')?.value

  // Allow login page and static assets
  if (pathname === '/login' || pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname === '/favicon.ico') {
    // If logged in and trying to access login, redirect to home
    if (pathname === '/login' && session) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Redirect to login if no session cookie
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
