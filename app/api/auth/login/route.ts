import { NextResponse } from 'next/server';
import { sharedDb } from '@bancactiu/db';
import { appendAuditBlock } from '@/lib/audit-merkle-chain';
import { verifyPassword } from '@/lib/crypto-security';
import { getServerUsers, matchesIdentifier } from '@/lib/server-credentials-store';
import { recordIntrusionEvent, extractClientIp } from '@/lib/intrusion-store';
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '@/lib/security/session';
import { loginRateLimiter } from '@/lib/security/rate-limit';

export async function POST(request: Request) {
  const clientIp = extractClientIp(request);

  // Rate Limiting per IP per prevenir atacs de força bruta (5 intents/minut)
  const rateLimit = loginRateLimiter.check(clientIp);
  if (!rateLimit.allowed) {
    recordIntrusionEvent({
      ip: clientIp,
      route: '/api/auth/login',
      method: 'POST',
      attemptType: 'Força Bruta',
      userAgent: request.headers.get('user-agent') || 'Desconegut',
      details: 'Superat el llindar de 5 intents per minut al portal d\'accés',
      severity: 'HIGH',
      status: 'BLOCKED',
      locationInfo: 'Perímetre Extern',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'S\'ha superat el límit d\'intents d\'inici de sessió. Espereu 1 minut abans de tornar-ho a provar.',
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { identifier, password } = body;

    const rawIdentifier = (identifier || '').trim();
    if (!rawIdentifier) {
      return NextResponse.json(
        { success: false, error: 'Cal indicar el vostre DNI o nom d\'usuari.' },
        { status: 400 }
      );
    }

    const cleanId = rawIdentifier.toUpperCase();

    // Normalització d'identificadors corporatius
    let lookupTarget = cleanId;
    if (cleanId === 'ADMINISTRADOR' || cleanId === 'ADMIN') {
      lookupTarget = '52622304Y';
    } else if (cleanId === 'SUPERADMIN') {
      lookupTarget = '47956602S';
    }

    // Buscar l'usuari a la base de dades
    const userRecord = await sharedDb.getUserByDni(lookupTarget);

    if (!userRecord) {
      recordIntrusionEvent({
        ip: clientIp,
        route: '/api/auth/login',
        method: 'POST',
        attemptType: 'Accés No Autoritzat',
        userAgent: request.headers.get('user-agent') || 'Desconegut',
        details: `Intent d'accés amb identificador no existent: "${identifier}"`,
        severity: 'HIGH',
        status: 'BLOCKED',
        locationInfo: 'Xarxa Externa',
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Usuari no autoritzat o no registrat a la plataforma BancActiu 2.0.',
          triggerHoneypot: true,
        },
        { status: 401 }
      );
    }

    // Sincronització amb el magatzem segur persistent del servidor
    try {
      const serverUsers = getServerUsers();
      const sUser = serverUsers.find((u) => matchesIdentifier(u, lookupTarget));
      if (sUser) {
        if (sUser.currentPassword && sUser.currentPassword !== '1234') {
          userRecord.passwordHash = sUser.currentPassword;
          userRecord.mustChangePassword = sUser.mustChangePassword;
          userRecord.isFirstLogin = sUser.mustChangePassword;
        }
        if (sUser.passwordHistory && Array.isArray(sUser.passwordHistory)) {
          userRecord.passwordHistory = sUser.passwordHistory;
        }
      }
    } catch {
      // Fallback transparent
    }

    const attemptPassword = (password || '').trim();
    const hasConfiguredPassword = Boolean(
      userRecord.passwordHash &&
      userRecord.passwordHash !== '1234' &&
      userRecord.mustChangePassword === false
    );

    // Cas 1: Usuari amb contrasenya definitiva ja establerta
    if (hasConfiguredPassword) {
      // Si intenta accedir amb el provisional '1234', queda completament invalidat
      if (attemptPassword === '1234') {
        recordIntrusionEvent({
          ip: clientIp,
          route: '/api/auth/login',
          method: 'POST',
          attemptType: 'Força Bruta',
          userAgent: request.headers.get('user-agent') || 'Desconegut',
          details: `Intent d'utilització de la clau provisional '1234' bloquejada (Usuari: ${userRecord.nomComplet})`,
          severity: 'CRITICAL',
          status: 'HONEYPOT_TRIGGERED',
          locationInfo: 'Xarxa Externa d\'Intrusió',
        });

        return NextResponse.json(
          {
            success: false,
            error: `Clau d'accés incorrecta per a l'usuari ${userRecord.nomComplet}. La clau provisional 1234 ha quedat invalidada.`,
            triggerHoneypot: true,
          },
          { status: 401 }
        );
      }

      const isCorrect = verifyPassword(attemptPassword, userRecord.passwordHash!);
      if (!isCorrect) {
        recordIntrusionEvent({
          ip: clientIp,
          route: '/api/auth/login',
          method: 'POST',
          attemptType: 'Login Fallit',
          userAgent: request.headers.get('user-agent') || 'Desconegut',
          details: `Clau d'accés errònia per a l'usuari ${userRecord.nomComplet} (${userRecord.dni})`,
          severity: 'HIGH',
          status: 'BLOCKED',
          locationInfo: 'IP d\'Accés',
        });

        return NextResponse.json(
          {
            success: false,
            error: `Clau d'accés incorrecta per a l'usuari ${userRecord.nomComplet}.`,
            triggerHoneypot: true,
          },
          { status: 401 }
        );
      }

      // Verificació de caducitat forçosa a 90 dies (ENS Nivell Alt)
      const lastChangeDate = userRecord.passwordUpdatedAt || userRecord.passwordSetAt || userRecord.dataCreacio;
      const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
      const isExpired = lastChangeDate ? Date.now() - new Date(lastChangeDate).getTime() >= ninetyDaysMs : false;

      if (isExpired) {
        return NextResponse.json({
          success: true,
          requirePasswordSetup: true,
          isExpired90Days: true,
          dni: userRecord.dni,
          userId: userRecord.id,
          name: userRecord.nomComplet,
          message: "La teva contrasenya ha superat el període màxim de 90 dies (ENS). Has d'establir-ne una de nova per continuar",
        });
      }
    } else {
      // Cas 2: Primer inici o requeriment de canvi de clau
      const isInitialMatch = Boolean(
        !attemptPassword ||
        attemptPassword === '1234' ||
        (userRecord.passwordHash && verifyPassword(attemptPassword, userRecord.passwordHash))
      );

      if (!isInitialMatch) {
        return NextResponse.json(
          {
            success: false,
            error: `Clau d'accés incorrecta per a la configuració inicial de ${userRecord.nomComplet}.`,
          },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        requirePasswordSetup: true,
        dni: userRecord.dni,
        userId: userRecord.id,
        name: userRecord.nomComplet,
        message: 'Primer inici de sessió detectat. Per protocol de seguretat heu d’establir la contrasenya definitiva.',
      });
    }

    // Autenticació reeixida -> Generació de sessió criptogràfica HMAC-SHA256
    const authenticatedUser = {
      userId: userRecord.id,
      dni: userRecord.dni,
      name: userRecord.nomComplet,
      email: userRecord.email,
      role: userRecord.rolPrincipal,
      roleLabel: userRecord.carrec || 'SuperAdmin TI',
      institution: 'BancActiu Catalunya',
      authMethod: 'Credencials Corporatives (ENS Nivell Alt)',
    };

    const sessionToken = createSessionToken(authenticatedUser);

    const response = NextResponse.json({
      success: true,
      user: {
        userId: authenticatedUser.userId,
        dni: authenticatedUser.dni,
        name: authenticatedUser.name,
        email: authenticatedUser.email,
        role: authenticatedUser.role,
        roleLabel: authenticatedUser.roleLabel,
        institution: authenticatedUser.institution,
        authenticated: true,
        authMethod: authenticatedUser.authMethod,
      },
      message: `Sessió iniciada correctament com a ${userRecord.nomComplet}.`,
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, SESSION_COOKIE_OPTIONS);

    // Registre immutable Merkle d'auditoria
    try {
      appendAuditBlock(
        userRecord.dni,
        'LOGIN_SUCCESS_ENS',
        { dni: userRecord.dni, email: userRecord.email, role: userRecord.rolPrincipal },
        clientIp,
        { ensLevel: 'HIGH' }
      );
    } catch (err) {
      console.warn('[MERKLE-AUDIT] Error registrant bloc de login:', err);
    }

    return response;
  } catch (error: any) {
    console.error('Error fatal a POST /api/auth/login:', error);
    return NextResponse.json(
      { success: false, error: 'Error intern processant l\'autenticació corporativa.' },
      { status: 500 }
    );
  }
}
