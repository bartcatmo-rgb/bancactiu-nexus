/**
 * Capa de Persistència de Base de Dades Centralitzada en el Núvol (Render / PostgreSQL / Cloud Storage)
 * BancActiu 1.0 - CatSalut / Institut Català de la Salut
 *
 * Garanteix que totes les entitats operatives (Usuaris, Centres Sanitaris, Expedients PAO,
 * Comandes de Taller, Entitats Col·laboradores i Traçabilitat d'Auditoria) persisteixin
 * de forma unificada i no depenguin del localStorage dels navegadors individuals.
 */

import fs from 'fs';
import path from 'path';
import type {
  UsuariCloud,
  CentreSanitariCloud,
  ExpedientPAOCloud,
  ComandaTallerOrtoCloud,
  EntitatComunitariaCloud,
  AuditoriaLogCloud,
  ConveniCloud,
  AocIntegrationConfig,
  IdpIntegrationConfig,
  IdpProviderConfig,
  IdpEntorn,
  AocEntorn,
  CloudDatabaseData,
} from '@/types/cloud-database';
import { getServerUsers } from '@/lib/server-credentials-store';

const DATA_DIR = path.join(process.cwd(), 'data');
const CLOUD_DB_FILE = path.join(DATA_DIR, 'cloud_relational_database.json');

const HASH_ROCA_PBKDF2 = '$pbkdf2$100000$fb04362767a082a2a7f9383d065d61da$0e1ec9172f7ff8adfc949c009805906f2865e0fa8ae5bc690efc11747fdb1305d75175a21492e9d2c6c0314dd1c58b7be08a424ef46ff011958d9a5306b0ae99';
const HASH_1234_PBKDF2 = '$pbkdf2$100000$ec7ea80c2a3b9cb1910a743f3725a1f1$67511f0cd05a47a28fe76152fe09f76dbe70e32d386822e03a2a3e7668a3f61b159c244a46dba9bd7173ca8f5b3b6d1e07790f46539c05e95a9b0d5ac8af28c7';

// Dades llavor inicials
function getInitialSeedData(): CloudDatabaseData {
  const initialUsuaris: UsuariCloud[] = [
    {
      dni: '52622304Y',
      passwordHash: HASH_ROCA_PBKDF2,
      nom: 'Bartolomé',
      cognoms: 'Cachinero Moreno',
      rol: 'SUPER_ADMIN',
      ambitTerritorial: 'Catalunya - Serveis Centrals CatSalut',
      centreId: undefined,
      permisosGranulars: ['ACCES_TOTAL', 'ADMIN_USUARIS', 'ADMIN_CENTRES', 'ADMIN_PAO', 'ADMIN_ENTITATS', 'AUDITORIA_SISTEMA'],
      actiu: true,
      mustChangePassword: false,
      isFirstLogin: false,
      passwordUpdatedAt: '2026-11-19T00:00:00.000Z',
      passwordHistory: [HASH_1234_PBKDF2, HASH_ROCA_PBKDF2],
      dataCreacio: '2026-01-01T08:00:00Z',
    },
    {
      dni: '47956602S',
      passwordHash: HASH_1234_PBKDF2,
      nom: 'Marc',
      cognoms: 'Cachinero Baranda',
      rol: 'SUPER_ADMIN',
      ambitTerritorial: 'GLOBAL_CATALUNYA',
      centreId: undefined,
      permisosGranulars: ['ACCES_TOTAL', 'ADMIN_USUARIS', 'ADMIN_CENTRES', 'ADMIN_PAO', 'ADMIN_ENTITATS', 'AUDITORIA_SISTEMA'],
      actiu: true,
      mustChangePassword: true,
      isFirstLogin: true,
      passwordUpdatedAt: '2026-11-19T00:00:00.000Z',
      passwordHistory: [HASH_1234_PBKDF2],
      dataCreacio: '2026-01-01T08:00:00Z',
    },
  ];

  const initialCentres: CentreSanitariCloud[] = [
    {
      codiRecss: 'CAP-SANT-ILDEFONS',
      nom: 'CAP Sant Ildefons',
      tipus: 'CAP',
      gapicId: 'GT_METRO_SUD',
      sectorId: 'SEC_BAIX_LLOBREGAT_LITORAL',
      absId: 'ABS_CORNELLA_SANT_ILDEFONS',
      adreca: 'Av. República Argentina, s/n',
      municipi: 'Cornellà de Llobregat',
      estatOperatiu: 'OPERATIU',
      estatConveni: 'ACTIU_PILOT',
      faseDesplegament: 1,
      dataActivacio: '2026-01-10T08:00:00Z',
      dataCreacio: '2026-01-10T08:00:00Z',
      ensTitularId: 'ENS-GAPIC-METRO-SUD',
    },
    {
      codiRecss: 'CAP-MARTI-JULIA',
      nom: 'CAP Martí Julià',
      tipus: 'CAP',
      gapicId: 'GT_METRO_SUD',
      sectorId: 'SEC_BAIX_LLOBREGAT_LITORAL',
      absId: 'ABS_CORNELLA_MARTI_JULIA',
      adreca: 'Av. de la Línia Elèctrica, 11-15',
      municipi: 'Cornellà de Llobregat',
      estatOperatiu: 'OPERATIU',
      estatConveni: 'ACTIU_PILOT',
      faseDesplegament: 1,
      dataActivacio: '2026-01-10T08:00:00Z',
      dataCreacio: '2026-01-10T08:00:00Z',
      ensTitularId: 'ENS-GAPIC-METRO-SUD',
    },
    {
      codiRecss: 'CAP-DR-CARLES-RIBAS',
      nom: 'CAP Doctor Carles Ribas',
      tipus: 'CAP',
      gapicId: 'GAPIC_BARCELONA_CIUTAT',
      sectorId: 'SEC_LITORAL_SANTS_MONTJUIC',
      absId: 'ABS_LA_MARINA',
      adreca: 'Passeig de la Zona Franca, 166 / Carrer del Foc',
      municipi: 'Barcelona',
      estatOperatiu: 'OPERATIU',
      estatConveni: 'ACTIU_PILOT',
      faseDesplegament: 1,
      dataActivacio: '2026-01-10T08:00:00Z',
      dataCreacio: '2026-01-10T08:00:00Z',
      ensTitularId: 'ENS-GAPIC-BCN-CIUTAT',
    },
    {
      codiRecss: 'CUAP-CORNELLA',
      nom: 'CUAP Cornellà',
      tipus: 'CUAP',
      gapicId: 'GT_METRO_SUD',
      sectorId: 'SEC_BAIX_LLOBREGAT_LITORAL',
      absId: 'ABS_CORNELLA_CUAP',
      adreca: 'Bellaterra, 39',
      municipi: 'Cornellà de Llobregat',
      estatOperatiu: 'OPERATIU',
      estatConveni: 'ACTIU_PILOT',
      faseDesplegament: 1,
      dataActivacio: '2026-01-10T08:00:00Z',
      dataCreacio: '2026-01-10T08:00:00Z',
      ensTitularId: 'ENS-GAPIC-METRO-SUD',
    },
  ];

  const initialEntitats: EntitatComunitariaCloud[] = [
    {
      id: 'ENT-CR-CORNELLA',
      nomOficial: 'Creu Roja Cornellà de Llobregat',
      tipus: 'ONG',
      municipi: 'Cornellà de Llobregat',
      gapicAssignada: 'GT_METRO_SUD',
      estatConveni: 'ACTIU_PILOT',
      faseDesplegament: 1,
      bancOrtoprotesicActiu: true,
      contacteTelefon: '933771122',
      contacteEmail: 'cornella@creuroja.org',
      adreca: 'Carrer Rubió i Ors, 104',
      dataActivacio: '2026-01-15T09:00:00Z',
      dataCreacio: '2026-01-15T09:00:00Z',
      ensTitularId: 'ENS-AJUNTAMENT-CORNELLA',
    },
    {
      id: 'ENT-AVV-GAVARRA',
      nomOficial: 'Associació de Veïns La Gavarra',
      tipus: 'ENTITAT_VEINAL',
      municipi: 'Cornellà de Llobregat',
      gapicAssignada: 'GT_METRO_SUD',
      estatConveni: 'ACTIU_PILOT',
      faseDesplegament: 1,
      bancOrtoprotesicActiu: true,
      contacteTelefon: '933754455',
      contacteEmail: 'avv.lagavarra@gmail.com',
      adreca: "Plaça d'Europa",
      dataActivacio: '2026-01-15T09:00:00Z',
      dataCreacio: '2026-01-15T09:00:00Z',
      ensTitularId: 'ENS-AJUNTAMENT-CORNELLA',
    },
  ];

  const initialConvenis: ConveniCloud[] = [
    {
      id: 'ENS-GAPIC-METRO-SUD',
      codiConveni: 'CONV-GAPIC-MSUD-2026',
      nomEnsTitular: "Gerència d'Atenció Primària i Comunitària (GAPIC) - Metropolitana Sud",
      tipusEns: 'SALUT_PUBLICA',
      modalitat: 'PILOT',
      ambitTerritorial: 'Barcelona Metropolitana Sud - Cornellà de Llobregat',
      estat: 'ACTIU',
      gerenciaId: 'GT_METRO_SUD',
      gerenciaNom: "Gerència d'Atenció Primària i Comunitària (GAPIC) - Metropolitana Sud",
      dataSignatura: '2026-01-10',
      centresAdheritsIds: ['CAP-SANT-ILDEFONS', 'CAP-MARTI-JULIA', 'CUAP-CORNELLA'],
      responsableDni: '11111111H',
      responsableNom: 'Direcció GAPIC Metro Sud',
      observacions: 'Conveni marc sanitari per al projecte pilot de Banc de Productes de Suport a Cornellà.',
      dataCreacio: '2026-01-10T08:00:00Z',
    },
    {
      id: 'ENS-AJUNTAMENT-CORNELLA',
      codiConveni: 'CONV-AJ-CORNELLA-2026',
      nomEnsTitular: 'Ajuntament de Cornellà de Llobregat (Polítiques Socials)',
      tipusEns: 'ENS_LOCAL',
      modalitat: 'PILOT',
      ambitTerritorial: 'Cornellà de Llobregat',
      estat: 'ACTIU',
      gerenciaId: 'GT_METRO_SUD',
      gerenciaNom: 'Ajuntament de Cornellà de Llobregat',
      dataSignatura: '2026-01-15',
      centresAdheritsIds: ['ENT-CR-CORNELLA', 'ENT-AVV-GAVARRA'],
      responsableDni: '33333333P',
      responsableNom: 'Serveis Socials Cornellà',
      observacions: 'Acord de col·laboració institucional de l’Ajuntament per a la xarxa comunitària i social.',
      dataCreacio: '2026-01-15T09:00:00Z',
    },
  ];

  const initialLogs: AuditoriaLogCloud[] = [
    {
      id: 'LOG-CORNELLA-INIT',
      timestamp: '2026-01-10T08:00:00Z',
      actorDni: '52622304Y',
      accio: 'INICIALITZACIO_PILOT_CORNELLA',
      entitatAfectada: 'CORNELLA_METRO_SUD',
      detallJson: JSON.stringify({
        projecte: 'BancActiu 1.0 - Pilot Cornellà de Llobregat',
        brancaSanitaria: 'GAPIC Metropolitana Sud (CAP Sant Ildefons, CAP Martí Julià, CUAP Cornellà)',
        brancaComunitaria: 'Ajuntament de Cornellà (Creu Roja, AVV La Gavarra)',
        dataLlançament: '2026-01-10',
      }),
    },
  ];

  return {
    usuaris: initialUsuaris,
    centresSanitaris: initialCentres,
    expedientsPao: [],
    comandesTallerOrto: [],
    entitatsComunitaries: initialEntitats,
    auditoriaLogs: initialLogs,
    convenis: initialConvenis,
  };
}

/**
 * Llegeix la base de dades centralitzada en el núvol (o inicialitza amb llavor)
 */
export function getCloudDatabase(): CloudDatabaseData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(CLOUD_DB_FILE)) {
      const seed = getInitialSeedData();
      fs.writeFileSync(CLOUD_DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
      return seed;
    }

    const content = fs.readFileSync(CLOUD_DB_FILE, 'utf-8');
    const data = JSON.parse(content) as CloudDatabaseData;

    // Purga estricta d'usuaris residuals (mantenir exclusivament 52622304Y i 47956602S)
    data.usuaris = (data.usuaris || []).filter(
      (u) =>
        u &&
        (u.dni?.toUpperCase() === '52622304Y' || u.dni?.toUpperCase() === '47956602S') &&
        !u.nom?.includes('Mireia')
    );

    // Assegurem que els dos administradors existeixin sempre
    for (const initU of getInitialSeedData().usuaris) {
      if (!data.usuaris.some((u) => u.dni.toUpperCase() === initU.dni.toUpperCase())) {
        data.usuaris.unshift(initU);
      }
    }
    saveCloudDatabase(data);

    if (!data.convenis || !Array.isArray(data.convenis) || data.convenis.length === 0) {
      data.convenis = getInitialSeedData().convenis || [];
      saveCloudDatabase(data);
    }

    return data;
  } catch (error) {
    console.error('[CloudDatabase] Error llegint base de dades centralitzada:', error);
    return getInitialSeedData();
  }
}

/**
 * Desa atòmicament l'estat complet de la base de dades centralitzada
 */
export function saveCloudDatabase(data: CloudDatabaseData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${CLOUD_DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, CLOUD_DB_FILE);
  } catch (error) {
    console.error('[CloudDatabase] Error desant a disk de Render:', error);
  }
}

// ---------------------------------------------------------------------------
// OPERACIONS PER ENTITATS (API CRUD)
// ---------------------------------------------------------------------------

export const dbCloud = {
  // === USUARIS ===
  usuaris: {
    findMany(): UsuariCloud[] {
      return getCloudDatabase().usuaris;
    },
    findByDni(dni: string): UsuariCloud | undefined {
      const clean = dni.trim().toUpperCase();
      return getCloudDatabase().usuaris.find((u) => u.dni.toUpperCase() === clean);
    },
    create(usuari: UsuariCloud): UsuariCloud {
      const data = getCloudDatabase();
      const existing = data.usuaris.findIndex(
        (u) => u.dni.toUpperCase() === usuari.dni.trim().toUpperCase()
      );
      if (existing !== -1) {
        data.usuaris[existing] = { ...data.usuaris[existing], ...usuari };
      } else {
        data.usuaris.push(usuari);
      }
      saveCloudDatabase(data);
      return usuari;
    },
    update(dni: string, updates: Partial<UsuariCloud>): UsuariCloud | null {
      const data = getCloudDatabase();
      const clean = dni.trim().toUpperCase();
      const idx = data.usuaris.findIndex((u) => u.dni.toUpperCase() === clean);
      if (idx === -1) return null;
      data.usuaris[idx] = {
        ...data.usuaris[idx],
        ...updates,
        dataActualitzacio: new Date().toISOString(),
      };
      saveCloudDatabase(data);
      return data.usuaris[idx];
    },
    delete(dni: string): boolean {
      const data = getCloudDatabase();
      const clean = dni.trim().toUpperCase();
      if (clean === '52622304Y' || clean === '47956602S') {
        // Els Superadministradors no es poden esborrar mai
        return false;
      }
      const before = data.usuaris.length;
      data.usuaris = data.usuaris.filter((u) => u.dni.toUpperCase() !== clean);
      if (data.usuaris.length < before) {
        saveCloudDatabase(data);
        return true;
      }
      return false;
    },
  },

  // === CENTRES SANITARIS ===
  centres: {
    findMany(): CentreSanitariCloud[] {
      return getCloudDatabase().centresSanitaris;
    },
    findByRecss(codiRecss: string): CentreSanitariCloud | undefined {
      const clean = codiRecss.trim().toUpperCase();
      return getCloudDatabase().centresSanitaris.find(
        (c) => c.codiRecss.toUpperCase() === clean
      );
    },
    create(centre: CentreSanitariCloud): CentreSanitariCloud {
      const data = getCloudDatabase();
      const idx = data.centresSanitaris.findIndex(
        (c) => c.codiRecss.toUpperCase() === centre.codiRecss.trim().toUpperCase()
      );
      if (idx !== -1) {
        data.centresSanitaris[idx] = { ...data.centresSanitaris[idx], ...centre };
      } else {
        data.centresSanitaris.push(centre);
      }
      saveCloudDatabase(data);
      return centre;
    },
    update(codiRecss: string, updates: Partial<CentreSanitariCloud>): CentreSanitariCloud | null {
      const data = getCloudDatabase();
      const clean = codiRecss.trim().toUpperCase();
      const idx = data.centresSanitaris.findIndex((c) => c.codiRecss.toUpperCase() === clean);
      if (idx === -1) return null;
      data.centresSanitaris[idx] = {
        ...data.centresSanitaris[idx],
        ...updates,
      };
      saveCloudDatabase(data);
      return data.centresSanitaris[idx];
    },
  },

  // === EXPEDIENTS PAO ===
  pao: {
    findMany(filters?: { cipPacient?: string; estat?: string; centreOrigenId?: string }): ExpedientPAOCloud[] {
      let list = getCloudDatabase().expedientsPao;
      if (filters?.cipPacient) {
        const cip = filters.cipPacient.trim().toUpperCase();
        list = list.filter((p) => p.cipPacient.toUpperCase().includes(cip));
      }
      if (filters?.estat) {
        list = list.filter((p) => p.estat === filters.estat);
      }
      if (filters?.centreOrigenId) {
        list = list.filter((p) => p.centreOrigenId === filters.centreOrigenId);
      }
      return list;
    },
    findById(id: string): ExpedientPAOCloud | undefined {
      return getCloudDatabase().expedientsPao.find((p) => p.id === id);
    },
    create(exp: Omit<ExpedientPAOCloud, 'id' | 'dataCreacio'>): ExpedientPAOCloud {
      const data = getCloudDatabase();
      const newId = `PAO-${new Date().getFullYear()}-${String(data.expedientsPao.length + 1).padStart(3, '0')}`;
      const newExp: ExpedientPAOCloud = {
        ...exp,
        id: newId,
        dataCreacio: new Date().toISOString(),
      };
      data.expedientsPao.unshift(newExp);
      saveCloudDatabase(data);
      return newExp;
    },
    update(id: string, updates: Partial<ExpedientPAOCloud>): ExpedientPAOCloud | null {
      const data = getCloudDatabase();
      const idx = data.expedientsPao.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      data.expedientsPao[idx] = {
        ...data.expedientsPao[idx],
        ...updates,
        dataActualitzacio: new Date().toISOString(),
      };
      saveCloudDatabase(data);
      return data.expedientsPao[idx];
    },
    delete(id: string): boolean {
      const data = getCloudDatabase();
      const before = data.expedientsPao.length;
      data.expedientsPao = data.expedientsPao.filter((p) => p.id !== id);
      if (data.expedientsPao.length < before) {
        saveCloudDatabase(data);
        return true;
      }
      return false;
    },
  },

  // === COMANDES TALLER ORTOPÈDIC ===
  taller: {
    findMany(filters?: { estatFabricacio?: string; centreDestiId?: string }): ComandaTallerOrtoCloud[] {
      let list = getCloudDatabase().comandesTallerOrto;
      if (filters?.estatFabricacio) {
        list = list.filter((c) => c.estatFabricacio === filters.estatFabricacio);
      }
      if (filters?.centreDestiId) {
        list = list.filter((c) => c.centreDestiId === filters.centreDestiId);
      }
      return list;
    },
    findById(id: string): ComandaTallerOrtoCloud | undefined {
      return getCloudDatabase().comandesTallerOrto.find((c) => c.id === id);
    },
    create(cmd: Omit<ComandaTallerOrtoCloud, 'id' | 'dataCreacio'>): ComandaTallerOrtoCloud {
      const data = getCloudDatabase();
      const newId = `ORD-${new Date().getFullYear()}-${String(data.comandesTallerOrto.length + 101)}`;
      const newCmd: ComandaTallerOrtoCloud = {
        ...cmd,
        id: newId,
        dataCreacio: new Date().toISOString(),
      };
      data.comandesTallerOrto.unshift(newCmd);
      saveCloudDatabase(data);
      return newCmd;
    },
    update(id: string, updates: Partial<ComandaTallerOrtoCloud>): ComandaTallerOrtoCloud | null {
      const data = getCloudDatabase();
      const idx = data.comandesTallerOrto.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      data.comandesTallerOrto[idx] = {
        ...data.comandesTallerOrto[idx],
        ...updates,
        dataActualitzacio: new Date().toISOString(),
      };
      saveCloudDatabase(data);
      return data.comandesTallerOrto[idx];
    },
  },

  // === ENTITATS COMUNITÀRIES ===
  entitats: {
    findMany(filters?: { tipus?: string; municipi?: string }): EntitatComunitariaCloud[] {
      let list = getCloudDatabase().entitatsComunitaries;
      if (filters?.tipus) {
        list = list.filter((e) => e.tipus === filters.tipus);
      }
      if (filters?.municipi) {
        const m = filters.municipi.trim().toLowerCase();
        list = list.filter((e) => e.municipi.toLowerCase().includes(m));
      }
      return list;
    },
    findById(id: string): EntitatComunitariaCloud | undefined {
      return getCloudDatabase().entitatsComunitaries.find((e) => e.id === id);
    },
    create(ent: EntitatComunitariaCloud): EntitatComunitariaCloud {
      const data = getCloudDatabase();
      const idx = data.entitatsComunitaries.findIndex((e) => e.id === ent.id);
      if (idx !== -1) {
        data.entitatsComunitaries[idx] = { ...data.entitatsComunitaries[idx], ...ent };
      } else {
        data.entitatsComunitaries.push(ent);
      }
      saveCloudDatabase(data);
      return ent;
    },
    update(id: string, updates: Partial<EntitatComunitariaCloud>): EntitatComunitariaCloud | null {
      const data = getCloudDatabase();
      const idx = data.entitatsComunitaries.findIndex((e) => e.id === id);
      if (idx === -1) return null;
      data.entitatsComunitaries[idx] = {
        ...data.entitatsComunitaries[idx],
        ...updates,
        dataActualitzacio: new Date().toISOString(),
      };
      saveCloudDatabase(data);
      return data.entitatsComunitaries[idx];
    },
    delete(id: string): boolean {
      const data = getCloudDatabase();
      const before = data.entitatsComunitaries.length;
      data.entitatsComunitaries = data.entitatsComunitaries.filter((e) => e.id !== id);
      if (data.entitatsComunitaries.length < before) {
        saveCloudDatabase(data);
        return true;
      }
      return false;
    },
  },

  // === AUDITORIA LOGS ===
  auditoria: {
    log(actorDni: string, accio: string, entitatAfectada: string, detall: unknown): AuditoriaLogCloud {
      const data = getCloudDatabase();
      const logEntry: AuditoriaLogCloud = {
        id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        actorDni,
        accio,
        entitatAfectada,
        detallJson: typeof detall === 'string' ? detall : JSON.stringify(detall),
      };
      data.auditoriaLogs.unshift(logEntry);
      // Mantenim com a màxim els darrers 1000 registres d'auditoria al fitxer
      if (data.auditoriaLogs.length > 1000) {
        data.auditoriaLogs = data.auditoriaLogs.slice(0, 1000);
      }
      saveCloudDatabase(data);
      return logEntry;
    },
    findRecent(limit = 100): AuditoriaLogCloud[] {
      return getCloudDatabase().auditoriaLogs.slice(0, limit);
    },
  },

  // === CONVENIS INSTITUCIONALS (ENS TITULARS) ===
  convenis: {
    findMany(filters?: { modalitat?: 'PILOT' | 'DEFINITIU'; estat?: string; ambitTerritorial?: string }): ConveniCloud[] {
      let list = getCloudDatabase().convenis || [];
      if (filters?.modalitat) {
        list = list.filter((c) => c.modalitat === filters.modalitat);
      }
      if (filters?.estat) {
        list = list.filter((c) => c.estat === filters.estat);
      }
      if (filters?.ambitTerritorial) {
        list = list.filter((c) => c.ambitTerritorial.toLowerCase().includes(filters.ambitTerritorial!.toLowerCase()));
      }
      return list;
    },
    findById(id: string): ConveniCloud | undefined {
      const list = getCloudDatabase().convenis || [];
      return list.find((c) => c.id === id || c.codiConveni === id);
    },
    create(conveni: ConveniCloud): ConveniCloud {
      const data = getCloudDatabase();
      if (!data.convenis) data.convenis = [];
      const idx = data.convenis.findIndex(
        (c) => c.id === conveni.id || c.codiConveni === conveni.codiConveni
      );
      if (idx !== -1) {
        data.convenis[idx] = { ...data.convenis[idx], ...conveni };
      } else {
        data.convenis.unshift(conveni);
      }
      saveCloudDatabase(data);
      return conveni;
    },
    update(id: string, updates: Partial<ConveniCloud>): ConveniCloud | null {
      const data = getCloudDatabase();
      if (!data.convenis) return null;
      const idx = data.convenis.findIndex((c) => c.id === id || c.codiConveni === id);
      if (idx === -1) return null;
      data.convenis[idx] = { ...data.convenis[idx], ...updates };
      saveCloudDatabase(data);
      return data.convenis[idx];
    },
    delete(id: string): boolean {
      const data = getCloudDatabase();
      if (!data.convenis) return false;
      const before = data.convenis.length;
      data.convenis = data.convenis.filter((c) => c.id !== id && c.codiConveni !== id);
      if (data.convenis.length < before) {
        saveCloudDatabase(data);
        return true;
      }
      return false;
    },
  },
    idpConfig: {
    get(): IdpIntegrationConfig {
      const data = getCloudDatabase();
      const existing = data.idpConfig;
      const aoc = data.aocConfig;
      return {
        idcat: existing?.idcat || {
          isActive: Boolean(aoc?.isActive ?? true),
          entorn: aoc?.entorn || 'PREPRODUCCIO',
          clientId: aoc?.clientId || 'BANCACTIU-VALID-APP-01',
          clientSecret: aoc?.clientSecret || 'SECRET_AOC_DEMO_2026',
        },
        clave: existing?.clave || {
          isActive: false,
          entorn: 'PREPRODUCCIO',
          clientId: 'CLAVE-MINHAP-APP-01',
          clientSecret: 'SECRET_CLAVE_DEMO_2026',
        },
      };
    },
    saveProvider(provider: 'idcat' | 'clave', config: IdpProviderConfig): IdpProviderConfig {
      const data = getCloudDatabase();
      const current = dbCloud.idpConfig.get();
      current[provider] = {
        isActive: Boolean(config.isActive),
        entorn: config.entorn === 'PRODUCCIO' ? 'PRODUCCIO' : 'PREPRODUCCIO',
        clientId: (config.clientId || '').trim(),
        clientSecret: (config.clientSecret || '').trim(),
      };
      data.idpConfig = current;
      if (provider === 'idcat') {
        data.aocConfig = current.idcat;
      }
      saveCloudDatabase(data);
      return current[provider];
    },
    saveAll(config: IdpIntegrationConfig): IdpIntegrationConfig {
      const data = getCloudDatabase();
      data.idpConfig = {
        idcat: {
          isActive: Boolean(config.idcat.isActive),
          entorn: config.idcat.entorn === 'PRODUCCIO' ? 'PRODUCCIO' : 'PREPRODUCCIO',
          clientId: (config.idcat.clientId || '').trim(),
          clientSecret: (config.idcat.clientSecret || '').trim(),
        },
        clave: {
          isActive: Boolean(config.clave.isActive),
          entorn: config.clave.entorn === 'PRODUCCIO' ? 'PRODUCCIO' : 'PREPRODUCCIO',
          clientId: (config.clave.clientId || '').trim(),
          clientSecret: (config.clave.clientSecret || '').trim(),
        },
      };
      data.aocConfig = data.idpConfig.idcat;
      saveCloudDatabase(data);
      return data.idpConfig;
    },
  },
  aocConfig: {
    get(): AocIntegrationConfig {
      return dbCloud.idpConfig.get().idcat;
    },
    save(config: AocIntegrationConfig): AocIntegrationConfig {
      return dbCloud.idpConfig.saveProvider('idcat', config);
    },
  },
};

export default dbCloud;
