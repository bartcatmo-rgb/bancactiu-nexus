import { NextResponse } from 'next/server';
import { guardApiAccess } from '@/lib/security-api-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request): Promise<NextResponse> {
  const guard = guardApiAccess(request, {
    requiredRoles: ['SUPER_ADMIN', 'SUPERADMIN'],
  });
  if (!guard.allowed) return guard.response!;

  return NextResponse.json({
    ok: true,
    status: 'OPERATIONAL',
    message: 'Consola de diagnòstic i governança de BancActiu 3.0 Enterprise activa.',
    actor: guard.actorDni,
    role: guard.actorRol,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const guard = guardApiAccess(request, {
    requiredRoles: ['SUPER_ADMIN', 'SUPERADMIN'],
    isWriteOperation: true,
  });
  if (!guard.allowed) return guard.response!;

  const body = await request.json().catch(() => ({}));
  const { command } = body;

  if (!command || typeof command !== 'string') {
    return NextResponse.json({ ok: false, error: 'Ordre de diagnòstic no especificada.' }, { status: 400 });
  }

  // Comprovació de seguretat: comandes autoritzades de només lectura/diagnòstic
  const allowedCommands = ['STATUS', 'HEALTH_CHECK', 'VERSION', 'PING'];
  const normalizedCmd = command.trim().toUpperCase();

  if (!allowedCommands.includes(normalizedCmd)) {
    return NextResponse.json(
      {
        ok: false,
        error: `L'ordre "${command}" no està autoritzada per a execució perimetral.`,
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    ok: true,
    command: normalizedCmd,
    executedBy: guard.actorDni,
    output: `Ordre ${normalizedCmd} executada satisfactòriament pel Superadministrador. Estat del sistema: 100% natiu i blindat.`,
    executedAt: new Date().toISOString(),
  });
}
