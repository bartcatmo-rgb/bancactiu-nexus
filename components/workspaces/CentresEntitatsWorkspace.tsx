'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Building2,
  Search,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Filter,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  X,
  Save,
  Check,
  RefreshCw,
  SlidersHorizontal,
  Home,
  Stethoscope,
  Landmark,
  Briefcase,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Layers,
  Wrench,
  HeartHandshake,
  UserCheck,
  Shield,
  Sparkles,
  Tag,
  MousePointerClick,
  Globe,
  Loader2
} from 'lucide-react';

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
  tipologia: TipologiaEntitat;
  matriu: AmbitMatriu;
  coordinates?: [number, number];
  source: 'ONLINE_CATSALUT';
}

export type TipologiaEntitat =
  | 'CAP'
  | 'SERVEI_SANITARI'
  | 'GAPIC'
  | 'AJUNTAMENT'
  | 'CREU_ROJA'
  | 'ENTITAT_LOCAL'
  | 'TALLER';

export type EstatEntitat = 'Actiu' | 'Pilot' | 'En Manteniment' | 'Inactiu';

export type AmbitMatriu =
  | 'TOTS'
  | 'ICS_CATSALUT'
  | 'GAPIC'
  | 'AJUNTAMENT'
  | 'CREU_ROJA'
  | 'ENTITAT_LOCAL'
  | 'TALLER';

export interface EntitatItem {
  id: string;
  codi: string;
  nom: string;
  tipologia: TipologiaEntitat;
  matriu: AmbitMatriu;
  gerenciaId?: string;
  gerenciaNom?: string;
  municipi: string;
  abs: string;
  adreca: string;
  telefon: string;
  email: string;
  responsable?: string;
  estat: EstatEntitat;
  dataAlta: string;
  rolesAssignats: string[];
  serveisHabilitats: {
    prescripcioPAO: boolean;
    bancMaterial: boolean;
    atencioDomiciliaria: boolean;
    citesRapides: boolean;
    tallerReparacions: boolean;
  };
  notes?: string;
}

// Tots els rols disponibles al sistema
export const ALL_SYSTEM_ROLES = [
  'Administratiu/Voluntariat',
  'Referent/Sanitari',
  'Gestor de Cites',
  'Gerència/Referents',
  'Coordinació Territorial',
  'Enllaç Municipal / Comunitari',
  'Coordinació Taller / Voluntariat',
  'SuperAdmin Territorial'
];

// Regla de preassignació automàtica segons tipologia
export function getDefaultRolesForTipologia(tipus: TipologiaEntitat): string[] {
  switch (tipus) {
    case 'CAP':
      return ['Administratiu/Voluntariat', 'Referent/Sanitari', 'Gestor de Cites'];
    case 'SERVEI_SANITARI':
      return ['Referent/Sanitari', 'Administratiu/Voluntariat'];
    case 'GAPIC':
      return ['Gerència/Referents', 'Coordinació Territorial'];
    case 'AJUNTAMENT':
    case 'ENTITAT_LOCAL':
      return ['Enllaç Municipal / Comunitari'];
    case 'CREU_ROJA':
    case 'TALLER':
      return ['Coordinació Taller / Voluntariat'];
    default:
      return ['Administratiu/Voluntariat'];
  }
}

// Catàleg oficial garantit amb CAP Doctor Carles Ribas i xarxa territorial
const INITIAL_ENTITATS_CATALOG: EntitatItem[] = [
  {
    id: 'ENT-CAP-DR-CARLES-RIBAS',
    codi: '0801912',
    nom: 'CAP Doctor Carles Ribas',
    tipologia: 'CAP',
    matriu: 'ICS_CATSALUT',
    gerenciaId: 'GAPIC_BCN_CIUTAT',
    gerenciaNom: 'GAPiC Barcelona Ciutat',
    municipi: 'Barcelona',
    abs: 'ABS La Marina',
    adreca: 'Passeig de la Zona Franca, 166 / Carrer del Foc',
    telefon: '932 89 67 00',
    email: 'cap.carlesribas@gencat.cat',
    responsable: 'Dra. Neus Riera Puig (Referent Clínica)',
    estat: 'Actiu',
    dataAlta: '2026-01-15',
    rolesAssignats: ['Administratiu/Voluntariat', 'Referent/Sanitari', 'Gestor de Cites'],
    serveisHabilitats: {
      prescripcioPAO: true,
      bancMaterial: true,
      atencioDomiciliaria: true,
      citesRapides: true,
      tallerReparacions: false,
    },
    notes: 'Centre d\'Atenció Primària de referència per a La Marina i Sants-Montjuïc. Circuit preferent PAO.'
  },
  {
    id: 'ENT-CAP-SANT-ILDEFONS',
    codi: '0808801',
    nom: 'CAP Sant Ildefons',
    tipologia: 'CAP',
    matriu: 'ICS_CATSALUT',
    gerenciaId: 'GAPIC_METRO_SUD',
    gerenciaNom: 'GAPiC Barcelona Metropolitana Sud',
    municipi: 'Cornellà de Llobregat',
    abs: 'ABS Cornellà Sant Ildefons',
    adreca: 'Avinguda República Argentina, s/n',
    telefon: '934 71 14 00',
    email: 'cap.santildefons@gencat.cat',
    responsable: 'Dr. Jordi Casals Mas (Director CAP)',
    estat: 'Actiu',
    dataAlta: '2026-01-10',
    rolesAssignats: ['Administratiu/Voluntariat', 'Referent/Sanitari', 'Gestor de Cites'],
    serveisHabilitats: {
      prescripcioPAO: true,
      bancMaterial: true,
      atencioDomiciliaria: true,
      citesRapides: true,
      tallerReparacions: false,
    },
    notes: 'Centre pilot Fase 1 BancActiu. Magatzem d\'ortopèdia avançada actiu.'
  },
  {
    id: 'ENT-CAP-MARTI-JULIA',
    codi: '0808802',
    nom: 'CAP Martí Julià',
    tipologia: 'CAP',
    matriu: 'ICS_CATSALUT',
    gerenciaId: 'GAPIC_METRO_SUD',
    gerenciaNom: 'GAPiC Barcelona Metropolitana Sud',
    municipi: 'Cornellà de Llobregat',
    abs: 'ABS Cornellà Martí Julià',
    adreca: 'Avinguda de la Línia Elèctrica, 11-15',
    telefon: '934 74 52 11',
    email: 'cap.martijulia@gencat.cat',
    responsable: 'Dra. Montserrat Soler (Cap de Servei)',
    estat: 'Actiu',
    dataAlta: '2026-01-10',
    rolesAssignats: ['Administratiu/Voluntariat', 'Referent/Sanitari', 'Gestor de Cites'],
    serveisHabilitats: {
      prescripcioPAO: true,
      bancMaterial: true,
      atencioDomiciliaria: false,
      citesRapides: true,
      tallerReparacions: false,
    },
    notes: 'Prescripció activa de material d\'accessibilitat i cadires de rodes.'
  },
  {
    id: 'ENT-CUAP-CORNELLA',
    codi: '0808803',
    nom: 'CUAP Cornellà (Urgències de Primària)',
    tipologia: 'CAP',
    matriu: 'ICS_CATSALUT',
    gerenciaId: 'GAPIC_METRO_SUD',
    gerenciaNom: 'GAPiC Barcelona Metropolitana Sud',
    municipi: 'Cornellà de Llobregat',
    abs: 'ABS Cornellà CUAP',
    adreca: 'Carrer Bellaterra, 39',
    telefon: '934 75 62 00',
    email: 'cuap.cornella@gencat.cat',
    responsable: 'Dr. Xavier Font (Coordinador Urgències)',
    estat: 'Actiu',
    dataAlta: '2026-01-12',
    rolesAssignats: ['Administratiu/Voluntariat', 'Referent/Sanitari', 'Gestor de Cites'],
    serveisHabilitats: {
      prescripcioPAO: true,
      bancMaterial: true,
      atencioDomiciliaria: true,
      citesRapides: true,
      tallerReparacions: false,
    },
    notes: 'Atenció continuada 24h i dispensació d\'urgència de material de mobilitat.'
  },
  {
    id: 'ENT-CAP-MANSO',
    codi: '0801915',
    nom: 'CAP Manso',
    tipologia: 'CAP',
    matriu: 'ICS_CATSALUT',
    gerenciaId: 'GAPIC_BCN_CIUTAT',
    gerenciaNom: 'GAPiC Barcelona Ciutat',
    municipi: 'Barcelona',
    abs: 'ABS Manso',
    adreca: 'Carrer de Manso, 19',
    telefon: '935 53 05 01',
    email: 'cap.manso@gencat.cat',
    responsable: 'Dr. Antoni Vilar (Director Mèdic)',
    estat: 'Actiu',
    dataAlta: '2026-01-20',
    rolesAssignats: ['Administratiu/Voluntariat', 'Referent/Sanitari'],
    serveisHabilitats: {
      prescripcioPAO: true,
      bancMaterial: true,
      atencioDomiciliaria: false,
      citesRapides: true,
      tallerReparacions: false,
    },
    notes: 'Centre d\'Especialitats i Primària Eixample Sud.'
  },
  {
    id: 'ENT-GAPIC-METRO-SUD',
    codi: 'GAPIC-01-SUD',
    nom: 'GAPiC Barcelona Metropolitana Sud (ICS)',
    tipologia: 'GAPIC',
    matriu: 'GAPIC',
    municipi: 'L\'Hospitalet de Llobregat',
    abs: 'Àmbit Territorial Metropolitana Sud',
    adreca: 'Carrer Major, 41-43',
    telefon: '932 60 75 00',
    email: 'gapic.metrosud@gencat.cat',
    responsable: 'Direcció d\'Atenció Primària Metropolitana Sud',
    estat: 'Actiu',
    dataAlta: '2026-01-01',
    rolesAssignats: ['Gerència/Referents', 'Coordinació Territorial'],
    serveisHabilitats: {
      prescripcioPAO: false,
      bancMaterial: true,
      atencioDomiciliaria: true,
      citesRapides: false,
      tallerReparacions: true,
    },
    notes: 'Gerència territorial que coordina els sectors del Baix Llobregat i Hospitalet.'
  },
  {
    id: 'ENT-GAPIC-BCN-CIUTAT',
    codi: 'GAPIC-02-BCN',
    nom: 'GAPiC Barcelona Ciutat (ICS / CatSalut)',
    tipologia: 'GAPIC',
    matriu: 'GAPIC',
    municipi: 'Barcelona',
    abs: 'Àmbit Territorial Barcelona Ciutat',
    adreca: 'Carrer de Balmes, 22',
    telefon: '934 82 41 00',
    email: 'gapic.bcn@gencat.cat',
    responsable: 'Gerència d\'Àmbit d\'Atenció Primària Barcelona Ciutat',
    estat: 'Actiu',
    dataAlta: '2026-01-01',
    rolesAssignats: ['Gerència/Referents', 'Coordinació Territorial'],
    serveisHabilitats: {
      prescripcioPAO: false,
      bancMaterial: true,
      atencioDomiciliaria: true,
      citesRapides: false,
      tallerReparacions: true,
    },
    notes: 'Coordinació sanitària de tots els CAPs de Barcelona (inclosos La Marina, Manso, Clot).'
  },
  {
    id: 'ENT-AJUNTAMENT-BCN',
    codi: 'AJ-08019',
    nom: 'Ajuntament de Barcelona - Districte Sants-Montjuïc',
    tipologia: 'AJUNTAMENT',
    matriu: 'AJUNTAMENT',
    municipi: 'Barcelona',
    abs: 'Districte Sants-Montjuïc',
    adreca: 'Carrer de la Creu Coberta, 104',
    telefon: '932 91 60 00',
    email: 'serveissocials.sants@bcn.cat',
    responsable: 'Àrea de Drets Socials i Salut Comunitària',
    estat: 'Actiu',
    dataAlta: '2026-01-15',
    rolesAssignats: ['Enllaç Municipal / Comunitari'],
    serveisHabilitats: {
      prescripcioPAO: false,
      bancMaterial: true,
      atencioDomiciliaria: true,
      citesRapides: false,
      tallerReparacions: false,
    },
    notes: 'Conveni marc d\'interoperabilitat Serveis Socials <-> CatSalut per a material ortoprotèsic.'
  },
  {
    id: 'ENT-AJUNTAMENT-CORNELLA',
    codi: 'AJ-08088',
    nom: 'Ajuntament de Cornellà de Llobregat',
    tipologia: 'AJUNTAMENT',
    matriu: 'AJUNTAMENT',
    municipi: 'Cornellà de Llobregat',
    abs: 'Serveis Socials Bàsics Municipals',
    adreca: 'Plaça de l\'Església, 1',
    telefon: '933 77 02 12',
    email: 'serveissocials@aj-cornella.cat',
    responsable: 'Coordinació Serveis Socials Municipals',
    estat: 'Actiu',
    dataAlta: '2026-01-10',
    rolesAssignats: ['Enllaç Municipal / Comunitari'],
    serveisHabilitats: {
      prescripcioPAO: false,
      bancMaterial: true,
      atencioDomiciliaria: true,
      citesRapides: false,
      tallerReparacions: false,
    },
    notes: 'Subscripció al conveni institucional de reutilització comunitària.'
  },
  {
    id: 'ENT-CREU-ROJA-BCN',
    codi: 'CR-08019',
    nom: 'Creu Roja Barcelona (Assemblea Sants-Montjuïc)',
    tipologia: 'CREU_ROJA',
    matriu: 'CREU_ROJA',
    municipi: 'Barcelona',
    abs: 'Districte Sants-Montjuïc / La Marina',
    adreca: 'Carrer de Joan Güell, 2',
    telefon: '933 00 65 65',
    email: 'sants@creuroja.org',
    responsable: 'Coordinació de Voluntariat i Logística',
    estat: 'Actiu',
    dataAlta: '2026-01-15',
    rolesAssignats: ['Coordinació Taller / Voluntariat'],
    serveisHabilitats: {
      prescripcioPAO: false,
      bancMaterial: true,
      atencioDomiciliaria: true,
      citesRapides: false,
      tallerReparacions: true,
    },
    notes: 'Magatzem i suport a la distribució domiciliària a la Zona Franca i La Marina.'
  },
  {
    id: 'ENT-TALLER-CENTRAL',
    codi: 'TAL-01-CENTRAL',
    nom: 'Taller Central de Reparacions Ortoprotèsiques',
    tipologia: 'TALLER',
    matriu: 'TALLER',
    municipi: 'L\'Hospitalet de Llobregat',
    abs: 'Polígon Pedrosa / Bellvitge',
    adreca: 'Carrer de les Ciències, 45',
    telefon: '932 98 40 10',
    email: 'taller.central@bancactiu.cat',
    responsable: 'Eng. Marc Puig (Cap de Taller)',
    estat: 'Actiu',
    dataAlta: '2026-01-10',
    rolesAssignats: ['Coordinació Taller / Voluntariat'],
    serveisHabilitats: {
      prescripcioPAO: false,
      bancMaterial: false,
      atencioDomiciliaria: false,
      citesRapides: false,
      tallerReparacions: true,
    },
    notes: 'Centre logístic de revisió tècnica, reparació i homologació sanitària de material reutilitzat.'
  },
  {
    id: 'ENT-PADES-MARINA',
    codi: 'SERV-PADES-01',
    nom: 'PADES Litoral / La Marina (Cures Pal·liatives i Suport)',
    tipologia: 'SERVEI_SANITARI',
    matriu: 'ICS_CATSALUT',
    gerenciaId: 'GAPIC_BCN_CIUTAT',
    gerenciaNom: 'GAPiC Barcelona Ciutat',
    municipi: 'Barcelona',
    abs: 'ABS La Marina / Sants',
    adreca: 'Passeig de la Zona Franca, 166 (annex sanitari)',
    telefon: '932 89 67 15',
    email: 'pades.marina@gencat.cat',
    responsable: 'Dr. Jaume Solà (Referent PADES)',
    estat: 'Actiu',
    dataAlta: '2026-01-20',
    rolesAssignats: ['Referent/Sanitari', 'Administratiu/Voluntariat'],
    serveisHabilitats: {
      prescripcioPAO: true,
      bancMaterial: true,
      atencioDomiciliaria: true,
      citesRapides: true,
      tallerReparacions: false,
    },
    notes: 'Equip de suport a domicili per a pacients amb mobilitat greument reduïda.'
  }
];

const STORAGE_KEY = 'bancactiu_centres_entitats_v3';

// Funcions auxiliars de normalització de cerca
function stripAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function expandAbbreviations(str: string): string {
  let res = str.toLowerCase();
  res = res.replace(/\bdr\.?\b/g, 'doctor');
  res = res.replace(/\bdra\.?\b/g, 'doctora');
  res = res.replace(/\bcap\b/g, 'centre atencio primaria cap');
  res = res.replace(/\bcuap\b/g, 'centre urgencies atencio primaria cuap');
  res = res.replace(/\bpg\.?\b/g, 'passeig');
  res = res.replace(/\bav\.?\b/g, 'avinguda');
  res = res.replace(/\bavda\.?\b/g, 'avinguda');
  res = res.replace(/\bc\/?\.?\b/g, 'carrer');
  res = res.replace(/\bpl\.?\b/g, 'placa');
  return res;
}

// Ressaltat de text amb fons groc suau
export function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim() || !text) return <>{text}</>;

  const cleanQuery = stripAccents(query.trim());
  const words = cleanQuery.split(/\s+/).filter(w => w.length > 1);

  if (words.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const normText = stripAccents(text);
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  normText.replace(pattern, (match, p1, offset) => {
    parts.push(text.slice(lastIndex, offset));
    parts.push(
      <span key={offset} className="bg-amber-100 text-amber-900 font-semibold px-0.5 rounded">
        {text.slice(offset, offset + match.length)}
      </span>
    );
    lastIndex = offset + match.length;
    return match;
  });

  parts.push(text.slice(lastIndex));
  return <>{parts}</>;
}

export function CentresEntitatsWorkspace() {
  const [entitats, setEntitats] = useState<EntitatItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMatriu, setSelectedMatriu] = useState<AmbitMatriu>('TOTS');
  const [selectedTipus, setSelectedTipus] = useState<string>('TOTS');
  const [viewMode, setViewMode] = useState<'TREE' | 'TABLE'>('TREE');

  // Focus a un node seleccionat de l'arbre
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>('ENT-CAP-DR-CARLES-RIBAS');

  // Arbre desplegat: IDs de carpetes obertes
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'MATRIU-ICS': true,
    'GAPIC_BCN_CIUTAT': true,
    'MATRIU-AJUNTAMENTS': true,
    'MATRIU-CREU_ROJA': true,
  });

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Modals
  const [isAltaModalOpen, setIsAltaModalOpen] = useState(false);
  const [validatingEntity, setValidatingEntity] = useState<EntitatItem | null>(null);
  const [editingEntitat, setEditingEntitat] = useState<EntitatItem | null>(null);

  // Formulari d'edició
  const [editFormData, setEditFormData] = useState<Partial<EntitatItem>>({});

  // Formulari de validació de rols
  const [modalRoles, setModalRoles] = useState<string[]>([]);
  const [modalServeis, setModalServeis] = useState({
    prescripcioPAO: true,
    bancMaterial: true,
    atencioDomiciliaria: true,
    citesRapides: true,
    tallerReparacions: false,
  });
  const [newRoleToAdd, setNewRoleToAdd] = useState('');

  // Formulari ràpid d'alta nova
  const [altaFormData, setAltaFormData] = useState<Partial<EntitatItem>>({
    tipologia: 'CAP',
    matriu: 'ICS_CATSALUT',
    municipi: 'Barcelona',
    estat: 'Actiu',
  });

  // Estat per a la cerca online en temps real (CatSalut / Dades Obertes)
  const [onlineResults, setOnlineResults] = useState<NormalizedCentreOnline[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineSearchError, setOnlineSearchError] = useState<string | null>(null);

  // Estat per a la cerca assistida dins del modal d'Alta Nova Entitat
  const [modalOnlineQuery, setModalOnlineQuery] = useState('');
  const [modalOnlineResults, setModalOnlineResults] = useState<NormalizedCentreOnline[]>([]);
  const [isSearchingModalOnline, setIsSearchingModalOnline] = useState(false);

  // Debounced online search per a la barra de cerca principal (350ms)
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setOnlineResults([]);
      setIsSearchingOnline(false);
      setOnlineSearchError(null);
      return;
    }

    setIsSearchingOnline(true);
    setOnlineSearchError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/centres/search-online?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.data)) {
            // Filtrar equipaments que ja estiguin desats a la col·lecció local per no duplicar
            const existingCodes = new Set(entitats.map((e) => (e.codi || '').toUpperCase().trim()));
            const existingNames = new Set(entitats.map((e) => stripAccents((e.nom || '').trim())));
            const filtered = data.data.filter((item: NormalizedCentreOnline) => {
              const itemCode = (item.code || '').toUpperCase().trim();
              const itemName = stripAccents((item.name || '').trim());
              return !existingCodes.has(itemCode) && !existingNames.has(itemName);
            });
            setOnlineResults(filtered);
          } else {
            setOnlineResults([]);
          }
        } else {
          setOnlineSearchError("No s'ha pogut obtenir el cens online en aquest moment.");
        }
      } catch (err: any) {
        console.warn('Error fetching online centres:', err);
        setOnlineSearchError('Error de comunicació amb el cens de la Generalitat.');
      } finally {
        setIsSearchingOnline(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, entitats]);

  // Debounced online search per al cercador assistit del modal d'Alta (350ms)
  useEffect(() => {
    const q = modalOnlineQuery.trim();
    if (q.length < 2) {
      setModalOnlineResults([]);
      setIsSearchingModalOnline(false);
      return;
    }

    setIsSearchingModalOnline(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/centres/search-online?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.data)) {
            setModalOnlineResults(data.data);
          }
        }
      } catch (e) {
        console.warn('Modal online search error:', e);
      } finally {
        setIsSearchingModalOnline(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [modalOnlineQuery]);

  // Funció per incorporar un centre detectat al cens oficial
  const handleIncorporateOnline = (onlineItem: NormalizedCentreOnline, openModal = true) => {
    const preassignedRoles = getDefaultRolesForTipologia(onlineItem.tipologia);
    const newItem: EntitatItem = {
      id: `ENT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      codi: onlineItem.code,
      nom: onlineItem.name,
      tipologia: onlineItem.tipologia,
      matriu: onlineItem.matriu,
      gerenciaNom: onlineItem.gapic,
      municipi: onlineItem.municipality,
      abs: onlineItem.abs,
      adreca: onlineItem.address,
      telefon: onlineItem.phone,
      email: onlineItem.email || 'contacte.salut@gencat.cat',
      responsable: 'Referent Territorial CatSalut',
      estat: 'Actiu',
      dataAlta: new Date().toISOString().split('T')[0],
      rolesAssignats: preassignedRoles,
      serveisHabilitats: {
        prescripcioPAO: true,
        bancMaterial: true,
        atencioDomiciliaria: true,
        citesRapides: true,
        tallerReparacions: onlineItem.tipologia === 'TALLER',
      },
      notes: `Incorporat del Cens Oficial CatSalut / Generalitat (${onlineItem.ambit} · ${onlineItem.sector}).`,
    };

    if (openModal) {
      setAltaFormData(newItem);
      setIsAltaModalOpen(true);
    } else {
      const updated = [newItem, ...entitats];
      persistEntitats(updated);
      setFocusedNodeId(newItem.id);
      showNotification('Entitat Incorporada', `[${newItem.nom}] s'ha donat d'alta correctament al sistema.`);
      fetch('/api/centres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codiRecss: newItem.codi,
          nom: newItem.nom,
          tipus: newItem.tipologia,
          municipi: newItem.municipi,
          absId: newItem.abs,
          adreca: newItem.adreca,
          estatOperatiu: 'OPERATIU',
        }),
      }).catch((err) => console.warn('Sync POST error:', err));
    }
  };

  const [notification, setNotification] = useState<{ title: string; message: string } | null>(null);

  const showNotification = (title: string, message: string) => {
    setNotification({ title, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // Carrega inicial amb persistència
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasCarlesRibas = parsed.some(
            (e: EntitatItem) => e.nom.toLowerCase().includes('carles ribas') || e.codi === '0801912'
          );
          if (!hasCarlesRibas) {
            parsed.unshift(INITIAL_ENTITATS_CATALOG[0]);
          }
          setEntitats(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Error reading entitats storage:', e);
    }
    setEntitats(INITIAL_ENTITATS_CATALOG);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ENTITATS_CATALOG));
  }, []);

  const persistEntitats = (updated: EntitatItem[]) => {
    setEntitats(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving entitats:', e);
    }
  };

  // CONTROL DE LA TECLA ESC: Tanca únicament els modals oberts i MAI tanca la sessió
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (validatingEntity || editingEntitat || isAltaModalOpen) {
          e.preventDefault();
          e.stopPropagation();
          setValidatingEntity(null);
          setEditingEntitat(null);
          setIsAltaModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [validatingEntity, editingEntitat, isAltaModalOpen]);

  // Detecta si la cerca textual ha trobat coincidències en un àmbit diferent al seleccionat al filtre
  const hasMatchesInOtherScopes = useMemo(() => {
    if (!searchQuery.trim() || selectedMatriu === 'TOTS') return false;
    const normQuery = stripAccents(searchQuery.trim());
    const expQuery = expandAbbreviations(normQuery);
    const queryWords = expQuery.split(/\s+/).filter((w) => w.length > 0);

    return entitats.some((item) => {
      if (item.matriu === selectedMatriu) return false;
      const targetBlob = [
        item.nom,
        item.codi,
        item.municipi,
        item.abs,
        item.adreca,
        item.telefon,
        item.email,
        item.responsable || '',
        item.tipologia,
        item.matriu,
        item.rolesAssignats.join(' '),
        item.notes || '',
      ]
        .map((s) => stripAccents(expandAbbreviations(s)))
        .join(' ');

      return queryWords.every((word) => targetBlob.includes(word));
    });
  }, [entitats, searchQuery, selectedMatriu]);

  // Cerca normalitzada i multicamp (Sense bloqueig d'àmbit matriu durant cerques textuals)
  const filteredEntitats = useMemo(() => {
    return entitats.filter((item) => {
      // Quan NO hi ha cerca textual activa, s'apliquen els filtres seleccionats a la barra
      if (!searchQuery.trim()) {
        if (selectedMatriu !== 'TOTS' && item.matriu !== selectedMatriu) {
          return false;
        }
        if (selectedTipus !== 'TOTS' && item.tipologia !== selectedTipus) {
          return false;
        }
        return true;
      }

      // Quan HI HA cerca textual activa, NO es bloqueja per Àmbit Matriu per garantir trobar recursos arreu de Catalunya
      const normQuery = stripAccents(searchQuery.trim());
      const expQuery = expandAbbreviations(normQuery);
      const queryWords = expQuery.split(/\s+/).filter((w) => w.length > 0);

      const targetBlob = [
        item.nom,
        item.codi,
        item.municipi,
        item.abs,
        item.adreca,
        item.telefon,
        item.email,
        item.responsable || '',
        item.tipologia,
        item.matriu,
        item.rolesAssignats.join(' '),
        item.notes || '',
      ]
        .map((s) => stripAccents(expandAbbreviations(s)))
        .join(' ');

      return queryWords.every((word) => targetBlob.includes(word));
    });
  }, [entitats, searchQuery, selectedMatriu, selectedTipus]);

  // Node amb focus actual
  const focusedEntity = useMemo(() => {
    return entitats.find(e => e.id === focusedNodeId) || entitats[0] || null;
  }, [entitats, focusedNodeId]);

  // Obre modal de validació i assignació de rols
  const handleOpenValidateRolesModal = (item: EntitatItem) => {
    setValidatingEntity(item);
    const preassigned = item.rolesAssignats && item.rolesAssignats.length > 0
      ? [...item.rolesAssignats]
      : getDefaultRolesForTipologia(item.tipologia);
    setModalRoles(preassigned);
    setModalServeis({ ...item.serveisHabilitats });
  };

  // Confirmació de validació i incorporació al llistat actiu
  const handleConfirmValidation = () => {
    if (!validatingEntity) return;

    const updated = entitats.map(item => {
      if (item.id === validatingEntity.id) {
        return {
          ...item,
          estat: 'Actiu' as EstatEntitat,
          rolesAssignats: modalRoles,
          serveisHabilitats: modalServeis,
        };
      }
      return item;
    });

    persistEntitats(updated);
    showNotification(
      'Entitat Validada amb Èxit',
      `[${validatingEntity.nom}] s'ha incorporat correctament al llistat actiu amb ${modalRoles.length} rols assignats.`
    );
    setValidatingEntity(null);

    // Sincronització de fons amb backend
    fetch('/api/centres', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codiRecss: validatingEntity.codi,
        nom: validatingEntity.nom,
        estatOperatiu: 'OPERATIU',
        estatConveni: 'ACTIU_PILOT',
      })
    }).catch(err => console.warn('Sync PUT error:', err));
  };

  // Obre modal d'edició (amb doble clic)
  const handleOpenEdit = useCallback((item: EntitatItem) => {
    setEditingEntitat(item);
    setEditFormData({
      ...item,
      rolesAssignats: [...item.rolesAssignats],
      serveisHabilitats: { ...item.serveisHabilitats }
    });
  }, []);

  // Guarda canvis de l'edició
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntitat) return;

    const updated = entitats.map(item => {
      if (item.id === editingEntitat.id) {
        return {
          ...item,
          nom: editFormData.nom?.trim() || item.nom,
          codi: editFormData.codi?.trim() || item.codi,
          tipologia: (editFormData.tipologia as TipologiaEntitat) || item.tipologia,
          municipi: editFormData.municipi?.trim() || item.municipi,
          abs: editFormData.abs?.trim() || item.abs,
          adreca: editFormData.adreca?.trim() || item.adreca,
          telefon: editFormData.telefon?.trim() || item.telefon,
          email: editFormData.email?.trim() || item.email,
          responsable: editFormData.responsable?.trim() || item.responsable,
          estat: (editFormData.estat as EstatEntitat) || item.estat,
          rolesAssignats: editFormData.rolesAssignats || item.rolesAssignats,
          serveisHabilitats: editFormData.serveisHabilitats || item.serveisHabilitats,
          notes: editFormData.notes?.trim() || item.notes,
        };
      }
      return item;
    });

    persistEntitats(updated);
    showNotification('Canvis Guardats', `S'han desat les modificacions a [${editFormData.nom || editingEntitat.nom}].`);
    setEditingEntitat(null);
  };

  // Guardar alta d'una entitat nova
  const handleSaveAlta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!altaFormData.nom?.trim() || !altaFormData.codi?.trim()) {
      alert('Cal omplir el nom i el codi oficial.');
      return;
    }

    const tipus = altaFormData.tipologia || 'CAP';
    const preassignedRoles = getDefaultRolesForTipologia(tipus);

    const newItem: EntitatItem = {
      id: `ENT-${Date.now()}`,
      codi: altaFormData.codi.trim(),
      nom: altaFormData.nom.trim(),
      tipologia: tipus,
      matriu: altaFormData.matriu || 'ICS_CATSALUT',
      municipi: altaFormData.municipi?.trim() || 'Catalunya',
      abs: altaFormData.abs?.trim() || 'Àmbit General',
      adreca: altaFormData.adreca?.trim() || 'Sense adreça',
      telefon: altaFormData.telefon?.trim() || '932 89 67 00',
      email: altaFormData.email?.trim() || 'contacte@gencat.cat',
      responsable: altaFormData.responsable?.trim() || 'SuperAdmin 52622304Y',
      estat: 'Actiu',
      dataAlta: new Date().toISOString().split('T')[0],
      rolesAssignats: preassignedRoles,
      serveisHabilitats: {
        prescripcioPAO: true,
        bancMaterial: true,
        atencioDomiciliaria: true,
        citesRapides: true,
        tallerReparacions: false,
      },
      notes: altaFormData.notes?.trim() || 'Alta directa des del cercador unificat.'
    };

    const updated = [newItem, ...entitats];
    persistEntitats(updated);
    setFocusedNodeId(newItem.id);
    setIsAltaModalOpen(false);
    showNotification('Alta Registrada', `L'entitat [${newItem.nom}] s'ha incorporat correctament.`);
  };

  const getTipusBadge = (tipus: TipologiaEntitat) => {
    switch (tipus) {
      case 'CAP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
            <Stethoscope size={11} className="text-teal-600" />
            <span>CAP</span>
          </span>
        );
      case 'SERVEI_SANITARI':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <Building2 size={11} className="text-blue-600" />
            <span>Servei Sanitari</span>
          </span>
        );
      case 'GAPIC':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <Landmark size={11} className="text-purple-600" />
            <span>GAPiC</span>
          </span>
        );
      case 'AJUNTAMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Home size={11} className="text-amber-600" />
            <span>Ajuntament</span>
          </span>
        );
      case 'CREU_ROJA':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <HeartHandshake size={11} className="text-rose-600" />
            <span>Creu Roja</span>
          </span>
        );
      case 'TALLER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <Wrench size={11} className="text-slate-600" />
            <span>Taller</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200">
            <Briefcase size={11} />
            <span>{tipus}</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Toast de Notificació */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-white border border-teal-200 shadow-xl flex items-start gap-3 max-w-md animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 size={20} className="text-teal-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">{notification.title}</h4>
            <p className="text-xs text-slate-600 mt-0.5">{notification.message}</p>
          </div>
        </div>
      )}

      {/* 1. Capçalera Unificada & Barra de Cerca Global */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold">
                <Building2 size={18} />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Gestió Unificada de Centres i Entitats</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-100 text-teal-900">
                    CatSalut / SISCAT
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cens integral de Catalunya · Arbre jeràrquic, assignació de rols i edició directa per doble clic
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('TREE')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  viewMode === 'TREE'
                    ? 'bg-white text-teal-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vista Jeràrquica (Arbre)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  viewMode === 'TABLE'
                    ? 'bg-white text-teal-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vista Llistat
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsAltaModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Alta Nova Entitat</span>
            </button>
          </div>
        </div>

        {/* Barra de cerca universal amb ressaltat i alta ràpida */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca a tot Catalunya: 'CAP Doctor Carles Ribas', 'Dr. Ribas', '0801912', 'La Marina', 'Cornellà'..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900 placeholder-slate-400 outline-none transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Selector d'Àmbit / Entitat Matriu */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Àmbit Matriu:</span>
            <select
              value={selectedMatriu}
              onChange={(e) => setSelectedMatriu(e.target.value as AmbitMatriu)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
            >
              <option value="TOTS">Tots els Àmbits</option>
              <option value="ICS_CATSALUT">CatSalut / ICS (Primària & Serveis)</option>
              <option value="GAPIC">Gerències Territorials (GAPiCs)</option>
              <option value="AJUNTAMENT">Ajuntaments & Serveis Socials</option>
              <option value="CREU_ROJA">Creu Roja & Tercer Sector</option>
              <option value="TALLER">Tallers de Reparació & Logística</option>
            </select>
          </div>
        </div>

        {/* Avís d'indicació interactiva per a l'usuari */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2">
            <MousePointerClick size={14} className="text-teal-600" />
            <span>
              <strong>Fes doble clic</strong> sobre qualsevol centre o recurs per obrir la seva fitxa d'edició i gestió de rols.
            </span>
          </div>
          <span>
            Mostrant <strong className="text-slate-800">{filteredEntitats.length}</strong> recursos
          </span>
        </div>
      </div>

      {/* Avís de coincidència en altres àmbits diferents al seleccionat */}
      {hasMatchesInOtherScopes && selectedMatriu !== 'TOTS' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span>
              <strong>Trobat en altres àmbits:</strong> S'han trobat equipaments coincidents fora de l'àmbit filtrat ({selectedMatriu}). S'estan mostrant tots els resultats per no amagar informació rellevant.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedMatriu('TOTS')}
            className="px-3 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 font-bold text-[11px] text-amber-950 transition-colors whitespace-nowrap self-end sm:self-auto"
          >
            Mostrar Tots els Àmbits
          </button>
        </div>
      )}

      {/* Secció de Resultats trobats al Cens Oficial CatSalut / Generalitat (Online) */}
      {searchQuery.trim().length >= 2 && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50/90 via-white to-slate-50 border border-teal-200 shadow-sm space-y-3 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-teal-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold shadow-xs">
                <Globe size={15} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Resultats trobats al Cens Oficial CatSalut / Generalitat (Online)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-100 text-teal-900 border border-teal-300">
                    Dades Obertes Catalunya
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Cerca directa a equipaments sanitaris i municipals en temps real · Prem &quot;Incorporar i Donar d'Alta&quot; per desar a la base de dades local.
                </p>
              </div>
            </div>

            {isSearchingOnline && (
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 bg-teal-100/70 px-2.5 py-1 rounded-lg border border-teal-200">
                <Loader2 size={13} className="animate-spin text-teal-700" />
                <span>Consultant cens oficial...</span>
              </div>
            )}
          </div>

          {/* Estat de càrrega */}
          {isSearchingOnline && onlineResults.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
              <Loader2 size={22} className="animate-spin text-teal-600" />
              <span>Cercant equipaments a l'API pública de la Generalitat de Catalunya i SISCAT...</span>
            </div>
          )}

          {/* Estat buit (cap resultat online trobat) */}
          {!isSearchingOnline && onlineResults.length === 0 && (
            <div className="py-3 px-4 text-center text-xs text-slate-500 bg-white/70 rounded-xl border border-slate-200/60">
              {onlineSearchError ? (
                <span className="text-amber-700">{onlineSearchError}</span>
              ) : (
                <span>No s'han trobat centres addicionals al cens oficial per a &quot;<strong>{searchQuery}</strong>&quot;.</span>
              )}
            </div>
          )}

          {/* Graella de resultats oficials en línia */}
          {onlineResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {onlineResults.map((onlineItem) => (
                <div
                  key={`${onlineItem.code}-${onlineItem.name}`}
                  className="p-3 rounded-xl bg-white border border-teal-200/70 hover:border-teal-400 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between space-y-2.5"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getTipusBadge(onlineItem.tipologia)}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {onlineItem.code}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          {onlineItem.ambit}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      <HighlightText text={onlineItem.name} query={searchQuery} />
                    </h4>

                    <div className="space-y-1 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">
                          <HighlightText text={`${onlineItem.address}, ${onlineItem.municipality}`} query={searchQuery} />
                        </span>
                      </div>
                      {onlineItem.phone && (
                        <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
                          <Phone size={11} className="text-slate-400 shrink-0" />
                          <span>{onlineItem.phone}</span>
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400">
                        {onlineItem.gapic} · {onlineItem.abs}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-teal-900">Font: Cens Oficial CatSalut</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleIncorporateOnline(onlineItem, false)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1"
                        title="Incorporar directament amb rols i configuració per defecte"
                      >
                        <Check size={12} className="text-teal-700" />
                        <span>Alta Ràpida</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleIncorporateOnline(onlineItem, true)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-xs transition-colors flex items-center gap-1"
                        title="Revisar dades abans de desar definitivament"
                      >
                        <Plus size={12} />
                        <span>Incorporar i Donar d'Alta</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Cos Principal: Arbre Jeràrquic (Drill-Down) + Panell de Detalls Focals */}
      {viewMode === 'TREE' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Columna Esquerra: Arbre Jeràrquic (8 columnes) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Layers size={14} className="text-teal-600" />
                <span>Estructura Jeràrquica Territorial</span>
              </span>
              <span className="text-[10px] text-slate-400">Navega pels nodes desplegables</span>
            </div>

            {/* NODES PRINCIPALS DE L'ARBRE */}
            <div className="space-y-2 text-xs">
              {/* RAMA 1: CATSALUT / ICS */}
              {(selectedMatriu === 'TOTS' || selectedMatriu === 'ICS_CATSALUT') && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div
                    onClick={() => toggleNodeExpansion('MATRIU-ICS')}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      {expandedNodes['MATRIU-ICS'] ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      <Building2 size={15} className="text-teal-700" />
                      <span>CatSalut / Institut Català de la Salut (ICS)</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 font-bold">
                      Xarxa Sanitària
                    </span>
                  </div>

                  {expandedNodes['MATRIU-ICS'] && (
                    <div className="p-2.5 pl-6 space-y-2 border-t border-slate-100 bg-white">
                      {/* Sub-Gerència Barcelona Ciutat */}
                      <div className="border-l-2 border-teal-200 pl-3 space-y-1.5">
                        <div
                          onClick={() => toggleNodeExpansion('GAPIC_BCN_CIUTAT')}
                          className="flex items-center justify-between cursor-pointer text-slate-800 hover:text-teal-800 font-bold"
                        >
                          <div className="flex items-center gap-1.5">
                            {expandedNodes['GAPIC_BCN_CIUTAT'] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <Landmark size={14} className="text-purple-600" />
                            <span>GAPiC Barcelona Ciutat</span>
                          </div>
                          <span className="text-[10px] text-slate-400">Sector Litoral / Sants-Montjuïc</span>
                        </div>

                        {expandedNodes['GAPIC_BCN_CIUTAT'] && (
                          <div className="pl-4 space-y-1 pt-1">
                            {/* Recurs Destacat: CAP Doctor Carles Ribas */}
                            {filteredEntitats
                              .filter(e => e.id === 'ENT-CAP-DR-CARLES-RIBAS' || e.gerenciaId === 'GAPIC_BCN_CIUTAT')
                              .map(item => (
                                <div
                                  key={item.id}
                                  onClick={() => setFocusedNodeId(item.id)}
                                  onDoubleClick={() => handleOpenEdit(item)}
                                  className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                    focusedNodeId === item.id
                                      ? 'bg-teal-50/80 border-teal-400 shadow-sm'
                                      : 'border-slate-100 hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Stethoscope size={14} className="text-teal-600" />
                                    <div>
                                      <div className="font-bold text-slate-900 text-xs">
                                        <HighlightText text={item.nom} query={searchQuery} />
                                      </div>
                                      <div className="text-[10px] text-slate-500">
                                        <HighlightText text={`${item.codi} · ${item.abs}`} query={searchQuery} />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {getTipusBadge(item.tipologia)}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenValidateRolesModal(item);
                                      }}
                                      title="Validar i assignar rols"
                                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 hover:bg-teal-200"
                                    >
                                      Validar Rols
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Sub-Gerència Metro Sud */}
                      <div className="border-l-2 border-teal-200 pl-3 space-y-1.5 pt-1">
                        <div
                          onClick={() => toggleNodeExpansion('GAPIC_METRO_SUD')}
                          className="flex items-center justify-between cursor-pointer text-slate-800 hover:text-teal-800 font-bold"
                        >
                          <div className="flex items-center gap-1.5">
                            {expandedNodes['GAPIC_METRO_SUD'] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <Landmark size={14} className="text-purple-600" />
                            <span>GAPiC Barcelona Metropolitana Sud</span>
                          </div>
                          <span className="text-[10px] text-slate-400">Sector Baix Llobregat / Delta</span>
                        </div>

                        {expandedNodes['GAPIC_METRO_SUD'] && (
                          <div className="pl-4 space-y-1 pt-1">
                            {filteredEntitats
                              .filter(e => e.gerenciaId === 'GAPIC_METRO_SUD')
                              .map(item => (
                                <div
                                  key={item.id}
                                  onClick={() => setFocusedNodeId(item.id)}
                                  onDoubleClick={() => handleOpenEdit(item)}
                                  className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                    focusedNodeId === item.id
                                      ? 'bg-teal-50/80 border-teal-400 shadow-sm'
                                      : 'border-slate-100 hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Stethoscope size={14} className="text-teal-600" />
                                    <div>
                                      <div className="font-bold text-slate-900 text-xs">
                                        <HighlightText text={item.nom} query={searchQuery} />
                                      </div>
                                      <div className="text-[10px] text-slate-500">
                                        <HighlightText text={`${item.codi} · ${item.municipi}`} query={searchQuery} />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {getTipusBadge(item.tipologia)}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenValidateRolesModal(item);
                                      }}
                                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 hover:bg-teal-200"
                                    >
                                      Validar Rols
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* RAMA 2: AJUNTAMENTS & SERVEIS SOCIALS */}
              {(selectedMatriu === 'TOTS' || selectedMatriu === 'AJUNTAMENT') && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div
                    onClick={() => toggleNodeExpansion('MATRIU-AJUNTAMENTS')}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      {expandedNodes['MATRIU-AJUNTAMENTS'] ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      <Home size={15} className="text-amber-700" />
                      <span>Ajuntaments i Serveis Socials Municipals</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                      Àmbit Local
                    </span>
                  </div>

                  {expandedNodes['MATRIU-AJUNTAMENTS'] && (
                    <div className="p-2.5 pl-6 space-y-1.5 border-t border-slate-100 bg-white">
                      {filteredEntitats
                        .filter(e => e.tipologia === 'AJUNTAMENT' || e.matriu === 'AJUNTAMENT')
                        .map(item => (
                          <div
                            key={item.id}
                            onClick={() => setFocusedNodeId(item.id)}
                            onDoubleClick={() => handleOpenEdit(item)}
                            className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              focusedNodeId === item.id
                                ? 'bg-amber-50/80 border-amber-400 shadow-sm'
                                : 'border-slate-100 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Home size={14} className="text-amber-600" />
                              <div>
                                <div className="font-bold text-slate-900 text-xs">
                                  <HighlightText text={item.nom} query={searchQuery} />
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  <HighlightText text={`${item.municipi} · ${item.abs}`} query={searchQuery} />
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {getTipusBadge(item.tipologia)}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenValidateRolesModal(item);
                                }}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200"
                              >
                                Validar Rols
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* RAMA 3: CREU ROJA & TALLERS */}
              {(selectedMatriu === 'TOTS' || selectedMatriu === 'CREU_ROJA' || selectedMatriu === 'TALLER') && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div
                    onClick={() => toggleNodeExpansion('MATRIU-CREU_ROJA')}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      {expandedNodes['MATRIU-CREU_ROJA'] ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      <HeartHandshake size={15} className="text-rose-700" />
                      <span>Creu Roja, Tercer Sector & Tallers Ortoprotèsics</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-bold">
                      Logística & Recanvis
                    </span>
                  </div>

                  {expandedNodes['MATRIU-CREU_ROJA'] && (
                    <div className="p-2.5 pl-6 space-y-1.5 border-t border-slate-100 bg-white">
                      {filteredEntitats
                        .filter(e => e.tipologia === 'CREU_ROJA' || e.tipologia === 'TALLER')
                        .map(item => (
                          <div
                            key={item.id}
                            onClick={() => setFocusedNodeId(item.id)}
                            onDoubleClick={() => handleOpenEdit(item)}
                            className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              focusedNodeId === item.id
                                ? 'bg-rose-50/80 border-rose-400 shadow-sm'
                                : 'border-slate-100 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {item.tipologia === 'TALLER' ? (
                                <Wrench size={14} className="text-slate-700" />
                              ) : (
                                <HeartHandshake size={14} className="text-rose-600" />
                              )}
                              <div>
                                <div className="font-bold text-slate-900 text-xs">
                                  <HighlightText text={item.nom} query={searchQuery} />
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  <HighlightText text={`${item.municipi} · ${item.codi}`} query={searchQuery} />
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {getTipusBadge(item.tipologia)}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenValidateRolesModal(item);
                                }}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 hover:bg-rose-200"
                              >
                                Validar Rols
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Columna Dreta: Inspector de Node en Focus (5 columnes) */}
          <div className="lg:col-span-5 space-y-4">
            {focusedEntity ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4 sticky top-4">
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">{focusedEntity.codi}</span>
                      {getTipusBadge(focusedEntity.tipologia)}
                    </div>
                    <h2 className="text-base font-extrabold text-slate-900 mt-1">
                      {focusedEntity.nom}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin size={12} className="text-slate-400 shrink-0" />
                      <span>{focusedEntity.adreca} ({focusedEntity.municipi})</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(focusedEntity)}
                    className="p-2 rounded-xl text-slate-600 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 transition-colors"
                    title="Editar fitxa completa (o fes doble clic)"
                  >
                    <Edit2 size={15} />
                  </button>
                </div>

                {/* Rols Operatius Assignats */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <UserCheck size={14} className="text-teal-600" />
                      <span>Rols Operatius Assignats:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenValidateRolesModal(focusedEntity)}
                      className="text-[11px] font-bold text-teal-700 hover:underline"
                    >
                      Modificar Rols
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {focusedEntity.rolesAssignats && focusedEntity.rolesAssignats.length > 0 ? (
                      focusedEntity.rolesAssignats.map(role => (
                        <span
                          key={role}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-900 border border-teal-200 flex items-center gap-1"
                        >
                          <ShieldCheck size={11} className="text-teal-600" />
                          <span>{role}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">Cap rol assignat</span>
                    )}
                  </div>
                </div>

                {/* Serveis Sociosanitaris Habilitats */}
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-2">Serveis i Funcions Actives:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <CheckCircle2
                        size={14}
                        className={focusedEntity.serveisHabilitats?.prescripcioPAO ? 'text-teal-600' : 'text-slate-300'}
                      />
                      <span className={focusedEntity.serveisHabilitats?.prescripcioPAO ? 'font-semibold text-slate-800' : 'text-slate-400 line-through'}>
                        Prescripció PAO
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <CheckCircle2
                        size={14}
                        className={focusedEntity.serveisHabilitats?.bancMaterial ? 'text-teal-600' : 'text-slate-300'}
                      />
                      <span className={focusedEntity.serveisHabilitats?.bancMaterial ? 'font-semibold text-slate-800' : 'text-slate-400 line-through'}>
                        Banc de Material
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <CheckCircle2
                        size={14}
                        className={focusedEntity.serveisHabilitats?.atencioDomiciliaria ? 'text-teal-600' : 'text-slate-300'}
                      />
                      <span className={focusedEntity.serveisHabilitats?.atencioDomiciliaria ? 'font-semibold text-slate-800' : 'text-slate-400 line-through'}>
                        Atenció a Domicili (SAD)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <CheckCircle2
                        size={14}
                        className={focusedEntity.serveisHabilitats?.tallerReparacions ? 'text-teal-600' : 'text-slate-300'}
                      />
                      <span className={focusedEntity.serveisHabilitats?.tallerReparacions ? 'font-semibold text-slate-800' : 'text-slate-400 line-through'}>
                        Taller & Recanvis
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contacte i Referent */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-slate-400" />
                    <span className="font-mono font-medium">{focusedEntity.telefon}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-slate-400" />
                    <span>{focusedEntity.email}</span>
                  </div>
                  {focusedEntity.responsable && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <UserCheck size={13} className="text-slate-400" />
                      <span>Referent: <strong>{focusedEntity.responsable}</strong></span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenValidateRolesModal(focusedEntity)}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck size={16} />
                    <span>Validar i Incorporar al Llistat Oficial</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                Selecciona un node de l'arbre per inspeccionar els seus detalls.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* VISTA 2: TAULA COMPLETA AMB SUPORT DE DOBLE CLIC */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Centre / Entitat</th>
                  <th className="py-3 px-3">Codi / Tipus</th>
                  <th className="py-3 px-3">Àmbit (ABS / Municipi)</th>
                  <th className="py-3 px-3">Rols Assignats</th>
                  <th className="py-3 px-3">Estat</th>
                  <th className="py-3 px-4 text-right">Accions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredEntitats.map(item => (
                  <tr
                    key={item.id}
                    onDoubleClick={() => handleOpenEdit(item)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    title="Fes doble clic per editar directament"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        <HighlightText text={item.nom} query={searchQuery} />
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-slate-400 shrink-0" />
                        <span><HighlightText text={item.adreca} query={searchQuery} /></span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono text-[11px] font-bold text-slate-800">
                        <HighlightText text={item.codi} query={searchQuery} />
                      </div>
                      <div className="mt-1">
                        {getTipusBadge(item.tipologia)}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800">
                        <HighlightText text={item.municipi} query={searchQuery} />
                      </div>
                      <div className="text-[11px] text-slate-500">
                        <HighlightText text={item.abs} query={searchQuery} />
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {item.rolesAssignats.slice(0, 2).map(r => (
                          <span key={r} className="px-1.5 py-0.5 rounded text-[10px] bg-teal-50 text-teal-800 border border-teal-200">
                            {r}
                          </span>
                        ))}
                        {item.rolesAssignats.length > 2 && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            +{item.rolesAssignats.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{item.estat}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenValidateRolesModal(item)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
                        >
                          Validar Rols
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MODAL FLOTANT DE VALIDACIÓ I ASSIGNACIÓ DE ROLS       */}
      {/* ======================================================== */}
      {validatingEntity && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Validació i Assignació de Rols Operatius
                  </h3>
                  <p className="text-[11px] text-slate-500">SuperAdmin 52622304Y · Protocol de Seguretat ENS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setValidatingEntity(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            {/* Targeta Resum de l'Entitat */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900">{validatingEntity.nom}</span>
                {getTipusBadge(validatingEntity.tipologia)}
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-2 font-mono">
                <span>Codi: {validatingEntity.codi}</span>
                <span>·</span>
                <span>Municipi: {validatingEntity.municipi}</span>
                <span>·</span>
                <span>ABS: {validatingEntity.abs}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Adreça: {validatingEntity.adreca}
              </div>
            </div>

            {/* Bloc d'Etiquetes Interactives de Rols */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Tag size={13} className="text-teal-600" />
                  <span>Rols Preassignats Automàticament (Clica per treure o afegeix-ne):</span>
                </label>
                <span className="text-[10px] text-slate-400 font-bold">{modalRoles.length} rols actius</span>
              </div>

              {/* Llistat d'Etiquetes de Rols Actius */}
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 min-h-[46px] items-center">
                {modalRoles.map(role => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300 shadow-sm"
                  >
                    <span>{role}</span>
                    <button
                      type="button"
                      onClick={() => setModalRoles(modalRoles.filter(r => r !== role))}
                      className="hover:text-rose-700 transition-colors"
                      title="Eliminar rol"
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>

              {/* Selector per afegir nous rols */}
              <div className="flex items-center gap-2 pt-1">
                <select
                  value={newRoleToAdd}
                  onChange={(e) => setNewRoleToAdd(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-800 outline-none focus:border-teal-500"
                >
                  <option value="">-- Selecciona un rol addicional per afegir --</option>
                  {ALL_SYSTEM_ROLES.filter(r => !modalRoles.includes(r)).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!newRoleToAdd}
                  onClick={() => {
                    if (newRoleToAdd && !modalRoles.includes(newRoleToAdd)) {
                      setModalRoles([...modalRoles, newRoleToAdd]);
                      setNewRoleToAdd('');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-40"
                >
                  Afegir
                </button>
              </div>
            </div>

            {/* Serveis habilitats en aquesta entitat */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-800 block">
                Habilitació de Serveis del Programa:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalServeis.prescripcioPAO}
                    onChange={(e) => setModalServeis({ ...modalServeis, prescripcioPAO: e.target.checked })}
                    className="accent-teal-700"
                  />
                  <span className="font-medium text-slate-800">Prescripció PAO</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalServeis.bancMaterial}
                    onChange={(e) => setModalServeis({ ...modalServeis, bancMaterial: e.target.checked })}
                    className="accent-teal-700"
                  />
                  <span className="font-medium text-slate-800">Banc de Material</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalServeis.atencioDomiciliaria}
                    onChange={(e) => setModalServeis({ ...modalServeis, atencioDomiciliaria: e.target.checked })}
                    className="accent-teal-700"
                  />
                  <span className="font-medium text-slate-800">Atenció a Domicili (SAD)</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalServeis.tallerReparacions}
                    onChange={(e) => setModalServeis({ ...modalServeis, tallerReparacions: e.target.checked })}
                    className="accent-teal-700"
                  />
                  <span className="font-medium text-slate-800">Taller & Recanvis</span>
                </label>
              </div>
            </div>

            {/* Botons d'acció */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setValidatingEntity(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel·lar (ESC)
              </button>
              <button
                type="button"
                onClick={handleConfirmValidation}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-sm flex items-center gap-1.5"
              >
                <Check size={15} />
                <span>Validar i Incorporar al Llistat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL D'EDICIÓ DIRECTA (PER DOBLE CLIC)              */}
      {/* ======================================================== */}
      {editingEntitat && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 size={18} className="text-teal-700" />
                <h3 className="text-base font-bold text-slate-900">Editar Entitat / Centre</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntitat(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipologia</label>
                  <select
                    value={editFormData.tipologia}
                    onChange={(e) => setEditFormData({ ...editFormData, tipologia: e.target.value as TipologiaEntitat })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                  >
                    <option value="CAP">CAP (Primària / CUAP)</option>
                    <option value="SERVEI_SANITARI">Servei Sanitari (SAD / PADES)</option>
                    <option value="GAPIC">GAPiC (Gerència Primària)</option>
                    <option value="AJUNTAMENT">Ajuntament / Socials</option>
                    <option value="CREU_ROJA">Creu Roja</option>
                    <option value="TALLER">Taller de Reparacions</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estat Operatiu</label>
                  <select
                    value={editFormData.estat}
                    onChange={(e) => setEditFormData({ ...editFormData, estat: e.target.value as EstatEntitat })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                  >
                    <option value="Actiu">Actiu</option>
                    <option value="Pilot">Fase Pilot</option>
                    <option value="En Manteniment">En Manteniment</option>
                    <option value="Inactiu">Inactiu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom Oficial</label>
                <input
                  type="text"
                  required
                  value={editFormData.nom || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, nom: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Codi Oficial</label>
                  <input
                    type="text"
                    required
                    value={editFormData.codi || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, codi: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Municipi</label>
                  <input
                    type="text"
                    required
                    value={editFormData.municipi || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, municipi: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Àrea Bàsica (ABS)</label>
                  <input
                    type="text"
                    value={editFormData.abs || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, abs: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telèfon</label>
                  <input
                    type="text"
                    value={editFormData.telefon || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, telefon: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adreça</label>
                <input
                  type="text"
                  value={editFormData.adreca || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, adreca: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEntitat(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel·lar (ESC)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-sm flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>Guardar Canvis</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL D'ALTA NOVA ENTITAT                            */}
      {/* ======================================================== */}
      {isAltaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-teal-700" />
                <h3 className="text-base font-bold text-slate-900">Donar d'Alta Nova Entitat / Centre</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAltaModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAlta} className="space-y-3.5 text-xs">
              {/* Cercador assistit integrat al cens oficial */}
              <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-teal-950 flex items-center gap-1.5">
                    <Globe size={13} className="text-teal-700" />
                    <span>Cerca assistida al Cens Oficial (CatSalut / Generalitat)</span>
                  </label>
                  {isSearchingModalOnline && (
                    <div className="flex items-center gap-1 text-[10px] text-teal-700">
                      <Loader2 size={11} className="animate-spin text-teal-600" />
                      <span>Cercant...</span>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={modalOnlineQuery}
                    onChange={(e) => setModalOnlineQuery(e.target.value)}
                    placeholder="Escriu per cercar i autocompletar: 'Poble Sec', 'Les Hortes', 'Bellvitge'..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-teal-200 text-slate-800 placeholder-slate-400 outline-none focus:border-teal-500 text-xs shadow-2xs"
                  />
                  {modalOnlineQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setModalOnlineQuery('');
                        setModalOnlineResults([]);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Desplegable de coincidències online trobades per autocompletar */}
                {modalOnlineResults.length > 0 && (
                  <div className="max-h-44 overflow-y-auto space-y-1 bg-white rounded-lg border border-teal-100 p-1.5 shadow-sm">
                    <div className="text-[10px] font-bold text-teal-800 px-1.5 py-0.5">
                      Fes clic sobre un centre per autocompletar la fitxa:
                    </div>
                    {modalOnlineResults.slice(0, 6).map((item) => (
                      <button
                        key={`${item.code}-${item.name}`}
                        type="button"
                        onClick={() => {
                          setAltaFormData({
                            nom: item.name,
                            codi: item.code,
                            tipologia: item.tipologia,
                            matriu: item.matriu,
                            municipi: item.municipality,
                            abs: item.abs,
                            adreca: item.address,
                            telefon: item.phone,
                            email: item.email || 'contacte.salut@gencat.cat',
                            notes: `Incorporat del Cens Oficial CatSalut (${item.ambit} · ${item.sector}).`,
                            estat: 'Actiu',
                          });
                          setModalOnlineQuery('');
                          setModalOnlineResults([]);
                        }}
                        className="w-full text-left p-1.5 rounded-md hover:bg-teal-50 transition-colors flex items-center justify-between gap-2 text-[11px] group"
                      >
                        <div className="truncate">
                          <span className="font-bold text-slate-900 group-hover:text-teal-900">{item.name}</span>
                          <span className="text-slate-400 text-[10px] ml-1">({item.municipality} · {item.code})</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-teal-100 text-teal-800 shrink-0 group-hover:bg-teal-200">
                          Autocompletar
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipologia *</label>
                  <select
                    value={altaFormData.tipologia}
                    onChange={(e) => setAltaFormData({ ...altaFormData, tipologia: e.target.value as TipologiaEntitat })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                  >
                    <option value="CAP">CAP (Primària / CUAP)</option>
                    <option value="SERVEI_SANITARI">Servei Sanitari (SAD / PADES)</option>
                    <option value="GAPIC">GAPiC (Gerència)</option>
                    <option value="AJUNTAMENT">Ajuntament / Socials</option>
                    <option value="CREU_ROJA">Creu Roja</option>
                    <option value="TALLER">Taller de Reparacions</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Codi Oficial *</label>
                  <input
                    type="text"
                    required
                    value={altaFormData.codi || ''}
                    onChange={(e) => setAltaFormData({ ...altaFormData, codi: e.target.value })}
                    placeholder="Ex: 0801912"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom Oficial *</label>
                <input
                  type="text"
                  required
                  value={altaFormData.nom || ''}
                  onChange={(e) => setAltaFormData({ ...altaFormData, nom: e.target.value })}
                  placeholder="Ex: CAP Doctor Carles Ribas"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Municipi *</label>
                  <input
                    type="text"
                    required
                    value={altaFormData.municipi || ''}
                    onChange={(e) => setAltaFormData({ ...altaFormData, municipi: e.target.value })}
                    placeholder="Ex: Barcelona"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Àrea Bàsica (ABS)</label>
                  <input
                    type="text"
                    value={altaFormData.abs || ''}
                    onChange={(e) => setAltaFormData({ ...altaFormData, abs: e.target.value })}
                    placeholder="Ex: ABS La Marina"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adreça</label>
                <input
                  type="text"
                  value={altaFormData.adreca || ''}
                  onChange={(e) => setAltaFormData({ ...altaFormData, adreca: e.target.value })}
                  placeholder="Ex: Passeig de la Zona Franca, 166"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAltaModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel·lar (ESC)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-sm"
                >
                  Confirmar Alta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
