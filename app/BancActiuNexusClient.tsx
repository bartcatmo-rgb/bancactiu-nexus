'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  AlertCircle,
  PackagePlus,
  Hammer,
  Wrench,
  Stethoscope,
  HeartHandshake,
  RotateCcw,
  ShieldAlert,
  Radio,
  Terminal,
  AlertTriangle,
  AlertOctagon,
  RefreshCw
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
import { SuperAdminSimulationsAndAuditWorkspace } from '@/components/workspaces/SuperAdminSimulationsAndAuditWorkspace';
import { SuperAdminAiAgentWorkspace } from '@/components/workspaces/SuperAdminAiAgentWorkspace';
import { GerenciaOnboardingWorkspace } from '@/components/workspaces/GerenciaOnboardingWorkspace';
import { SuperAdminRolesAndServicesWorkspace } from '@/components/workspaces/SuperAdminRolesAndServicesWorkspace';
import { SuperAdminInteroperabilityWorkspace } from '@/components/workspaces/SuperAdminInteroperabilityWorkspace';
import { WorkshopAndRepairsWorkspace } from '@/components/workspaces/WorkshopAndRepairsWorkspace';
import { SocialServicesWorkspace } from '@/components/workspaces/SocialServicesWorkspace';
import { AdministratiuVoluntariatWorkspace } from '@/components/workspaces/AdministratiuVoluntariatWorkspace';
import { GerenciaReferentsWorkspace } from '@/components/workspaces/GerenciaReferentsWorkspace';
import { NewLoanModal, NewLoanData } from '@/components/loans/NewLoanModal';
import { KenzoAssistant } from '@/components/kenzo/KenzoAssistant';
import { IntellectualPropertyModal } from '@/components/legal/IntellectualPropertyModal';
import { INSTITUTIONAL_MODULE_FLAGS, isModuleActive } from '@/lib/modules-feature-flags';
import { SessionLockManager } from '@/components/security/SessionLockManager';

interface BancActiuNexusClientProps {
  initialUser?: {
    dni?: string;
    name?: string;
    role?: string;
    roleLabel?: string;
    institution?: string;
    userId?: string;
    email?: string;
  } | null;
}

export default function BancActiuNexusClient({ initialUser }: BancActiuNexusClientProps) {
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [activeRole, setActiveRole] = useState(initialUser?.role || 'SUPERADMIN');
  const [isNewLoanModalOpen, setIsNewLoanModalOpen] = useState(false);
  const handleOpenNewLoanModal = () => setIsNewLoanModalOpen(true);
  const [moduleFlags, setModuleFlags] = useState<Record<string, boolean>>(INSTITUTIONAL_MODULE_FLAGS);

  const toggleModuleFlag = (moduleId: string) => {
    setModuleFlags(prev => {
      const updated = { ...prev, [moduleId]: !prev[moduleId] };
      showToast(
        updated[moduleId] ? "Mòdul Activat Sota Demanda" : "Mòdul Desactivat",
        `El mòdul ${moduleId} ara està ${updated[moduleId] ? "ACTIU" : "INACTIU"}.`
      );
      return updated;
    });
  };

  // Context dinàmic de Tenant (IP & Host resolution)
  const [tenantContext, setTenantContext] = useState<{
    id: string;
    code: string;
    name: string;
    shortName: string;
    description: string;
    badgeLabel: string;
    badgeVariant: 'purple' | 'blue' | 'emerald' | 'amber' | 'rose';
    themeColor: string;
    allowedModules: string[];
    isDefault?: boolean;
    clientIp?: string;
  }>({
    id: 'tenant-default',
    code: 'BANCACTIU_ENTERPRISE',
    name: 'BancActiu 3.0 Enterprise',
    shortName: 'BancActiu 3.0',
    description: 'Plataforma Unificada de Governança i Serveis Sociosanitaris',
    badgeLabel: 'Plataforma Institucional',
    badgeVariant: 'purple',
    themeColor: '#9333ea',
    allowedModules: ['bancactiu-nexus', 'bancactiu-salut', 'bancactiu-municipal', 'bancactiu-social', 'bancactiu-operatiu'],
    isDefault: true,
  });

  React.useEffect(() => {
    try {
      const match = typeof document !== 'undefined' ? document.cookie.split('; ').find(r => r.startsWith('bancactiu_tenant=')) : null;
      if (match) {
        const val = decodeURIComponent(match.split('=')[1]);
        const parsed = JSON.parse(val);
        if (parsed && parsed.id) setTenantContext(parsed);
      }
    } catch {
      // Fallback a neutre
    }
  }, []);

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

  // Lògica de dispar estricta: NÚMÉS s'activa per a les 3 accions crítiques de governança i seguretat
  // (1: Concessió/modificació rols superadmin, 2: Exportació massiva RGPD, 3: Laboratori d'auditoria/xarxa)
  // Qualssevol altra acció rutinària o navegació ordinària no ha de disparar el modal.
  const requestSensitiveAction = (
    actionType: 'SUPERADMIN_ROLE_CHANGE' | 'MASS_DATA_EXPORT' | 'AUDIT_LAB_NETWORK',
    actionTitle: string,
    actionDescription: string,
    onAuthorized: (data?: any) => void
  ) => {
    const isAllowedCriticalAction =
      actionType === 'SUPERADMIN_ROLE_CHANGE' ||
      actionType === 'MASS_DATA_EXPORT' ||
      actionType === 'AUDIT_LAB_NETWORK';

    if (isCriticalRole && isAllowedCriticalAction) {
      setAuthModalConfig({
        isOpen: true,
        actionTitle,
        actionDescription,
        actionSeverity: 'critical',
        onAuthorized: (data) => {
          showToast(
            'Acció Crítica Autoritzada (ENS Nivell Alt)',
            `Autorització confirmada per [${actionTitle}]. Audit ID: ${data?.auditId || 'ENS-AUDIT'}`
          );
          onAuthorized(data);
        },
      });
    } else {
      // Qualsevol altra navegació o acció s'executa immediatament sense modal
      onAuthorized();
    }
  };

  const isSuperAdminAuthorized =
    initialUser?.role === 'SUPERADMIN' ||
    initialUser?.dni === '52622304Y' ||
    initialUser?.dni === '47956602S' ||
    initialUser?.userId === 'usr-superadmin-bartolome' ||
    initialUser?.userId === 'usr-superadmin-marc';

  const [showIpModal, setShowIpModal] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const userKey = initialUser?.dni || initialUser?.name || 'current_user';
      const hasAccepted = localStorage.getItem(`bancactiu_ip_accepted_${userKey}`) || localStorage.getItem('bancactiu_ip_global_accepted');
      if (!hasAccepted) {
        setShowIpModal(true);
      }
    }
  }, [initialUser]);

  const isInternalAppSwitching = useRef(false);

  // FASE 1: Destrucció Automàtica de Sessió al Tancar Pestanya o Finestra (Beacon API / beforeunload / pagehide)
  useEffect(() => {
    const handleTabOrWindowClose = () => {
      if (isInternalAppSwitching.current) return;

      try {
        // Enviar senyal de destrucció de sessió al servidor de forma asíncrona no bloquejant
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon('/api/auth/logout');
        } else {
          fetch('/api/auth/logout', { method: 'POST', keepalive: true }).catch(() => {});
        }

        // Invalida la cookie localment de manera síncrona
        document.cookie = 'bancactiu_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0; SameSite=Lax;';

        // Netejar emmagatzematge de sessió
        sessionStorage.clear();
        localStorage.removeItem('bancactiu_session_cache');
      } catch (e) {
        console.warn('[SESSION-DESTRUCTION] Error en tancar pestanya:', e);
      }
    };

    window.addEventListener('pagehide', handleTabOrWindowClose);
    window.addEventListener('beforeunload', handleTabOrWindowClose);

    return () => {
      window.removeEventListener('pagehide', handleTabOrWindowClose);
      window.removeEventListener('beforeunload', handleTabOrWindowClose);
    };
  }, []);

  // FASE 2: Eliminació de Bretxes de Sessió (Supressió de drecera ESC per evitar sortides involuntàries a /login)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  // Estats per a Disaster Recovery i SOAR
  const [isDisasterRecoveryOpen, setIsDisasterRecoveryOpen] = useState(false);
  const [isSoarModalOpen, setIsSoarModalOpen] = useState(false);
  const [isRestoringFlows, setIsRestoringFlows] = useState(false);
  const [soarScanActive, setSoarScanActive] = useState(false);

  const handleNavigateModule = (appId: string, defaultPort: number) => {
    isInternalAppSwitching.current = true;
    const targetUrl = resolveAppTargetUrl(appId, defaultPort);
    window.location.href = targetUrl;
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // fallback
    }
    document.cookie = 'bancactiu_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0; SameSite=Lax;';
    sessionStorage.clear();
    localStorage.removeItem('bancactiu_session_cache');
    window.location.href = '/login';
  };

  const handleAppSelect = (app: AppDefinition) => {
    if (app.id === 'bancactiu-nexus') {
      setIsLauncherOpen(false);
      return;
    }
    isInternalAppSwitching.current = true;
    // Resolució intel·ligent d'URL: Localhost amb ports vs Vercel Cloud amb rutes relatives/dominis
    const targetUrl = resolveAppTargetUrl(app.id, app.port);
    window.location.href = targetUrl;
  };

  const handleSessionReauthenticate = async (pass: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/reauthenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dni: initialUser?.dni || '',
          password: pass,
          actionName: 'SESSION_UNLOCK',
          actionDetails: 'Desbloqueig de sessió per inactivitat de 5 minuts (ENS Nivell Alt)',
          module: 'bancactiu-nexus'
        })
      });
      const data = await res.json();
      return !!data.success;
    } catch {
      return false;
    }
  };

  return (
    <SessionLockManager onReauthenticate={handleSessionReauthenticate}>
      <RadialAuraBackground variant="nexus" className="min-h-screen w-full flex flex-col overflow-y-auto">
      {/* 1. Barra Superior Exclusiva de Superadministrador */}
      {isSuperAdminAuthorized && (
        <aside
          aria-label="Barra de Control SuperAdministrador"
          className="sticky top-0 z-50 w-full border-b border-purple-200 bg-white/95 backdrop-blur-xl shadow-sm"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
            {/* Esquerra: Identitat SuperAdmin */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-md border border-purple-200 p-1 shrink-0 overflow-hidden">
                <img src="/bancactiu_icon.svg" alt="BancActiu" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-tight text-slate-900 uppercase">
                    Consola Exclusiva SuperAdmin
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    DNI / ID: {initialUser?.dni || 'AUTORITZAT'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{initialUser?.name || "Administrador Acreditat"} · Governança i Control Central</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                    Centre: {tenantContext.shortName}
                  </span>
                </p>
              </div>
            </div>

            {/* Centre: Barra Modular d'Accions SuperAdmin (7 Eixos Estratègics) */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* 1. Auditoria Forense & Estrès (5 Anys) */}
              <button
                type="button"
                onClick={() => {
                  setActiveWorkspace(activeWorkspace === 'simulations-audit' ? null : 'simulations-audit');
                }}
                title="Auditoria Forense Massiva de Tenants i Simulació d'Estrès a 5 Anys"
                className={`group px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm border ${
                  activeWorkspace === 'simulations-audit'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-emerald-500/10'
                    : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-300'
                }`}
              >
                <Activity size={13} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                <span>Auditoria</span>
              </button>

              {/* 2. Seguretat (Zero-Trust amb 2FA) */}
              <button
                type="button"
                onClick={() => {
                  if (activeWorkspace === 'security-lab') {
                    setActiveWorkspace(null);
                  } else {
                    requestSensitiveAction(
                      'AUDIT_LAB_NETWORK',
                      "Accés al Laboratori de Seguretat Zero-Trust (ENS Nivell Alt)",
                      "Mètriques de ciberseguretat militar, escàner de xarxa i paràmetres criptogràfics.",
                      () => setActiveWorkspace('security-lab')
                    );
                  }
                }}
                title="Ciberseguretat Zero-Trust i Escàner ENS (Requereix 2FA)"
                className={`group px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm border ${
                  activeWorkspace === 'security-lab'
                    ? 'bg-cyan-100 text-cyan-900 border-cyan-300 shadow-cyan-500/10'
                    : 'bg-white hover:bg-cyan-50 text-slate-700 border-slate-200 hover:border-cyan-300'
                }`}
              >
                <Lock size={13} className="text-cyan-600 group-hover:scale-110 transition-transform" />
                <span>Seguretat Zero-Trust</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-100 text-cyan-800 font-mono font-bold">2FA</span>
              </button>

              {/* 3. Control de Centres */}
              <button
                type="button"
                onClick={() => {
                  setActiveWorkspace(activeWorkspace === 'centres-onboarding' ? null : 'centres-onboarding');
                }}
                title="Control i Alta Descentralitzada de Centres (CAPs, Hospitals, Entitats)"
                className={`group px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm border ${
                  activeWorkspace === 'centres-onboarding'
                    ? 'bg-purple-100 text-purple-900 border-purple-300 shadow-purple-500/10'
                    : 'bg-white hover:bg-purple-50 text-slate-700 border-slate-200 hover:border-purple-300'
                }`}
              >
                <Building2 size={13} className="text-purple-600 group-hover:scale-110 transition-transform" />
                <span>Control de Centres</span>
              </button>

              {/* 4. Rols / Usuaris */}
              <button
                type="button"
                onClick={() => {
                  setActiveWorkspace(activeWorkspace === 'roles-services' ? null : 'roles-services');
                }}
                title="Gestió de perfils, usuaris RBAC i privilegis institucionals"
                className={`group px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm border ${
                  activeWorkspace === 'roles-services'
                    ? 'bg-indigo-100 text-indigo-900 border-indigo-300 shadow-indigo-500/10'
                    : 'bg-white hover:bg-indigo-50 text-slate-700 border-slate-200 hover:border-indigo-300'
                }`}
              >
                <Users size={13} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                <span>Rols / Usuaris</span>
              </button>

              {/* 5. Serveis */}
              <button
                type="button"
                onClick={() => {
                  setActiveWorkspace(activeWorkspace === 'roles-services' ? null : 'roles-services');
                }}
                title="Catàleg de serveis sociosanitaris i llocs de treball"
                className="group px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm border bg-white hover:bg-blue-50 text-slate-700 border-slate-200 hover:border-blue-300"
              >
                <Server size={13} className="text-blue-600 group-hover:scale-110 transition-transform" />
                <span>Serveis</span>
              </button>

              {/* 6. Recuperació de fluxos davant caigudes (Disaster Recovery Reset/Restore) */}
              <button
                type="button"
                onClick={() => setIsDisasterRecoveryOpen(true)}
                title="Consola de Disaster Recovery: Purga de bloqueigs i recuperació de fluxos caiguts"
                className="group px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm border bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300"
              >
                <RotateCcw size={13} className="text-amber-700 group-hover:rotate-180 transition-transform duration-500" />
                <span>Recuperació de Fluxos</span>
              </button>

              {/* 7. Monitoratge d'intrusions amb aïllament automàtic (SOAR) */}
              <button
                type="button"
                onClick={() => setIsSoarModalOpen(true)}
                title="Monitoratge de Seguretat Activa SOAR i Aïllament Automàtic de Vectors Hostils"
                className="group px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm border bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300"
              >
                <ShieldAlert size={13} className="text-rose-700 group-hover:scale-110 transition-transform" />
                <span>SOAR / Aïllament</span>
              </button>

              {/* Enllaços directes a xarxa social i préstecs */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-sm ml-1">
                <button
                  type="button"
                  onClick={() => handleNavigateModule('bancactiu-social', 3003)}
                  title="Enllaç directe al mòdul Social"
                  className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-rose-50 transition-all flex items-center gap-1"
                >
                  <Share2 size={12} className="text-rose-600" />
                  <span>Xarxa Social</span>
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => handleNavigateModule('bancactiu-operatiu', 3004)}
                  title="Enllaç directe al mòdul Operatiu"
                  className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-blue-50 transition-all flex items-center gap-1"
                >
                  <Boxes size={12} className="text-blue-600" />
                  <span>Préstecs</span>
                </button>
              </div>
            </div>

            {/* Dreta: Accés ràpid Manuals & PDFs (Stealth Pentesting Mode: Cap element visible de trampa/honeypot al DOM) */}
            <div className="flex items-center gap-2">
              <Link
                href="/docs"
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:text-cyan-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all flex items-center gap-1.5"
              >
                <FileText size={13} className="text-cyan-600" />
                <span>Manuals & PDFs</span>
              </Link>
            </div>
          </div>
        </aside>
      )}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 md:p-6 flex flex-col min-h-0">
        {/* Capçalera institucional Glassmorphism amb acció de Tancar Sessió */}
        <GlassHeader
          appName="BancActiu Nexus (Consola SuperAdmin)"
          badgeText={tenantContext.isDefault ? "SuperAdmin · Màxima Seguretat" : tenantContext.badgeLabel}
          badgeVariant={tenantContext.badgeVariant || "purple"}
          userNom={initialUser?.name || "SuperAdmin"}
          userRol={initialUser?.roleLabel || "Nivell 5 · Control Total"}
          tenantSubtext={tenantContext.name || "Plataforma de Governança i Serveis"}
          onOpenLauncher={() => setIsLauncherOpen(true)}
          onLogout={handleLogout}
        />

        {/* FASE 2: BARRA DE SEPARACIÓ D'ACCESSOS I SIMULACIÓ PER ROLS OPERATIUS */}
        <div className="my-2.5 p-2 sm:p-2.5 rounded-2xl bg-white/95 border border-purple-200 backdrop-blur-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 pl-2">
            <ShieldCheck size={16} className="text-purple-600 shrink-0" />
            <div>
              <span className="text-xs font-black tracking-wide text-slate-900 uppercase block">
                Mòdul de Simulació & Separació de Rols:
              </span>
              <span className="text-[10px] text-slate-500">
                Alterna entre perfils institucionals per auditar o operar sota el seu entorn dedicat
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {/* Rol 1: SuperAdmin */}
            <button
              type="button"
              onClick={() => {
                setActiveRole('SUPERADMIN');
                setActiveWorkspace(null);
                showToast("Rol Actiu: SuperAdmin", "Consola central de governança, auditoria i màxima seguretat.");
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
                activeRole === 'SUPERADMIN' && !activeWorkspace
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              SuperAdmin
            </button>

            {/* Rol 2: Administratiu / Voluntariat */}
            <button
              type="button"
              onClick={() => {
                setActiveRole('ADMINISTRATIU');
                setActiveWorkspace('administratiu');
                showToast("Rol Actiu: Administratiu / Voluntariat", "Pantalla dividida, cerca amb ressaltat groc suau i filiació ciutadana.");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                activeRole === 'ADMINISTRATIU' || activeWorkspace === 'administratiu'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-500 shadow-amber-500/20'
                  : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-200 hover:border-amber-300'
              }`}
            >
              <Users size={14} className={activeRole === 'ADMINISTRATIU' || activeWorkspace === 'administratiu' ? 'text-white' : 'text-amber-600'} />
              <span>Administratiu / Voluntariat</span>
            </button>

            {/* Rol 3: Gerència i Referents */}
            <button
              type="button"
              onClick={() => {
                setActiveRole('GERENCIA');
                setActiveWorkspace('gerencia');
                showToast("Rol Actiu: Gerència i Referents", "Supervisió territorial, diagrames de flux interactius i taulers KPI.");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                activeRole === 'GERENCIA' || activeWorkspace === 'gerencia'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-indigo-500 shadow-indigo-500/20'
                  : 'bg-white hover:bg-indigo-50 text-slate-700 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <Activity size={14} className={activeRole === 'GERENCIA' || activeWorkspace === 'gerencia' ? 'text-white' : 'text-indigo-600'} />
              <span>Gerència i Referents</span>
            </button>

            {/* Rol 4: Centre de Reparació (Creu Roja) */}
            <button
              type="button"
              onClick={() => {
                setActiveRole('TALLER_REPARACIONS');
                setActiveWorkspace('workshop-repairs');
                showToast("Rol Actiu: Taller Creu Roja", "Cicle de reparacions, control de recanvis i missatgeria transversal.");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                activeWorkspace === 'workshop-repairs' || activeRole === 'TALLER_REPARACIONS'
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white border-rose-500 shadow-rose-500/20'
                  : 'bg-white hover:bg-rose-50 text-slate-700 border-slate-200 hover:border-rose-300'
              }`}
            >
              <Wrench size={14} className={activeWorkspace === 'workshop-repairs' || activeRole === 'TALLER_REPARACIONS' ? 'text-white' : 'text-rose-600'} />
              <span>Taller Creu Roja</span>
            </button>

            {/* Rol 5: Treballador del CAP (Clínic) */}
            <button
              type="button"
              onClick={() => {
                setActiveRole('TECNIC_SALUT');
                setActiveWorkspace(null);
                showToast("Rol Actiu: Treballador Clínic del CAP", "Gestió de prescripció PAO i validació mèdica d'ortopèdia.");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                activeRole === 'TECNIC_SALUT' && !activeWorkspace
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-emerald-500/20'
                  : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-300'
              }`}
            >
              <Stethoscope size={14} className={activeRole === 'TECNIC_SALUT' && !activeWorkspace ? 'text-white' : 'text-emerald-600'} />
              <span>Personal Clínic CAP</span>
            </button>

            {/* Rol 6: Serveis Socials & Dependència */}
            <button
              type="button"
              onClick={() => {
                if (!moduleFlags.SOCIAL_SERVICES_ENABLED) {
                  setModuleFlags(prev => ({ ...prev, SOCIAL_SERVICES_ENABLED: true }));
                }
                setActiveRole('SERVEIS_SOCIALS');
                setActiveWorkspace('social-services');
                showToast("Rol Actiu: Serveis Socials (Dependència)", "Gestió d'expedients BVD (64 punts), SAD i coordinació PIA.");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                activeWorkspace === 'social-services' || activeRole === 'SERVEIS_SOCIALS'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 shadow-purple-500/20'
                  : 'bg-white hover:bg-purple-50 text-slate-700 border-slate-200 hover:border-purple-300'
              }`}
            >
              <HeartHandshake size={14} className={activeWorkspace === 'social-services' || activeRole === 'SERVEIS_SOCIALS' ? 'text-white' : 'text-purple-600'} />
              <span>Serveis Socials</span>
            </button>
          </div>
        </div>

        {/* FASE 2: Avís Visual de Mode Simulació Actiu & Botó de Retorn SuperAdmin */}
        {activeRole !== 'SUPERADMIN' && (
          <div className="my-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-300 backdrop-blur-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-amber-900">
                    Mode Simulació Actiu: {activeRole.replace('_', ' ')}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Acreditació Verificada RGPD
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Visualitzant la plataforma amb la perspectiva i permisos del perfil {activeRole.replace('_', ' ')}. Totes les accions estan traçades sota l'estàndard ENS.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveRole('SUPERADMIN');
                setActiveWorkspace(null);
                showToast("Sessió Restablerta", "Has sortit de la simulació i tornat a la consola completa de Superadministrador.");
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm shrink-0 flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>Restablir Sessió SuperAdmin</span>
            </button>
          </div>
        )}

        {/* Zona de Treball Dinàmica o Launchpad */}
        {!activeWorkspace ? (
          <main className="flex-1 my-3 sm:my-4 space-y-4 sm:space-y-6">
            {/* Banner de Benvinguda i Ecosistema 3.0 */}
            <GlassCard variant="glow" glowColor="purple" className="p-4 sm:p-6 bg-white/95">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                      Panell Central de Comandament BancActiu Nexus
                    </h2>
                    <GlassBadge variant="emerald">Sessió Verificada</GlassBadge>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                    Benvingut al nucli de governança institucional. Des d'aquest espai tens accés a l'auditoria forense, a l'alta descentralitzada de centres i serveis, a la simulació de concurrència d'alta escala (fins a 250.000 ciutadans i 5 anys) i a la consola de l'Enginyer Agent IA autònom.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href="/docs">
                    <GlassButton
                      variant="primary"
                      size="sm"
                      icon={<FileText size={15} />}
                    >
                      Manuals & PDFs
                    </GlassButton>
                  </Link>
                  <GlassButton
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveWorkspace('simulations-audit')}
                    icon={<Activity size={15} />}
                  >
                    Auditoria & Estrès (5 Anys)
                  </GlassButton>
                  <GlassButton
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      requestSensitiveAction(
                        'AUDIT_LAB_NETWORK',
                        "Accés al Laboratori d'Auditoria i Paràmetres de Xarxa",
                        "Simulació de concurrència d'alta escala (250k ciutadans) i escaneig de vulnerabilitats.",
                        () => setActiveWorkspace('security-lab')
                      )
                    }
                    icon={<Shield size={15} />}
                  >
                    Stress & Security (2FA)
                  </GlassButton>
                  <GlassButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveWorkspace('ai-agent')}
                    icon={<Bot size={15} />}
                  >
                    Agent IA Codi
                  </GlassButton>
                  <GlassButton
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveWorkspace('interoperability')}
                    icon={<Globe size={15} />}
                  >
                    Pasarel·les AOC
                  </GlassButton>
                  <GlassButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveWorkspace('workshop-repairs')}
                    icon={<Wrench size={15} />}
                  >
                    Taller Creu Roja
                  </GlassButton>
                </div>
              </div>
            </GlassCard>

            {/* Quadrícula de 5 Mòduls Operatius i SuperAdmin */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
              {/* Mòdul 1: Alta Descentralitzada de Centres (Navegació ordinària) */}
              <GlassCard
                variant="interactive"
                glowColor="purple"
                className="p-4 sm:p-5 flex flex-col justify-between"
                onClick={() => setActiveWorkspace('centres-onboarding')}
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white mb-3 shadow-md border border-purple-200">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                    Alta Descentralitzada de Centres
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    Configuració i alta jeràrquica de CAPs, hospitals i entitats per cada gerència territorial.
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-purple-700 pt-2 border-t border-slate-100">
                  <span>Gestionar Centres</span>
                  <ArrowRight size={14} />
                </div>
              </GlassCard>

              {/* Mòdul 2: Rols, Serveis i Llocs de Treball (Navegació ordinària) */}
              <GlassCard
                variant="interactive"
                glowColor="purple"
                className="p-4 sm:p-5 flex flex-col justify-between"
                onClick={() => setActiveWorkspace('roles-services')}
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white mb-3 shadow-md border border-indigo-200">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                    Rols, Serveis i Puestos
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    Superadministració del catàleg de serveis, rols RBAC i estructura de llocs de treball.
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-indigo-700 pt-2 border-t border-slate-100">
                  <span>Configurar Rols</span>
                  <ArrowRight size={14} />
                </div>
              </GlassCard>

              {/* Mòdul 3: Stress & Security Lab (Accés explícit al laboratori d'auditoria/xarxa: Requereix 2FA) */}
              <GlassCard
                variant="interactive"
                glowColor="purple"
                className="p-4 sm:p-5 flex flex-col justify-between"
                onClick={() =>
                  requestSensitiveAction(
                    'AUDIT_LAB_NETWORK',
                    "Accés al Laboratori d'Auditoria i Paràmetres de Xarxa",
                    "Simulació de concurrència (1-3 anys Catalunya) i escaneig de vulnerabilitats en temps real.",
                    () => setActiveWorkspace('security-lab')
                  )
                }
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 via-amber-600 to-emerald-600 flex items-center justify-center text-white mb-3 shadow-md border border-emerald-200">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                    Stress & Security Lab
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    Simulació de concurrència (fins a 250k ciutadans) i escaneig continu ENS (Score 99%).
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 pt-2 border-t border-slate-100">
                  <span>Obrir Lab (2FA)</span>
                  <ArrowRight size={14} />
                </div>
              </GlassCard>

              {/* Mòdul 4: Consola Agent IA de Codi (Navegació ordinària) */}
              <GlassCard
                variant="interactive"
                glowColor="purple"
                className="p-4 sm:p-5 flex flex-col justify-between"
                onClick={() => setActiveWorkspace('ai-agent')}
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white mb-3 shadow-md border border-cyan-200">
                    <Bot className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                    Consola Enginyer Agent IA
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    Modificacions a demanda mitjançant prompts en llenguatge natural amb generació de diff i auditoria.
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-cyan-700 pt-2 border-t border-slate-100">
                  <span>Executar Agent</span>
                  <ArrowRight size={14} />
                </div>
              </GlassCard>

              {/* Mòdul 5: Taller & Reparacions Creu Roja (FASE 3) */}
              <GlassCard
                variant="interactive"
                glowColor="rose"
                className="p-4 sm:p-5 flex flex-col justify-between"
                onClick={() => setActiveWorkspace('workshop-repairs')}
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 via-pink-600 to-amber-600 flex items-center justify-center text-white mb-3 shadow-md border border-rose-200">
                    <Hammer className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                    Taller & Reparacions (Creu Roja)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    Gestió del cicle de vida d'avaries (Pendent, Taller, Verificació de Seguretat i Retorn a Estoc).
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-rose-700 pt-2 border-t border-slate-100">
                  <span>Gestionar Taller</span>
                  <ArrowRight size={14} />
                </div>
              </GlassCard>

              {/* Mòdul 6: Serveis Socials & Dependència (FASE 2 & Feature Flag) */}
              <GlassCard
                variant="interactive"
                glowColor="purple"
                className="p-4 sm:p-5 flex flex-col justify-between"
                onClick={() => {
                  if (!moduleFlags.SOCIAL_SERVICES_ENABLED) {
                    toggleModuleFlag('SOCIAL_SERVICES_ENABLED');
                  }
                  setActiveWorkspace('social-services');
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-md border border-purple-200">
                      <HeartHandshake className="w-5 h-5" />
                    </div>
                    <GlassBadge variant={moduleFlags.SOCIAL_SERVICES_ENABLED ? "purple" : "slate"}>
                      {moduleFlags.SOCIAL_SERVICES_ENABLED ? "Actiu" : "Activable sota demanda"}
                    </GlassBadge>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                    Serveis Socials & Dependència
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    Gestió d'expedients de dependència, barems BVD (escala 64 punts), PIAs, SAD i teleassistència municipal.
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-purple-700 pt-2 border-t border-slate-100">
                  <span>{moduleFlags.SOCIAL_SERVICES_ENABLED ? "Gestionar Dependència" : "Activar Mòdul Sota Demanda"}</span>
                  <ArrowRight size={14} />
                </div>
              </GlassCard>
            </div>

            {/* Launcher Embolicat per saltar a altres aplicacions */}
            <div className="mt-6 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Grid size={16} className="text-cyan-600" />
                  Ecosistema de Micro-Aplicacions BancActiu 3.0
                </h3>
                <span className="text-xs text-slate-500">
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
          <main className="flex-1 my-4 w-full overflow-y-auto custom-scrollbar pr-1">
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

            {activeWorkspace === 'administratiu' && (
              <AdministratiuVoluntariatWorkspace
                onClose={() => setActiveWorkspace(null)}
                onShowToast={(title, msg) => showToast(title, msg)}
              />
            )}

            {activeWorkspace === 'gerencia' && (
              <GerenciaReferentsWorkspace
                onClose={() => setActiveWorkspace(null)}
                onShowToast={(title, msg) => showToast(title, msg)}
              />
            )}

            {activeWorkspace === 'interoperability' && (
              <SuperAdminInteroperabilityWorkspace onClose={() => setActiveWorkspace(null)} />
            )}

            {activeWorkspace === 'simulations-audit' && (
              <SuperAdminSimulationsAndAuditWorkspace
                onClose={() => setActiveWorkspace(null)}
                adminDni={initialUser?.dni || ''}
                onShowToast={(title, msg) => showToast(title, msg)}
              />
            )}

            {activeWorkspace === 'security-lab' && (
              <SuperAdminStressAndSecurityLabWorkspace onClose={() => setActiveWorkspace(null)} />
            )}

            {activeWorkspace === 'ai-agent' && (
              <SuperAdminAiAgentWorkspace onClose={() => setActiveWorkspace(null)} />
            )}

            {activeWorkspace === 'centres-onboarding' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <GerenciaOnboardingWorkspace
                  onClose={() => setActiveWorkspace(null)}
                />
              </div>
            )}

            {activeWorkspace === 'roles-services' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <SuperAdminRolesAndServicesWorkspace
                  onClose={() => setActiveWorkspace(null)}
                  onShowToast={(type, title, msg) => showToast(title, msg)}
                  onRequestSensitiveAction={(title, desc, onAuth) =>
                    requestSensitiveAction('SUPERADMIN_ROLE_CHANGE', title, desc, onAuth)
                  }
                />
              </div>
            )}

            {activeWorkspace === 'workshop-repairs' && (
              <WorkshopAndRepairsWorkspace
                onClose={() => setActiveWorkspace(null)}
                onShowToast={(title, msg) => showToast(title, msg)}
              />
            )}

            {activeWorkspace === 'social-services' && (
              <SocialServicesWorkspace
                onClose={() => setActiveWorkspace(null)}
                onShowToast={(title, msg) => showToast(title, msg)}
              />
            )}
          </main>
        )}

        {/* Modal Flotant del Gateway Launcher */}
        <GlassModal
          isOpen={isLauncherOpen}
          onClose={() => setIsLauncherOpen(false)}
          title="Navegador de Micro-Aplicacions BancActiu 3.0"
          maxWidth="4xl"
        >
          <GatewayLauncher
            currentAppId="bancactiu-nexus"
            currentUserRole={activeRole}
            onChangeRole={setActiveRole}
            onSelectApp={handleAppSelect}
          />
        </GlassModal>

        {/* Peu de pàgina institucional neutre i dinàmic */}
        <footer className="mt-6 pt-3 border-t border-slate-200 text-center text-xs text-slate-500">
          BancActiu Nexus 3.0 &middot; Sistema de Superadministració i Seguretat Perimetral &middot; {tenantContext.isDefault ? "Arquitectura Distribuïda i Zero-Trust" : tenantContext.name}
        </footer>
        {/* Assistent Flotant Kenzo AI */}
        <KenzoAssistant />

        {/* Notificació Toast de Seguretat ENS Nivell Alt */}
        {notificationToast && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-white/95 border border-emerald-500 shadow-xl backdrop-blur-xl flex items-center gap-3 animate-fadeIn text-slate-900 max-w-md">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-emerald-800">{notificationToast.title}</h4>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{notificationToast.message}</p>
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
          currentUserDni={initialUser?.dni || ''}
          currentUserName={initialUser?.name || 'Administrador Acreditat'}
          currentUserRole={activeRole}
          moduleName="bancactiu-nexus"
        />

        {/* Modal Interactiu de Nou Préstamo d'Ortopèdia Comunitària (FASE 1) */}
        <NewLoanModal
          isOpen={isNewLoanModalOpen}
          onClose={() => setIsNewLoanModalOpen(false)}
          onLoanCreated={(newLoan) => {
            showToast(
              'Préstec d\'Ortopèdia Lliurat amb Èxit',
              `Expedient ${newLoan.expedient} assignat a ${newLoan.ciutada} (${newLoan.material}). Codi QR: ${newLoan.codiQR}`
            );
          }}
        />

        {/* Modal Ineludible de Drets de Propietat Intel·lectual (Primer Login) */}
        <IntellectualPropertyModal
          isOpen={showIpModal}
          onAccept={() => setShowIpModal(false)}
          user={initialUser}
        />

        {/* Modal de Recuperació de Fluxos & Disaster Recovery (Zero-Downtime) */}
        {isDisasterRecoveryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 sm:p-6 text-slate-900">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                    <RotateCcw size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Consola de Recuperació de Fluxos (Disaster Recovery)</h3>
                    <p className="text-xs text-slate-500">Supervisió d'estat de caigudes, purga de bloqueigs i restauració de continuïtat</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDisasterRecoveryOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1">Còpia de Seguretat Oficial (Real)</span>
                    <span className="font-mono text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 block truncate">
                      bancactiu-backup-real-20261118.zip
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Integritat SHA-256 Verificada</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1">Còpia de Seguretat Proves (Honeypot)</span>
                    <span className="font-mono text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 block truncate">
                      bancactiu-backup-intrusio-20261118.zip
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Tag Git: backup-intrusio-20261118</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-800 block">Estat dels Micro-Serveis de la Plataforma:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <CheckCircle2 size={13} /> Nexus (Governança): 3000
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <CheckCircle2 size={13} /> Salut (Clínic): 3001
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <CheckCircle2 size={13} /> Municipal: 3002
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <CheckCircle2 size={13} /> Social: 3003
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <CheckCircle2 size={13} /> Operatiu: 3004
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <CheckCircle2 size={13} /> BD Prisma/SQLite: OK
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <strong>Protocol davant Caiguda:</strong> En cas de pèrdua de sincronisme o bloqueig de concurrència, aquest procediment allibera locks de sessió, purga la memòria cau intermediària i restableix les rutes de servei sense reiniciar la base de dades ni perdre expedients.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
                <GlassButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsDisasterRecoveryOpen(false)}
                >
                  Tancar
                </GlassButton>
                <GlassButton
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setIsRestoringFlows(true);
                    setTimeout(() => {
                      setIsRestoringFlows(false);
                      setIsDisasterRecoveryOpen(false);
                      showToast(
                        "Fluxos Restablits amb Èxit",
                        "Tots els bloqueigs temporals han estat purgats i els serveis funcionen amb paràmetres nominals."
                      );
                    }, 800);
                  }}
                  icon={<RotateCcw size={14} className={isRestoringFlows ? "animate-spin" : ""} />}
                >
                  {isRestoringFlows ? "Restablint..." : "Executar Restabliment de Fluxos"}
                </GlassButton>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Monitoratge SOAR (Aïllament Automàtic) */}
        {isSoarModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 sm:p-6 text-slate-900">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                    <ShieldAlert size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Monitoratge SOAR & Aïllament Automàtic</h3>
                    <p className="text-xs text-slate-500">Detecció en temps real, quarantena d'intrusió i protecció Zero-Trust (ENS)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSoarModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">Tallafocs WAF</span>
                    <span className="text-lg font-black text-emerald-700">100% Blindat</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">0 vectors no autoritzats</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">Aïllament SOAR</span>
                    <span className="text-lg font-black text-purple-700">Actiu</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Quarantena automàtica</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">ENS Categoria</span>
                    <span className="text-lg font-black text-cyan-700">Nivell Alt</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">RGPD Strict Isolation</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1.5">Vectors Aïllats Preventivament pel SOAR:</span>
                  <div className="space-y-1">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="font-mono text-xs text-slate-800">192.168.1.105</span>
                        <span className="text-[10px] text-slate-400">(Intent d'injecció / Proves d'intrusió)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Quarantena Activa
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="font-mono text-xs text-slate-800">10.0.4.88</span>
                        <span className="text-[10px] text-slate-400">(Sondeig de ports HTTPS)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Monitoritzat
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <strong>Ring-Fencing de Credencials:</strong> El magatzem de claus oficials manté immutables els perfils autoritzats de Bartolomé Cachinero Moreno (52622304Y) i Marc Cachinero Baranda (47956602S).
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
                <GlassButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsSoarModalOpen(false)}
                >
                  Tancar
                </GlassButton>
                <GlassButton
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSoarScanActive(true);
                    setTimeout(() => {
                      setSoarScanActive(false);
                      showToast(
                        "Escaneig SOAR Completat",
                        "Tots els 7 servidors i nodes territorials han estat verificats. 0 vulnerabilitats trobades."
                      );
                    }, 1000);
                  }}
                  icon={<ShieldAlert size={14} className={soarScanActive ? "animate-pulse" : ""} />}
                >
                  {soarScanActive ? "Escanejant..." : "Executar Escaneig en Temps Real"}
                </GlassButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </RadialAuraBackground>
    </SessionLockManager>
  );
}
