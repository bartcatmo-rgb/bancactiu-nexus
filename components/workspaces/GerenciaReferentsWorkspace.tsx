'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  GitFork,
  ArrowRight,
  CheckCircle2,
  Clock,
  Building,
  Activity,
  Layers,
  FileCheck,
  ShieldCheck,
  Sparkles,
  PieChart,
  Users2,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { GlassCard, GlassButton, GlassBadge } from '@bancactiu/ui-glass';

interface GerenciaReferentsWorkspaceProps {
  onClose?: () => void;
  onShowToast?: (title: string, message: string) => void;
}

export function GerenciaReferentsWorkspace({
  onClose,
  onShowToast
}: GerenciaReferentsWorkspaceProps) {
  // Pas seleccionat del diagrama de flux
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const fluxSteps = [
    {
      pas: 1,
      titol: 'Detecció & Sol·licitud',
      actor: 'Ciutadania / Serveis Socials',
      durada: '0.4 dies',
      descripcio: 'Entrada de la necessitat assistencial mitjançant el portal o derivació de Serveis Socials (bavarem BVD).',
      estat: 'OPTIM',
      metriques: { expedients: 1420, percentatge: '100%' }
    },
    {
      pas: 2,
      titol: 'Validació & Prescripció Mèdica',
      actor: 'Metge de Família (CAP)',
      durada: '0.8 dies',
      descripcio: 'Validació clínica i prescripció mèdica d’ajuda tècnica (CatSalut PAO) pel facultatiu assignat.',
      estat: 'OPTIM',
      metriques: { expedients: 1380, percentatge: '97.2%' }
    },
    {
      pas: 3,
      titol: 'Assignació & Taller Creu Roja',
      actor: 'Mecànics & Tècnics Creu Roja',
      durada: '0.6 dies',
      descripcio: 'Preparació del material des d’estoc descentralitzat o diagnosi i recondicionament en taller.',
      estat: 'ALERT',
      metriques: { expedients: 1310, percentatge: '94.9%' }
    },
    {
      pas: 4,
      titol: 'Control de Qualitat & Seguretat',
      actor: 'Verificador Tècnic BancActiu',
      durada: '0.2 dies',
      descripcio: 'Revisió de frens, rodaments i desinfecció segons norma ISO 13485 i certificat de seguretat.',
      estat: 'OPTIM',
      metriques: { expedients: 1290, percentatge: '98.5%' }
    },
    {
      pas: 5,
      titol: 'Lliurament Domiciliari & Seguiment',
      actor: 'Voluntariat & Logística',
      durada: '0.3 dies',
      descripcio: 'Instal·lació al domicili del pacient, signatura digital i activació del període de préstec.',
      estat: 'OPTIM',
      metriques: { expedients: 1275, percentatge: '98.8%' }
    },
  ];

  const centresMetriques = [
    { nom: 'CAP Sant Ildefons (Cornellà)', adhesio: '100%', estoc: 34, resolucio: '1.9 dies', estat: 'EXCEL·LENT' },
    { nom: 'CAP La Florida (L\'Hospitalet)', adhesio: '98%', estoc: 28, resolucio: '2.1 dies', estat: 'EXCEL·LENT' },
    { nom: 'CAP Just Oliveras (L\'Hospitalet)', adhesio: '95%', estoc: 22, resolucio: '2.4 dies', estat: 'BON_ESTAT' },
    { nom: 'CAP Bellvitge (L\'Hospitalet)', adhesio: '92%', estoc: 19, resolucio: '2.6 dies', estat: 'BON_ESTAT' },
    { nom: 'CAP El Prat - Disseminats', adhesio: '88%', estoc: 14, resolucio: '3.1 dies', estat: 'REVISIO' },
  ];

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Capçalera de Gerència */}
      <GlassCard className="p-4 sm:p-5 bg-white/95 border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Panell Executiu de Gerència i Referents Clínics
                </h2>
                <GlassBadge variant="purple">Supervisió Territorial</GlassBadge>
              </div>
              <p className="text-xs text-slate-600">
                Diagrames de flux de procés, temps de resposta i mètriques estratègiques de xarxa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 size={13} />
              Objectiu Resolutiu Assolit (2.3 dies)
            </span>
            {onClose && (
              <GlassButton variant="secondary" size="sm" onClick={onClose}>
                Tancar Panell
              </GlassButton>
            )}
          </div>
        </div>

        {/* Targetes de KPIs Estratègics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Temps Mitjà Resolució
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900">2.3</span>
              <span className="text-xs font-bold text-slate-600">dies</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1 rounded ml-auto">
                -24% vs 2025
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Taxa d'Adhesió de CAPs
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-indigo-700">94.2%</span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1 rounded ml-auto">
                48 / 51 Centres
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Estalvi Sanitari Reutilització
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-700">184.200 €</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1 rounded ml-auto">
                Auditat
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Pacients Atesos Actius
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900">1.275</span>
              <span className="text-xs font-bold text-slate-600">persones</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* DIAGRAMA DE FLUX DE PROCÉS INTERACTIU */}
      <GlassCard className="p-4 sm:p-6 bg-white/95 border-slate-200">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <GitFork className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Diagrama de Flux de Procés Operatiu (End-to-End)
              </h3>
              <p className="text-[11px] text-slate-500">
                Cicle integral d'ortopèdia comunitària: des de la detecció al lliurament i control de qualitat
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Clic per explorar cada etapa</span>
        </div>

        {/* Passos del flux en format horitzontal */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
          {fluxSteps.map((step, idx) => {
            const isSelected = activeStepIndex === idx;
            return (
              <button
                key={step.pas}
                type="button"
                onClick={() => setActiveStepIndex(idx)}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-400 shadow-md ring-1 ring-indigo-400'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {step.pas}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    {step.durada}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight mb-1">
                  {step.titol}
                </h4>
                <p className="text-[10px] text-slate-500 truncate">
                  {step.actor}
                </p>
              </button>
            );
          })}
        </div>

        {/* Caixa de Detall de l'Etapa Seleccionada */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
                Etapa {fluxSteps[activeStepIndex].pas}: {fluxSteps[activeStepIndex].titol}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                Responsable: {fluxSteps[activeStepIndex].actor}
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
              {fluxSteps[activeStepIndex].descripcio}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shrink-0">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Volum Atès</span>
              <span className="text-base font-black text-slate-900 font-mono">
                {fluxSteps[activeStepIndex].metriques.expedients} exp.
              </span>
            </div>
            <div className="border-l border-slate-200 pl-3">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Eficiència</span>
              <span className="text-base font-black text-emerald-600 font-mono">
                {fluxSteps[activeStepIndex].metriques.percentatge}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* TAULA DE GESTIÓ I RENDIMENT PER CENTRES SANITARIS */}
      <GlassCard className="p-4 sm:p-5 bg-white/95 border-slate-200">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Taula de Rendiment i Estoc per Centre Sanitari
              </h3>
              <p className="text-[10px] text-slate-500">
                Estat del catàleg i ràtio de compliment del compromís de servei territorial
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-600">5 Centres Principals</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                <th className="py-2.5 px-3">Centre Sanitari (CAP)</th>
                <th className="py-2.5 px-3">Taxa d'Adhesió</th>
                <th className="py-2.5 px-3">Estoc Disponible</th>
                <th className="py-2.5 px-3">Temps Resolució</th>
                <th className="py-2.5 px-3 text-right">Estat Global</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {centresMetriques.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{c.nom}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{c.adhesio}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {c.estoc} unitats
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">{c.resolucio}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.estat === 'EXCEL·LENT'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : c.estat === 'BON_ESTAT'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {c.estat}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
