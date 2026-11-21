import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { guardApiAccess } from '@/lib/security-api-guard';
import { searchOnlineRateLimiter } from '@/lib/security/rate-limit';

export interface NormalizedCentreOnline {
  code: string;
  name: string;
  ambit: string;
  sector: string;
  gapic: string;
  address: string;
  postalCode: string;
  municipality: string;
  abs: string;
  phone: string;
  email: string;
  tipologia: 'CAP' | 'SERVEI_SANITARI' | 'GAPIC' | 'AJUNTAMENT' | 'CREU_ROJA' | 'ENTITAT_LOCAL' | 'TALLER';
  matriu: 'ICS_CATSALUT' | 'GAPIC' | 'AJUNTAMENT' | 'CREU_ROJA' | 'ENTITAT_LOCAL' | 'TALLER';
  coordinates?: [number, number];
  source: 'ONLINE_CATSALUT';
}

function stripAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Determina la tipologia, matriu i àmbit institucional d'un equipament del cens oficial
 */
function inferInstitutionalScope(nom: string, categoria: string = ''): {
  tipologia: 'CAP' | 'SERVEI_SANITARI' | 'GAPIC' | 'AJUNTAMENT' | 'CREU_ROJA' | 'ENTITAT_LOCAL' | 'TALLER';
  matriu: 'ICS_CATSALUT' | 'GAPIC' | 'AJUNTAMENT' | 'CREU_ROJA' | 'ENTITAT_LOCAL' | 'TALLER';
  ambit: string;
} {
  const blob = `${nom} ${categoria}`.toLowerCase();

  if (blob.includes('creu roja') || blob.includes('cruz roja')) {
    return { tipologia: 'CREU_ROJA', matriu: 'CREU_ROJA', ambit: 'Creu Roja' };
  }
  if (blob.includes('taller') || blob.includes('ortop') || blob.includes('manteniment')) {
    return { tipologia: 'TALLER', matriu: 'TALLER', ambit: 'Taller' };
  }
  if (blob.includes('ajuntament') || blob.includes('benestar social') || blob.includes('serveis socials') || blob.includes('ens locals')) {
    return { tipologia: 'AJUNTAMENT', matriu: 'AJUNTAMENT', ambit: 'Serveis Socials' };
  }
  if (blob.includes('gapic') || blob.includes('gerència') || blob.includes('gerencia')) {
    return { tipologia: 'GAPIC', matriu: 'GAPIC', ambit: 'CatSalut / ICS' };
  }
  if (blob.includes('hospital') || blob.includes('pades') || blob.includes('sociosanitari') || blob.includes('csma') || blob.includes('csmij') || blob.includes('salut mental')) {
    return { tipologia: 'SERVEI_SANITARI', matriu: 'ICS_CATSALUT', ambit: 'SISCAT Concertat' };
  }
  if (blob.includes('cap') || blob.includes('primària') || blob.includes('primaria') || blob.includes('cuap') || blob.includes('consultori') || blob.includes('dispensari') || blob.includes('sanit') || blob.includes('salut')) {
    return { tipologia: 'CAP', matriu: 'ICS_CATSALUT', ambit: 'CatSalut / ICS' };
  }

  return { tipologia: 'ENTITAT_LOCAL', matriu: 'ENTITAT_LOCAL', ambit: 'Entitat Local / Comunitària' };
}

let cachedIcsCatalog: NormalizedCentreOnline[] | null = null;

function loadStructuredCatalog(): NormalizedCentreOnline[] {
  if (cachedIcsCatalog) return cachedIcsCatalog;

  const catalog: NormalizedCentreOnline[] = [];
  try {
    const candidatePaths = [
      path.join(process.cwd(), 'public', 'data', 'organigrama_ics_centres.json'),
      path.join(process.cwd(), 'apps', 'bancactiu-nexus', 'public', 'data', 'organigrama_ics_centres.json'),
    ];

    let filePath = '';
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }

    if (filePath) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      if (data.organigrama && Array.isArray(data.organigrama)) {
        for (const organ of data.organigrama) {
          const gapicNom = organ.gapicNom || 'GAPiC Territorial CatSalut';
          if (Array.isArray(organ.sectors)) {
            for (const sector of organ.sectors) {
              const sectorNom = sector.sectorNom || 'Sector Territorial';
              if (Array.isArray(sector.absList)) {
                for (const abs of sector.absList) {
                  const absNom = abs.absNom || 'ABS Catalunya';
                  const municipiDef = abs.municipi || 'Catalunya';
                  if (Array.isArray(abs.centres)) {
                    for (const c of abs.centres) {
                      const scope = inferInstitutionalScope(c.nom, c.tipus);
                      catalog.push({
                        code: c.codiRecss || c.id || `ICS-${catalog.length + 1}`,
                        name: c.nom,
                        ambit: scope.ambit,
                        sector: sectorNom,
                        gapic: gapicNom,
                        address: c.adreca || 'Catalunya',
                        postalCode: c.codiPostal || '',
                        municipality: municipiDef,
                        abs: absNom,
                        phone: c.telefon || '932 89 67 00',
                        email: c.email || 'contacte.salut@gencat.cat',
                        tipologia: scope.tipologia,
                        matriu: scope.matriu,
                        coordinates: c.coordenades,
                        source: 'ONLINE_CATSALUT',
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[SEARCH-ONLINE] Error carregant catàleg estructurat:', err);
  }

  cachedIcsCatalog = catalog;
  return catalog;
}

export async function GET(request: Request): Promise<NextResponse> {
  // Verificació d'autenticació perimetral Zero-Trust
  const guard = guardApiAccess(request);
  if (!guard.allowed) return guard.response!;

  // Rate Limiting Anti-Abús (30 req/minut per IP)
  const rateLimit = searchOnlineRateLimiter.check(guard.clientIp);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Rate limit excedit (màxim 30 peticions/minut).' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const rawQ = searchParams.get('q')?.trim() || '';

  // Sanitització estricta de mida (Anti-DoS / SSRF <= 80 caràcters)
  const q = rawQ.slice(0, 80);

  if (!q || q.length < 2) {
    return NextResponse.json({
      success: true,
      count: 0,
      query: q,
      data: [],
    });
  }

  const normQuery = stripAccents(q);
  const queryWords = normQuery.split(/\s+/).filter((w) => w.length > 1);

  const results: NormalizedCentreOnline[] = [];
  const seenCodes = new Set<string>();
  const seenNames = new Set<string>();

  const addResult = (item: NormalizedCentreOnline) => {
    const normCode = item.code.trim().toUpperCase();
    const normName = stripAccents(item.name.trim());
    if (seenCodes.has(normCode) || seenNames.has(normName)) return;
    seenCodes.add(normCode);
    seenNames.add(normName);
    results.push(item);
  };

  // 1. Consulta en temps real a l'API oficial de Dades Obertes de Catalunya (Anti-SSRF: destí fix i redirect: 'error')
  const sodaUrls = [
    `https://analisi.transparenciacatalunya.cat/resource/8gmd-gz7i.json?$q=${encodeURIComponent(q)}&$limit=25`,
    `https://analisi.transparenciacatalunya.cat/resource/7423-3959.json?$q=${encodeURIComponent(q)}&$limit=25`,
  ];

  for (const url of sodaUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        redirect: 'error',
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const jsonList = await res.json();
        if (Array.isArray(jsonList) && jsonList.length > 0) {
          for (const item of jsonList) {
            const rawNom = item.nom || item.alies || item.equipament || '';
            if (!rawNom) continue;

            const categoria = item.categoria || '';
            const scope = inferInstitutionalScope(rawNom, categoria);

            const addressParts = [item.tipus_via, item.via, item.num].filter(Boolean).join(' ');
            const adreca = addressParts || item.via || item.adreca || 'Cens Oficial de Catalunya';
            const municipi = item.poblacio || item.municipi || 'Catalunya';
            const comarca = item.comarca || '';

            let coords: [number, number] | undefined = undefined;
            if (item.localitzacio?.coordinates && Array.isArray(item.localitzacio.coordinates)) {
              coords = [
                parseFloat(item.localitzacio.coordinates[0]),
                parseFloat(item.localitzacio.coordinates[1]),
              ];
            } else if (item.longitud && item.latitud) {
              coords = [parseFloat(item.longitud), parseFloat(item.latitud)];
            }

            addResult({
              code: item.idequipament || item.codi || item.codi_recss || `CAT-${item.idequipament || Math.random().toString(36).substring(2, 8)}`,
              name: rawNom,
              ambit: scope.ambit,
              sector: comarca ? `Sector ${comarca}` : (municipi || 'Sector Territorial'),
              gapic: comarca ? `GAPiC ${comarca}` : 'GAPiC Territorial CatSalut',
              address: adreca,
              postalCode: item.cpostal || '',
              municipality: municipi,
              abs: comarca ? `ABS ${municipi || comarca}` : (municipi || 'Àmbit Territorial'),
              phone: item.telefon1 || item.tel || '932 89 67 00',
              email: item.email || 'contacte.salut@gencat.cat',
              tipologia: scope.tipologia,
              matriu: scope.matriu,
              coordinates: coords,
              source: 'ONLINE_CATSALUT',
            });
          }
          break;
        }
      }
    } catch {
      // Fallback transparent
    }
  }

  // 2. Consulta al catàleg estructurat oficial de Catalunya (Fallback / Complementari)
  const localCatalog = loadStructuredCatalog();
  for (const item of localCatalog) {
    const targetBlob = stripAccents(
      `${item.name} ${item.code} ${item.municipality} ${item.abs} ${item.sector} ${item.address}`
    );
    const matchesAll = queryWords.length > 0
      ? queryWords.every((w) => targetBlob.includes(w))
      : targetBlob.includes(normQuery);

    if (matchesAll) {
      addResult(item);
    }
  }

  // Ordenar prioritzant resultats sanitaris
  results.sort((a, b) => {
    const priority = (tipus: string) => {
      if (tipus === 'CAP') return 1;
      if (tipus === 'SERVEI_SANITARI') return 2;
      if (tipus === 'GAPIC') return 3;
      if (tipus === 'AJUNTAMENT') return 4;
      return 5;
    };
    return priority(a.tipologia) - priority(b.tipologia);
  });

  return NextResponse.json({
    success: true,
    count: results.length,
    query: q,
    data: results.slice(0, 40),
  });
}
