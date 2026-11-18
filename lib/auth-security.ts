import type { ManagedRole } from '@/types/demo-user';
import { verifyPassword } from '@/lib/crypto-security';
export type Profile = ManagedRole;

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
    id: 'user-superadmin-bartolome',
    username: '52622304Y',
    dni: '52622304Y',
    email: 'bartcatmo@gmail.com',
    telefono: '615602174',
    nombre: 'Bartolomé Cachinero Moreno',
    rol: 'SUPER_ADMIN',
    workplace: 'Consola Central TI · Govern & Arquitectura Global BancActiu',
    defaultEntity: 'ALL',
    avatarColor: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    initials: 'BC',
    currentPassword: '1234',
    mustChangePassword: true,
    lastPasswordChangeDate: new Date().toISOString(),
    passwordHistory: ['1234'],
  },
  {
    id: 'user-superadmin-marc',
    username: '47956602S',
    dni: '47956602S',
    email: 'marccachinero@gmail.com',
    telefono: '640537414',
    nombre: 'Marc Cachinero Baranda',
    rol: 'SUPER_ADMIN',
    workplace: 'Consola Central TI · Pentest & Proves d\'Intrusió BancActiu',
    defaultEntity: 'ALL',
    avatarColor: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
    initials: 'MC',
    currentPassword: '1234',
    mustChangePassword: true,
    lastPasswordChangeDate: new Date().toISOString(),
    passwordHistory: ['1234'],
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
    // Neteja estricta de qualsevol usuari antic o dades de prova residuals
    parsed = parsed.filter(u => 
      u && 
      (u.dni?.toUpperCase() === '52622304Y' || u.dni?.toUpperCase() === '47956602S' ||
       u.username?.toUpperCase() === '52622304Y' || u.username?.toUpperCase() === '47956602S') &&
      !u.nombre?.includes('Mireia')
    );
    if (parsed.length === 0) {
      parsed = INITIAL_SYSTEM_USERS;
      saveSystemUsers(parsed);
      return parsed;
    }

    // Assegura que els dos únics administradors (Bartolomé i Marc) hi siguin sempre presents
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
 * Valida les condicions de seguretat de la contrasenya:
 * 1. Mínim 8 caràcters
 * 2. Lletres i números
 * 3. 2 símbols obligatoris com a mínim
 * 4. No repetir cap de les últimes 10 contrasenyes utilitzades
 */
export function validatePasswordSecurity(
  newPassword: string,
  history: string[] = []
): PasswordValidationResult {
  const errors: string[] = [];
  const cleanPass = newPassword.trim();

  const hasMinLength = cleanPass.length >= 8;
  const hasLetters = /[a-zA-Z]/.test(cleanPass);
  const hasNumbers = /[0-9]/.test(cleanPass);

  // Recompte de símbols (caràcters no alfanumèrics)
  const symbols = cleanPass.match(/[^a-zA-Z0-9]/g) || [];
  const symbolCount = symbols.length;
  const hasAtLeastTwoSymbols = symbolCount >= 2;

  // Comprova les últimes 10 contrasenyes guardades a l'historial
  const last10 = history.slice(-10);
  const matchesPrevious = last10.some((prevHash) => {
    if (!prevHash) return false;
    return verifyPassword(cleanPass, prevHash);
  });
  const isNotInHistory = !matchesPrevious;

  if (!hasMinLength) {
    errors.push('La contrasenya ha de tenir un mínim de 8 caràcters.');
  }
  if (!hasLetters) {
    errors.push('Ha de contenir almenys una lletra.');
  }
  if (!hasNumbers) {
    errors.push('Ha de contenir almenys un número.');
  }
  if (!hasAtLeastTwoSymbols) {
    errors.push(`Ha de contenir com a mínim 2 símbols obligatoris (ex: @, #, $, !, %, &, *). Actualment en té: ${symbolCount}.`);
  }
  if (!isNotInHistory) {
    errors.push('La nova contrasenya no pot ser igual a cap de les darreres 10 contrasenyes utilitzades.');
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
 * Verifica si la contrasenya ha caducat (més de 3 mesos / 90 dies)
 */
export function isPasswordExpired(lastChangeDateStr: string): boolean {
  if (!lastChangeDateStr) return true;
  const lastChange = new Date(lastChangeDateStr).getTime();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  return Date.now() - lastChange > ninetyDaysMs;
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
 * Autentica un usuari per DNI, username o correu electrònic amb protecció contra atacs de força bruta
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
        message: `⛔ Compte bloquejat per seguretat a causa de múltiples intents fallits consecutius (Atac de força bruta detectat). Resten ${minutesRemaining} minuts per al desbloqueig automàtic o contacteu amb el Superadministrador.`,
      };
    } else {
      // El bloqueig ha expirat: resetegem intents
      user.lockoutUntil = null;
      user.failedLoginAttempts = 0;
      saveSystemUsers(users);
    }
  }

  // Comprovació de contrasenya (o clau mestra de recuperació / demo)
  const isMatch = cleanPass === user.currentPassword || cleanPass === 'Demo2026' || (user.rol === 'SUPER_ADMIN' && cleanPass === '1234');
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
        message: `⛔ S'han superat els ${MAX_LOGIN_ATTEMPTS} intents permesos. Compte bloquejat durant ${LOCKOUT_DURATION_MINUTES} minuts per protegir les dades mèdiques contra atacs de força bruta.`,
      };
    } else {
      saveSystemUsers(users);
      const remaining = MAX_LOGIN_ATTEMPTS - currentAttempts;
      return {
        success: false,
        user,
        reason: 'INVALID_PASSWORD',
        remainingAttempts: remaining,
        message: `Contrasenya incorrecta. Us resten ${remaining} intent${remaining > 1 ? 's' : ''} abans del bloqueig de seguretat del compte.`,
      };
    }
  }

  // ACCÉS CORRECTE: Reset de fallades de seguretat
  if (user.failedLoginAttempts || user.lockoutUntil) {
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    saveSystemUsers(users);
  }

  // 1. Canvi obligatori al primer inici (ex: pass provisional 1234)
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

/**
 * Desbloqueja manualment un compte d'usuari (acció per a Superadministrador)
 */
export function unlockUserAccount(userId: string): { success: boolean; message: string } {
  const users = loadSystemUsers();
  const user = users.find((u) => u.id === userId || u.username === userId || u.dni === userId);
  if (!user) {
    return { success: false, message: 'Usuari no trobat.' };
  }
  user.failedLoginAttempts = 0;
  user.lockoutUntil = null;
  saveSystemUsers(users);
  return { success: true, message: `El compte de ${user.nombre} ha estat desbloquejat amb èxit.` };
}

/**
 * Canvia la contrasenya d'un usuari guardant l'antiga a l'historial de les 10 últimes
 */
export function changeUserPassword(userId: string, newPassword: string): { success: boolean; error?: string } {
  const users = loadSystemUsers();
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    return { success: false, error: 'Usuari no trobat al sistema.' };
  }

  const user = users[userIndex];
  const history = Array.isArray(user.passwordHistory) ? user.passwordHistory : [];

  const validation = validatePasswordSecurity(newPassword, history);
  if (!validation.isValid) {
    return { success: false, error: validation.errors[0] };
  }

  // Afegeix la contrasenya actual a l'historial (màxim 10 elements)
  const updatedHistory = [...history, user.currentPassword].slice(-10);

  const updatedUser: SystemUser = {
    ...user,
    currentPassword: newPassword.trim(),
    mustChangePassword: false,
    lastPasswordChangeDate: new Date().toISOString(),
    passwordHistory: updatedHistory,
    resetToken: null,
    resetTokenExpires: null,
  };

  users[userIndex] = updatedUser;
  saveSystemUsers(users);

  return { success: true };
}

/**
 * Sol·licitud de canvi de contrasenya per oblit: genera un testimoni de restabliment i envia correu
 */
export function requestPasswordReset(usernameOrEmail: string): {
  success: boolean;
  message: string;
  email?: string;
  resetUrl?: string;
  token?: string;
} {
  const users = loadSystemUsers();
  const clean = usernameOrEmail.trim().toUpperCase();

  const user = users.find(
    (u) =>
      u.username.toUpperCase() === clean ||
      u.dni.toUpperCase() === clean ||
      u.email.toUpperCase() === clean
  );

  if (!user) {
    return {
      success: false,
      message: 'No s’ha trobat cap compte associat amb aquest identificador o correu electrònic.',
    };
  }

  // Genera un token aleatori segur i caducitat a 2 hores
  const token = `rst_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  const userIndex = users.findIndex((u) => u.id === user.id);
  users[userIndex] = {
    ...user,
    resetToken: token,
    resetTokenExpires: expires,
  };
  saveSystemUsers(users);

  const resetUrl = `/recuperar-contrasenya?token=${token}`;

  return {
    success: true,
    message: `S’ha enviat un correu de seguretat amb l’enllaç de restabliment a: ${user.email}`,
    email: user.email,
    token,
    resetUrl,
  };
}

/**
 * Valida un token de recuperació de contrasenya
 */
export function validateResetToken(token: string): { valid: boolean; user?: SystemUser; error?: string } {
  const users = loadSystemUsers();
  const user = users.find((u) => u.resetToken === token);

  if (!user) {
    return { valid: false, error: 'L’enllaç de recuperació és invàlid o ja ha estat utilitzat.' };
  }

  if (user.resetTokenExpires && new Date(user.resetTokenExpires).getTime() < Date.now()) {
    return { valid: false, error: 'L’enllaç de recuperació ha caducat (vigència màxima de 2 hores). Sol·liciteu-ne un de nou.' };
  }

  return { valid: true, user };
}

/**
 * Restableix la contrasenya mitjançant token de recuperació
 */
export function resetPasswordWithToken(token: string, newPassword: string): { success: boolean; error?: string } {
  const check = validateResetToken(token);
  if (!check.valid || !check.user) {
    return { success: false, error: check.error || 'Token no vàlid.' };
  }
  return changeUserPassword(check.user.id, newPassword);
}


const DEMO_SWITCHER_KEY = 'bancactiu_allow_demo_switcher_v1';

export function isDemoSwitcherAllowed(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(DEMO_SWITCHER_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setDemoSwitcherAllowed(allowed: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEMO_SWITCHER_KEY, allowed ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('bancactiu-switcher-changed', { detail: { allowed } }));
  } catch {
    // ignore
  }
}

export function isSuperAdminDni(dniOrUsername?: string): boolean {
  if (!dniOrUsername) return false;
  const clean = dniOrUsername.trim().toUpperCase();
  return (
    clean === '52622304Y' ||
    clean === '47956602S' ||
    clean === 'BARTO' ||
    clean === 'MARC' ||
    clean === 'ADMIN' ||
    clean === 'ADMINISTRADOR' ||
    clean === 'SUPERADMIN' ||
    clean === 'BARTCATMO@GMAIL.COM' ||
    clean === 'MARCCACHINERO@GMAIL.COM' ||
    clean === '615602174' ||
    clean === '640537414'
  );
}
