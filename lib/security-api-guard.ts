import { NextResponse } from 'next/server';
import { getLockdownState, isIpBlocked, isSuperAdminEmergencyActor } from '@/lib/security-lockdown';
import { verifySessionToken, SessionPayload } from '@/lib/security/session';

export interface GuardOptions {
  requiredRoles?: string[];
  allowCiutada?: boolean;
  allowAnonymous?: boolean;
  isWriteOperation?: boolean;
  actorDni?: string;
}

export interface GuardResult {
  allowed: boolean;
  response?: NextResponse;
  clientIp: string;
  actorDni?: string;
  actorRol?: string;
  actorName?: string;
  session?: SessionPayload;
}

/**
 * Extreu la IP del client d'una Request estàndard de l'App Router
 */
export function getRequestClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

/**
 * Guardià defensiu centralitzat per a tots els endpoints de l'App Router:
 * 1. Verifica si la IP està bloquejada pel WAF.
 * 2. Verifica la sessió criptogràfica HMAC-SHA256 (Cero Confianza en capçaleres d'usuari).
 * 3. Si el Mode Seguretat (Lockdown) està actiu, rebutja operacions d'escriptura
 *    llevat que sigui un Superadministrador global.
 * 4. Valida el rol de l'usuari contra els rols permesos per prevenir IDOR.
 */
export function guardApiAccess(request: Request, options: GuardOptions = {}): GuardResult {
  const clientIp = getRequestClientIp(request);
  const method = request.method.toUpperCase();
  const isWrite = options.isWriteOperation ?? ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  // 1. Verificació d'IP bloquejada
  if (isIpBlocked(clientIp)) {
    return {
      allowed: false,
      clientIp,
      response: NextResponse.json(
        {
          ok: false,
          missatge: `Accés denegat: La IP ${clientIp} està bloquejada per violació de seguretat sanitària.`,
        },
        { status: 403 }
      ),
    };
  }

  // 2. Extracció i verificació estricta de la sessió criptogràfica (Zero-Trust)
  let session: SessionPayload | null = null;
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionMatch = cookieHeader.match(/bancactiu_session=([^;]+)/);
  if (sessionMatch) {
    const rawToken = decodeURIComponent(sessionMatch[1]);
    session = verifySessionToken(rawToken);
  }

  // CERO CONFIANZA: Ignorar completament x-user-dni i x-user-role de les capçaleres externes
  const actorDni = session?.dni || '';
  const actorRol = session?.role || '';
  const actorName = session?.name || '';

  if (!options.allowAnonymous && !session) {
    return {
      allowed: false,
      clientIp,
      response: NextResponse.json(
        {
          ok: false,
          error: 'Accés no autoritzat',
          missatge: 'Cal una sessió corporativa vàlida per accedir a aquest recurs.',
          code: 'UNAUTHORIZED_SESSION_REQUIRED',
        },
        { status: 401 }
      ),
    };
  }

  // 3. Verificació de Mode Seguretat (System Lockdown)
  const lockdown = getLockdownState();
  if (lockdown.isLockdownActive && isWrite) {
    const isEmergencyAdmin = isSuperAdminEmergencyActor(actorDni);
    if (!isEmergencyAdmin) {
      return {
        allowed: false,
        clientIp,
        actorDni,
        actorRol,
        actorName,
        response: NextResponse.json(
          {
            ok: false,
            missatge:
              '⛔ MODE SEGURETAT ACTIU (SYSTEM LOCKDOWN): Totes les operacions de creació o modificació de dades han estat suspeses temporalment per protegir la integritat del sistema davant d’un incident de seguretat. Només els Superadministradors poden operar.',
            lockdownReason: lockdown.lockdownReason,
            activatedAt: lockdown.activatedAt,
          },
          { status: 423 }
        ),
      };
    }
  }

  // 4. Verificació de rols requerits
  if (options.requiredRoles && options.requiredRoles.length > 0) {
    const isSuperAdmin =
      isSuperAdminEmergencyActor(actorDni) ||
      actorRol === 'SUPER_ADMIN' ||
      actorRol === 'SUPERADMIN';

    if (!isSuperAdmin) {
      const hasRequiredRole = options.requiredRoles.some(
        (r) => r.toUpperCase() === actorRol.toUpperCase()
      );
      if (!hasRequiredRole) {
        return {
          allowed: false,
          clientIp,
          actorDni,
          actorRol,
          actorName,
          response: NextResponse.json(
            {
              ok: false,
              missatge:
                'Accés no autoritzat: El vostre rol d’usuari no disposa dels privilegis requerits per a aquesta operació.',
            },
            { status: 403 }
          ),
        };
      }
    }
  }

  return { allowed: true, clientIp, actorDni, actorRol, actorName, session: session || undefined };
}

/**
 * Validació de jerarquia estricta (anti-IDOR i prevenció d'escalada de privilegis)
 * per a la creació d'usuaris i adscripció de centres:
 * - SUPER_ADMIN: pot crear qualsevol rol i assignar a qualsevol centre/territori.
 * - GERENCIA_TERRITORIAL: només pot donar d'alta DIRECCIO_CAP o centres en el seu territori.
 * - DIRECCIO_CAP / REFERENT_GESTIO_CAP / CAP_ADMIN: només poden donar d'alta personal del seu propi centreId.
 */
export function validateHierarchyScope(params: {
  actorRol: string;
  actorCentreId?: string;
  actorTerritori?: string;
  targetRol: string;
  targetCentreId?: string;
  targetTerritori?: string;
}): { allowed: boolean; reason?: string } {
  const { actorRol, actorCentreId, actorTerritori, targetRol, targetCentreId, targetTerritori } = params;

  if (actorRol === 'SUPER_ADMIN' || actorRol === 'SUPERADMIN') {
    return { allowed: true };
  }

  if (actorRol === 'GERENCIA_TERRITORIAL' || actorRol === 'TECNIC_SALUT_GERENCIA') {
    const allowedTargetRoles = ['DIRECCIO_CAP', 'REFERENT_GESTIO_CAP', 'CAP_REFERENT'];
    if (!allowedTargetRoles.includes(targetRol)) {
      return {
        allowed: false,
        reason: `Una Gerència Territorial només pot donar d'alta càrrecs de Direcció o Referents de CAP, no pas el rol ${targetRol}.`,
      };
    }
    if (actorTerritori && targetTerritori && !targetTerritori.toLowerCase().includes(actorTerritori.toLowerCase())) {
      return {
        allowed: false,
        reason: `No podeu crear usuaris fora del vostre àmbit territorial (${actorTerritori}).`,
      };
    }
    return { allowed: true };
  }

  if (actorRol === 'DIRECCIO_CAP' || actorRol === 'REFERENT_GESTIO_CAP' || actorRol === 'CAP_ADMIN') {
    const allowedStaffRoles = [
      'METGE',
      'INFERMERIA',
      'ADMINISTRATIU',
      'CAP_ADMIN',
      'TREBALL_SOCIAL',
      'TECNIC_LOCAL',
    ];
    if (!allowedStaffRoles.includes(targetRol)) {
      return {
        allowed: false,
        reason: `La Direcció de CAP només pot gestionar personal intern del centre, no pas el rol ${targetRol}.`,
      };
    }
    if (actorCentreId && targetCentreId && actorCentreId !== targetCentreId) {
      return {
        allowed: false,
        reason: `Accés denegat (IDOR): No podeu assignar personal a un centre distint del vostre (${actorCentreId}).`,
      };
    }
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `El rol ${actorRol} no té autorització per gestionar altes a l'organigrama.`,
  };
}
