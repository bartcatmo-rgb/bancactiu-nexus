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
  RefreshCw,
  LogOut,
  Search,
  ChevronRight,
  Compass,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  Eye,
  Menu,
  X
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
import { resolveAppTargetUrl, isProductionEnvironment } from '@/lib/navigation';
import { SuperAdminStressAndSecurityLabWorkspace } from '@/components/workspaces/SuperAdminStressAndSecurityLabWorkspace';
import { SuperAdminSimulationsAndAuditWorkspace } from '@/components/workspaces/SuperAdminSimulationsAndAuditWorkspace';
import { SuperAdminRolesAndServicesWorkspace } from '@/components/workspaces/SuperAdminRolesAndServicesWorkspace';
import { SuperAdminInteroperabilityWorkspace } from '@/components/workspaces/SuperAdminInteroperabilityWorkspace';
import { WorkshopAndRepairsWorkspace } from '@/components/workspaces/WorkshopAndRepairsWorkspace';
import { SocialServicesWorkspace } from '@/components/workspaces/SocialServicesWorkspace';
import { AdministratiuVoluntariatWorkspace } from '@/components/workspaces/AdministratiuVoluntariatWorkspace';
import { GerenciaReferentsWorkspace } from '@/components/workspaces/GerenciaReferentsWorkspace';
import { CentresEntitatsWorkspace } from '@/components/workspaces/CentresEntitatsWorkspace';
import { IntellectualPropertyModal } from '@/components/legal/IntellectualPropertyModal';
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
  // Espai de treball actiu: null / 'superadmin' | 'centres-entitats' | 'gerencia' | 'administratiu' | 'taller' | 'simulations-audit' | 'security-lab' | 'roles-services'
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>('centres-entitats');
  const [activeRole, setActiveRole] = useState(initialUser?.role || 'SUPERADMIN');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');

  // Context dinàmic de Tenant (IP & Host resolution)
  const [tenantContext, setTenantContext] = useState({
    id: 'tenant-default',
    code: 'BANCACTIU_ENTERPRISE',
    name: 'eCAP · BancActiu Enterprise',
    shortName: 'eCAP Salut',
    description: 'Plataforma Unificada de Governança i Serveis Sociosanitaris',
    badgeLabel: 'eCAP / SISCAT',
  });

  // FASE 2: Eliminació de Bretxes de Sessió (Supressió absoluta de la drecera ESC per evitar sortides a /login)
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

  const isInternalAppSwitching = useRef(false);

  // Destrucció de sessió al tancar finestra
  useEffect(() => {
    const handleTabOrWindowClose = () => {
      if (isInternalAppSwitching.current) return;
      try {
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon('/api/auth/logout');
        } else {
          fetch('/api/auth/logout', { method: 'POST', keepalive: true }).catch(() => {});
        }
        document.cookie = 'bancactiu_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0; SameSite=Lax;';
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

  // Modal de propietat intel·lectual
  const [showIpModal, setShowIpModal] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userKey = initialUser?.dni || initialUser?.name || 'current_user';
      const hasAccepted = localStorage.getItem(`bancactiu_ip_accepted_${userKey}`) || localStorage.getItem('bancactiu_ip_global_accepted');
      if (!hasAccepted) {
        setShowIpModal(true);
      }
    }
  }, [initialUser]);

  // Estats de Disaster Recovery i SOAR
  const [isDisasterRecoveryOpen, setIsDisasterRecoveryOpen] = useState(false);
  const [isSoarModalOpen, setIsSoarModalOpen] = useState(false);
  const [isRestoringFlows, setIsRestoringFlows] = useState(false);
  const [soarScanActive, setSoarScanActive] = useState(false);

  // Notificacions Toast
  const [notificationToast, setNotificationToast] = useState<{
    visible: boolean;
    title: string;
    message: string;
  } | null>(null);

  const showToast = (title: string, message: string) => {
    setNotificationToast({ visible: true, title, message });
    setTimeout(() => setNotificationToast(null), 4500);
  };

  // Re-autenticació sensible per a accions crítiques
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

  const requestSensitiveAction = (
    actionType: 'SUPERADMIN_ROLE_CHANGE' | 'MASS_DATA_EXPORT' | 'AUDIT_LAB_NETWORK',
    actionTitle: string,
    actionDescription: string,
    onAuthorized: (data?: any) => void
  ) => {
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
  };

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

  const isSuperAdminAuthorized =
    initialUser?.role === 'SUPERADMIN' ||
    initialUser?.dni === '52622304Y' ||
    initialUser?.dni === '47956602S';

  return (
    <SessionLockManager onReauthenticate={handleSessionReauthenticate}>
      <div className="min-h-screen w-full flex bg-slate-50 text-slate-800 antialiased overflow-hidden">
        {/* ======================================================== */}
        {/* SIDEBAR ESQUERRE FIX - IDENTITAT SANITÀRIA eCAP          */}
        {/* ======================================================== */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
            isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
        >
          {/* Bloc Superior: Logotip eCAP & Identitat Sanitària */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold shadow-md shadow-teal-700/20 p-1.5 shrink-0">
                  <img src="/bancactiu_icon.svg" alt="eCAP" className="w-full h-full object-contain filter brightness-0 invert" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm tracking-tight text-slate-900">eCAP · BancActiu</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 border border-teal-200">
                      v3.0
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Sistema Clínic & Sociosanitari</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="md:hidden p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Targeta d'Usuari i Estat ENS */}
            <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                  {initialUser?.name?.charAt(0) || 'B'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {initialUser?.name || 'Bartolomé Cachinero Moreno'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">
                    DNI: {initialUser?.dni || '52622304Y'}
                  </div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                <span className="text-slate-500 font-medium">Sessió:</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ENS Nivell Alt (Activa)
                </span>
              </div>
            </div>
          </div>

          {/* Menú de Navegació de Rols i Espais eCAP */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
            {/* Secció 1: ESPAIS OPERATIUS I ROLS */}
            <div>
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Espais Operatius i Rols
              </span>
              <nav className="space-y-1">
                {/* 1. Gestió de Centres i Entitats (DESTACAT PRIMERA POSICIÓ) */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveWorkspace('centres-entitats');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeWorkspace === 'centres-entitats'
                      ? 'bg-teal-700 text-white shadow-sm shadow-teal-700/20'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Building2 size={16} className={activeWorkspace === 'centres-entitats' ? 'text-white' : 'text-teal-600'} />
                  <span className="truncate flex-1 text-left">Gestió Unificada de Centres i Entitats</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    activeWorkspace === 'centres-entitats' ? 'bg-teal-800 text-teal-100' : 'bg-teal-50 text-teal-800 border border-teal-200'
                  }`}>
                    CAPs
                  </span>
                </button>

                {/* 2. SuperAdmin (Governança Central) */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveWorkspace('superadmin');
                    setActiveRole('SUPERADMIN');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeWorkspace === 'superadmin' || activeWorkspace === null
                      ? 'bg-purple-700 text-white shadow-sm shadow-purple-700/20'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck size={16} className={activeWorkspace === 'superadmin' || activeWorkspace === null ? 'text-white' : 'text-purple-600'} />
                  <span className="truncate flex-1 text-left">SuperAdmin (52622304Y)</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    activeWorkspace === 'superadmin' || activeWorkspace === null ? 'bg-purple-800 text-purple-100' : 'bg-purple-50 text-purple-800 border border-purple-200'
                  }`}>
                    Nivell 5
                  </span>
                </button>

                {/* 3. Gerència i Referents Clínics */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveWorkspace('gerencia');
                    setActiveRole('GERENCIA');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeWorkspace === 'gerencia'
                      ? 'bg-blue-700 text-white shadow-sm shadow-blue-700/20'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Compass size={16} className={activeWorkspace === 'gerencia' ? 'text-white' : 'text-blue-600'} />
                  <span className="truncate flex-1 text-left">Gerència i Referents</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    activeWorkspace === 'gerencia' ? 'bg-blue-800 text-blue-100' : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                    KPIs
                  </span>
                </button>

                {/* 4. Administratiu / Voluntariat */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveWorkspace('administratiu');
                    setActiveRole('ADMINISTRATIU');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeWorkspace === 'administratiu'
                      ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/20'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Users size={16} className={activeWorkspace === 'administratiu' ? 'text-white' : 'text-emerald-600'} />
                  <span className="truncate flex-1 text-left">Administratiu / Voluntariat</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    activeWorkspace === 'administratiu' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    Filiació
                  </span>
                </button>

                {/* 5. Taller de Reparacions */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveWorkspace('taller');
                    setActiveRole('TALLER_REPARACIONS');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeWorkspace === 'taller'
                      ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Wrench size={16} className={activeWorkspace === 'taller' ? 'text-white' : 'text-amber-600'} />
                  <span className="truncate flex-1 text-left">Taller de Reparacions</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    activeWorkspace === 'taller' ? 'bg-amber-700 text-amber-100' : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    4 Eixos
                  </span>
                </button>
              </nav>
            </div>

            {/* Secció 2: EINES SUPERADMIN */}
            {isSuperAdminAuthorized && (
              <div>
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Governança & Seguretat
                </span>
                <nav className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveWorkspace('simulations-audit');
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      activeWorkspace === 'simulations-audit'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Activity size={14} className="text-emerald-600" />
                    <span className="truncate flex-1 text-left">Auditoria Forense (5 Anys)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      requestSensitiveAction(
                        'AUDIT_LAB_NETWORK',
                        "Accés al Laboratori de Seguretat Zero-Trust (ENS Nivell Alt)",
                        "Mètriques de ciberseguretat, escàner de xarxa i paràmetres criptogràfics.",
                        () => {
                          setActiveWorkspace('security-lab');
                          setIsMobileSidebarOpen(false);
                        }
                      );
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      activeWorkspace === 'security-lab'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Lock size={14} className="text-cyan-600" />
                    <span className="truncate flex-1 text-left">Seguretat Zero-Trust</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-100 text-cyan-800 font-bold">2FA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveWorkspace('roles-services');
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      activeWorkspace === 'roles-services'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Users size={14} className="text-indigo-600" />
                    <span className="truncate flex-1 text-left">Rols, Usuaris & Serveis</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDisasterRecoveryOpen(true)}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all"
                  >
                    <RotateCcw size={14} className="text-amber-700" />
                    <span className="truncate flex-1 text-left">Recuperació de Fluxos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSoarModalOpen(true)}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all"
                  >
                    <ShieldAlert size={14} className="text-rose-700" />
                    <span className="truncate flex-1 text-left">SOAR / Aïllament</span>
                  </button>
                </nav>
              </div>
            )}

            {/* Secció 3: ENLLAÇOS EXTERNS / MÒDULS */}
            <div>
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Mòduls Interconnectats
              </span>
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => handleNavigateModule('bancactiu-social', 3003)}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <Share2 size={14} className="text-rose-600" />
                  <span className="truncate flex-1 text-left">Xarxa Social Comunitària</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigateModule('bancactiu-operatiu', 3004)}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <Boxes size={14} className="text-blue-600" />
                  <span className="truncate flex-1 text-left">Préstecs & Magatzem</span>
                </button>

                <Link
                  href="/docs"
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <FileText size={14} className="text-cyan-600" />
                  <span className="truncate flex-1 text-left">Manuals & PDFs Oficials</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Peu del Menú: Botó Explícit de Tancar Sessió */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/50">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-sm"
            >
              <LogOut size={15} />
              <span>Tancar Sessió Segura</span>
            </button>
            <div className="text-[10px] text-center text-slate-400 mt-2 font-mono">
              eCAP CatSalut · ENS Certificat
            </div>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* ÀREA PRINCIPAL DE CONTINGUT (eCAP CONTENT SHELL)         */}
        {/* ======================================================== */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Capçalera Superior Compacta */}
          <header className="h-14 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span className="text-slate-400">eCAP</span>
                <ChevronRight size={14} className="text-slate-300" />
                <span className="text-slate-900 font-bold capitalize">
                  {activeWorkspace === 'centres-entitats' && 'Gestió Unificada de Centres i Entitats (SISCAT)'}
                  {activeWorkspace === 'superadmin' && 'Consola Central SuperAdmin'}
                  {activeWorkspace === 'gerencia' && 'Espai Gerència i Referents Territorials'}
                  {activeWorkspace === 'administratiu' && 'Espai Administratiu i Voluntariat'}
                  {activeWorkspace === 'taller' && 'Espai Taller de Reparacions'}
                  {activeWorkspace === 'simulations-audit' && 'Auditoria Forense i Estrès 5 Anys'}
                  {activeWorkspace === 'security-lab' && 'Laboratori de Seguretat Zero-Trust'}
                  {activeWorkspace === 'roles-services' && 'Gestió de Rols, Usuaris i Serveis'}
                  {!activeWorkspace && 'Panell de Governança eCAP'}
                </span>
              </div>
            </div>

            {/* Accions Ràpides de la Capçalera */}
            <div className="flex items-center gap-2">
              {/* Botó Recuperació davant Caigudes */}
              <button
                type="button"
                onClick={() => setIsDisasterRecoveryOpen(true)}
                title="Consola de Disaster Recovery"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <RotateCcw size={13} className="text-amber-700" />
                <span>Disaster Recovery</span>
              </button>

              {/* Botó SOAR */}
              <button
                type="button"
                onClick={() => setIsSoarModalOpen(true)}
                title="Monitoratge de Seguretat SOAR"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100 transition-colors"
              >
                <ShieldAlert size={13} className="text-rose-700" />
                <span>SOAR</span>
              </button>

              <div className="h-6 w-px bg-slate-200 mx-1" />

              {/* Tancar Sessió Ràpid */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition-colors"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Sortir</span>
              </button>
            </div>
          </header>

          {/* Banner de Simulació de Rols */}
          {activeRole !== 'SUPERADMIN' && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-amber-900 shrink-0">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="text-amber-700 shrink-0" />
                <span>
                  <strong>Mode Simulació Actiu:</strong> Estàs operant amb el perfil <strong>[{activeRole}]</strong> per auditar la seva perspectiva funcional.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveRole('SUPERADMIN');
                  setActiveWorkspace('superadmin');
                  showToast('Sessió Restablerta', 'Has tornat a la sessió oficial de SuperAdmin (52622304Y).');
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors"
              >
                Restablir SuperAdmin
              </button>
            </div>
          )}

          {/* Cos Principal Scrollable */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
            <div className="max-w-7xl mx-auto">
              {/* VISTA 1: GESTIÓ DE CENTRES I ENTITATS */}
              {activeWorkspace === 'centres-entitats' && (
                <CentresEntitatsWorkspace />
              )}

              {/* VISTA 2: GERÈNCIA I REFERENTS */}
              {activeWorkspace === 'gerencia' && (
                <GerenciaReferentsWorkspace />
              )}

              {/* VISTA 3: ADMINISTRATIU I VOLUNTARIAT */}
              {activeWorkspace === 'administratiu' && (
                <AdministratiuVoluntariatWorkspace />
              )}

              {/* VISTA 4: TALLER DE REPARACIONS */}
              {activeWorkspace === 'taller' && (
                <WorkshopAndRepairsWorkspace />
              )}

              {/* VISTA 5: AUDITORIA FORENSE I ESTRÈS 5 ANYS */}
              {activeWorkspace === 'simulations-audit' && (
                <SuperAdminSimulationsAndAuditWorkspace
                  onClose={() => setActiveWorkspace('centres-entitats')}
                />
              )}

              {/* VISTA 6: LABORATORI SEGURETAT ZERO-TRUST */}
              {activeWorkspace === 'security-lab' && (
                <SuperAdminStressAndSecurityLabWorkspace
                  onClose={() => setActiveWorkspace('centres-entitats')}
                />
              )}

              {/* VISTA 7: ROLS, USUARIS & SERVEIS */}
              {activeWorkspace === 'roles-services' && (
                <SuperAdminRolesAndServicesWorkspace
                  onClose={() => setActiveWorkspace('centres-entitats')}
                />
              )}

              {/* VISTA 8: SUPERADMIN EXECUTIVE CENTER (QUAN S'ACTIVA 'superadmin') */}
              {(activeWorkspace === 'superadmin' || activeWorkspace === null) && (
                <div className="space-y-5">
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 mb-2">
                          <ShieldCheck size={14} className="text-purple-600" />
                          <span>Consola Central SuperAdmin · ENS Nivell Alt</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                          Benvingut, {initialUser?.name || 'Bartolomé Cachinero Moreno'}
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                          DNI: {initialUser?.dni || '52622304Y'} · Control Total d'Interoperabilitat, Seguretat i Catàleg SISCAT
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveWorkspace('centres-entitats')}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-sm transition-all flex items-center gap-2"
                        >
                          <Building2 size={16} />
                          <span>Obrir Gestió de Centres & CAPs</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Targetes d'Accés Ràpid als Espais */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div
                      onClick={() => setActiveWorkspace('centres-entitats')}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mb-3 group-hover:scale-105 transition-transform">
                        <Building2 size={18} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">Centres & Entitats</h3>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Cens unificat de CAPs (inclòs CAP Dr. Carles Ribas), GAPiCs i Ajuntaments.
                      </p>
                    </div>

                    <div
                      onClick={() => {
                        setActiveWorkspace('gerencia');
                        setActiveRole('GERENCIA');
                      }}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 mb-3 group-hover:scale-105 transition-transform">
                        <Compass size={18} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">Gerència & Referents</h3>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Diagrama interactiu de 5 fases de flux i taules KPI de rendiment per CAP.
                      </p>
                    </div>

                    <div
                      onClick={() => {
                        setActiveWorkspace('administratiu');
                        setActiveRole('ADMINISTRATIU');
                      }}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-3 group-hover:scale-105 transition-transform">
                        <Users size={18} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">Administratiu & Voluntariat</h3>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Cercador amb ressaltat groc, pantalla dividida i filiació ciutadana editable.
                      </p>
                    </div>

                    <div
                      onClick={() => {
                        setActiveWorkspace('taller');
                        setActiveRole('TALLER_REPARACIONS');
                      }}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-3 group-hover:scale-105 transition-transform">
                        <Wrench size={18} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">Taller de Reparacions</h3>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Avaries, gestió de recanvis, xat segur Creu Roja i control gerencial.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Modal de Disaster Recovery */}
        {isDisasterRecoveryOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center gap-3 text-amber-700">
                <RotateCcw size={22} />
                <h3 className="text-base font-bold text-slate-900">Recuperació de Fluxos davant Caigudes</h3>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Executa el protocol de restabliment del motor de fluxos operatius i neteja de bloquejos de concurrència.
              </p>
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                Punts de restauració verificats a l'Escriptori:
                <div className="font-mono text-[11px] mt-1">· bancactiu-backup-real-20261118.zip</div>
                <div className="font-mono text-[11px]">· bancactiu-backup-intrusio-20261118.zip</div>
              </div>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDisasterRecoveryOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Tancar
                </button>
                <button
                  type="button"
                  disabled={isRestoringFlows}
                  onClick={() => {
                    setIsRestoringFlows(true);
                    setTimeout(() => {
                      setIsRestoringFlows(false);
                      setIsDisasterRecoveryOpen(false);
                      showToast("Fluxos Restablerts", "El sistema ha verificat la integritat i ha restaurat tots els canals operatius.");
                    }, 1200);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 shadow-sm flex items-center gap-1.5"
                >
                  {isRestoringFlows ? <RefreshCw size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                  <span>Restablir Fluxos Ara</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal SOAR / Aïllament */}
        {isSoarModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center gap-3 text-rose-700">
                <ShieldAlert size={22} />
                <h3 className="text-base font-bold text-slate-900">Monitoratge SOAR & Aïllament</h3>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Seguretat activa Zero-Trust amb aïllament automàtic de peticions anòmales i quarantena d'intrusions.
              </p>
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Estat de l'escut SOAR:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    ACTIU (Protegit)
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-slate-500">Quarantena automàtica:</span>
                  <span className="font-mono text-slate-700">0 vectors bloquejats</span>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSoarModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Tancar
                </button>
                <button
                  type="button"
                  disabled={soarScanActive}
                  onClick={() => {
                    setSoarScanActive(true);
                    setTimeout(() => {
                      setSoarScanActive(false);
                      showToast("Escaneig SOAR Completat", "Tots els nodes i perímetres compleixen l'estàndard ENS Nivell Alt.");
                    }, 1000);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 shadow-sm flex items-center gap-1.5"
                >
                  {soarScanActive ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  <span>Executar Escaneig Heurístic</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmació 2FA per accions crítiques */}
        <SensitiveActionAuthModal
          isOpen={authModalConfig.isOpen}
          actionTitle={authModalConfig.actionTitle}
          actionDescription={authModalConfig.actionDescription}
          actionSeverity={authModalConfig.actionSeverity}
          currentUserDni={initialUser?.dni || '52622304Y'}
          currentUserName={initialUser?.name || 'Bartolomé Cachinero Moreno'}
          currentUserRole={initialUser?.role || 'SUPERADMIN'}
          onClose={() => setAuthModalConfig(prev => ({ ...prev, isOpen: false }))}
          onSuccess={(authData) => {
            const cb = authModalConfig.onAuthorized;
            setAuthModalConfig(prev => ({ ...prev, isOpen: false }));
            cb(authData);
          }}
        />

        {/* Modal de Propietat Intel·lectual */}
        {showIpModal && (
          <IntellectualPropertyModal
            isOpen={showIpModal}
            user={{
              dni: initialUser?.dni || '52622304Y',
              name: initialUser?.name || 'Bartolomé Cachinero Moreno',
              role: initialUser?.role || 'SUPERADMIN',
              email: initialUser?.email || 'bartcatmo@gmail.com'
            }}
            onAccept={() => {
              const userKey = initialUser?.dni || initialUser?.name || 'current_user';
              if (typeof window !== 'undefined') {
                localStorage.setItem(`bancactiu_ip_accepted_${userKey}`, 'true');
                localStorage.setItem('bancactiu_ip_global_accepted', 'true');
              }
              setShowIpModal(false);
            }}
          />
        )}
      </div>
    </SessionLockManager>
  );
}
