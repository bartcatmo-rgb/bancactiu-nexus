import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from './lib/tenant';

let ephemeralEdgeDevSecret: string | null = null;

function getEdgeSessionSecret(): string {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return 'build-ephemeral-secret-phase-production-build';
    }
    throw new Error('[SECURITY FATAL] SESSION_SECRET obligatòria en entorns de producció (ENS Nivell Alt).');
  }

  if (!ephemeralEdgeDevSecret) {
    ephemeralEdgeDevSecret = 'bancactiu_dev_edge_session_secret_2026_fallback!';
  }
  return ephemeralEdgeDevSecret;
}

function base64UrlToUint8Array(b64url: string): Uint8Array {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) {
    b64 += '=';
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function verifySessionEdge(token: string | undefined): Promise<any | null> {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signatureB64] = parts;
  if (!payloadB64 || !signatureB64) return null;

  try {
    const secret = getEdgeSessionSecret();
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBuf = base64UrlToUint8Array(signatureB64);
    const dataBuf = enc.encode(payloadB64);
    const isValid = await crypto.subtle.verify('HMAC', key, sigBuf as any, dataBuf as any);
    if (!isValid) return null;

    const jsonStr = new TextDecoder().decode(base64UrlToUint8Array(payloadB64));
    const payload = JSON.parse(jsonStr);

    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || typeof payload.exp !== 'number' || payload.exp < now) {
      return null;
    }

    if (payload.idleExp && typeof payload.idleExp === 'number' && payload.idleExp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  // 1. Bloqueig immediat de bypass de Middleware (CVE-2025-29927)
  if (request.headers.has('x-middleware-subrequest')) {
    return new NextResponse('Forbidden: direct subrequest invocation denied', { status: 403 });
  }

  const { pathname } = request.nextUrl;

  // 2. Resolució Dinàmica de Multi-Tenant contextual
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1');
  const requestHost = request.headers.get('host') || request.nextUrl.host || '';
  const tenantParam = request.nextUrl.searchParams.get('tenant');

  const tenant = resolveTenant(clientIp, requestHost, tenantParam);

  const tenantCookieValue = encodeURIComponent(
    JSON.stringify({
      id: tenant.id,
      code: tenant.code,
      name: tenant.name,
      shortName: tenant.shortName,
      description: tenant.description,
      badgeLabel: tenant.badgeLabel,
      badgeVariant: tenant.badgeVariant,
      themeColor: tenant.themeColor,
      allowedModules: tenant.allowedModules,
      isDefault: tenant.isDefault,
    })
  );

  const applyTenantHeaders = (res: NextResponse) => {
    res.cookies.set('bancactiu_tenant', tenantCookieValue, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24,
    });
    return res;
  };

  // 3. Rutes públiques d'autenticació i recursos estàtics
  if (
    pathname === '/login' ||
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/logout' ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/docs') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|woff2?|map|pdf)$/)
  ) {
    if (pathname === '/login') {
      const response = NextResponse.next();
      response.cookies.delete('bancactiu_session');
      return applyTenantHeaders(response);
    }
    const response = NextResponse.next();
    return applyTenantHeaders(response);
  }

  // 4. Verificació criptogràfica real de sessió en Edge Runtime (Web Crypto HMAC-SHA256)
  const sessionCookie = request.cookies.get('bancactiu_session')?.value;
  const verifiedSession = await verifySessionEdge(sessionCookie);

  // 5. Bloqueig estricte d'accés no autenticat
  if (!verifiedSession) {
    if (pathname.startsWith('/api/')) {
      const unauthorizedRes = NextResponse.json(
        {
          error: 'Accés no autoritzat',
          message: 'Sessió corporativa vàlida requerida per accedir als serveis de BancActiu Nexus.',
          code: 'UNAUTHORIZED_ACCESS_DENIED',
        },
        { status: 401 }
      );
      unauthorizedRes.cookies.delete('bancactiu_session');
      return applyTenantHeaders(unauthorizedRes);
    }

    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/' && pathname !== '' && pathname !== '/login' && !pathname.startsWith('/login')) {
      loginUrl.searchParams.set('redirect', pathname);
    }
    const redirectRes = NextResponse.redirect(loginUrl);
    redirectRes.cookies.delete('bancactiu_session');
    return applyTenantHeaders(redirectRes);
  }

  const defaultRes = NextResponse.next();
  return applyTenantHeaders(defaultRes);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
