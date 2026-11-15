'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Bot,
  Activity,
  Users,
  Building2,
  Server,
  Lock,
  Layers,
  ArrowRight,
  Sparkles,
  Zap,
  Grid,
  CheckCircle2,
  Globe,
  FileText,
  Share2,
  Boxes,
  Download,
  KeyRound,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import {
  RadialAuraBackground,
  GlassCard,
  GlassButton,
  GlassBadge,
  GlassHeader,
  GlassModal,
  GatewayLauncher,
  AppDefinition,
  SensitiveActionAuthModal
} from '@bancactiu/ui-glass';
import { sharedDb } from '@bancactiu/db';
import { resolveAppTargetUrl, isProductionEnvironment } from '@/lib/navigation';
import { SuperAdminStressAndSecurityLabWorkspace } from '@/components/workspaces/SuperAdminStressAndSecurityLabWorkspace';
import { SuperAdminAiAgentWorkspace } from '@/components/workspaces/SuperAdminAiAgentWorkspace';
import { GerenciaOnboardingWorkspace } from '@/components/workspaces/GerenciaOnboardingWorkspace';
import { SuperAdminRolesAndServicesWorkspace } from '@/components/workspaces/SuperAdminRolesAndServicesWorkspace';
import { SuperAdminInteroperabilityWorkspace } from '@/components/workspaces/SuperAdminInteroperabilityWorkspace';
import { KenzoAssistant } from '@/components/kenzo/KenzoAssistant';

interface BancActiuNexusClientProps {
  initialUser?: {
    dni?: string;
    name?: string;
    role?: string;
    roleLabel?: string;
    institution?: string;
  } | null;
}

export default function BancActiuNexusClient({ initialUser }: BancActiuNexusClientProps) {
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [activeRole, setActiveRole] = useState(initialUser?.role || 'SUPERADMIN');

  // Re-autenticació sensible per a rols d'alt nivell (Superadmin, Gerència, Direcció)
  const [authModalConfig, setAuthModalConfig] = useState<{
    isOpen: boolean;
    actionTitle: string;
    actionDescription: string;
    actionSeverity: 'critical' | 'high' | 'warning';
    onAuthorized: (data?: any) => void;
  }>({
    isOpen: false,
    actionTitle: '',
    actionDescription: '',
    actionSeverity: 'critical',
    onAuthorized: () => {},
  });

  const [notificationToast, setNotificationToast] = useState<{
    visible: boolean;
    title: string;
    message: string;
  } | null>(null);

  const showToast = (title: string, message: string) => {
    setNotificationToast({ visible: true, title, message });
    setTimeout(() => setNotificationToast(null), 5000);
  };

  const isCriticalRole =
    activeRole === 'SUPERADMIN' ||
    activeRole === 'GERENCIA' ||
    activeRole === 'DIRECCIO' ||
    initialUser?.role === 'SUPERADMIN';

  const requestSensitiveAction = (
    actionTitle: string,
    actionDescription: string,
    actionSeverity: 'critical' | 'high' | 'warning',
    onAuthorized: (data?: any) => void
  ) => {
    if (isCriticalRole) {
      setAuthModalConfig({
        isOpen: true,
        actionTitle,
        actionDescription,
        actionSeverity,
        onAuthorized: (data) => {
          showToast(
            'Acció Autoritzada (ENS Nivell Alt)',
            `Autorització confirmada per [${actionTitle}]. Audit ID: ${data?.auditId || 'ENS-AUDIT'}`
          );
          onAuthorized(data);
        },
      });
    } else {
      onAuthorized();
    }
  };

  const isSuperAdmin52622304Y = initialUser?.dni === '52622304Y' || (initialUser?.role === 'SUPERADMIN' && (!initialUser?.dni || initialUser.dni === '52622304Y'));

  const handleNavigateModule = (appId: string, defaultPort: number) => {
    const targetUrl = resolveAppTargetUrl(appId, defaultPort);
    window.location.href = targetUrl;
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // fallback
    }
    document.cookie = 'bancactiu_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.href = '/login';
  };

  const handleAppSelect = (app: AppDefinition) => {
    if (app.id === 'bancactiu-nexus') {
      setIsLauncherOpen(false);
      return;
    }
    // Resolució intel·ligent d'URL: Localhost amb ports vs Vercel Cloud amb rutes relatives/dominis
    const targetUrl = resolveAppTargetUrl(app.id, app.port);
    window.location.href = targetUrl;
  };

  return (
    <RadialAuraBackground variant="nexus" className="min-h-screen w-full flex flex-col overflow-y-auto">
      {/* 1. Barra Superior Exclusiva de Superadministrador (DNI 52622304Y) */}
      {isSuperAdmin52622304Y && (
        <aside
          aria-label="Barra de Control SuperAdministrador"
          className="sticky top-0 z-50 w-full border-b border-purple-500/30 bg-slate-950/85 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.6)]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
            {/* Esquerra: Identitat SuperAdmin DNI 52622304Y */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-lg border border-white/20">
                <Shield className="w-4 h-4 text-purple-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-tight text-white uppercase">
                    Consola Exclusiva SuperAdmin
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    DNI: 52622304Y
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{initialUser?.name || "Mireia Valls"} · Governança i Control Total Catalunya</span>
                </p>
              </div>
            </div>

            {/* Centre: Accions Ràpides Exclusives amb Re-Autenticació */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Botó 1: Gestió d'Usuaris i Rols */}
              <button
                type="button"
                onClick={() => {
                  if (activeWorkspace === 'roles-services') {
                    setActiveWorkspace(null);
                  } else {
                    requestSensitiveAction(
                      "Concessió i Modificació de Rols RBAC",
                      "Assignació i revocació de privilegis a administratius, serveis i entitats veïnals sota directrius ENS Nivell Alt.",
                      "critical",
                      () => setActiveWorkspace('roles-services')
                    );
                  }
                }}
                title="Assignar perfils a administratius i entitats veïnals (Requereix Doble Verificació)"
                className={`group px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all flex items-center gap-1.5 shadow-sm border ${
                  activeWorkspace === 'roles-services'
                    ? 'bg-purple-600/40 border-purple-400 shadow-purple-500/20'
                    : 'bg-slate-900/80 hover:bg-purple-900/30 border-white/10 hover:border-purple-400/40'
                }`}
              >
                <Users size={14} className="text-purple-400 group-hover:scale-110 transition-transform" />
                <span>Gestió d'Usuaris i Rols</span>
              </button>

              {/* Botó 2: Auditoria Zero-Trust */}
              <button
                type="button"
                onClick={() => {
                  if (activeWorkspace === 'security-lab') {
                    setActiveWorkspace(null);
                  } else {
                    requestSensitiveAction(
                      "Auditoria Forense Zero-Trust & Scan ENS",
                      "Accés a mètriques d'auditoria immutable, escàner de seguretat en temps real i laboratoris d'estrès.",
                      "critical",
                      () => setActiveWorkspace('security-lab')
                    );
                  }
                }}
                title="Estat de ciberseguretat militar i escàner de vulnerabilitats ENS (Requereix Doble Verificació)"
                className={`group px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all flex items-center gap-1.5 shadow-sm border ${
                  activeWorkspace === 'security-lab'
                    ? 'bg-cyan-600/40 border-cyan-400 shadow-cyan-500/20'
                    : 'bg-slate-900/80 hover:bg-cyan-900/30 border-white/10 hover:border-cyan-400/40'
                }`}
              >
                <Lock size={14} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Auditoria Zero-Trust</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">ENS Alt</span>
              </button>

              {/* Botó 3: Exportació Massiva de Dades Protegides */}
              <button
                type="button"
                onClick={() => {
                  requestSensitiveAction(
                    "Exportació Massiva de Dades Protegides (RGPD/ENS)",
                    "Extracció i descàrrega xifrada del registre d'auditoria forense i expedients d'ajudes tècniques.",
                    "critical",
                    (data) => {
                      showToast(
                        "Exportació Forense Autoritzada",
                        `Extracció completada amb èxit sota protocols RGPD i ENS. Ref: ${data?.auditId || 'EXP-RGPD-2026'}`
                      );
                    }
                  );
                }}
                title="Exportació de dades sensibles protegida per doble verificació"
                className="group px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all flex items-center gap-1.5 shadow-sm border bg-slate-900/80 hover:bg-emerald-900/30 border-white/10 hover:border-emerald-400/40"
              >
                <Download size={14} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Exportació Protegida</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">2FA</span>
              </button>

              {/* Botó 3: Gestió de Xarxa i Préstecs (Social + Operatiu) */}
              <div className="flex items-center gap-1 bg-slate-900/85 p-0.5 rounded-xl border border-white/10 shadow-sm">
                <button
                  type="button"
                  onClick={() => handleNavigateModule('bancactiu-social', 3003)}
                  title="Enllaç directe al mòdul Social (Banc del Temps i Xarxa Ciutadana)"
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-200 hover:text-white hover:bg-rose-600/30 transition-all flex items-center gap-1"
                >
                  <Share2 size={13} className="text-rose-400" />
                  <span>Xarxa Social</span>
                </button>
                <span className="text-white/20">|</span>
                <button
                  type="button"
                  onClick={() => handleNavigateModule('bancactiu-operatiu', 3004)}
                  title="Enllaç directe al mòdul Operatiu (Logística de Préstecs i Ortopèdia)"
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-200 hover:text-white hover:bg-blue-600/30 transition-all flex items-center gap-1"
                >
                  <Boxes size={13} className="text-blue-400" />
                  <span>Gestió de Préstecs</span>
                </button>
              </div>
            </div>

            {/* Dreta: Accés ràpid Manuals i Estat */}
            <div className="flex items-center gap-2">
              <Link
                href="/docs"
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-cyan-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1.5"
              >
                <FileText size={13} className="text-cyan-400" />
                <span>Manuals & PDFs</span>
              </Link>
            </div>
          </div>
        </aside>
      )}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-between">
        {/* Capçalera institucional Glassmorphism amb acció de Tancar Sessió */}
        <GlassHeader
          appName="BancActiu Nexus (Consola SuperAdmin)"
          badgeText="SuperAdmin · Màxima Seguretat"
          badgeVariant="purple"
          userNom={initialUser?.name || "Mireia Valls (SuperAdmin GAPIC)"}
          userRol={initialUser?.roleLabel || "Nivell 5 · Control Total Catalunya"}
          onOpenLauncher={() => setIsLauncherOpen(true)}
          onLogout={handleLogout}
        />

        {/* Zona de Treball Dinàmica o Launchpad */}
        {!activeWorkspace ? (
          <main className="flex-1 my-4 space-y-6">
            {/* Banner de Benvinguda i Ecosistema 2.0 */}
            <GlassCard variant="glow" glowColor="purple" className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Panell Central de Comandament BancActiu Nexus
                    </h2>
                    <GlassBadge variant="emerald">Sessió Verificada</GlassBadge>
                  </div>
                  <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                    Benvingut al nucli de governança institucional. Des d'aquest espai tens accés a l'auditoria forense,
                    a l'alta descentralitzada de centres sanitaris, a la simulació de càrrega massiva (1-3 anys a escala Catalunya)
                    i a la consola de l'Enginyer Agent IA autònom.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <Link href="/docs">
                    <GlassButton
                      variant="primary"
                      icon={<FileText size={16} />}
                    >
                      Manuals & PDFs Executius
                    </GlassButton>
                  </Link>
                  <GlassButton
                    variant="primary"
                    onClick={() =>
                      requestSensitiveAction(
                        "Stress & Security Lab (Escàner ENS)",
                        "Simulació de concurrència d'alta escala (250k ciutadans) i escaneig de vulnerabilitats.",
                        "critical",
                        () => setActiveWorkspace('security-lab')
                      )
                    }
                    icon={<Activity size={16} />}
                  >
                    Stress & Security Lab
                  </GlassButton>
                  <GlassButton
                    variant="secondary"
                    onClick={() =>
                      requestSensitiveAction(
                        "Consola Enginyer Agent IA (Modificació Codi)",
                        "Modificacions a demanda del codi font amb generació de diff i auditoria forense.",
                        "critical",
                        () => setActiveWorkspace('ai-agent')
                      )
                    }
                    icon={<Bot size={16} />}
                  >
                    Agent IA Codi
                  </GlassButton>
                  <GlassButton
                    variant="primary"
                    onClick={() =>
                      requestSensitiveAction(
                        "Pasarel·les d'Interoperabilitat AOC",
                        "Consultes xifrades a Padró, Dependència i Història Clínica Compartida.",
                        "high",
                        () => setActiveWorkspace('interoperability')
                      )
                    }
                    icon={<Globe size={16} />}
                  >
                    Pasarel·les AOC
                  </GlassButton>
                </div>
              </div>
            </GlassCard>

            {/* Quadrícula de 4 Mòduls SuperAdmin Avançats amb Doble Verificació */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Mòdul 1: Alta Descentralitzada de Centres */}
              <GlassCard
                variant="interactive"
                glowColor="purple"
                className="p-5 flex flex-col justify-between"
                onClick={() =>
                  requestSensitiveAction(
                    "Alta Descentralitzada de Centres Sanitaris",
                    "Configuració i alta jeràrquica de CAPs, hospitals i entitats per cada gerència territorial.",
                    "high",
                    () => setActiveWorkspace('centres-onboarding')
                  )
                }
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white mb-3 shadow-lg border border-white/20">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Alta Descentralitzada de Centres
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    Configuració i alta jeràrquica de CAPs, hospitals i entitats per cada gerència territorial.
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-purple-300 pt-2 border-t border-white/10">
                  <span>Gestionar Centres (2FA)</span>
                  <ArrowRight size={14} />
                </div>
              </GlassCard>

              {/* Mòdul 2: Rols, Serveis i Llocs de Treball */}
              <GlassCard
                variant="interactive"
                glowColor="purple"
                className="p-5 flex flex-col justify-between"
                onClick={() =>
                  requestSensitiveAction(
                    "Superadministració de Rols i Llocs de Treball",
                    "Superadministració del catàleg de serveis, rols RBAC i estructura de llocs de treball.",
                    "critical",
                    () => setActiveWorkspace('roles-services')
                  )
                }
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white mb-3 shadow-lg border border-white/20">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Rols, Serveis i Puestos
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    Superadministració del catàleg de serveis, rols RBAC i estructura de llocs de treball.
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-indigo-300 pt-2 border-t border-white/10">
                  <span>Configurar Rols (2FA)</span>
                  <ArrowRight size={14} />
                </div>
              </GlassCard>

              {/* Mòdul 3: Stress & Security Lab */}
              <GlassCard
                variant="interactive"
                glowColor="purple"
                className="p-5 flex flex-col justify-between"
                onClick={() =>
                  requestSensitiveAction(
                    "Stress & Security Lab (Escàner ENS)",
                    "Simulació de concurrència (1-3 anys Catalunya) i escaneig de vulnerabilitats en temps real.",
                    "critical",
                    () => setActiveWorkspace('security-lab')
                  )
                }
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 via-amber-600 to-emerald-600 flex items-center justify-center text-white mb-3 shadow-lg border border-white/20">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Stress & Security Lab
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    Simulació de concurrència (1-3 anys Catalunya) i escaneig de vulnerabilitats en temps real (Score 99%).
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-emerald-300 pt-2 border-t border-white/10">
                  <span>Obrir Laboratori (2FA)</span>
                  <ArrowRight size={14} />
                </div>
              </GlassCard>

              {/* Mòdul 4: Consola Agent IA de Codi */}
              <GlassCard
                variant="interactive"
                glowColor="purple"
                className="p-5 flex flex-col justify-between"
                onClick={() =>
                  requestSensitiveAction(
                    "Consola Enginyer Agent IA (Modificació Codi)",
                    "Modificacions a demanda mitjançant prompts en llenguatge natural amb generació de diff i auditoria.",
                    "critical",
                    () => setActiveWorkspace('ai-agent')
                  )
                }
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white mb-3 shadow-lg border border-white/20">
                    <Bot className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Consola Enginyer Agent IA
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    Modificacions a demanda mitjançant prompts en llenguatge natural amb generació de diff i auditoria.
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-cyan-300 pt-2 border-t border-white/10">
                  <span>Executar Agent (2FA)</span>
                  <ArrowRight size={14} />
                </div>
              </GlassCard>
            </div>

            {/* Launcher Embolicat per saltar a altres aplicacions */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Grid size={18} className="text-cyan-400" />
                  Ecosistema de Micro-Aplicacions BancActiu 2.0
                </h3>
                <span className="text-xs text-slate-400">
                  Base de Dades Compartida (@bancactiu/db)
                </span>
              </div>
              <GatewayLauncher
                currentAppId="bancactiu-nexus"
                currentUserRole={activeRole}
                onChangeRole={setActiveRole}
                onSelectApp={handleAppSelect}
              />
            </div>
          </main>
        ) : (
          /* Sub-workspaces estancs */
          <main className="flex-1 my-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={() => setActiveWorkspace(null)}
              >
                ← Tornar al Tauler Principal
              </GlassButton>
              <GlassBadge variant="purple">
                Espai de Treball Actiu: {activeWorkspace}
              </GlassBadge>
            </div>

            {activeWorkspace === 'interoperability' && (
              <SuperAdminInteroperabilityWorkspace onClose={() => setActiveWorkspace(null)} />
            )}

            {activeWorkspace === 'security-lab' && (
              <SuperAdminStressAndSecurityLabWorkspace onClose={() => setActiveWorkspace(null)} />
            )}

            {activeWorkspace === 'ai-agent' && (
              <SuperAdminAiAgentWorkspace onClose={() => setActiveWorkspace(null)} />
            )}

            {activeWorkspace === 'centres-onboarding' && (
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/10 backdrop-blur-xl">
                <GerenciaOnboardingWorkspace
                  onClose={() => setActiveWorkspace(null)}
                />
              </div>
            )}

            {activeWorkspace === 'roles-services' && (
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/10 backdrop-blur-xl">
                <SuperAdminRolesAndServicesWorkspace
                  onClose={() => setActiveWorkspace(null)}
                  onShowToast={(type, title, msg) => alert(`${title}: ${msg}`)}
                />
              </div>
            )}
          </main>
        )}

        {/* Modal Flotant del Gateway Launcher */}
        <GlassModal
          isOpen={isLauncherOpen}
          onClose={() => setIsLauncherOpen(false)}
          title="Navegador de Micro-Aplicacions BancActiu 2.0"
          maxWidth="4xl"
        >
          <GatewayLauncher
            currentAppId="bancactiu-nexus"
            currentUserRole={activeRole}
            onChangeRole={setActiveRole}
            onSelectApp={handleAppSelect}
          />
        </GlassModal>

        {/* Peu de pàgina institucional */}
        <footer className="mt-6 pt-3 border-t border-white/10 text-center text-xs text-slate-500">
          BancActiu Nexus 2.0 &middot; Sistema de Superadministració i Seguretat Perimetral &middot; Generalitat de Catalunya i Ajuntament de Cornellà
        </footer>
        {/* Assistent Flotant Kenzo AI */}
        <KenzoAssistant />

        {/* Notificació Toast de Seguretat ENS Nivell Alt */}
        {notificationToast && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-950/95 border border-emerald-500/50 shadow-2xl backdrop-blur-2xl flex items-center gap-3 animate-fadeIn text-white max-w-md">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-emerald-300">{notificationToast.title}</h4>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{notificationToast.message}</p>
            </div>
          </div>
        )}

        {/* Modal de Re-Autenticació per a Rols Crítics (ENS Nivell Alt) */}
        <SensitiveActionAuthModal
          isOpen={authModalConfig.isOpen}
          onClose={() => setAuthModalConfig(prev => ({ ...prev, isOpen: false }))}
          onSuccess={(data) => {
            authModalConfig.onAuthorized(data);
          }}
          actionTitle={authModalConfig.actionTitle}
          actionDescription={authModalConfig.actionDescription}
          actionSeverity={authModalConfig.actionSeverity}
          currentUserDni={initialUser?.dni || '52622304Y'}
          currentUserName={initialUser?.name || 'Mireia Valls (SuperAdmin)'}
          currentUserRole={activeRole}
          moduleName="bancactiu-nexus"
        />
      </div>
    </RadialAuraBackground>
  );
}
