/**
 * MÒDUL DE CRIPTOGRAFIA I SEGURETAT SANITÀRIA (RGPD / LOPDGDD 3/2018 / ENS NIVEL ALTO)
 * Implementació de hashing de contrasenyes mitjançant PBKDF2 (SHA-512) amb 210.000 iteracions
 * i salt criptogràfic individual per a compliment estricte de seguretat sanitària.
 */

import crypto from 'crypto';

const PBKDF2_ITERATIONS = 210000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';
const HASH_PREFIX = '$pbkdf2$';

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Genera un hash criptogràfic robust amb salt per a una contrasenya (210.000 iteracions ENS Nivell Alt)
 */
export function hashPassword(password: string): string {
  if (!password || typeof password !== 'string') {
    throw new Error('La contrasenya no és vàlida per generar el hash.');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `${HASH_PREFIX}${PBKDF2_ITERATIONS}$${salt}$${hash}`;
}

/**
 * Verifica una contrasenya contra un hash emmagatzemat (amb protecció contra timing attacks)
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash || typeof password !== 'string' || typeof storedHash !== 'string') return false;

  // El hash ha de tenir obligatòriament el format segur PBKDF2
  if (storedHash.startsWith(HASH_PREFIX)) {
    try {
      const parts = storedHash.split('$');
      // Format: ["", "pbkdf2", iterations, salt, hash]
      if (parts.length !== 5) return false;
      const iterations = parseInt(parts[2], 10);
      if (isNaN(iterations) || iterations < 100000) return false;
      const salt = parts[3];
      const expectedHash = parts[4];

      const computedHash = crypto.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST).toString('hex');
      
      const expectedBuf = Buffer.from(expectedHash, 'hex');
      const computedBuf = Buffer.from(computedHash, 'hex');

      if (expectedBuf.length !== computedBuf.length) return false;
      return crypto.timingSafeEqual(expectedBuf, computedBuf);
    } catch (err) {
      console.error('Error verificant hash PBKDF2:', err);
      return false;
    }
  }

  // CERO CONFIANZA: Rebutgem qualsevol contrasenya en text pla sense hash PBKDF2
  return false;
}

/**
 * Valida la robustesa de la contrasenya segons la política de seguretat de l'APDCAT / ENS Nivell Alt:
 * - Mínim 10 caràcters
 * - Almenys una lletra majúscula
 * - Almenys una lletra minúscula
 * - Almenys un dígit numèric
 * - Almenys un caràcter especial
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || password.length < 10) {
    errors.push('La contrasenya ha de tenir com a mínim 10 caràcters (ENS Nivell Alt).');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Cal incloure almenys una lletra majúscula.');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Cal incloure almenys una lletra minúscula.');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Cal incloure almenys un dígit numèric.');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Cal incloure almenys un caràcter especial (ex: @, #, $, %, ., -, _).');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Anonimització o emmascarament de DNI per a registres d'auditoria pública / no administrativa
 * Ex: "47956602S" -> "***56602*"
 */
export function maskDni(dni: string): string {
  if (!dni || dni.length < 4) return '***';
  const clean = dni.trim().toUpperCase();
  if (clean.length <= 5) return '***' + clean.slice(-2);
  return '***' + clean.slice(3, -1) + '*';
}
