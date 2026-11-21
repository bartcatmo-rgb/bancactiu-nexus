import { NextResponse } from 'next/server';
import { sharedDb } from '@bancactiu/db';
import { hashPassword, verifyPassword } from '@/lib/crypto-security';
import { getServerUsers, matchesIdentifier, saveUserPasswordDirect } from '@/lib/server-credentials-store';
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '@/lib/security/session';
import { setupPasswordRateLimiter } from '@/lib/security/rate-limit';
import { extractClientIp, recordIntrusionEvent } from '@/lib/intrusion-store';
import { appendAuditBlock } from '@/lib/audit-merkle-chain';

export async function POST(request: Request) {
  const clientIp = extractClientIp(request);

  // Rate Limiting per IP per a prevenció de força bruta (5 intents/minut)
  const rateLimit = setupPasswordRateLimiter.check(clientIp);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'S\'ha superat el límit d\'intents de canvi de contrasenya. Espereu 1 minut abans de tornar-ho a provar.',
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { dni, currentPassword, newPassword, confirmPassword } = body;

    const normalizedDni = (dni || '').trim().toUpperCase();

    const user = await sharedDb.getUserByDni(normalizedDni);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Operació denegada. Usuari no trobat a la base de dades institucional.',
        },
        { status: 403 }
      );
    }

    // Sincronitzar amb el magatzem del servidor
    try {
      const serverUsers = getServerUsers();
      const sUser = serverUsers.find((u) => matchesIdentifier(u, normalizedDni));
      if (sUser && sUser.currentPassword) {
        user.passwordHash = sUser.currentPassword;
        user.mustChangePassword = sUser.mustChangePassword;
        if (Array.isArray(sUser.passwordHistory)) {
          user.passwordHistory = sUser.passwordHistory;
        }
      }
    } catch {}

    // Verificació obligatòria de la contrasenya actual / provisional
    const cleanCurrent = (currentPassword || '').trim();
    let isCurrentValid = false;

    if (user.mustChangePassword) {
      // En primer inici es permet el provisional 1234 o el hash inicial
      isCurrentValid =
        !cleanCurrent ||
        cleanCurrent === '1234' ||
        (Boolean(user.passwordHash) && verifyPassword(cleanCurrent, user.passwordHash!));
    } else {
      // En canvi regular o caducitat 90 dies cal conèixer la contrasenya vigent
      isCurrentValid =
        Boolean(cleanCurrent) &&
        Boolean(user.passwordHash) &&
        verifyPassword(cleanCurrent, user.passwordHash!);
    }

    if (!isCurrentValid) {
      recordIntrusionEvent({
        ip: clientIp,
        route: '/api/auth/setup-password',
        method: 'POST',
        attemptType: 'Accés No Autoritzat',
        userAgent: request.headers.get('user-agent') || 'Desconegut',
        details: `Intent de canvi de clau sense contrasenya actual vàlida per a l'usuari ${user.nomComplet} (${user.dni})`,
        severity: 'HIGH',
        status: 'BLOCKED',
        locationInfo: 'IP d\'Accés',
      });

      return NextResponse.json(
        {
          success: false,
          error: 'La contrasenya actual proporcionada no és correcta.',
        },
        { status: 401 }
      );
    }

    if (!newPassword || newPassword.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'La contrasenya ha de tenir com a mínim 10 caràcters (ENS Nivell Alt).',
        },
        { status: 400 }
      );
    }

    // Comprovació de complexitat ENS Nivell Alt
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return NextResponse.json(
        {
          success: false,
          error: 'La contrasenya ha de contenir com a mínim una majúscula, una minúscula, un número i un caràcter especial (ENS Nivell Alt).',
        },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Les contrasenyes introduïdes no coincideixen.',
        },
        { status: 400 }
      );
    }

    // Validació de l'historial (últimes 5 contrasenyes + provisional 1234)
    const history: string[] = Array.isArray(user.passwordHistory) ? [...user.passwordHistory] : [];
    if (user.passwordHash && !history.includes(user.passwordHash)) {
      history.unshift(user.passwordHash);
    }

    const last5 = history.slice(0, 5);
    const matchesPrevious =
      newPassword.trim() === '1234' ||
      last5.some((prevHash) => {
        if (!prevHash) return false;
        return verifyPassword(newPassword.trim(), prevHash);
      });

    if (matchesPrevious) {
      return NextResponse.json(
        {
          success: false,
          error: 'Per seguretat (ENS Nivell Alt), no pots reutilitzar una contrasenya anterior ni la clau inicial 1234.',
        },
        { status: 400 }
      );
    }

    // Generació de hash PBKDF2 amb 210.000 iteracions (ENS Nivell Alt)
    const newHash = hashPassword(newPassword.trim());
    const updatedHistory = [newHash, ...history.filter((h) => h !== newHash)].slice(0, 10);

    user.passwordHash = newHash;
    user.mustChangePassword = false;
    user.isFirstLogin = false;
    user.passwordSetAt = new Date().toISOString();
    user.passwordUpdatedAt = new Date().toISOString();
    user.passwordHistory = updatedHistory;

    await sharedDb.setUserPassword(normalizedDni, newHash, updatedHistory);
    saveUserPasswordDirect(normalizedDni, newHash, updatedHistory);

    const authenticatedUser = {
      userId: user.id,
      dni: user.dni,
      name: user.nomComplet,
      email: user.email,
      role: user.rolPrincipal,
      roleLabel: user.carrec || 'SuperAdmin TI',
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
      message: `Contrasenya per a l'usuari ${user.nomComplet} configurada correctament. Accés autoritzat.`,
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, SESSION_COOKIE_OPTIONS);

    try {
      appendAuditBlock(
        user.dni,
        'PASSWORD_CHANGE_SUCCESS_ENS',
        { dni: user.dni, email: user.email },
        clientIp,
        { ensLevel: 'HIGH' }
      );
    } catch {}

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error en configurar la contrasenya' },
      { status: 500 }
    );
  }
}
