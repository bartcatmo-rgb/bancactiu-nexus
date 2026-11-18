'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  User,
  Users,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  FileCheck2,
  Save,
  CheckCircle2,
  Package,
  Clock,
  PlusCircle,
  Truck,
  HeartHandshake,
  Download,
  AlertCircle,
  Stethoscope,
  Filter,
  Check,
  ChevronDown
} from 'lucide-react';
import { GlassCard, GlassButton, GlassBadge } from '@bancactiu/ui-glass';

export interface PacientFiliacio {
  id: string;
  nom: string;
  cognoms: string;
  dni: string;
  cip: string;
  dataNaixement: string;
  telefon: string;
  email: string;
  adreca: string;
  municipi: string;
  barri: string;
  grauDependencia: 'SENSE_GRAU' | 'GRAU_I' | 'GRAU_II' | 'GRAU_III';
  puntuacioBvd: number;
  capReferencia: string;
  estatValidacio: 'VERIFICAT_CATSALUT' | 'PENDENT_DOCUMENTACIO' | 'EN_REVISIO';
}

export interface ComandaOrtopedia {
  id: string;
  pacientId: string;
  codiComanda: string;
  materialNom: string;
  categoria: 'CADIRES' | 'LLITS' | 'CAMINADORS' | 'BANY' | 'PREVENCIO';
  capCodi: string;
  metgePrescriptor: string;
  dataSollicitud: string;
  dataPrevisio: string;
  estat: 'SOL_LICITAT' | 'PRESCRIT_CAP' | 'EN_TALLER_CREU_ROJA' | 'LLIURAT' | 'RETORNAT';
  prioritat: 'NORMAL' | 'URGENT' | 'PREFERENT';
}

interface AdministratiuVoluntariatWorkspaceProps {
  onClose?: () => void;
  onShowToast?: (title: string, message: string) => void;
}

// Helper per al ressaltat en groc suau de coincidències de cerca
function HighlightText({ text, search }: { text: string; search: string }) {
  if (!search || !search.trim()) return <>{text}</>;
  const cleanSearch = search.trim();
  const regex = new RegExp(`(${cleanSearch.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === cleanSearch.toLowerCase() ? (
          <mark key={index} className="bg-amber-100 text-amber-900 px-0.5 rounded font-semibold border-b border-amber-300">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

const INITIAL_PACIENTS: PacientFiliacio[] = [
  {
    id: 'pac-01',
    nom: 'Maria Dolors',
    cognoms: 'Prat i Rovira',
    dni: '43218765K',
    cip: 'PRRO4321876501',
    dataNaixement: '1948-06-14',
    telefon: '612 345 678',
    email: 'mdolors.prat@gencat.cat',
    adreca: 'Av. Sant Ildefons 24, 2n 1a',
    municipi: 'Cornellà de Llobregat',
    barri: 'Sant Ildefons',
    grauDependencia: 'GRAU_II',
    puntuacioBvd: 58,
    capReferencia: 'CAP Sant Ildefons (Cornellà)',
    estatValidacio: 'VERIFICAT_CATSALUT',
  },
  {
    id: 'pac-02',
    nom: 'Joan',
    cognoms: 'Garcia i Soler',
    dni: '38129482X',
    cip: 'GASO3812948202',
    dataNaixement: '1952-11-03',
    telefon: '654 987 321',
    email: 'joan.garcia.soler@email.cat',
    adreca: 'Carrer de la Florida 88, Baixos',
    municipi: "L'Hospitalet de Llobregat",
    barri: 'La Florida',
    grauDependencia: 'GRAU_I',
    puntuacioBvd: 34,
    capReferencia: 'CAP La Florida (L\'Hospitalet)',
    estatValidacio: 'VERIFICAT_CATSALUT',
  },
  {
    id: 'pac-03',
    nom: 'Carme',
    cognoms: 'Vidal i Mas',
    dni: '47956602S',
    cip: 'VIMA4795660203',
    dataNaixement: '1961-04-22',
    telefon: '640 537 414',
    email: 'carme.vidal.mas@salut.cat',
    adreca: 'Rambla Anselm Clavé 12, 1r',
    municipi: 'Cornellà de Llobregat',
    barri: 'Centre',
    grauDependencia: 'GRAU_III',
    puntuacioBvd: 76,
    capReferencia: 'CAP Just Oliveras (L\'Hospitalet)',
    estatValidacio: 'VERIFICAT_CATSALUT',
  },
  {
    id: 'pac-04',
    nom: 'Josep',
    cognoms: 'Batlle i Puig',
    dni: '52622304Y',
    cip: 'BAPU5262230404',
    dataNaixement: '1944-09-30',
    telefon: '615 602 174',
    email: 'josep.batlle.puig@gencat.cat',
    adreca: 'Carrer Mossèn Andreu 18',
    municipi: 'Cornellà de Llobregat',
    barri: 'La Gavarra',
    grauDependencia: 'GRAU_II',
    puntuacioBvd: 62,
    capReferencia: 'CAP Sant Ildefons (Cornellà)',
    estatValidacio: 'VERIFICAT_CATSALUT',
  }
];

const INITIAL_COMANDES: ComandaOrtopedia[] = [
  {
    id: 'cmd-01',
    pacientId: 'pac-01',
    codiComanda: 'CMD-2026-081',
    materialNom: 'Cadira de Rodes Autopropulsable Alumini Plegable (Invacare)',
    categoria: 'CADIRES',
    capCodi: 'CAP Sant Ildefons (Cornellà)',
    metgePrescriptor: 'Dra. Marta Bosch (Col·l. 08/44120)',
    dataSollicitud: '2026-11-10',
    dataPrevisio: '2026-11-20',
    estat: 'PRESCRIT_CAP',
    prioritat: 'URGENT'
  },
  {
    id: 'cmd-02',
    pacientId: 'pac-01',
    codiComanda: 'CMD-2026-082',
    materialNom: 'Caminador Ergonòmic amb Seient i Fre de Maneta (Rollator)',
    categoria: 'CAMINADORS',
    capCodi: 'CAP Sant Ildefons (Cornellà)',
    metgePrescriptor: 'Dra. Marta Bosch (Col·l. 08/44120)',
    dataSollicitud: '2026-11-12',
    dataPrevisio: '2026-11-19',
    estat: 'EN_TALLER_CREU_ROJA',
    prioritat: 'NORMAL'
  },
  {
    id: 'cmd-03',
    pacientId: 'pac-02',
    codiComanda: 'CMD-2026-083',
    materialNom: 'Llit Hospitalari Articulat Elèctric amb Baranes i Incorporador',
    categoria: 'LLITS',
    capCodi: 'CAP La Florida (L\'Hospitalet)',
    metgePrescriptor: 'Dr. Oriol Camps (Col·l. 08/39812)',
    dataSollicitud: '2026-11-08',
    dataPrevisio: '2026-11-18',
    estat: 'LLIURAT',
    prioritat: 'PREFERENT'
  },
  {
    id: 'cmd-04',
    pacientId: 'pac-03',
    codiComanda: 'CMD-2026-084',
    materialNom: 'Matalàs Viscoelàstic Sanitari Antiescares amb Funda Impermeable',
    categoria: 'PREVENCIO',
    capCodi: 'CAP Just Oliveras (L\'Hospitalet)',
    metgePrescriptor: 'Dra. Núria Valls (Col·l. 08/51029)',
    dataSollicitud: '2026-11-14',
    dataPrevisio: '2026-11-22',
    estat: 'SOL_LICITAT',
    prioritat: 'URGENT'
  }
];

const CATALEG_CAP_MATERIALS = [
  { codi: 'PAO-CAD-01', nom: 'Cadira de Rodes d\'Alumini Autopropulsable', estoc: 8, disponible: true },
  { codi: 'PAO-LLI-02', nom: 'Llit Articulat Elèctric Hospitalari', estoc: 3, disponible: true },
  { codi: 'PAO-CAM-03', nom: 'Caminador lleuger 4 rodes amb fre', estoc: 14, disponible: true },
  { codi: 'PAO-MAT-04', nom: 'Matalàs Viscoelàstic Sanitari Antiescares', estoc: 6, disponible: true },
  { codi: 'PAO-GRU-05', nom: 'Grua Mòbil de Transferència amb Arnés', estoc: 2, disponible: true },
  { codi: 'PAO-BANY-06', nom: 'Cadira Giratòria per a Bany i Dutxa Adaptada', estoc: 11, disponible: true },
];

export function AdministratiuVoluntariatWorkspace({
  onClose,
  onShowToast
}: AdministratiuVoluntariatWorkspaceProps) {
  // Llistats
  const [pacients, setPacients] = useState<PacientFiliacio[]>(INITIAL_PACIENTS);
  const [comandes, setComandes] = useState<ComandaOrtopedia[]>(INITIAL_COMANDES);

  // Cerca avançada
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCapFilter, setSelectedCapFilter] = useState('ALL');
  const [selectedEstatFilter, setSelectedEstatFilter] = useState('ALL');

  // Pacient seleccionat per a la pantalla dividida (Split Screen)
  const [selectedPacientId, setSelectedPacientId] = useState<string>(INITIAL_PACIENTS[0].id);

  // Formulari editable de filiació
  const selectedPacient = useMemo(() => {
    return pacients.find(p => p.id === selectedPacientId) || pacients[0];
  }, [pacients, selectedPacientId]);

  const [formFiliacio, setFormFiliacio] = useState<PacientFiliacio>(selectedPacient);

  // Sincronitzar formulari en canviar de pacient
  React.useEffect(() => {
    if (selectedPacient) {
      setFormFiliacio(selectedPacient);
    }
  }, [selectedPacient]);

  // Filtratge de pacients
  const filteredPacients = useMemo(() => {
    return pacients.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.nom.toLowerCase().includes(q) ||
        p.cognoms.toLowerCase().includes(q) ||
        p.dni.toLowerCase().includes(q) ||
        p.cip.toLowerCase().includes(q) ||
        p.telefon.includes(q) ||
        p.adreca.toLowerCase().includes(q) ||
        p.municipi.toLowerCase().includes(q);

      const matchesCap =
        selectedCapFilter === 'ALL' || p.capReferencia.includes(selectedCapFilter);

      return matchesSearch && matchesCap;
    });
  }, [pacients, searchQuery, selectedCapFilter]);

  // Comandes del pacient seleccionat
  const comandesPacient = useMemo(() => {
    return comandes.filter(c => {
      const matchesPacient = c.pacientId === selectedPacientId;
      const matchesEstat =
        selectedEstatFilter === 'ALL' || c.estat === selectedEstatFilter;
      return matchesPacient && matchesEstat;
    });
  }, [comandes, selectedPacientId, selectedEstatFilter]);

  // Gestió de desar filiació editable
  const handleSaveFiliacio = (e: React.FormEvent) => {
    e.preventDefault();
    setPacients(prev => prev.map(p => p.id === formFiliacio.id ? formFiliacio : p));
    if (onShowToast) {
      onShowToast(
        "Filiació Desada Correctament",
        `S'han actualitzat les dades de ${formFiliacio.nom} ${formFiliacio.cognoms} (${formFiliacio.cip}) sota protocols RGPD.`
      );
    }
  };

  // Nova comanda ràpida associada al CAP
  const handleNovaComanda = (materialNom: string, categoria: ComandaOrtopedia['categoria']) => {
    const novaCmd: ComandaOrtopedia = {
      id: `cmd-${Date.now()}`,
      pacientId: selectedPacient.id,
      codiComanda: `CMD-2026-${Math.floor(100 + Math.random() * 900)}`,
      materialNom,
      categoria,
      capCodi: selectedPacient.capReferencia,
      metgePrescriptor: 'Prescripció Directa - Validació en Curs',
      dataSollicitud: new Date().toISOString().split('T')[0],
      dataPrevisio: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estat: 'SOL_LICITAT',
      prioritat: 'NORMAL'
    };
    setComandes(prev => [novaCmd, ...prev]);
    if (onShowToast) {
      onShowToast(
        "Comanda Tramitada",
        `Nova sol·licitud ${novaCmd.codiComanda} per a ${selectedPacient.nom} vinculada a ${selectedPacient.capReferencia}.`
      );
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Capçalera del Workspace d'Administració i Voluntariat */}
      <GlassCard className="p-4 sm:p-5 bg-white/95 border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Espai Administratiu & Suport al Voluntariat
                </h2>
                <GlassBadge variant="amber">Gestió Integral</GlassBadge>
              </div>
              <p className="text-xs text-slate-600">
                Filiació ciutadana, prescripcions mèdiques i comandes d'ortopèdia comunitària
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              Cens Actiu: <strong className="text-slate-800 font-mono">{pacients.length}</strong> expedients
            </span>
            {onClose && (
              <GlassButton variant="secondary" size="sm" onClick={onClose}>
                Tancar Espai
              </GlassButton>
            )}
          </div>
        </div>

        {/* Barra de Cerca Avançada amb Paleta Neutra i Ressaltat en Groc Suau */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-2.5">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca avançada per nom, DNI, CIP, carrer o telèfon..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 px-1 py-0.5 rounded bg-slate-200"
              >
                Esborrar
              </button>
            )}
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedCapFilter}
              onChange={(e) => setSelectedCapFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
            >
              <option value="ALL">Tots els Centres de Salut (CAP)</option>
              <option value="Sant Ildefons">CAP Sant Ildefons (Cornellà)</option>
              <option value="La Florida">CAP La Florida (L'Hospitalet)</option>
              <option value="Just Oliveras">CAP Just Oliveras (L'Hospitalet)</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedEstatFilter}
              onChange={(e) => setSelectedEstatFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
            >
              <option value="ALL">Tots els Estats de Comanda</option>
              <option value="SOL_LICITAT">Sol·licitat (Pendent)</option>
              <option value="PRESCRIT_CAP">Prescrit pel CAP</option>
              <option value="EN_TALLER_CREU_ROJA">En Taller Creu Roja</option>
              <option value="LLIURAT">Lliurat al Pacient</option>
            </select>
          </div>
        </div>

        {searchQuery && (
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Filter size={12} className="text-amber-600" />
            <span>Coincidències trobades per al criteri "<strong className="text-slate-800">{searchQuery}</strong>" ressaltades en</span>
            <span className="bg-amber-100 text-amber-900 px-1 rounded font-semibold text-[10px]">groc suau</span>
            <span>({filteredPacients.length} pacients)</span>
          </div>
        )}
      </GlassCard>

      {/* Selector Ràpid de Pacients (Mini carrusel / pills) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <span className="text-[11px] font-bold text-slate-500 shrink-0 uppercase tracking-wider pl-1">
          Pacient Actiu:
        </span>
        {filteredPacients.map(p => {
          const isSelected = p.id === selectedPacientId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPacientId(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-2 border shadow-sm ${
                isSelected
                  ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/20'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <User size={13} className={isSelected ? 'text-white' : 'text-slate-400'} />
              <span>
                <HighlightText text={`${p.nom} ${p.cognoms}`} search={searchQuery} />
              </span>
              <span className={`text-[10px] font-mono px-1 rounded ${isSelected ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <HighlightText text={p.cip.substring(0, 8)} search={searchQuery} />
              </span>
            </button>
          );
        })}
      </div>

      {/* PANTALLA DIVIDIDA (SPLIT SCREEN LAYOUT) */}
      <div className="space-y-4">
        {/* ============================================================== */}
        {/* SECCIÓ SUPERIOR: FILIACIÓ EDITABLE DEL PACIENT                 */}
        {/* ============================================================== */}
        <GlassCard className="p-4 sm:p-6 bg-white/95 border-slate-200">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Filiació Sanitària i Administrativa (Editable)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Dades oficials vinculades a la targeta sanitària individual (TSI CatSalut)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 size={12} />
                {selectedPacient.estatValidacio}
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveFiliacio} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={formFiliacio.nom}
                  onChange={(e) => setFormFiliacio({ ...formFiliacio, nom: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Cognoms
                </label>
                <input
                  type="text"
                  value={formFiliacio.cognoms}
                  onChange={(e) => setFormFiliacio({ ...formFiliacio, cognoms: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  DNI / NIE
                </label>
                <input
                  type="text"
                  value={formFiliacio.dni}
                  onChange={(e) => setFormFiliacio({ ...formFiliacio, dni: e.target.value.toUpperCase() })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-mono uppercase focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  CIP CatSalut
                </label>
                <input
                  type="text"
                  value={formFiliacio.cip}
                  onChange={(e) => setFormFiliacio({ ...formFiliacio, cip: e.target.value.toUpperCase() })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-indigo-700 font-mono uppercase focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Data de Naixement
                </label>
                <input
                  type="date"
                  value={formFiliacio.dataNaixement}
                  onChange={(e) => setFormFiliacio({ ...formFiliacio, dataNaixement: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Telèfon de Contacte
                </label>
                <input
                  type="text"
                  value={formFiliacio.telefon}
                  onChange={(e) => setFormFiliacio({ ...formFiliacio, telefon: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Adreça i Municipi
                </label>
                <input
                  type="text"
                  value={formFiliacio.adreca}
                  onChange={(e) => setFormFiliacio({ ...formFiliacio, adreca: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Grau Dependència (BVD)
                </label>
                <select
                  value={formFiliacio.grauDependencia}
                  onChange={(e) => setFormFiliacio({ ...formFiliacio, grauDependencia: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold"
                >
                  <option value="SENSE_GRAU">Sense Reconeixement Formal</option>
                  <option value="GRAU_I">Grau I - Dependència Moderada</option>
                  <option value="GRAU_II">Grau II - Dependència Severa</option>
                  <option value="GRAU_III">Grau III - Gran Dependència</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Centre d'Atenció Primària (CAP) de Referència
                </label>
                <input
                  type="text"
                  value={formFiliacio.capReferencia}
                  onChange={(e) => setFormFiliacio({ ...formFiliacio, capReferencia: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold text-emerald-800"
                />
              </div>

              <div className="flex items-end">
                <GlassButton
                  type="submit"
                  variant="primary"
                  className="w-full justify-center py-2"
                  icon={<Save size={15} />}
                >
                  Desar Filiació
                </GlassButton>
              </div>
            </div>
          </form>
        </GlassCard>

        {/* ============================================================== */}
        {/* SECCIÓ INFERIOR: COMANDES I CATÀLEG VINCULAT AL CENTRE DE SALUT */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Columna Esquerra (7/12): Comandes Actives del Pacient */}
          <div className="lg:col-span-7 space-y-3">
            <GlassCard className="p-4 sm:p-5 bg-white/95 border-slate-200">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Comandes i Expedients de Préstec del Pacient
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Vinculades al CAP {selectedPacient.capReferencia}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  {comandesPacient.length} comandes
                </span>
              </div>

              {comandesPacient.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Aquest pacient no té cap comanda registrada amb els filtres actuals.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {comandesPacient.map((cmd) => (
                    <div
                      key={cmd.id}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 font-mono">
                            {cmd.codiComanda}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            cmd.prioritat === 'URGENT'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {cmd.prioritat}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Previsió: {cmd.dataPrevisio}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800">
                          {cmd.materialNom}
                        </h4>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <Stethoscope size={12} className="text-emerald-600" />
                          <span>{cmd.metgePrescriptor}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                          cmd.estat === 'PRESCRIT_CAP'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : cmd.estat === 'EN_TALLER_CREU_ROJA'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : cmd.estat === 'LLIURAT'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {cmd.estat === 'PRESCRIT_CAP' ? 'Prescrit pel CAP' :
                           cmd.estat === 'EN_TALLER_CREU_ROJA' ? 'En Taller Creu Roja' :
                           cmd.estat === 'LLIURAT' ? 'Lliurat al Domicili' : 'Pendent'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Columna Dreta (5/12): Catàleg d'Ortopèdia disponible al Centre de Salut */}
          <div className="lg:col-span-5 space-y-3">
            <GlassCard className="p-4 sm:p-5 bg-white/95 border-slate-200">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Catàleg Disponible al CAP
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Estoc assignat a {selectedPacient.capReferencia}
                    </p>
                  </div>
                </div>
                <GlassBadge variant="emerald">Temps Real</GlassBadge>
              </div>

              <div className="space-y-2">
                {CATALEG_CAP_MATERIALS.map((item) => (
                  <div
                    key={item.codi}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-all flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-500">{item.codi}</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          {item.estoc} un.
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-800 leading-tight">
                        {item.nom}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleNovaComanda(item.nom, 'CADIRES')}
                      className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-300 rounded-lg transition-all shrink-0 flex items-center gap-1"
                    >
                      <PlusCircle size={12} />
                      <span>Comandar</span>
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
