import crypto from 'crypto';

export interface SessionPayload {
  userId: string;
  dni: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  institution: string;
  authenticated: true;
  authMethod: string;
  iat: number;
  exp: number;
  idleExp: number;
  sessionId: string;
}

export const SESSION_COOKIE_NAME = 'bancactiu_session';
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hores
export const SESSION_IDLE_TIMEOUT_SECONDS = 30 * 60; // 30 minuts d'inactivitat

let ephemeralDevSecret: string | null = null;

export function getSessionSecret(): string {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    // Durant la fase de build estàtic de Next.js es permet una clau efímera per a la recollida de pàgines
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      if (!ephemeralDevSecret) {
        ephemeralDevSecret = crypto.randomBytes(32).toString('hex');
      }
      return ephemeralDevSecret;
    }
    throw new Error('[SECURITY FATAL] SESSION_SECRET obligatòria en entorns de producció (ENS Nivell Alt).');
  }

  // Entorn de desenvolupament o proves: clau efímera en memòria per procés
  if (!ephemeralDevSecret) {
    ephemeralDevSecret = crypto.randomBytes(32).toString('hex');
  }
  return ephemeralDevSecret;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Crea un token de sessió firmat criptogràficament amb HMAC-SHA256
 */
export function createSessionToken(
  user: {
    userId: string;
    dni: string;
    name: string;
    email: string;
    role: string;
    roleLabel?: string;
    institution?: string;
    authMethod?: string;
  },
  customTtlSeconds = SESSION_MAX_AGE_SECONDS
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    userId: user.userId,
    dni: user.dni.toUpperCase().trim(),
    name: user.name,
    email: user.email,
    role: user.role,
    roleLabel: user.roleLabel || 'Personal Acreditat',
    institution: user.institution || 'BancActiu Catalunya',
    authenticated: true,
    authMethod: user.authMethod || 'Credencials Corporatives',
    iat: now,
    exp: now + customTtlSeconds,
    idleExp: now + SESSION_IDLE_TIMEOUT_SECONDS,
    sessionId: crypto.randomUUID(),
  };

  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const secret = getSessionSecret();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifica un token de sessió amb protecció contra timing attacks i comprovació d'expiració estricta
 */
export function verifySessionToken(token: string | null | undefined): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signatureB64] = parts;
  if (!payloadB64 || !signatureB64) return null;

  try {
    const secret = getSessionSecret();
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const sigBuf = Buffer.from(signatureB64, 'utf8');
    const expectedBuf = Buffer.from(expectedSig, 'utf8');

    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const jsonStr = base64UrlDecode(payloadB64);
    const payload = JSON.parse(jsonStr) as SessionPayload;

    const now = Math.floor(Date.now() / 1000);

    // Comprovació obligatòria de caducitat absoluta
    if (!payload.exp || typeof payload.exp !== 'number' || payload.exp < now) {
      return null;
    }

    // Comprovació de caducitat per inactivitat
    if (payload.idleExp && typeof payload.idleExp === 'number' && payload.idleExp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Opcions de la cookie de sessió estricta ENS Nivell Alt
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
};
