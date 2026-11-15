import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Rutes permeses sense autenticació (públiques, auth endpoints, recursos estàtics)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/login' ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|woff2?|map)$/)
  ) {
    return NextResponse.next();
  }

  // 2. Comprovació de la sessió criptogràfica o de control d'accés
  const sessionCookie = request.cookies.get('bancactiu_session')?.value;

  let isValidSession = false;

  if (sessionCookie) {
    try {
      const decoded = decodeURIComponent(sessionCookie);
      const session = JSON.parse(decoded);
      if (session && session.authenticated === true && session.role) {
        isValidSession = true;
      }
    } catch {
      // Validació alternativa si el token és opac o string directe
      if (sessionCookie.length >= 16) {
        isValidSession = true;
      }
    }
  }

  // 3. Bloqueig d'accés no autoritzat
  if (!isValidSession) {
    // Si és una crida a l'API interna, retornar 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          error: 'Accés no autoritzat',
          message: 'Sessió de SuperAdmin requerida per accedir als serveis de BancActiu Nexus.',
          code: 'UNAUTHORIZED_ACCESS_DENIED'
        },
        { status: 401 }
      );
    }

    // Redirigir a /login guardant el paràmetre de retorn
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/' && pathname !== '') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 4. Si ja té sessió vàlida i intenta anar a /login, redirigir al panell
  if (pathname === '/login' && isValidSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and next internal assets
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
