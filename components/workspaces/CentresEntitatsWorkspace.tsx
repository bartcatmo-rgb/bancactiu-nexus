'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Briefcase
} from 'lucide-react';

export type TipologiaEntitat = 'CAP' | 'SERVEI_SANITARI' | 'GAPIC' | 'AJUNTAMENT';
export type EstatEntitat = 'Actiu' | 'Pilot' | 'En Manteniment' | 'Inactiu';

export interface EntitatItem {
  id: string;
  codi: string;
  nom: string;
  tipologia: TipologiaEntitat;
  municipi: string;
  abs: string;
  adreca: string;
  telefon: string;
  email: string;
  responsable?: string;
  estat: EstatEntitat;
  dataAlta: string;
  notes?: string;
}

// Catàleg oficial de referència amb CAP Doctor Carles Ribas garantit
const INITIAL_ENTITATS_CATALOG: EntitatItem[] = [
  {
    id: 'ENT-CAP-DR-CARLES-RIBAS',
    codi: '0801912',
    nom: 'CAP Doctor Carles Ribas',
    tipologia: 'CAP',
    municipi: 'Barcelona',
    abs: 'ABS La Marina',
    adreca: 'Passeig de la Zona Franca, 166 / Carrer del Foc',
    telefon: '932 89 67 00',
    email: 'cap.carlesribas@gencat.cat',
    responsable: 'Dra. Neus Riera Puig (Referent Clínica)',
    estat: 'Actiu',
    dataAlta: '2026-01-15',
    notes: 'Centre d\'Atenció Primària de referència per a La Marina i Sants-Montjuïc. Circuit preferent PAO.'
  },
  {
    id: 'ENT-CAP-SANT-ILDEFONS',
    codi: '0808801',
    nom: 'CAP Sant Ildefons',
    tipologia: 'CAP',
    municipi: 'Cornellà de Llobregat',
    abs: 'ABS Cornellà Sant Ildefons',
    adreca: 'Avinguda República Argentina, s/n',
    telefon: '934 71 14 00',
    email: 'cap.santildefons@gencat.cat',
    responsable: 'Dr. Jordi Casals Mas (Director CAP)',
    estat: 'Actiu',
    dataAlta: '2026-01-10',
    notes: 'Centre pilot Fase 1 BancActiu. Magatzem d\'ortopèdia avançada actiu.'
  },
  {
    id: 'ENT-CAP-MARTI-JULIA',
    codi: '0808802',
    nom: 'CAP Martí Julià',
    tipologia: 'CAP',
    municipi: 'Cornellà de Llobregat',
    abs: 'ABS Cornellà Martí Julià',
    adreca: 'Avinguda de la Línia Elèctrica, 11-15',
    telefon: '934 74 52 11',
    email: 'cap.martijulia@gencat.cat',
    responsable: 'Dra. Montserrat Soler (Cap de Servei)',
    estat: 'Actiu',
    dataAlta: '2026-01-10',
    notes: 'Prescripció activa de material d\'accessibilitat i cadires de rodes.'
  },
  {
    id: 'ENT-CUAP-CORNELLA',
    codi: '0808803',
    nom: 'CUAP Cornellà (Urgències de Primària)',
    tipologia: 'CAP',
    municipi: 'Cornellà de Llobregat',
    abs: 'ABS Cornellà CUAP',
    adreca: 'Carrer Bellaterra, 39',
    telefon: '934 75 62 00',
    email: 'cuap.cornella@gencat.cat',
    responsable: 'Dr. Xavier Font (Coordinador Urgències)',
    estat: 'Actiu',
    dataAlta: '2026-01-12',
    notes: 'Atenció continuada 24h i dispensació d\'urgència de material de mobilitat.'
  },
  {
    id: 'ENT-CAP-MANSO',
    codi: '0801915',
    nom: 'CAP Manso',
    tipologia: 'CAP',
    municipi: 'Barcelona',
    abs: 'ABS Manso',
    adreca: 'Carrer de Manso, 19',
    telefon: '935 53 05 01',
    email: 'cap.manso@gencat.cat',
    responsable: 'Dr. Antoni Vilar (Director Mèdic)',
    estat: 'Actiu',
    dataAlta: '2026-01-20',
    notes: 'Centre d\'Especialitats i Primària Eixample Sud.'
  },
  {
    id: 'ENT-CAP-CLOT',
    codi: '0801920',
    nom: 'CAP El Clot',
    tipologia: 'CAP',
    municipi: 'Barcelona',
    abs: 'ABS El Clot',
    adreca: 'Carrer de Concili de Trento, 25',
    telefon: '933 08 81 12',
    email: 'cap.clot@gencat.cat',
    responsable: 'Dra. Anna Blanch (Referent Sociosanitària)',
    estat: 'Actiu',
    dataAlta: '2026-02-01',
    notes: 'Adhesió al conveni de banc de recursos comunitaris.'
  },
  {
    id: 'ENT-GAPIC-METRO-SUD',
    codi: 'GAPIC-01-SUD',
    nom: 'GAPiC Barcelona Metropolitana Sud (ICS)',
    tipologia: 'GAPIC',
    municipi: 'L\'Hospitalet de Llobregat',
    abs: 'Àmbit Territorial Metropolitana Sud',
    adreca: 'Carrer Major, 41-43',
    telefon: '932 60 75 00',
    email: 'gapic.metrosud@gencat.cat',
    responsable: 'Direcció d\'Atenció Primària Metropolitana Sud',
    estat: 'Actiu',
    dataAlta: '2026-01-01',
    notes: 'Gerència territorial que coordina els sectors del Baix Llobregat i Hospitalet.'
  },
  {
    id: 'ENT-GAPIC-BCN-CIUTAT',
    codi: 'GAPIC-02-BCN',
    nom: 'GAPiC Barcelona Ciutat (ICS / CatSalut)',
    tipologia: 'GAPIC',
    municipi: 'Barcelona',
    abs: 'Àmbit Territorial Barcelona Ciutat',
    adreca: 'Carrer de Balmes, 22',
    telefon: '934 82 41 00',
    email: 'gapic.bcn@gencat.cat',
    responsable: 'Gerència d\'Àmbit d\'Atenció Primària Barcelona Ciutat',
    estat: 'Actiu',
    dataAlta: '2026-01-01',
    notes: 'Coordinació sanitària de tots els CAPs de Barcelona (inclosos La Marina, Manso, Clot).'
  },
  {
    id: 'ENT-AJUNTAMENT-BCN',
    codi: 'AJ-08019',
    nom: 'Ajuntament de Barcelona - Districte Sants-Montjuïc',
    tipologia: 'AJUNTAMENT',
    municipi: 'Barcelona',
    abs: 'Districte Sants-Montjuïc',
    adreca: 'Carrer de la Creu Coberta, 104',
    telefon: '932 91 60 00',
    email: 'serveissocials.sants@bcn.cat',
    responsable: 'Àrea de Drets Socials i Salut Comunitària',
    estat: 'Actiu',
    dataAlta: '2026-01-15',
    notes: 'Conveni marc d\'interoperabilitat Serveis Socials <-> CatSalut per a material ortoprotèsic.'
  },
  {
    id: 'ENT-AJUNTAMENT-CORNELLA',
    codi: 'AJ-08088',
    nom: 'Ajuntament de Cornellà de Llobregat',
    tipologia: 'AJUNTAMENT',
    municipi: 'Cornellà de Llobregat',
    abs: 'Serveis Socials Bàsics Municipals',
    adreca: 'Plaça de l\'Església, 1',
    telefon: '933 77 02 12',
    email: 'serveissocials@aj-cornella.cat',
    responsable: 'Coordinació Serveis Socials Municipals',
    estat: 'Actiu',
    dataAlta: '2026-01-10',
    notes: 'Subscripció al conveni institucional de reutilització comunitària.'
  },
  {
    id: 'ENT-SERVEI-PADES-MARINA',
    codi: 'SERV-PADES-01',
    nom: 'PADES Litoral / La Marina (Cures Pal·liatives i Suport)',
    tipologia: 'SERVEI_SANITARI',
    municipi: 'Barcelona',
    abs: 'ABS La Marina / Sants',
    adreca: 'Passeig de la Zona Franca, 166 (annex sanitari)',
    telefon: '932 89 67 15',
    email: 'pades.marina@gencat.cat',
    responsable: 'Dr. Jaume Solà (Referent PADES)',
    estat: 'Actiu',
    dataAlta: '2026-01-20',
    notes: 'Equip de suport a domicili per a pacients amb mobilitat greument reduïda.'
  },
  {
    id: 'ENT-SERVEI-SAD-CORNELLA',
    codi: 'SERV-SAD-CORNELLA',
    nom: 'Servei d\'Atenció Domiciliària (SAD) Cornellà',
    tipologia: 'SERVEI_SANITARI',
    municipi: 'Cornellà de Llobregat',
    abs: 'Àmbit Municipal Cornellà',
    adreca: 'Carrer Mossèn Andreu, 17',
    telefon: '934 74 18 00',
    email: 'sad@aj-cornella.cat',
    responsable: 'Marta Vidal (Coordinadora SAD)',
    estat: 'Actiu',
    dataAlta: '2026-01-18',
    notes: 'Servei d\'instal·lació de llits articulats i grues a llars vulnerables.'
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

  // Construcció de regex segura
  const pattern = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  
  // Normalitzem per fer el split
  const normText = stripAccents(text);
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  normText.replace(pattern, (match, p1, offset) => {
    // Afegim text no coincident original
    parts.push(text.slice(lastIndex, offset));
    // Afegim text coincident original amb ressaltat groc suau
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
  const [selectedTipus, setSelectedTipus] = useState<string>('TOTS');
  const [selectedEstat, setSelectedEstat] = useState<string>('TOTS');
  const [selectedMunicipi, setSelectedMunicipi] = useState<string>('TOTS');
  
  // Modal Alta
  const [isAltaModalOpen, setIsAltaModalOpen] = useState(false);
  // Modal Edició
  const [editingEntitat, setEditingEntitat] = useState<EntitatItem | null>(null);

  // Formulari d'alta o edició
  const [formData, setFormData] = useState<Partial<EntitatItem>>({
    tipologia: 'CAP',
    estat: 'Actiu',
    municipi: 'Barcelona',
  });

  const [notification, setNotification] = useState<{ title: string; message: string } | null>(null);

  const showNotification = (title: string, message: string) => {
    setNotification({ title, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // Carrega inicial des de localStorage amb fallback al catàleg de referència
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Assegurem que "CAP Doctor Carles Ribas" sempre hi és present
          const hasCarlesRibas = parsed.some(e => e.nom.toLowerCase().includes('carles ribas') || e.codi === '0801912');
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

  // Persistència immediata quan canvia el llistat
  const persistEntitats = (updated: EntitatItem[]) => {
    setEntitats(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving entitats:', e);
    }
  };

  // Municipis únics
  const municipisList = useMemo(() => {
    const setM = new Set<string>();
    entitats.forEach(e => {
      if (e.municipi) setM.add(e.municipi);
    });
    return Array.from(setM).sort();
  }, [entitats]);

  // Cerca normalitzada i multicampo
  const filteredEntitats = useMemo(() => {
    return entitats.filter(item => {
      // Filtre Tipologia
      if (selectedTipus !== 'TOTS' && item.tipologia !== selectedTipus) {
        return false;
      }
      // Filtre Estat
      if (selectedEstat !== 'TOTS' && item.estat !== selectedEstat) {
        return false;
      }
      // Filtre Municipi
      if (selectedMunicipi !== 'TOTS' && item.municipi !== selectedMunicipi) {
        return false;
      }

      // Cerca de text
      if (!searchQuery.trim()) return true;

      const normQuery = stripAccents(searchQuery.trim());
      const expQuery = expandAbbreviations(normQuery);
      const queryWords = expQuery.split(/\s+/).filter(w => w.length > 0);

      // Agreguem camps rellevants per a la cerca
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
        item.notes || ''
      ].map(s => stripAccents(expandAbbreviations(s))).join(' ');

      // Tots els termes de cerca han de coincidir (AND lògic)
      return queryWords.every(word => targetBlob.includes(word));
    });
  }, [entitats, searchQuery, selectedTipus, selectedEstat, selectedMunicipi]);

  // Gestió de Formulari Alta / Edició
  const handleOpenAlta = () => {
    setFormData({
      tipologia: 'CAP',
      nom: '',
      codi: '',
      municipi: 'Barcelona',
      abs: '',
      adreca: '',
      telefon: '',
      email: '',
      responsable: '',
      estat: 'Actiu',
      notes: ''
    });
    setIsAltaModalOpen(true);
  };

  const handleOpenEdit = (item: EntitatItem) => {
    setEditingEntitat(item);
    setFormData({ ...item });
  };

  const handleSaveAlta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom?.trim() || !formData.codi?.trim()) {
      alert('Cal omplir com a mínim el nom oficial i el codi de l\'entitat.');
      return;
    }

    const newItem: EntitatItem = {
      id: `ENT-${Date.now()}`,
      codi: formData.codi.trim(),
      nom: formData.nom.trim(),
      tipologia: formData.tipologia || 'CAP',
      municipi: formData.municipi?.trim() || 'Catalunya',
      abs: formData.abs?.trim() || 'Àmbit General',
      adreca: formData.adreca?.trim() || 'Sense adreça',
      telefon: formData.telefon?.trim() || 'Sense telèfon',
      email: formData.email?.trim() || 'contacte@gencat.cat',
      responsable: formData.responsable?.trim() || '',
      estat: (formData.estat as EstatEntitat) || 'Actiu',
      dataAlta: new Date().toISOString().split('T')[0],
      notes: formData.notes?.trim() || ''
    };

    const updated = [newItem, ...entitats];
    persistEntitats(updated);
    setIsAltaModalOpen(false);
    showNotification('Alta Completada', `L'entitat [${newItem.nom}] s'ha registrat correctament amb codi ${newItem.codi}.`);

    // Sincronització de fons amb backend
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
      })
    }).catch(err => console.warn('Sync POST /api/centres error:', err));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntitat) return;

    const updated = entitats.map(item => {
      if (item.id === editingEntitat.id) {
        return {
          ...item,
          nom: formData.nom?.trim() || item.nom,
          codi: formData.codi?.trim() || item.codi,
          tipologia: (formData.tipologia as TipologiaEntitat) || item.tipologia,
          municipi: formData.municipi?.trim() || item.municipi,
          abs: formData.abs?.trim() || item.abs,
          adreca: formData.adreca?.trim() || item.adreca,
          telefon: formData.telefon?.trim() || item.telefon,
          email: formData.email?.trim() || item.email,
          responsable: formData.responsable?.trim() || item.responsable,
          estat: (formData.estat as EstatEntitat) || item.estat,
          notes: formData.notes?.trim() || item.notes,
        };
      }
      return item;
    });

    persistEntitats(updated);
    setEditingEntitat(null);
    showNotification('Modificació Guardada', `S'han actualitzat les dades operatives de [${formData.nom || editingEntitat.nom}].`);

    // Sincronització de fons amb backend
    fetch('/api/centres', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codiRecss: formData.codi || editingEntitat.codi,
        nom: formData.nom,
        municipi: formData.municipi,
        absId: formData.abs,
        adreca: formData.adreca,
      })
    }).catch(err => console.warn('Sync PUT /api/centres error:', err));
  };

  const handleToggleEstat = (item: EntitatItem) => {
    const nouEstat: EstatEntitat = item.estat === 'Actiu' ? 'Inactiu' : 'Actiu';
    const updated = entitats.map(e => e.id === item.id ? { ...e, estat: nouEstat } : e);
    persistEntitats(updated);
    showNotification('Estat Operatiu Canviat', `L'entitat [${item.nom}] ha passat a estat [${nouEstat}].`);
  };

  const getTipusBadge = (tipus: TipologiaEntitat) => {
    switch (tipus) {
      case 'CAP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
            <Stethoscope size={11} className="text-teal-600" />
            <span>CAP / Primària</span>
          </span>
        );
      case 'SERVEI_SANITARI':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <Building2 size={11} className="text-blue-600" />
            <span>Servei Sanitari</span>
          </span>
        );
      case 'GAPIC':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <Landmark size={11} className="text-purple-600" />
            <span>GAPiC (Gerència)</span>
          </span>
        );
      case 'AJUNTAMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Home size={11} className="text-amber-600" />
            <span>Ajuntament / Socials</span>
          </span>
        );
    }
  };

  const getEstatBadge = (estat: EstatEntitat) => {
    switch (estat) {
      case 'Actiu':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Actiu</span>
          </span>
        );
      case 'Pilot':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            <span>Fase Pilot</span>
          </span>
        );
      case 'En Manteniment':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Manteniment</span>
          </span>
        );
      case 'Inactiu':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Inactiu</span>
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

      {/* Capçalera del mòdul */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Gestió de Centres i Entitats</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-teal-100 text-teal-900">
                  eCAP / SISCAT
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cens sanitari i comunitari unificat: CAPs, Serveis d'Atenció Domiciliària (SAD), GAPiCs i Ajuntaments
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAlta}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>Donar d'Alta Entitat / CAP</span>
          </button>
        </div>
      </div>

      {/* Barra de cerca normalitzada i filtres */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Cercador Intel·ligent Multicampo */}
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca per nom ('Doctor Carles Ribas', 'Dr. Ribas'), codi, municipi, ABS ('La Marina'), adreça..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-900 placeholder-slate-400 outline-none transition-all"
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

          {/* Filtres per Tipologia */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {(['TOTS', 'CAP', 'SERVEI_SANITARI', 'GAPIC', 'AJUNTAMENT'] as const).map(tipus => (
              <button
                key={tipus}
                type="button"
                onClick={() => setSelectedTipus(tipus)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedTipus === tipus
                    ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tipus === 'TOTS' ? 'Totes les Tipologies' : tipus.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Subfiltres: Estat i Municipi */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-semibold flex items-center gap-1">
            <SlidersHorizontal size={12} />
            <span>Filtrar per:</span>
          </span>

          <select
            value={selectedEstat}
            onChange={(e) => setSelectedEstat(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs outline-none focus:border-teal-500"
          >
            <option value="TOTS">Tots els Estats</option>
            <option value="Actiu">Actiu</option>
            <option value="Pilot">Fase Pilot</option>
            <option value="En Manteniment">En Manteniment</option>
            <option value="Inactiu">Inactiu</option>
          </select>

          <select
            value={selectedMunicipi}
            onChange={(e) => setSelectedMunicipi(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs outline-none focus:border-teal-500"
          >
            <option value="TOTS">Tots els Municipis</option>
            {municipisList.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <span className="text-slate-400 ml-auto">
            Mostrant <strong className="text-slate-700">{filteredEntitats.length}</strong> de {entitats.length} entitats
          </span>
        </div>
      </div>

      {/* Llistat d'Entitats en Taula / Targetes eCAP */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Entitat / Centre</th>
                <th className="py-3 px-3">Codi / Tipus</th>
                <th className="py-3 px-3">Àmbit Territorial (ABS)</th>
                <th className="py-3 px-3">Contacte Oficial</th>
                <th className="py-3 px-3">Estat</th>
                <th className="py-3 px-4 text-right">Accions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredEntitats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Building2 size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No s'ha trobat cap entitat o centre amb aquests criteris.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Prova amb una altra cerca (ex: "Carles Ribas", "Sant Ildefons", "La Marina").
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEntitats.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        <HighlightText text={item.nom} query={searchQuery} />
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-slate-400 shrink-0" />
                        <span><HighlightText text={item.adreca} query={searchQuery} /></span>
                      </div>
                      {item.responsable && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Referent: <span className="text-slate-600 font-medium"><HighlightText text={item.responsable} query={searchQuery} /></span>
                        </div>
                      )}
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
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Phone size={11} className="text-slate-400" />
                        <span className="font-mono text-[11px]"><HighlightText text={item.telefon} query={searchQuery} /></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                        <Mail size={11} className="text-slate-400" />
                        <span className="text-[11px] truncate max-w-[160px]"><HighlightText text={item.email} query={searchQuery} /></span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {getEstatBadge(item.estat)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          title="Editar dades de l'entitat"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleEstat(item)}
                          title={item.estat === 'Actiu' ? 'Desactivar entitat' : 'Activar entitat'}
                          className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors border ${
                            item.estat === 'Actiu'
                              ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-700'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {item.estat === 'Actiu' ? 'Pausa' : 'Activa'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'Alta d'Entitat / Centre */}
      {isAltaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-teal-700" />
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

            <form onSubmit={handleSaveAlta} className="space-y-3.5 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipologia d'Entitat *</label>
                  <select
                    value={formData.tipologia}
                    onChange={(e) => setFormData({ ...formData, tipologia: e.target.value as TipologiaEntitat })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                  >
                    <option value="CAP">CAP (Primària / CUAP)</option>
                    <option value="SERVEI_SANITARI">Servei Sanitari (SAD / PADES)</option>
                    <option value="GAPIC">GAPiC (Gerència Primària)</option>
                    <option value="AJUNTAMENT">Ajuntament / Serveis Socials</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Codi Oficial (RECSS / NIF) *</label>
                  <input
                    type="text"
                    required
                    value={formData.codi || ''}
                    onChange={(e) => setFormData({ ...formData, codi: e.target.value })}
                    placeholder="Ex: 0801912 o GAPIC-03"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom Oficial de l'Entitat / Centre *</label>
                <input
                  type="text"
                  required
                  value={formData.nom || ''}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
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
                    value={formData.municipi || ''}
                    onChange={(e) => setFormData({ ...formData, municipi: e.target.value })}
                    placeholder="Ex: Barcelona"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Àrea Bàsica de Salut (ABS)</label>
                  <input
                    type="text"
                    value={formData.abs || ''}
                    onChange={(e) => setFormData({ ...formData, abs: e.target.value })}
                    placeholder="Ex: ABS La Marina"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adreça Completa</label>
                <input
                  type="text"
                  value={formData.adreca || ''}
                  onChange={(e) => setFormData({ ...formData, adreca: e.target.value })}
                  placeholder="Ex: Passeig de la Zona Franca, 166"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telèfon de Contacte</label>
                  <input
                    type="text"
                    value={formData.telefon || ''}
                    onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                    placeholder="Ex: 932 89 67 00"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correu Institucional</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Ex: centre@gencat.cat"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Responsable o Referent Clínic</label>
                <input
                  type="text"
                  value={formData.responsable || ''}
                  onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                  placeholder="Ex: Dra. Neus Riera Puig"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observacions / Notes Operatives</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes sobre el conveni o integració..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAltaModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel·lar
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

      {/* Modal d'Edició d'Entitat / Centre */}
      {editingEntitat && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
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

            <form onSubmit={handleSaveEdit} className="space-y-3.5 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipologia</label>
                  <select
                    value={formData.tipologia}
                    onChange={(e) => setFormData({ ...formData, tipologia: e.target.value as TipologiaEntitat })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                  >
                    <option value="CAP">CAP (Primària / CUAP)</option>
                    <option value="SERVEI_SANITARI">Servei Sanitari (SAD / PADES)</option>
                    <option value="GAPIC">GAPiC (Gerència Primària)</option>
                    <option value="AJUNTAMENT">Ajuntament / Socials</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estat Operatiu</label>
                  <select
                    value={formData.estat}
                    onChange={(e) => setFormData({ ...formData, estat: e.target.value as EstatEntitat })}
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
                  value={formData.nom || ''}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Codi Oficial</label>
                  <input
                    type="text"
                    required
                    value={formData.codi || ''}
                    onChange={(e) => setFormData({ ...formData, codi: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Municipi</label>
                  <input
                    type="text"
                    required
                    value={formData.municipi || ''}
                    onChange={(e) => setFormData({ ...formData, municipi: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Àrea Bàsica (ABS)</label>
                  <input
                    type="text"
                    value={formData.abs || ''}
                    onChange={(e) => setFormData({ ...formData, abs: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telèfon</label>
                  <input
                    type="text"
                    value={formData.telefon || ''}
                    onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adreça</label>
                <input
                  type="text"
                  value={formData.adreca || ''}
                  onChange={(e) => setFormData({ ...formData, adreca: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correu Electrònic</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Referent / Responsable</label>
                  <input
                    type="text"
                    value={formData.responsable || ''}
                    onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEntitat(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel·lar
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
    </div>
  );
}
