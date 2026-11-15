'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  QrCode,
  ScanLine,
  UserPlus,
  PackageCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  HardDrive,
  ArrowLeft
} from 'lucide-react';
import {
  RadialAuraBackground,
  GlassCard,
  GlassButton,
  GlassBadge,
  GlassHeader,
  GlassModal,
  GatewayLauncher,
  AppDefinition
} from '@bancactiu/ui-glass';
import { resolveAppTargetUrl } from '@/lib/navigation';

export default function BancActiuOperatiuUnifiedPage() {
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [scanSimulated, setScanSimulated] = useState(false);

  const [prestecsLlista, setPrestecsLlista] = useState([
    { id: 'op-01', expedient: 'BA-2026-00891', ciutada: 'Antònia Riera Gómez', material: 'Cadira de Rodes Autopropulsable Alumini', codiQR: 'QR-CR-001', estat: 'LLIURAT_ACTIU', retorn: '2026-12-01' },
    { id: 'op-02', expedient: 'BA-2026-00892', ciutada: 'Joan Puigdemunt Vidal', material: 'Caminador 4 Rodes amb Fre i Seient', codiQR: 'QR-CAM-002', estat: 'LLIURAT_ACTIU', retorn: '2026-12-05' },
    { id: 'op-03', expedient: 'BA-2026-00894', ciutada: 'Josep Maria Almirall', material: 'Parell de Bastons Anglesos Antilliscants', codiQR: 'QR-BST-003', estat: 'RETORNAT', retorn: '2026-11-10' },
  ]);

  const handleSimulateScan = () => {
    setScanSimulated(true);
    setTimeout(() => {
      alert('Escàner QR/Codi de Barres: Material detectat correctament [CADIRA DE RODES CR-LUG-01]. Estat: DISPONIBLE.');
      setScanSimulated(false);
    }, 600);
  };

  const handleAppSelect = (app: AppDefinition) => {
    if (app.id === 'bancactiu-operatiu-1.0' || app.id === 'bancactiu-operatiu') {
      setIsLauncherOpen(false);
      return;
    }
    window.location.href = resolveAppTargetUrl(app.id, app.port);
  };

  const filteredPrestecs = prestecsLlista.filter(p =>
    p.ciutada.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.expedient.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <RadialAuraBackground variant="operatiu">
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-between min-h-screen">
        <div>
          {/* Barra superior de retorn al Gateway Nexus */}
          <div className="flex items-center justify-between mb-3 text-xs">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 transition-all font-semibold"
            >
              <ArrowLeft size={14} />
              <span>← Tornar a BancActiu Nexus</span>
            </Link>
            <GlassBadge variant="blue" pulse>Mòdul Operatiu Actiu (Vercel Cloud)</GlassBadge>
          </div>

          <GlassHeader
            appName="BancActiu Operatiu (Taulell UAC & Logística)"
            badgeText="Magatzem Central &middot; Lliuraments"
            badgeVariant="blue"
            userNom="Marc Rovira (Tècnic Operatiu Taulell)"
            userRol="Unitat d'Atenció Ciutadana · Superadmin DNI 52622304Y"
            onOpenLauncher={() => setIsLauncherOpen(true)}
          />

          <main className="flex-1 my-6 space-y-6">
            <GlassCard variant="glow" glowColor="cyan" className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ScanLine className="w-6 h-6 text-cyan-400" />
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Control Diari de Lliuraments, Retorns i Traçabilitat d'Estoc
                    </h2>
                    <GlassBadge variant="blue">Taulell Central</GlassBadge>
                  </div>
                  <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                    Mòdul d'alta freqüència per al registre de préstecs presencials mitjançant idCAT Mòbil,
                    impressió d'etiquetes QR/Barres per a cada peça d'ajuda tècnica i control de devolucions.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <GlassButton
                    variant="primary"
                    onClick={handleSimulateScan}
                    icon={<QrCode size={16} />}
                  >
                    {scanSimulated ? 'Escanejant...' : 'Escriure / Escanejar QR'}
                  </GlassButton>
                  <GlassButton variant="secondary" icon={<UserPlus size={16} />}>
                    Nou Préstec Ciutadà
                  </GlassButton>
                </div>
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GlassCard className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                    <PackageCheck size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Materials Disponibles</div>
                    <div className="text-xl font-black text-white">418 Unitats</div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-300">Cadires, caminadors, crosses, llits articulats.</div>
              </GlassCard>

              <GlassCard className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Préstecs Actius</div>
                    <div className="text-xl font-black text-white">1.240 Ajudes</div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-300">Temps mitjà de préstec comunitari: 42 dies.</div>
              </GlassCard>

              <GlassCard className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
                    <HardDrive size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Taxa de Reutilització</div>
                    <div className="text-xl font-black text-white">94.2%</div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-300">Materials recondicionats per Creu Roja.</div>
              </GlassCard>
            </div>

            <GlassCard className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <LayoutDashboard size={18} className="text-cyan-400" />
                  Préstecs Vigents i Estat de Retorn
                </h3>
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cercar per pacient, CIP o expedient..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 text-slate-400 text-[11px] uppercase">
                    <tr>
                      <th className="p-3">Expedient</th>
                      <th className="p-3">Ciutadà / Beneficiari</th>
                      <th className="p-3">Material Lliurat</th>
                      <th className="p-3">Identificador QR</th>
                      <th className="p-3">Data Prevista Retorn</th>
                      <th className="p-3">Estat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-slate-200">
                    {filteredPrestecs.map((p) => (
                      <tr key={p.id} className="hover:bg-white/5 transition">
                        <td className="p-3 font-mono font-bold text-cyan-300">{p.expedient}</td>
                        <td className="p-3 font-semibold text-white">{p.ciutada}</td>
                        <td className="p-3 text-slate-300">{p.material}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-400">{p.codiQR}</td>
                        <td className="p-3 text-slate-300">{p.retorn}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            p.estat === 'LLIURAT_ACTIU'
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}>
                            {p.estat === 'LLIURAT_ACTIU' ? 'Lliurat i Actiu' : 'Retornat a Magatzem'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </main>
        </div>

        <GlassModal
          isOpen={isLauncherOpen}
          onClose={() => setIsLauncherOpen(false)}
          title="Navegador de Micro-Aplicacions BancActiu 2.0"
          maxWidth="4xl"
        >
          <GatewayLauncher
            currentAppId="bancactiu-operatiu-1.0"
            onSelectApp={handleAppSelect}
          />
        </GlassModal>

        <footer className="mt-8 pt-4 border-t border-white/10 text-center text-xs text-slate-500">
          BancActiu Operatiu 1.0 &middot; UAC &middot; Magatzem Logístic Cornellà &middot; Monorepo BancActiu 2.0
        </footer>
      </div>
    </RadialAuraBackground>
  );
}
