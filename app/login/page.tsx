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
  const redirectPath = searchParams.get('redirect') || '/';

  // Mode d'autenticació: credentials / certificate
  const [authMode, setAuthMode] = useState<'credentials' | 'certificate'>('credentials');

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
          setTargetDni(data.dni || identifier.trim().toUpperCase() || '52622304Y');
          setIsFirstTimeSetup(true);
          setSuccessMsg(data.message || 'Primer accés detectat. Definiu la vostra contrasenya de Superadministrador.');
          return;
        }

        // Accés completat, redirigir al Gateway Launcher
        router.push(redirectPath);
        router.refresh();
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
          dni: targetDni || '52622304Y',
          newPassword,
          confirmPassword
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg('Contrasenya configurada amb èxit. Accedint al sistema...');
        setTimeout(() => {
          router.push(redirectPath);
          router.refresh();
        }, 1200);
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
    <div className="w-full max-w-md">
      <GlassCard variant="glow" glowColor="purple" className="p-6 sm:p-8 backdrop-blur-2xl">
        {/* Capçalera de la Targeta */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 mb-3 shadow-inner">
            {isFirstTimeSetup ? (
              <Key className="w-8 h-8 text-amber-300 animate-pulse" />
            ) : (
              <Lock className="w-8 h-8 text-cyan-300" />
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {isFirstTimeSetup ? 'Configuració Inicial de Clau' : 'Gateway Launcher Nexus'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {isFirstTimeSetup
              ? 'Definiu la contrasenya personal per al compte d\'administració'
              : 'Accés autenticat per a personal acreditat i governança perimetral'}
          </p>
        </div>

        {/* Missatges d'estat */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* VISTA 1: Formulari de Primer Inici (First-Time Password Setup) */}
        {isFirstTimeSetup ? (
          <form onSubmit={handleSetupPassword} className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200">
              Superadministrador vinculat: <strong className="font-mono text-white">{targetDni || '52622304Y'}</strong> (Mireia Valls)
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Nova Contrasenya Segura
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Introduïu una contrasenya robusta"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/70 border border-white/15 text-white text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder:text-slate-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Confirmació de la Contrasenya
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Repetiu la contrasenya"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/70 border border-white/15 text-white text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder:text-slate-500"
              />
            </div>

            {/* Checklist de requisits de seguretat */}
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-400">
                {hasMinLength ? <Check size={13} className="text-emerald-400" /> : <X size={13} className="text-slate-500" />}
                <span className={hasMinLength ? 'text-emerald-300' : ''}>Mínim 8 caràcters</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                {hasUpper && hasLower ? <Check size={13} className="text-emerald-400" /> : <X size={13} className="text-slate-500" />}
                <span className={hasUpper && hasLower ? 'text-emerald-300' : ''}>Majúscules i minúscules (A-Z, a-z)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                {hasNumber ? <Check size={13} className="text-emerald-400" /> : <X size={13} className="text-slate-500" />}
                <span className={hasNumber ? 'text-emerald-300' : ''}>Com a mínim un número (0-9)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                {hasSpecial ? <Check size={13} className="text-emerald-400" /> : <X size={13} className="text-slate-500" />}
                <span className={hasSpecial ? 'text-emerald-300' : ''}>Caràcter especial (!@#$%^&*)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                {passwordsMatch ? <Check size={13} className="text-emerald-400" /> : <X size={13} className="text-slate-500" />}
                <span className={passwordsMatch ? 'text-emerald-300' : ''}>Les contrasenyes coincideixen</span>
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
              className="w-full text-center text-xs text-slate-400 hover:text-white pt-2 transition-colors"
            >
              ← Tornar a la pantalla d'inici de sessió
            </button>
          </form>
        ) : (
          /* VISTA 2: Formulari Estàndard d'Inici de Sessió (Sense Autofill) */
          <>
            {/* Selector de mètode: Credencials o Certificat */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl border border-white/10 mb-5">
              <button
                type="button"
                onClick={() => setAuthMode('credentials')}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'credentials'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound size={13} />
                DNI / Clau
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('certificate')}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'certificate'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award size={13} />
                idCAT / T-CAT
              </button>
            </div>

            {authMode === 'credentials' ? (
              <form onSubmit={(e) => handleLogin(e, 'credentials')} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    DNI del Superadministrador
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoComplete="off"
                    placeholder="ex: 52622304Y"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/70 border border-white/15 text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-600 uppercase"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Compte arrel vinculat al DNI institucional <span className="font-mono text-cyan-300">52622304Y</span>
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-medium text-slate-300">
                      Clau d'Accés
                    </label>
                    <span className="text-[10px] text-purple-300 font-mono">
                      Nivell 5 Protegit
                    </span>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="off"
                    placeholder="Introdueixi la seva contrasenya"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/70 border border-white/15 text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-600"
                  />
                </div>

                <GlassButton
                  type="submit"
                  variant="primary"
                  disabled={isLoading || !identifier.trim()}
                  className="w-full justify-center py-2.5 mt-2"
                  icon={isLoading ? <Sparkles className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                >
                  {isLoading ? 'Verificant Identitat...' : 'Iniciar Sessió Segura'}
                </GlassButton>

                {/* Opció per establir primer inici */}
                <div className="pt-3 border-t border-white/10 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetDni('52622304Y');
                      setIsFirstTimeSetup(true);
                      setErrorMsg(null);
                      setSuccessMsg('Configuració de primer accés per al DNI 52622304Y.');
                    }}
                    className="text-xs text-amber-300 hover:text-amber-200 transition-colors flex items-center justify-center gap-1 mx-auto font-medium"
                  >
                    <Key size={13} />
                    Primer accés? Definiu la vostra contrasenya inicial
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-left space-y-2">
                  <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold">
                    <FileCheck2 size={16} />
                    Certificats Digitals Oficials Admesos
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    S'ha detectat la presència de dispositius de signatura electrònica vàlids (idCAT, T-CAT corporatiu de Salut, DNI Electrònic o Cl@ve).
                  </p>
                  <div className="pt-2 border-t border-cyan-500/20 text-[10px] text-cyan-200 font-mono">
                    Certificat digital d'empleat públic (T-CAT) o ciutadà acreditat (idCAT / DNIe)
                  </div>
                </div>

                <GlassButton
                  type="button"
                  variant="primary"
                  disabled={isLoading}
                  onClick={() => handleLogin(undefined, 'certificate')}
                  className="w-full justify-center py-2.5"
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
      <div className="mt-4 p-3 rounded-xl bg-slate-900/50 border border-white/5 backdrop-blur-md text-[10px] text-slate-400 text-center">
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
    name: 'BancActiu 2.0 Enterprise',
    shortName: 'BancActiu 2.0',
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
    <RadialAuraBackground variant="nexus">
      <div className="min-h-screen w-full flex flex-col justify-between p-4 sm:p-6 lg:p-8">
        {/* Capçalera d'accés institucional dinàmica */}
        <header className="flex justify-between items-center max-w-5xl w-full mx-auto pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white tracking-tight">
                  BancActiu <span className="text-cyan-400">2.0</span>
                </h1>
                <GlassBadge variant={tenant.badgeVariant || 'purple'} pulse>
                  {tenant.isDefault ? "Porta d'Accés Segura" : tenant.badgeLabel}
                </GlassBadge>
              </div>
              <p className="text-xs text-slate-400">
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
              <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                IP: {tenant.clientIp}
              </span>
            )}
          </div>
        </header>

        {/* Zona Central amb Suspense boundary */}
        <main className="flex-1 flex items-center justify-center my-6">
          <Suspense fallback={
            <div className="text-white text-sm animate-pulse flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400 animate-spin" />
              Carregant mòdul de seguretat...
            </div>
          }>
            <LoginForm />
          </Suspense>
        </main>

        {/* Peu de pàgina neutre */}
        <footer className="text-center text-xs text-slate-500 pt-4 border-t border-white/10">
          BancActiu Nexus 2.0 &middot; Control Perimetral i Seguretat Zero-Trust &middot; {tenant.isDefault ? "Arquitectura Distribuïda" : tenant.shortName}
        </footer>
      </div>
    </RadialAuraBackground>
  );
}
