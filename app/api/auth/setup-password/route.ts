import { NextResponse } from 'next/server';
import { sharedDb } from '@bancactiu/db';
import { hashPassword, verifyPassword } from '@/lib/crypto-security';
import { getServerUsers, matchesIdentifier, saveUserPasswordDirect } from '@/lib/server-credentials-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dni, newPassword, confirmPassword } = body;

    const normalizedDni = (dni || '').trim().toUpperCase();

    const user = await sharedDb.getUserByDni(normalizedDni);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Operació denegada. Usuari no trobat a la base de dades institucional.'
        },
        { status: 403 }
      );
    }

    if (!newPassword || newPassword.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'La contrasenya ha de tenir com a mínim 10 caràcters (ENS Nivell Alt).'
        },
        { status: 400 }
      );
    }

    // Comprovació de complexitat: majúscula, minúscula, número i caràcter especial (ENS Nivell Alt)
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return NextResponse.json(
        {
          success: false,
          error: 'La contrasenya ha de contenir com a mínim una majúscula, una minúscula, un número i un caràcter especial (ENS Nivell Alt).'
        },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Les contrasenyes introduïdes no coincideixen.'
        },
        { status: 400 }
      );
    }

    // Validació estricta de l'historial (últimes 5 contrasenyes utilitzades + clau inicial 1234 - ENS Nivell Alt)
    const history: string[] = Array.isArray(user.passwordHistory) ? [...user.passwordHistory] : [];
    if (user.passwordHash && !history.includes(user.passwordHash)) {
      history.unshift(user.passwordHash);
    }

    try {
      const serverUsers = getServerUsers();
      const sUser = serverUsers.find((u) => matchesIdentifier(u, normalizedDni));
      if (sUser) {
        if (sUser.currentPassword && !history.includes(sUser.currentPassword)) {
          history.unshift(sUser.currentPassword);
        }
        if (Array.isArray(sUser.passwordHistory)) {
          for (const h of sUser.passwordHistory) {
            if (h && !history.includes(h)) {
              history.push(h);
            }
          }
        }
      }
    } catch {
      // Fallback a dades en memòria
    }

    // Invalida que es pugui reutilitzar el "1234" provisional com a nova contrasenya
    if (!history.includes('1234')) {
      history.push('1234');
    }

    // Comprovar també amb l'historial del vault persistent de la cookie si existeix
    try {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/bancactiu_auth_vault=([^;]+)/);
      if (match) {
        const vault = JSON.parse(decodeURIComponent(match[1]));
        const vEntry = vault[normalizedDni] || (normalizedDni.includes('ADMIN') ? vault['ADMINISTRADOR'] : null);
        if (vEntry?.passwordHistory && Array.isArray(vEntry.passwordHistory)) {
          for (const h of vEntry.passwordHistory) {
            if (h && !history.includes(h)) {
              history.push(h);
            }
          }
        }
        if (vEntry?.passwordHash && !history.includes(vEntry.passwordHash)) {
          history.unshift(vEntry.passwordHash);
        }
      }
    } catch {
      // Fallback
    }

    // Validar contra les últimes 5 contrasenyes o 1234
    const last5 = history.slice(0, 5);
    const matchesPrevious =
      newPassword.trim() === '1234' ||
      last5.some((prevHash) => {
        if (!prevHash) return false;
        return verifyPassword(newPassword.trim(), prevHash);
      });

    if (matchesPrevious) {
      return NextResponse.json(
        {
          success: false,
          error: 'Per seguretat (ENS Nivell Alt), no pots reutilitzar una contrasenya anterior ni la clau inicial'
        },
        { status: 400 }
      );
    }

    // Generació de hash criptogràfic segur PBKDF2 (SHA-512)
    const newHash = hashPassword(newPassword.trim());
    const updatedHistory = [newHash, ...history.filter((h) => h !== newHash)].slice(0, 10);

    // Actualització immediata de l'estat d'usuari a memòria i base de dades
    user.passwordHash = newHash;
    user.mustChangePassword = false;
    user.isFirstLogin = false;
    user.passwordSetAt = new Date().toISOString();
    user.passwordUpdatedAt = new Date().toISOString();
    user.passwordHistory = updatedHistory;

    await sharedDb.setUserPassword(normalizedDni, newHash, updatedHistory);

    // Persistència a la base de dades privada del servidor
    saveUserPasswordDirect(normalizedDni, newHash, updatedHistory);

    const authenticatedUser = {
      userId: user.id,
      dni: user.dni,
      name: user.nomComplet,
      email: user.email,
      role: user.rolPrincipal,
      roleLabel: user.rolPrincipal === 'SUPERADMIN' 
        ? 'SuperAdmin · Control Total Catalunya & IETI' 
        : `${user.rolPrincipal} · BancActiu`,
      institution: 'Institut Esteve Terrades i Illa · BancActiu 2.0',
      authenticated: true,
      authMethod: `Credencials Personals (${user.dni})`,
      passwordConfigured: true,
      mustChangePassword: false,
      isFirstLogin: false,
      loginTime: new Date().toISOString(),
    };

    // Actualitzar i persistir el Vault de credencials segures a la cookie perenne (resistent a cold starts en Vercel)
    let vault: Record<string, any> = {};
    try {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/bancactiu_auth_vault=([^;]+)/);
      if (match) {
        try {
          vault = JSON.parse(decodeURIComponent(match[1]));
        } catch {
          vault = {};
        }
      }
      const headerVault = request.headers.get('x-bancactiu-vault');
      if (headerVault) {
        try {
          const parsedH = JSON.parse(headerVault);
          vault = { ...vault, ...parsedH };
        } catch {}
      }
      const vaultEntry = {
        passwordHash: newHash,
        mustChangePassword: false,
        isFirstLogin: false,
        passwordHistory: updatedHistory,
        updatedAt: new Date().toISOString(),
      };
      vault[normalizedDni] = vaultEntry;
      if (normalizedDni === '52622304Y' || normalizedDni.includes('ADMIN') || normalizedDni === 'BARTO') {
        vault['52622304Y'] = vaultEntry;
        vault['ADMINISTRADOR'] = vaultEntry;
        vault['ADMIN'] = vaultEntry;
        vault['BARTO'] = vaultEntry;
      } else if (normalizedDni === '47956602S' || normalizedDni.includes('MARC') || normalizedDni === 'SUPERADMIN') {
        vault['47956602S'] = vaultEntry;
        vault['SUPERADMIN'] = vaultEntry;
        vault['MARC'] = vaultEntry;
      }
    } catch (e) {
      console.warn('[SetupPassword] Error preparant vault:', e);
    }

    const response = NextResponse.json({
      success: true,
      user: authenticatedUser,
      vault,
      message: `Contrasenya per a l'usuari ${user.nomComplet} configurada correctament. Accés autoritzat.`
    });

    // Desplegar cookie de sessió
    const sessionString = encodeURIComponent(JSON.stringify(authenticatedUser));
    response.cookies.set('bancactiu_session', sessionString, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8
    });

    response.cookies.set('bancactiu_auth_vault', encodeURIComponent(JSON.stringify(vault)), {
      path: '/',
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365, // 1 any de persistència
    });

    const individualEntry = vault[normalizedDni] || {
      passwordHash: newHash,
      mustChangePassword: false,
      isFirstLogin: false,
      passwordHistory: updatedHistory,
      updatedAt: new Date().toISOString()
    };

    response.cookies.set(`bancactiu_vault_${normalizedDni}`, encodeURIComponent(JSON.stringify(individualEntry)), {
      path: '/',
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365, // 1 any de persistència
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error en configurar la contrasenya' },
      { status: 500 }
    );
  }
}
