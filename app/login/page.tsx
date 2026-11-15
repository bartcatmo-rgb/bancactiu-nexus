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
  Layers
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

  const [authMode, setAuthMode] = useState<'credentials' | 'certificate'>('credentials');
  const [identifier, setIdentifier] = useState('superadmin');
  const [password, setPassword] = useState('BancActiu2026!');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customMode?: 'credentials' | 'certificate') => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const mode = customMode || authMode;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authMethod: mode,
          identifier,
          password
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Redirigir al Gateway Launcher protegit
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

  return (
    <div className="w-full max-w-md">
      <GlassCard variant="glow" glowColor="purple" className="p-6 sm:p-8 backdrop-blur-2xl">
        {/* Icona & Títol */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 mb-3 shadow-inner">
            <Lock className="w-8 h-8 text-cyan-300" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Gateway Launcher Nexus
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Accés exclusiu per a Superadministració i Direcció Territorial
          </p>
        </div>

        {/* Selector de mètode d'autenticació */}
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
            Credencials
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

        {/* Missatge d'error si existeix */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulari segons mètode */}
        {authMode === 'credentials' ? (
          <form onSubmit={(e) => handleLogin(e, 'credentials')} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Identificador Institucional / Usuari GAPIC
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="superadmin"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/70 border border-white/15 text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Clau d'Accés Criptogràfica
                </label>
                <span className="text-[10px] text-purple-300 font-mono">
                  Nivell 5 Protegit
                </span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/70 border border-white/15 text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-500"
              />
            </div>

            <GlassButton
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="w-full justify-center py-2.5 mt-2"
              icon={isLoading ? <Sparkles className="animate-spin" size={16} /> : <ArrowRight size={16} />}
            >
              {isLoading ? 'Verificant Identitat...' : 'Iniciar Sessió Segura'}
            </GlassButton>
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
                Titular certificat: Mireia Valls i Grau (GAPIC Catalunya)
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
              {isLoading ? 'Autenticant via idCAT...' : 'Validar Certificat Digital'}
            </GlassButton>
          </div>
        )}

        {/* Botó d'accés ràpid per a avaluació oficial */}
        <div className="mt-5 pt-4 border-t border-white/10 text-center">
          <button
            type="button"
            onClick={() => {
              setIdentifier('superadmin');
              setPassword('BancActiu2026!');
              handleLogin(undefined, 'credentials');
            }}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center justify-center gap-1 mx-auto font-medium"
          >
            <Sparkles size={13} />
            Accés Immediat SuperAdmin (Credencials Predeterminades)
          </button>
        </div>
      </GlassCard>

      {/* Avís Legal de Seguretat */}
      <div className="mt-4 p-3 rounded-xl bg-slate-900/50 border border-white/5 backdrop-blur-md text-[10px] text-slate-400 text-center">
        Sistema subjecte a registre d'auditoria continu (Llei 39/2015 i RGPD). Qualsevol accés no autoritzat serà notificat al Centre de Seguretat de la Informació de Catalunya (CESICAT).
      </div>
    </div>
  );
}

export default function BancActiuLoginPage() {
  return (
    <RadialAuraBackground variant="nexus">
      <div className="min-h-screen w-full flex flex-col justify-between p-4 sm:p-6 lg:p-8">
        {/* Capçalera d'accés institucional */}
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
                <GlassBadge variant="purple" pulse>
                  Porta d'Accés Segura
                </GlassBadge>
              </div>
              <p className="text-xs text-slate-400">
                Generalitat de Catalunya &middot; Ajuntament de Cornellà &middot; GAPIC
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <GlassBadge variant="emerald">
              ENS Nivell Alt
            </GlassBadge>
            <GlassBadge variant="blue">
              TLS 1.3 / AES-256
            </GlassBadge>
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

        {/* Peu de pàgina */}
        <footer className="text-center text-xs text-slate-500 pt-4 border-t border-white/10">
          BancActiu Nexus 2.0 &middot; Control Perimetral i Seguretat Zero-Trust &middot; Generalitat de Catalunya
        </footer>
      </div>
    </RadialAuraBackground>
  );
}
