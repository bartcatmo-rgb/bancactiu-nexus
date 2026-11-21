import { NextResponse } from 'next/server';
import { getSoarIncidents, liftSoarQuarantine } from '@/lib/soar-engine';
import { verifyMerkleChainIntegrity, getRecentAuditBlocks } from '@/lib/audit-merkle-chain';
import { guardApiAccess } from '@/lib/security-api-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request): Promise<NextResponse> {
  const guard = guardApiAccess(request, {
    requiredRoles: ['SUPER_ADMIN', 'SUPERADMIN']
  });
  if (!guard.allowed) return guard.response!;

  const incidents = getSoarIncidents();
  const merkleVerification = verifyMerkleChainIntegrity();
  const recentAuditBlocks = getRecentAuditBlocks(15);

  return NextResponse.json({
    ok: true,
    soarEngine: {
      status: 'ACTIVE_MILITARY_GRADE',
      totalIncidentsMitigated: incidents.length,
      recentIncidents: incidents.slice(0, 10),
    },
    merkleAuditChain: {
      integrity: merkleVerification.isValid ? 'VERIFIED_100%' : 'INTEGRITY_VIOLATION_DETECTED',
      details: merkleVerification,
      recentBlocks: recentAuditBlocks
    }
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const guard = guardApiAccess(request, {
    requiredRoles: ['SUPER_ADMIN', 'SUPERADMIN'],
    isWriteOperation: true
  });
  if (!guard.allowed) return guard.response!;

  const body = await request.json().catch(() => ({}));
  const { action, clientIp } = body;

  if (action === 'LIFT_QUARANTINE' && clientIp) {
    const success = liftSoarQuarantine(clientIp);
    return NextResponse.json({
      ok: success,
      missatge: success ? `Quarantena SOAR aixecada per a la IP ${clientIp}.` : `No s'ha trobat registre de quarantena per a la IP ${clientIp}.`
    });
  }

  return NextResponse.json({ ok: false, missatge: 'Acció no reconeguda.' }, { status: 400 });
}
