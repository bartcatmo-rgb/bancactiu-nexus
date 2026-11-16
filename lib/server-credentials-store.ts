/**
 * Magatzem de Persistència de Credencials al Servidor / Backend (Render / Node.js)
 * Assegura que la contrasenya del Superadministrador (52622304Y) i resta d'usuaris
 * persisteixi al servidor de forma xifrada (PBKDF2 SHA-512) segons RGPD / LOPDGDD 3/2018.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import type { SystemUser } from '@/lib/auth-security';
import { INITIAL_SYSTEM_USERS, validatePasswordSecurity } from '@/lib/auth-security';
import { hashPassword, verifyPassword } from '@/lib/crypto-security';

// Determina el fitxer de dades privat al servidor amb fallback a /tmp en entorns serverless (Vercel)
function getDbFilePath(): string {
  const primaryDir = path.join(process.cwd(), 'data');
  const primaryFile = path.join(primaryDir, 'db_credentials_users.json');
  try {
    if (!fs.existsSync(primaryDir)) {
      fs.mkdirSync(primaryDir, { recursive: true });
    }
    const testFile = path.join(primaryDir, '.write_test');
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    return primaryFile;
  } catch {
    const tmpDir = path.join(os.tmpdir(), 'bancactiu_data');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    return path.join(tmpDir, 'db_credentials_users.json');
  }
}

/**
 * Retorna un objecte d'usuari sanititzat (sense contrasenya ni historial de hashes en text pla)
 */
export function sanitizeUser(user: SystemUser): Omit<SystemUser, 'currentPassword' | 'passwordHistory'> {
  const { currentPassword: _p, passwordHistory: _h, ...safe } = user;
  return safe;
}

/**
 * Inicialitza i llegeix els usuaris persistits al servidor
 */
export function getServerUsers(): SystemUser[] {
  try {
    const dbFile = getDbFilePath();
    const dataDir = path.dirname(dbFile);

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(dbFile)) {
      // Inicialitza amb hashes segurs
      const seeded = INITIAL_SYSTEM_USERS.map((u) => ({
        ...u,
        currentPassword: u.currentPassword.startsWith('$pbkdf2$')
          ? u.currentPassword
          : hashPassword(u.currentPassword),
      }));
      fs.writeFileSync(dbFile, JSON.stringify(seeded, null, 2), 'utf-8');
      return seeded;
    }

    const content = fs.readFileSync(dbFile, 'utf-8');
    const parsed = JSON.parse(content) as SystemUser[];

    // Assegurar que el superadministrador 52622304Y estigui sempre inicialitzat
    const hasSuperAdmin = parsed.some(
      (u) => u.username.toUpperCase() === '52622304Y' || u.dni.toUpperCase() === '52622304Y'
    );

    if (!hasSuperAdmin) {
      const superAdminInitial = INITIAL_SYSTEM_USERS.find((u) => u.username === '52622304Y');
      if (superAdminInitial) {
        parsed.unshift({
          ...superAdminInitial,
          currentPassword: superAdminInitial.currentPassword.startsWith('$pbkdf2$')
            ? superAdminInitial.currentPassword
            : hashPassword(superAdminInitial.currentPassword),
        });
        saveServerUsers(parsed);
      }
    }

    // Assegurar que el superadministrador junior 48956602Z estigui sempre inicialitzat
    const hasJuniorAdmin = parsed.some(
      (u) => u.username.toUpperCase() === '48956602Z' || u.dni.toUpperCase() === '48956602Z'
    );

    if (!hasJuniorAdmin) {
      const juniorInitial = INITIAL_SYSTEM_USERS.find((u) => u.username === '48956602Z');
      if (juniorInitial) {
        parsed.push({
          ...juniorInitial,
          currentPassword: juniorInitial.currentPassword.startsWith('$pbkdf2$')
            ? juniorInitial.currentPassword
            : hashPassword(juniorInitial.currentPassword),
        });
        saveServerUsers(parsed);
      }
    }

    return parsed;
  } catch (error) {
    console.error('[ServerCredentialsStore] Error llegint db_credentials_users.json:', error);
    return INITIAL_SYSTEM_USERS;
  }
}

/**
 * Desa la col·lecció d'usuaris a disc al servidor
 */
export function saveServerUsers(users: SystemUser[]): void {
  try {
    const dbFile = getDbFilePath();
    const dataDir = path.dirname(dbFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(dbFile, JSON.stringify(users, null, 2), 'utf-8');
  } catch (error) {
    console.error('[ServerCredentialsStore] Error desant db_credentials_users.json:', error);
  }
}

/**
 * Desa directament la nova contrasenya d'un usuari regularitzat (primer inici)
 */
export function saveUserPasswordDirect(
  identifier: string,
  newHash: string,
  history: string[]
): boolean {
  try {
    const users = getServerUsers();
    const cleanId = identifier.trim().toUpperCase();
    const userIdx = users.findIndex(
      (u) =>
        u.dni.toUpperCase() === cleanId ||
        u.username.toUpperCase() === cleanId ||
        u.email.toUpperCase() === cleanId ||
        (cleanId === 'ADMINISTRADOR' && (u.username.toUpperCase().includes('ADMIN') || u.id.toLowerCase().includes('admin')))
    );
    if (userIdx !== -1) {
      users[userIdx] = {
        ...users[userIdx],
        currentPassword: newHash,
        mustChangePassword: false,
        passwordHistory: history.slice(0, 10),
        lastPasswordChangeDate: new Date().toISOString(),
        failedLoginAttempts: 0,
        lockoutUntil: null,
      };
      saveServerUsers(users);
      return true;
    }
    return false;
  } catch (err) {
    console.error('[ServerCredentialsStore] Error a saveUserPasswordDirect:', err);
    return false;
  }
}

/**
 * Actualitza la contrasenya d'un usuari al servidor aplicant hash criptogràfic PBKDF2
 */
export function updateServerUserPassword(
  dniOrUsername: string,
  passwordActual: string,
  passwordNova: string
): { ok: boolean; missatge: string; user?: Omit<SystemUser, 'currentPassword' | 'passwordHistory'> } {
  const users = getServerUsers();
  const cleanId = dniOrUsername.trim().toUpperCase();

  const userIdx = users.findIndex(
    (u) =>
      u.dni.toUpperCase() === cleanId ||
      u.username.toUpperCase() === cleanId ||
      u.email.toUpperCase() === cleanId
  );

  if (userIdx === -1) {
    return {
      ok: false,
      missatge: `No s'ha trobat cap usuari amb DNI/Identificador ${dniOrUsername} a la base de dades.`,
    };
  }

  const user = users[userIdx];

  // Comprova que la contrasenya actual sigui correcta mitjançant comparació segura
  const isMatch = verifyPassword(passwordActual.trim(), user.currentPassword);
  if (!isMatch) {
    return {
      ok: false,
      missatge: 'La contrasenya actual proporcionada no és correcta.',
    };
  }

  // Valida la seguretat de la nova contrasenya
  const history = Array.isArray(user.passwordHistory) ? user.passwordHistory : [];
  const validation = validatePasswordSecurity(passwordNova, history);
  if (!validation.isValid) {
    return {
      ok: false,
      missatge: validation.errors[0] || 'La contrasenya no compleix els criteris de seguretat.',
    };
  }

  // Xifratge criptogràfic PBKDF2 segons RGPD
  const newHashed = hashPassword(passwordNova.trim());

  // Afegeix la contrasenya actual a l'historial (fins a 10)
  const updatedHistory = [...history, user.currentPassword].slice(-10);

  const updatedUser: SystemUser = {
    ...user,
    currentPassword: newHashed,
    mustChangePassword: false, // Ja no és necessari canviar-la
    lastPasswordChangeDate: new Date().toISOString(),
    passwordHistory: updatedHistory,
    failedLoginAttempts: 0,
    lockoutUntil: null,
  };

  users[userIdx] = updatedUser;
  saveServerUsers(users);

  return {
    ok: true,
    missatge: 'Contrasenya actualitzada i xifrada correctament a la base de dades central de BancActiu 1.0 (Render)',
    user: sanitizeUser(updatedUser),
  };
}

/**
 * Autentica un usuari contra la base de dades central del servidor amb hash segur
 */
export function authenticateServerUser(
  identifier: string,
  passwordAttempt: string
): {
  ok: boolean;
  user?: SystemUser;
  sanitizedUser?: Omit<SystemUser, 'currentPassword' | 'passwordHistory'>;
  reason?: 'NOT_FOUND' | 'INVALID_PASSWORD' | 'MUST_CHANGE_PASSWORD' | 'EXPIRED_PASSWORD' | 'ACCOUNT_LOCKED';
  missatge?: string;
} {
  const users = getServerUsers();
  const cleanId = identifier.trim().toUpperCase();
  const cleanPass = passwordAttempt.trim();

  const userIdx = users.findIndex(
    (u) =>
      u.dni.toUpperCase() === cleanId ||
      u.username.toUpperCase() === cleanId ||
      u.email.toUpperCase() === cleanId
  );

  if (userIdx === -1) {
    return {
      ok: false,
      reason: 'NOT_FOUND',
      missatge: 'Identificador o DNI no registrat al servidor.',
    };
  }

  const user = users[userIdx];

  // Comprova bloqueig temporal per atacs de força bruta
  if (user.lockoutUntil) {
    const lockoutExpiry = new Date(user.lockoutUntil).getTime();
    const now = Date.now();
    if (now < lockoutExpiry) {
      const minutesRemaining = Math.max(1, Math.ceil((lockoutExpiry - now) / (60 * 1000)));
      return {
        ok: false,
        sanitizedUser: sanitizeUser(user),
        reason: 'ACCOUNT_LOCKED',
        missatge: `Compte bloquejat al servidor per seguretat. Resten ${minutesRemaining} minuts.`,
      };
    } else {
      user.lockoutUntil = null;
      user.failedLoginAttempts = 0;
      saveServerUsers(users);
    }
  }

  // Comprova contrasenya amb suport per hash i migració automàtica a PBKDF2
  const isMatch = verifyPassword(cleanPass, user.currentPassword);
  if (!isMatch) {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    user.failedLoginAttempts = attempts;
    if (attempts >= 5) {
      user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      saveServerUsers(users);
      return {
        ok: false,
        sanitizedUser: sanitizeUser(user),
        reason: 'ACCOUNT_LOCKED',
        missatge: "S'ha superat el límit d'intents. Compte bloquejat 15 minuts al servidor.",
      };
    }
    saveServerUsers(users);
    return {
      ok: false,
      sanitizedUser: sanitizeUser(user),
      reason: 'INVALID_PASSWORD',
      missatge: `Contrasenya incorrecta. Intents restants: ${5 - attempts}.`,
    };
  }

  // Migració transparent a PBKDF2 si encara era en text pla
  if (!user.currentPassword.startsWith('$pbkdf2$')) {
    user.currentPassword = hashPassword(cleanPass);
    saveServerUsers(users);
  }

  // Reset intents fallits
  if (user.failedLoginAttempts || user.lockoutUntil) {
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    saveServerUsers(users);
  }

  // Primer inici o canvi obligatori
  if (user.mustChangePassword) {
    return {
      ok: false,
      user,
      sanitizedUser: sanitizeUser(user),
      reason: 'MUST_CHANGE_PASSWORD',
      missatge: 'Primer inici de sessió detectat. Cal canviar la contrasenya provisional.',
    };
  }

  return {
    ok: true,
    user,
    sanitizedUser: sanitizeUser(user),
    missatge: 'Autenticació correcta al servidor central.',
  };
}
