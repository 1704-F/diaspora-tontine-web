// ============================================
// 7. MIDDLEWARE DE REDIRECTION (src/middleware.ts) - MISE À JOUR
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './lib/i18n'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
})

export default function middleware(request: NextRequest) {
  // Routes publiques (pas d'auth requise)
  const publicPaths = ['/login', '/register', '/', '/about']
  
  // Routes protégées (auth requise)
  const protectedPaths = ['/dashboard', '/modules', '/profile', '/settings']
  
  const { pathname } = request.nextUrl
  
  // Vérifier si c'est une route protégée
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  
  if (isProtectedPath) {
    // Vérifier token dans les cookies ou headers
    const token = request.cookies.get('token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      // Rediriger vers login avec returnUrl
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('returnUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  // Appliquer middleware i18n
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
    '/([\\w-]+)?/users/(.+)'
  ]
}
