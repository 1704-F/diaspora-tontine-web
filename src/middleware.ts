import { NextRequest, NextResponse } from 'next/server'

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Routes publiques - pas de redirection
  const publicPaths = ['/', '/login', '/register', '/about']
  
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

  // Routes protégées - vérifier auth plus tard côté client
  const protectedPaths = ['/dashboard', '/modules']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  
  if (isProtectedPath) {
    // Laisser passer, l'auth sera vérifiée côté client avec ProtectedRoute
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
}