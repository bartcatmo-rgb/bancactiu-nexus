'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Shield,
  Lock,
  KeyRound,
  UserCheck,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Building2,
  Layers,
  Key,
  Eye,
  EyeOff,
  Check,
  X
} from 'lucide-react';
import {
  RadialAuraBackground,
  GlassCard,
  GlassButton,
  GlassBadge
} from '@bancactiu/ui-glass';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const redirectPath = rawRedirect && rawRedirect !== '/login' && !rawRedirect.startsWith('/login') ? rawRedirect : '/';

  // Mode d'autenticació: credentials / certificate
  const [authMode, setAuthMode] = useState<'credentials' | 'certificate'>('credentials');

  // Neteja imperativa d'estat residual en carregar /login (Elimina vulnerabilitat d'autologin)
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        // Netejar sessionStorage i claus residuals de sessió a localStorage
        sessionStorage.clear();
        localStorage.removeItem('bancactiu_session_cache');
        localStorage.removeItem('bancactiu_user');
        localStorage.removeItem('bancactiu_auth_state');

        // Invalidar de forma imperativa la cookie de sessió residual
        document.cookie = 'bancactiu_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0; SameSite=Lax;';
      }

      // Notificar al backend la neteja de la cookie bancactiu_session
      fetch('/api/auth/logout', { method: 'POST', keepalive: true }).catch(() => {});
    } catch (e) {
      console.warn('[LOGIN-CLEANUP] Error netejant estat residual:', e);
    }
  }, []);

  // Camps obligatòriament buits per requisit estricte de seguretat (sense valors per defecte)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Estat per a la configuració inicial de contrasenya (First-Time Setup)
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [targetDni, setTargetDni] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Validació de complexitat de contrasenya (ENS Nivell Alt)
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial && passwordsMatch;

  const handleLogin = async (e?: React.FormEvent, customMode?: 'credentials' | 'certificate') => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const mode = customMode || authMode;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authMethod: mode,
          identifier: identifier.trim(),
          password
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Comprovar si el Superadmin requereix configurar la contrasenya inicial (First-Time Setup)
        if (data.requirePasswordSetup) {
          setTargetDni(data.dni || identifier.trim().toUpperCase() || '48956602Z');
          setIsFirstTimeSetup(true);
          setSuccessMsg(data.message || 'Primer accés detectat. Definiu la vostra contrasenya segura.');
          return;
        }

        // Accés completat, navegació imperativa al Gateway Launcher (elimina bucles de cache de Next.js)
        window.location.href = redirectPath;
      } else {
        setErrorMsg(data.error || 'Credencials no vàlides. Verifiqueu les dades.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de connexió amb el servidor d\'autenticació.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setErrorMsg('La contrasenya no compleix els requisits mínims de seguretat.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dni: targetDni || '48956602Z',
          newPassword,
          confirmPassword
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg('Contrasenya configurada amb èxit. Accedint al sistema...');
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 800);
      } else {
        setErrorMsg(data.error || 'No s\'ha pogut establir la contrasenya.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de connexió.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md my-auto">
      <GlassCard variant="glow" glowColor="purple" className="p-4 sm:p-6 backdrop-blur-2xl bg-white/95">
        {/* Capçalera de la Targeta */}
        <div className="text-center mb-4 sm:mb-5">
          <div className="inline-flex p-2.5 rounded-2xl bg-gradient-to-br from-purple-50 to-cyan-50 border border-purple-200 mb-2 shadow-sm">
            {isFirstTimeSetup ? (
              <Key className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600 animate-pulse" />
            ) : (
              <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-600" />
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {isFirstTimeSetup ? 'Configuració Inicial de Clau' : 'Gateway Launcher Nexus'}
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
            {isFirstTimeSetup
              ? 'Definiu la contrasenya personal per al compte d\'administració'
              : 'Accés autenticat per a personal acreditat i governança perimetral'}
          </p>
        </div>

        {/* Missatges d'estat */}
        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* VISTA 1: Formulari de Primer Inici (First-Time Password Setup) */}
        {isFirstTimeSetup ? (
          <form onSubmit={handleSetupPassword} autoComplete="off" autoCapitalize="off" spellCheck={false} data-lpignore="true" className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
              Usuari vinculat: <strong className="font-mono text-slate-900">{targetDni || 'ADMINISTRADOR'}</strong>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nova Contrasenya Segura
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  placeholder="Introduïu una contrasenya robusta"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-400 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirmació de la Contrasenya
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                placeholder="Repetiu la contrasenya"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Checklist de requisits de seguretat */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-500">
                {hasMinLength ? <Check size={13} className="text-emerald-600" /> : <X size={13} className="text-slate-400" />}
                <span className={hasMinLength ? 'text-emerald-700 font-semibold' : ''}>Mínim 8 caràcters</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                {hasUpper && hasLower ? <Check size={13} className="text-emerald-600" /> : <X size={13} className="text-slate-400" />}
                <span className={hasUpper && hasLower ? 'text-emerald-700 font-semibold' : ''}>Majúscules i minúscules (A-Z, a-z)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                {hasNumber ? <Check size={13} className="text-emerald-600" /> : <X size={13} className="text-slate-400" />}
                <span className={hasNumber ? 'text-emerald-700 font-semibold' : ''}>Com a mínim un número (0-9)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                {hasSpecial ? <Check size={13} className="text-emerald-600" /> : <X size={13} className="text-slate-400" />}
                <span className={hasSpecial ? 'text-emerald-700 font-semibold' : ''}>Caràcter especial (!@#$%^&*)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                {passwordsMatch ? <Check size={13} className="text-emerald-600" /> : <X size={13} className="text-slate-400" />}
                <span className={passwordsMatch ? 'text-emerald-700 font-semibold' : ''}>Les contrasenyes coincideixen</span>
              </div>
            </div>

            <GlassButton
              type="submit"
              variant="primary"
              disabled={isLoading || !isPasswordValid}
              className="w-full justify-center py-2.5 mt-2"
              icon={isLoading ? <Sparkles className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
            >
              {isLoading ? 'Desant Nova Contrasenya...' : 'Confirmar i Accedir a Nexus'}
            </GlassButton>

            <button
              type="button"
              onClick={() => {
                setIsFirstTimeSetup(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 pt-2 transition-colors"
            >
              ← Tornar a la pantalla d'inici de sessió
            </button>
          </form>
        ) : (
          /* VISTA 2: Formulari Estàndard d'Inici de Sessió (Sense Autofill) */
          <>
            {/* Selector de mètode: Credencials o Certificat */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 mb-3 sm:mb-4">
              <button
                type="button"
                onClick={() => setAuthMode('credentials')}
                className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'credentials'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <KeyRound size={13} />
                DNI / Clau
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('certificate')}
                className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'certificate'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Award size={13} />
                idCAT / T-CAT
              </button>
            </div>

            {authMode === 'credentials' ? (
              <form onSubmit={(e) => handleLogin(e, 'credentials')} autoComplete="off" autoCapitalize="off" spellCheck={false} data-lpignore="true" className="space-y-3 sm:space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    DNI del Superadministrador
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-lpignore="true"
                    placeholder="ex: 48956602Z o Administrador"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-400 uppercase"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Identificació per DNI (<span className="font-mono text-cyan-700 font-semibold">48956602Z</span>) o usuari docent (<span className="font-mono text-cyan-700 font-semibold">Administrador</span>)
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Clau d'Accés
                    </label>
                    <span className="text-[10px] text-purple-700 font-mono font-semibold">
                      Nivell 5 Protegit
                    </span>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-lpignore="true"
                    placeholder="Introdueixi la seva contrasenya"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-400"
                  />
                </div>

                <GlassButton
                  type="submit"
                  variant="primary"
                  disabled={isLoading || !identifier.trim()}
                  className="w-full justify-center py-2 mt-1 sm:mt-2"
                  icon={isLoading ? <Sparkles className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                >
                  {isLoading ? 'Verificant Identitat...' : 'Iniciar Sessió Segura'}
                </GlassButton>

                {/* Opció per establir primer inici */}
                <div className="pt-2 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetDni(identifier.trim() || 'ADMINISTRADOR');
                      setIsFirstTimeSetup(true);
                      setErrorMsg(null);
                      setSuccessMsg('Configuració de primer accés. Definiu una nova contrasenya segura.');
                    }}
                    className="text-xs text-amber-700 hover:text-amber-800 transition-colors flex items-center justify-center gap-1 mx-auto font-medium"
                  >
                    <Key size={12} />
                    Primer accés? Definiu la vostra contrasenya inicial
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-center">
                <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-left space-y-1.5">
                  <div className="flex items-center gap-2 text-cyan-800 text-xs font-bold">
                    <FileCheck2 size={15} />
                    Certificats Digitals Oficials Admesos
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Dispositius de signatura electrònica vàlids (idCAT, T-CAT corporatiu de Salut, DNI Electrònic o Cl@ve).
                  </p>
                </div>

                <GlassButton
                  type="button"
                  variant="primary"
                  disabled={isLoading}
                  onClick={() => handleLogin(undefined, 'certificate')}
                  className="w-full justify-center py-2"
                  icon={isLoading ? <Sparkles className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                >
                  {isLoading ? 'Autenticant via Certificat...' : 'Validar Certificat Digital'}
                </GlassButton>
              </div>
            )}
          </>
        )}
      </GlassCard>

      {/* Avís Legal de Seguretat */}
      <div className="mt-2.5 p-2 rounded-xl bg-white/80 border border-slate-200 backdrop-blur-md text-[9px] sm:text-[10px] text-slate-500 text-center leading-tight shadow-sm">
        Sistema protegit per arquitectura Zero-Trust i registre d'auditoria continu (Llei 39/2015 i RGPD). Qualsevol accés no autoritzat serà bloquejat i auditat pel sistema perimetral.
      </div>
    </div>
  );
}

function useTenantContext() {
  const [tenant, setTenant] = useState<{
    id: string;
    name: string;
    shortName: string;
    description: string;
    badgeLabel: string;
    badgeVariant: 'purple' | 'blue' | 'emerald' | 'amber' | 'rose';
    isDefault?: boolean;
    clientIp?: string;
  }>({
    id: 'tenant-default',
    name: 'BancActiu 3.0 Enterprise',
    shortName: 'BancActiu 3.0',
    description: 'Plataforma Unificada de Governança i Serveis Sociosanitaris',
    badgeLabel: 'Plataforma Institucional',
    badgeVariant: 'purple',
    isDefault: true,
  });

  React.useEffect(() => {
    try {
      const match = typeof document !== 'undefined' ? document.cookie.split('; ').find(r => r.startsWith('bancactiu_tenant=')) : null;
      if (match) {
        const val = decodeURIComponent(match.split('=')[1]);
        const parsed = JSON.parse(val);
        if (parsed && parsed.id) setTenant(parsed);
      }
    } catch {
      // Ignorar fallback
    }
  }, []);

  return tenant;
}

export default function BancActiuLoginPage() {
  const tenant = useTenantContext();

  return (
    <RadialAuraBackground variant="nexus" className="h-screen w-screen overflow-hidden">
      <div className="h-full w-full max-h-screen overflow-hidden flex flex-col justify-between p-3 sm:p-5 select-none">
        {/* Capçalera d'accés institucional dinàmica */}
        <header className="flex justify-between items-center max-w-5xl w-full mx-auto pb-2 sm:pb-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  BancActiu <span className="text-cyan-600">3.0</span>
                </h1>
                <GlassBadge variant={tenant.badgeVariant || 'purple'} pulse>
                  {tenant.isDefault ? "Porta d'Accés Segura" : tenant.badgeLabel}
                </GlassBadge>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600">
                {tenant.isDefault
                  ? "Plataforma de Governança i Serveis Sociosanitaris"
                  : `${tenant.name} · Accés Autoritzat`}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <GlassBadge variant="emerald">
              ENS Nivell Alt
            </GlassBadge>
            <GlassBadge variant="purple">
              Zero-Trust
            </GlassBadge>
            {tenant.clientIp && tenant.clientIp !== '127.0.0.1' && (
              <span className="text-[10px] font-mono text-slate-600 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                IP: {tenant.clientIp}
              </span>
            )}
          </div>
        </header>

        {/* Zona Central amb Suspense boundary */}
        <main className="flex-1 flex items-center justify-center py-1 sm:py-2 overflow-hidden">
          <Suspense fallback={
            <div className="text-slate-700 text-sm animate-pulse flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600 animate-spin" />
              Carregant mòdul de seguretat...
            </div>
          }>
            <LoginForm />
          </Suspense>
        </main>

        {/* Peu de pàgina neutre */}
        <footer className="text-center text-[10px] sm:text-xs text-slate-500 pt-2 border-t border-slate-200 shrink-0">
          BancActiu Nexus 3.0 &middot; Control Perimetral i Seguretat Zero-Trust &middot; {tenant.isDefault ? "Arquitectura Distribuïda" : tenant.shortName}
        </footer>
      </div>
    </RadialAuraBackground>
  );
}
