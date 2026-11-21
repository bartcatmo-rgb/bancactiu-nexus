import { NextResponse } from 'next/server';
import { guardApiAccess } from '@/lib/security-api-guard';
import { getRecentAuditBlocks, verifyMerkleChainIntegrity } from '@/lib/audit-merkle-chain';
import { sharedDb } from '@bancactiu/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request): Promise<NextResponse> {
  const guard = guardApiAccess(request, {
    requiredRoles: ['SUPER_ADMIN', 'SUPERADMIN'],
  });
  if (!guard.allowed) return guard.response!;

  const merkleVerification = verifyMerkleChainIntegrity();
  const recentMerkleBlocks = getRecentAuditBlocks(50);
  const dbLogs = await sharedDb.getAuditLogs();

  return NextResponse.json({
    ok: true,
    merkleStatus: merkleVerification.isValid ? 'INTEGRITAT_VERIFICADA' : 'CORRUPCIO_DETECTADA',
    merkleVerification,
    recentMerkleBlocks,
    dbLogs: dbLogs.slice(0, 100),
  });
}
