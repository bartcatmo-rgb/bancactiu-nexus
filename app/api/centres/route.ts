import { NextResponse } from 'next/server';
import dbCloud from '@/lib/db/cloud-database';
import type { CentreSanitariCloud } from '@/types/cloud-database';
import { guardApiAccess } from '@/lib/security-api-guard';

/**
 * GET /api/centres
 * Llistat i cerca de centres sanitaris i entitats col·laboradores
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim().toLowerCase() || '';
    const tipus = searchParams.get('tipus')?.trim() || '';

    let centres = dbCloud.centres.findMany();

    if (query) {
      centres = centres.filter(c =>
        c.nom.toLowerCase().includes(query) ||
        c.codiRecss.toLowerCase().includes(query) ||
        c.municipi.toLowerCase().includes(query) ||
        (c.absId && c.absId.toLowerCase().includes(query)) ||
        c.adreca.toLowerCase().includes(query)
      );
    }

    if (tipus && tipus !== 'TOTS') {
      centres = centres.filter(c => c.tipus === tipus);
    }

    return NextResponse.json({
      ok: true,
      centres,
      total: centres.length,
    });
  } catch (error) {
    console.error('Error GET /api/centres:', error);
    return NextResponse.json(
      { ok: false, missatge: 'Error obtenint el catàleg de centres.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/centres
 * Donar d'alta un nou centre sanitari o entitat
 */
export async function POST(request: Request): Promise<NextResponse> {
  const guard = guardApiAccess(request, {
    requiredRoles: ['SUPER_ADMIN', 'GERENCIA_TERRITORIAL', 'TECNIC_SALUT_GERENCIA'],
    isWriteOperation: true,
  });
  if (!guard.allowed && guard.response) {
    return guard.response;
  }

  try {
    const body = await request.json();
    const { codiRecss, nom, tipus, municipi, absId, adreca, gapicId, sectorId, estatOperatiu, actorDni } = body;

    if (!codiRecss || !nom) {
      return NextResponse.json(
        { ok: false, missatge: 'Cal indicar com a mínim el codi i el nom de la entitat/centre.' },
        { status: 400 }
      );
    }

    const nouCentre: CentreSanitariCloud = {
      codiRecss: codiRecss.trim(),
      nom: nom.trim(),
      tipus: tipus || 'CAP',
      gapicId: gapicId || 'GAPIC_CENTRAL',
      sectorId: sectorId || 'SEC_GENERAL',
      absId: absId?.trim(),
      adreca: adreca || 'Sense adreça especificada',
      municipi: municipi || 'Catalunya',
      estatOperatiu: estatOperatiu || 'OPERATIU',
      estatConveni: 'ACTIU_PILOT',
      faseDesplegament: 1,
      dataActivacio: new Date().toISOString(),
      dataCreacio: new Date().toISOString(),
    };

    const creat = dbCloud.centres.create(nouCentre);

    dbCloud.auditoria.log(
      actorDni || guard.actorDni || 'SISTEMA',
      'ALTA_CENTRE_SANITARI',
      'CentresSanitaris',
      { codiRecss: nouCentre.codiRecss, nom: nouCentre.nom }
    );

    return NextResponse.json({
      ok: true,
      missatge: 'Entitat/Centre donat d\'alta correctament.',
      centre: creat,
    });
  } catch (error) {
    console.error('Error POST /api/centres:', error);
    return NextResponse.json(
      { ok: false, missatge: 'Error registrant el nou centre sanitari.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/centres
 * Actualització de dades operatives d'un centre sanitari per part del Superadministrador o Gerència
 */
export async function PUT(request: Request): Promise<NextResponse> {
  const guard = guardApiAccess(request, {
    requiredRoles: ['SUPER_ADMIN', 'GERENCIA_TERRITORIAL', 'TECNIC_SALUT_GERENCIA'],
    isWriteOperation: true,
  });
  if (!guard.allowed && guard.response) {
    return guard.response;
  }

  try {
    const body = await request.json();
    const { codiRecss, actorDni, ...updates } = body;

    if (!codiRecss) {
      return NextResponse.json(
        { ok: false, missatge: 'Cal indicar el codi RECSS del centre a actualitzar.' },
        { status: 400 }
      );
    }

    const cleanCod = codiRecss.trim();
    const centreExistent = dbCloud.centres.findByRecss(cleanCod);
    if (!centreExistent) {
      return NextResponse.json(
        { ok: false, missatge: `No s'ha trobat cap centre amb codi RECSS ${cleanCod}.` },
        { status: 404 }
      );
    }

    const actorRol = guard.actorRol || (request.headers.get('x-user-role') || '').trim();
    const actorTerritori = (request.headers.get('x-user-territori') || '').trim();

    // Validació de jurisdicció si no és SuperAdmin
    if (actorRol === 'GERENCIA_TERRITORIAL' || actorRol === 'TECNIC_SALUT_GERENCIA') {
      if (actorTerritori && centreExistent.gapicId && !centreExistent.gapicId.toLowerCase().includes(actorTerritori.toLowerCase()) && !actorTerritori.toLowerCase().includes(centreExistent.gapicId.toLowerCase())) {
        return NextResponse.json(
          { ok: false, missatge: `Una Gerència Territorial només pot modificar centres sota la seva demarcació (${actorTerritori}).` },
          { status: 403 }
        );
      }
    }

    const actualitzat = dbCloud.centres.update(cleanCod, updates);

    // Auditoria
    dbCloud.auditoria.log(
      actorDni || guard.actorDni || 'SISTEMA',
      'MODIFICACIO_CENTRE_SANITARI',
      'CentresSanitaris',
      { codiRecss: cleanCod, campsModificats: Object.keys(updates) }
    );

    return NextResponse.json({
      ok: true,
      missatge: 'Centre sanitari actualitzat correctament.',
      centre: actualitzat,
    });
  } catch (error) {
    console.error('Error PUT /api/centres:', error);
    return NextResponse.json(
      { ok: false, missatge: 'Error actualitzant el centre sanitari.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/centres
 * Donar de baixa o suspendre operativament un centre sanitari
 */
export async function DELETE(request: Request): Promise<NextResponse> {
  const guard = guardApiAccess(request, {
    requiredRoles: ['SUPER_ADMIN', 'GERENCIA_TERRITORIAL'],
    isWriteOperation: true,
  });
  if (!guard.allowed && guard.response) {
    return guard.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const codiRecss = searchParams.get('codiRecss');

    if (!codiRecss) {
      return NextResponse.json(
        { ok: false, missatge: 'Cal especificar el paràmetre codiRecss.' },
        { status: 400 }
      );
    }

    const cleanCod = codiRecss.trim();
    const centre = dbCloud.centres.findByRecss(cleanCod);
    if (!centre) {
      return NextResponse.json(
        { ok: false, missatge: `Centre ${cleanCod} no trobat.` },
        { status: 404 }
      );
    }

    const actualitzat = dbCloud.centres.update(cleanCod, {
      estatOperatiu: 'INACTIU',
      estatConveni: 'BAIXA',
    });

    dbCloud.auditoria.log(
      guard.actorDni || 'SISTEMA',
      'BAIXA_CENTRE_SANITARI',
      'CentresSanitaris',
      { codiRecss: cleanCod }
    );

    return NextResponse.json({
      ok: true,
      missatge: `Centre ${cleanCod} donat de baixa correctament.`,
      centre: actualitzat,
    });
  } catch (error) {
    console.error('Error DELETE /api/centres:', error);
    return NextResponse.json(
      { ok: false, missatge: 'Error desactivant el centre sanitari.' },
      { status: 500 }
    );
  }
}
