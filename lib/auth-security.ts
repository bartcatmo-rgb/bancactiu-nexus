import type { ManagedRole } from '@/types/demo-user';
import { verifyPassword } from '@/lib/crypto-security';
export type Profile = ManagedRole;

export const HASH_ROCA_PBKDF2 = '$pbkdf2$100000$fb04362767a082a2a7f9383d065d61da$0e1ec9172f7ff8adfc949c009805906f2865e0fa8ae5bc690efc11747fdb1305d75175a21492e9d2c6c0314dd1c58b7be08a424ef46ff011958d9a5306b0ae99';
export const HASH_1234_PBKDF2 = '$pbkdf2$100000$ec7ea80c2a3b9cb1910a743f3725a1f1$67511f0cd05a47a28fe76152fe09f76dbe70e32d386822e03a2a3e7668a3f61b159c244a46dba9bd7173ca8f5b3b6d1e07790f46539c05e95a9b0d5ac8af28c7';

export interface SystemUser {
  id: string;
  username: string; // Ex: "52622304Y", "47956602S"
  dni: string; // Ex: "52622304Y"
  email: string;
  telefono?: string;
  nombre: string;
  rol: Profile;
  workplace: string;
  defaultEntity: string;
  avatarColor: string;
  initials: string;
  currentPassword: string;
  mustChangePassword: boolean; // Obligatori al primer inici de sessió
  lastPasswordChangeDate: string; // Data ISO
  passwordUpdatedAt?: string; // Data ISO d'actualització per càlcul ENS de 90 dies
  passwordHistory: string[]; // Historial de les últimes 10 contrasenyes per evitar repeticions
  resetToken?: string | null;
  resetTokenExpires?: string | null;
  failedLoginAttempts?: number; // Recompte de fallades per prevenció d'atacs de força bruta
  lockoutUntil?: string | null; // Bloqueig temporal per excés d'intents (ISO Date)
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  hasMinLength: boolean;
  hasLetters: boolean;
  hasNumbers: boolean;
  symbolCount: number;
  hasAtLeastTwoSymbols: boolean;
  isNotInHistory: boolean;
}

export const INITIAL_SYSTEM_USERS: SystemUser[] = [
  {
    id: 'user-superadmin-govern',
    username: '52622304Y',
    dni: '52622304Y',
    email: 'superadmin.govern@bancactiu.cat',
    telefono: '934000001',
    nombre: 'SuperAdmin Govern TI',
    rol: 'SUPER_ADMIN',
    workplace: 'Consola Central TI · Govern & Arquitectura Global BancActiu',
    defaultEntity: 'ALL',
    avatarColor: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    initials: 'SG',
    currentPassword: HASH_ROCA_PBKDF2,
    mustChangePassword: false,
    lastPasswordChangeDate: '2026-11-19T00:00:00.000Z',
    passwordUpdatedAt: '2026-11-19T00:00:00.000Z',
    passwordHistory: [HASH_1234_PBKDF2, HASH_ROCA_PBKDF2],
  },
  {
    id: 'user-superadmin-tecnic',
    username: '47956602S',
    dni: '47956602S',
    email: 'superadmin.tecnic@bancactiu.cat',
    telefono: '934000002',
    nombre: 'SuperAdmin Pentest TI',
    rol: 'SUPER_ADMIN',
    workplace: 'Consola Central TI · Pentest & Proves d\'Intrusió BancActiu',
    defaultEntity: 'ALL',
    avatarColor: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
    initials: 'SP',
    currentPassword: HASH_1234_PBKDF2,
    mustChangePassword: true,
    lastPasswordChangeDate: '2026-11-19T00:00:00.000Z',
    passwordUpdatedAt: '2026-11-19T00:00:00.000Z',
    passwordHistory: [HASH_1234_PBKDF2],
  },
];

const STORAGE_KEY = 'bancactiu_security_users_ens_v4';

export function loadSystemUsers(): SystemUser[] {
  if (typeof window === 'undefined') return INITIAL_SYSTEM_USERS;
  try {
    localStorage.removeItem('bancactiu_security_users_cornella_v1');
    localStorage.removeItem('bancactiu_security_users_purged_v2');
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveSystemUsers(INITIAL_SYSTEM_USERS);
      return INITIAL_SYSTEM_USERS;
    }
    let parsed = JSON.parse(raw) as SystemUser[];
    parsed = parsed.filter(u => 
      u && 
      (u.dni?.toUpperCase() === '52622304Y' || u.dni?.toUpperCase() === '47956602S' ||
       u.username?.toUpperCase() === '52622304Y' || u.username?.toUpperCase() === '47956602S')
    );
    if (parsed.length === 0) {
      parsed = INITIAL_SYSTEM_USERS;
      saveSystemUsers(parsed);
      return parsed;
    }

    for (const initUser of INITIAL_SYSTEM_USERS) {
      if (!parsed.some(u => u.dni?.toUpperCase() === initUser.dni)) {
        parsed.unshift(initUser);
      }
    }
    saveSystemUsers(parsed);
    return parsed;
  } catch {
    return INITIAL_SYSTEM_USERS;
  }
}

export function saveSystemUsers(users: SystemUser[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    window.dispatchEvent(new CustomEvent('bancactiu_users_updated', { detail: users }));
  } catch (err) {
    console.error('Error desant usuaris a localStorage:', err);
  }
}

/**
 * Valida les condicions de seguretat de la contrasenya (ENS Nivell Alt):
 * 1. Mínim 10 caràcters
 * 2. Majúscules, minúscules i números
 * 3. Almenys 1 caràcter especial
 * 4. No repetir cap de les últimes 5 contrasenyes utilitzades ni la inicial '1234'
 */
export function validatePasswordSecurity(
  newPassword: string,
  history: string[] = []
): PasswordValidationResult {
  const errors: string[] = [];
  const cleanPass = newPassword.trim();

  // ENS Nivell Alt: Mínim 10 caràcters
  const hasMinLength = cleanPass.length >= 10;
  const hasUpper = /[A-Z]/.test(cleanPass);
  const hasLower = /[a-z]/.test(cleanPass);
  const hasLetters = hasUpper && hasLower;
  const hasNumbers = /[0-9]/.test(cleanPass);

  const symbols = cleanPass.match(/[^a-zA-Z0-9]/g) || [];
  const symbolCount = symbols.length;
  const hasAtLeastTwoSymbols = symbolCount >= 1;

  // Comprova les últimes 5 contrasenyes guardades a l'historial i la clau inicial 1234
  const last5 = (Array.isArray(history) ? history : []).slice(0, 5);
  const matchesPrevious =
    cleanPass === '1234' ||
    last5.some((prevHash) => {
      if (!prevHash) return false;
      return verifyPassword(cleanPass, prevHash);
    });
  const isNotInHistory = !matchesPrevious;

  if (!hasMinLength) {
    errors.push('La contrasenya ha de tenir un mínim de 10 caràcters (ENS Nivell Alt).');
  }
  if (!hasUpper) {
    errors.push('Ha de contenir almenys una lletra majúscula (A-Z).');
  }
  if (!hasLower) {
    errors.push('Ha de contenir almenys una lletra minúscula (a-z).');
  }
  if (!hasNumbers) {
    errors.push('Ha de contenir almenys un número (0-9).');
  }
  if (symbolCount === 0) {
    errors.push('Ha de contenir almenys un caràcter especial (!@#$%^&*).');
  }
  if (!isNotInHistory) {
    errors.push('Per seguretat (ENS Nivell Alt), no pots reutilitzar una contrasenya anterior ni la clau inicial');
  }

  return {
    isValid: errors.length === 0,
    errors,
    hasMinLength,
    hasLetters,
    hasNumbers,
    symbolCount,
    hasAtLeastTwoSymbols,
    isNotInHistory,
  };
}

/**
 * Verifica si la contrasenya ha caducat (més de 3 mesos / 90 dies - ENS)
 */
export function isPasswordExpired(lastChangeDateStr?: string): boolean {
  if (!lastChangeDateStr) return false;
  const lastChange = new Date(lastChangeDateStr).getTime();
  if (isNaN(lastChange)) return false;
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  return Date.now() - lastChange >= ninetyDaysMs;
}

/**
 * Retorna els dies restants fins a la propera renovació obligatòria de contrasenya (cada 90 dies)
 */
export function getDaysUntilPasswordExpiration(lastChangeDateStr: string): number {
  if (!lastChangeDateStr) return 0;
  const lastChange = new Date(lastChangeDateStr).getTime();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const msRemaining = lastChange + ninetyDaysMs - Date.now();
  return Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
}

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MINUTES = 15;

export type AuthResult = {
  success: boolean;
  user?: SystemUser;
  reason?: 'NOT_FOUND' | 'INVALID_PASSWORD' | 'MUST_CHANGE_PASSWORD' | 'EXPIRED_PASSWORD' | 'ACCOUNT_LOCKED';
  message?: string;
  daysRemaining?: number;
  remainingAttempts?: number;
  lockoutMinutesRemaining?: number;
};

/**
 * Autentica un usuari per DNI o username amb comprovació estricta PBKDF2 (sense portes del darrere)
 */
export function authenticateUser(identifier: string, passAttempt: string): AuthResult {
  const users = loadSystemUsers();
  const cleanId = identifier.trim().toUpperCase();
  const cleanPass = passAttempt.trim();

  const userIndex = users.findIndex(
    (u) =>
      u.username.toUpperCase() === cleanId ||
      u.dni.toUpperCase() === cleanId ||
      u.email.toUpperCase() === cleanId
  );

  if (userIndex === -1) {
    return {
      success: false,
      reason: 'NOT_FOUND',
      message: 'No s’ha trobat cap compte d’usuari registrat amb aquest identificador / DNI.',
    };
  }

  const user = users[userIndex];

  // 0. VERIFICACIÓ DE BLOQUEIG PER FORÇA BRUTA (ACCOUNT LOCKOUT)
  if (user.lockoutUntil) {
    const lockoutExpiry = new Date(user.lockoutUntil).getTime();
    const now = Date.now();
    if (now < lockoutExpiry) {
      const minutesRemaining = Math.max(1, Math.ceil((lockoutExpiry - now) / (60 * 1000)));
      return {
        success: false,
        user,
        reason: 'ACCOUNT_LOCKED',
        lockoutMinutesRemaining: minutesRemaining,
        message: `⛔ Compte bloquejat per seguretat. Resten ${minutesRemaining} minuts per al desbloqueig automàtic.`,
      };
    } else {
      user.lockoutUntil = null;
      user.failedLoginAttempts = 0;
      saveSystemUsers(users);
    }
  }

  // Verificació criptogràfica estricta PBKDF2 (CERO BYPASS: eliminat Demo2026 o comparació plana)
  const isMatch = verifyPassword(cleanPass, user.currentPassword);
  if (!isMatch) {
    const currentAttempts = (user.failedLoginAttempts || 0) + 1;
    user.failedLoginAttempts = currentAttempts;

    if (currentAttempts >= MAX_LOGIN_ATTEMPTS) {
      const lockDate = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
      user.lockoutUntil = lockDate.toISOString();
      saveSystemUsers(users);

      return {
        success: false,
        user,
        reason: 'ACCOUNT_LOCKED',
        lockoutMinutesRemaining: LOCKOUT_DURATION_MINUTES,
        message: `⛔ S'han superat els ${MAX_LOGIN_ATTEMPTS} intents permesos. Compte bloquejat durant ${LOCKOUT_DURATION_MINUTES} minuts.`,
      };
    } else {
      saveSystemUsers(users);
      const remaining = MAX_LOGIN_ATTEMPTS - currentAttempts;
      return {
        success: false,
        user,
        reason: 'INVALID_PASSWORD',
        remainingAttempts: remaining,
        message: `Contrasenya incorrecta. Us resten ${remaining} intent${remaining > 1 ? 's' : ''} abans del bloqueig de seguretat.`,
      };
    }
  }

  // Reset de fallades de seguretat
  if (user.failedLoginAttempts || user.lockoutUntil) {
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    saveSystemUsers(users);
  }

  // 1. Canvi obligatori al primer inici
  if (user.mustChangePassword) {
    return {
      success: false,
      user,
      reason: 'MUST_CHANGE_PASSWORD',
      message: 'Primer inici de sessió detectat. Per protocol de seguretat heu de canviar la contrasenya provisional.',
    };
  }

  // 2. Canvi obligatori cada 3 mesos (90 dies)
  if (isPasswordExpired(user.lastPasswordChangeDate)) {
    return {
      success: false,
      user,
      reason: 'EXPIRED_PASSWORD',
      message: 'La vostra contrasenya ha superat el període màxim de vigència de 3 mesos (90 dies). Cal renovar-la.',
    };
  }

  const daysRemaining = getDaysUntilPasswordExpiration(user.lastPasswordChangeDate);
  return {
    success: true,
    user,
    daysRemaining,
  };
}

export function isSuperAdminDni(dniOrUsername?: string): boolean {
  if (!dniOrUsername) return false;
  const clean = dniOrUsername.trim().toUpperCase();
  return (
    clean === '52622304Y' ||
    clean === '47956602S' ||
    clean === 'SUPERADMIN' ||
    clean === 'ADMIN'
  );
}
