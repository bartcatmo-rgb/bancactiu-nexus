import { NextResponse } from 'next/server';
import { getIntrusionEvents } from '@/lib/intrusion-store';
import { guardApiAccess } from '@/lib/security-api-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request): Promise<NextResponse> {
  const guard = guardApiAccess(request, {
    requiredRoles: ['SUPER_ADMIN', 'SUPERADMIN'],
  });
  if (!guard.allowed) return guard.response!;

  const logs = getIntrusionEvents();
  return NextResponse.json({
    ok: true,
    total: logs.length,
    events: logs,
  });
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const guard = guardApiAccess(request, {
    requiredRoles: ['SUPER_ADMIN', 'SUPERADMIN'],
  });
  if (!guard.allowed) return guard.response!;

  return NextResponse.json(
    {
      ok: false,
      error: 'Operació no permesa. Els registres de seguretat i telemetria són estrictament immutables i append-only (ENS Nivell Alt).',
    },
    { status: 405 }
  );
}
