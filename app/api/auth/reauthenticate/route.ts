import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sharedDb } from '@bancactiu/db';
import { verifyPassword } from '@/lib/crypto-security';
import { getServerUsers, matchesIdentifier } from '@/lib/server-credentials-store';
import { verifySessionToken } from '@/lib/security/session';
import { reauthRateLimiter } from '@/lib/security/rate-limit';
import { extractClientIp, recordIntrusionEvent } from '@/lib/intrusion-store';

export async function POST(request: Request) {
  const clientIp = extractClientIp(request);

  // Rate Limiting per IP (5 intents/minut)
  const rateLimit = reauthRateLimiter.check(clientIp);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'S\'ha superat el límit d\'intents de re-autenticació. Espereu 1 minut.',
      },
      { status: 429 }
    );
  }

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('bancactiu_session')?.value;
    const session = verifySessionToken(sessionCookie);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sessió no vàlida o caducada. Cal iniciar sessió prèviament.',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      password,
      actionName = 'Acció Sensible',
      actionDetails = '',
      justification = '',
      module = 'bancactiu-nexus',
    } = body;

    const cleanDni = session.dni;

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          error: 'La contrasenya de confirmació és estrictament obligatòria.',
        },
        { status: 400 }
      );
    }

    // Comprovació de rols sensibles autoritzats
    const effectiveRole = session.role.toUpperCase();
    const isSensitiveRole =
      effectiveRole === 'SUPERADMIN' ||
      effectiveRole === 'SUPER_ADMIN' ||
      effectiveRole === 'GERENCIA' ||
      effectiveRole === 'DIRECCIO' ||
      effectiveRole === 'DIRECTOR' ||
      effectiveRole === 'TECNIC_SALUT';

    if (!isSensitiveRole) {
      return NextResponse.json(
        {
          success: false,
          error: 'Accés denegat: El teu rol actual no disposa de suficients privilegis per executar aquesta acció sensible.',
        },
        { status: 403 }
      );
    }

    // Verificació de credencials contra la base de dades i magatzem del servidor
    let isValidPassword = false;
    const verification = await sharedDb.verifyUserPassword(cleanDni, password);
    if (verification.valid) {
      isValidPassword = true;
    } else {
      try {
        const serverUsers = getServerUsers();
        const sUser = serverUsers.find((u) => matchesIdentifier(u, cleanDni));
        if (sUser && sUser.currentPassword) {
          isValidPassword = verifyPassword(password.trim(), sUser.currentPassword);
        }
      } catch {}
    }

    // CERO TOLERANCIA A BACKDOORS: Eliminades claus fixes i comparacions laxes
    if (!isValidPassword) {
      recordIntrusionEvent({
        ip: clientIp,
        route: '/api/auth/reauthenticate',
        method: 'POST',
        attemptType: 'Accés No Autoritzat',
        userAgent: request.headers.get('user-agent') || 'Desconegut',
        details: `Contrasenya incorrecta en re-autenticació per a l'acció [${actionName}] (Usuari: ${cleanDni})`,
        severity: 'HIGH',
        status: 'BLOCKED',
        locationInfo: 'IP d\'Accés',
      });

      await sharedDb.logAudit({
        actorDni: cleanDni,
        actorNom: session.name,
        appSource: module,
        accio: 'REAUTENTICACIO_CONTRASENYA_INCORRECTA',
        entitat: `ENS_SENSIBLE: ${actionName}`,
        detall: `Clau d'accés invàlida introduïda durant la doble verificació per a l'acció [${actionName}].`,
        ip: clientIp,
        rgpdConforme: true,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'La contrasenya de confirmació és incorrecta. L\'incident s\'ha registrat a l\'auditoria perimetral.',
        },
        { status: 401 }
      );
    }

    // Registre d'auditoria immutable ENS Nivell Alt & RGPD
    const auditRecord = await sharedDb.logAudit({
      actorDni: cleanDni,
      actorNom: session.name,
      appSource: module,
      accio: 'REAUTENTICACIO_ACCIO_SENSIBLE_APROVADA',
      entitat: `ENS_SENSIBLE: ${actionName}`,
      detall: `Doble factor verificat amb èxit. Acció autoritzada: [${actionName}]. Motiu: ${
        justification || 'Operativa ordinària de governança'
      }. Detalls: ${actionDetails || 'Paràmetres perimetrals'}.`,
      ip: clientIp,
      rgpdConforme: true,
    });

    return NextResponse.json({
      success: true,
      authorized: true,
      authorizedAt: new Date().toISOString(),
      auditId: auditRecord.id,
      actorDni: cleanDni,
      action: actionName,
      message: 'Re-autenticació de seguretat satisfactòria.',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error intern en processar la re-autenticació.',
      },
      { status: 500 }
    );
  }
}
