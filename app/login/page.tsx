'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
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
} from '@bancactiu/ui-glass';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const redirectPath = rawRedirect && rawRedirect !== '/login' && !rawRedirect.startsWith('/login') ? rawRedirect : '/';

  // Neteja imperativa d'estat residual en carregar /login (Elimina vulnerabilitat d'autologin)
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        localStorage.removeItem('bancactiu_session_cache');
        localStorage.removeItem('bancactiu_user');
        localStorage.removeItem('bancactiu_auth_state');
        localStorage.removeItem('bancactiu_auth_vault');
        localStorage.removeItem('bancactiu_security_users_cornella_v1');
        localStorage.removeItem('bancactiu_usuaris_cornella_v1');

        // Invalidar cookie residual de sessió
        document.cookie = 'bancactiu_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0; SameSite=Strict;';
      }

      fetch('/api/auth/logout', { method: 'POST', keepalive: true }).catch(() => {});
    } catch (e) {
      console.warn('[LOGIN-CLEANUP] Error netejant estat residual:', e);
    }
  }, []);

  // Camps obligatòriament buits per requisit estricte de seguretat
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const identifierInputRef = React.useRef<HTMLInputElement>(null);
  const passwordInputRef = React.useRef<HTMLInputElement>(null);

  // Neteja Imperativa Antiautocompletat Chrome / Edge
  React.useEffect(() => {
    const purgeCredentials = () => {
      setIdentifier('');
      setPassword('');
      if (identifierInputRef.current) {
        identifierInputRef.current.value = '';
      }
      if (passwordInputRef.current) {
        passwordInputRef.current.value = '';
      }
    };

    purgeCredentials();
    const t1 = setTimeout(purgeCredentials, 50);
    const t2 = setTimeout(purgeCredentials, 150);
    const t3 = setTimeout(purgeCredentials, 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Estat per a la configuració inicial de contrasenya (First-Time Setup) o Renovació 90 dies (ENS)
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [isExpired90Days, setIsExpired90Days] = useState(false);
  const [targetDni, setTargetDni] = useState('');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Validació de complexitat de contrasenya (ENS Nivell Alt: mínim 10 caràcters)
  const hasMinLength = newPassword.length >= 10;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial && passwordsMatch;

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.requirePasswordSetup) {
          setTargetDni(data.dni || identifier.trim().toUpperCase() || '');
          setCurrentPasswordInput(password);
          setIsFirstTimeSetup(true);
          setIsExpired90Days(Boolean(data.isExpired90Days));
          if (data.isExpired90Days) {
            setErrorMsg(data.message || "La teva contrasenya ha superat el període màxim de 90 dies (ENS). Has d'establir-ne una de nova per continuar");
          } else {
            setSuccessMsg(data.message || 'Primer accés detectat. Definiu la vostra contrasenya segura.');
          }
          return;
        }

        window.location.href = redirectPath;
      } else {
        setErrorMsg(data.error || 'Credencials no vàlides. Verifiqueu les dades.');
        if (data.triggerHoneypot) {
          setTimeout(() => {
            window.location.href = '/honeypot';
          }, 1500);
        }
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
          dni: targetDni || identifier.trim().toUpperCase() || '',
          currentPassword: currentPasswordInput || password,
          newPassword,
          confirmPassword,
        }),
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
          <div className="flex justify-center mb-3">
            <div className="h-12 px-4 py-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
              <img src="/bancactiu_logo.svg" alt="BancActiu" className="h-8 w-auto object-contain" />
            </div>
          </div>
          <div className="inline-flex p-2 rounded-xl bg-gradient-to-br from-purple-50 to-cyan-50 border border-purple-200 mb-1.5 shadow-sm">
            {isFirstTimeSetup ? (
              <Key className="w-5 h-5 text-amber-600 animate-pulse" />
            ) : (
              <Lock className="w-5 h-5 text-cyan-600" />
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {isExpired90Days
              ? 'Renovació de Seguretat ENS (90 dies)'
              : isFirstTimeSetup
              ? 'Configuració Inicial de Clau'
              : 'Gateway Launcher Nexus'}
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
            {isExpired90Days
              ? "La teva contrasenya ha superat el període màxim de 90 dies (ENS). Has d'establir-ne una de nova per continuar"
              : isFirstTimeSetup
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
          <form onSubmit={handleSetupPassword} autoComplete="off" autoCapitalize="off" spellCheck={false} className="space-y-4">
            {targetDni && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                Usuari vinculat: <strong className="font-mono text-slate-900">{targetDni}</strong>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nova Contrasenya Segura
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="random_new_pwd_not_saved"
                  id="random_new_pwd_not_saved"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  readOnly
                  onFocus={(e) => e.target.removeAttribute('readOnly')}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  placeholder=""
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-all pr-10"
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
                name="random_confirm_pwd_not_saved"
                id="random_confirm_pwd_not_saved"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                readOnly
                onFocus={(e) => e.target.removeAttribute('readOnly')}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder=""
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            {/* Checklist de requisits de seguretat */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-500">
                {hasMinLength ? <Check size={13} className="text-emerald-600" /> : <X size={13} className="text-slate-400" />}
                <span className={hasMinLength ? 'text-emerald-700 font-semibold' : ''}>Mínim 10 caràcters (ENS Nivell Alt)</span>
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
          /* VISTA 2: Formulari Estàndard d'Inici de Sessió per Credencials Corporatives */
          <form onSubmit={handleLogin} autoComplete="off" autoCapitalize="off" spellCheck={false} className="space-y-3 sm:space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Identificador d'Accés (DNI / Codi)
              </label>
              <input
                ref={identifierInputRef}
                type="text"
                name="random_identifier_field_not_saved"
                id="random_identifier_field_not_saved"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                readOnly
                onFocus={(e) => e.target.removeAttribute('readOnly')}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder=""
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 transition-all uppercase"
              />
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
                ref={passwordInputRef}
                type="password"
                name="random_secret_field_not_saved"
                id="random_secret_field_not_saved"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                readOnly
                onFocus={(e) => e.target.removeAttribute('readOnly')}
                autoComplete="new-password"
                autoCapitalize="off"
                spellCheck={false}
                placeholder=""
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 transition-all"
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

            <div className="pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  if (!identifier.trim()) {
                    setErrorMsg("Cal indicar el vostre identificador d'accés abans de configurar la clau inicial.");
                    return;
                  }
                  setTargetDni(identifier.trim().toUpperCase());
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
    } catch {}
  }, []);

  return tenant;
}

export default function BancActiuLoginPage() {
  const tenant = useTenantContext();

  return (
    <RadialAuraBackground variant="nexus" className="min-h-screen w-full overflow-x-hidden overflow-y-auto">
      <div className="min-h-screen w-full flex flex-col justify-between p-3 sm:p-5 select-none overflow-y-auto custom-scrollbar">
        <header className="flex justify-between items-center max-w-5xl w-full mx-auto pb-2 sm:pb-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Lock size={16} />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-bold text-slate-800 leading-none">
                BancActiu 2.0 · Plataforma Unificada de Gestió Sociosanitària
              </h1>
              <span className="text-[10px] text-slate-500 font-medium">
                Departament de Salut & Drets Socials · Generalitat de Catalunya
              </span>
            </div>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
            ENS Nivell Alt
          </span>
        </header>

        <main className="flex-1 flex items-center justify-center py-4">
          <Suspense fallback={<div className="text-xs text-slate-400">Carregant portal segur...</div>}>
            <LoginForm />
          </Suspense>
        </main>

        <footer className="text-center text-[10px] text-slate-400 py-2 border-t border-slate-100 shrink-0">
          © 2026 BancActiu · Generalitat de Catalunya · Certificació ENS Nivell Alt
        </footer>
      </div>
    </RadialAuraBackground>
  );
}
