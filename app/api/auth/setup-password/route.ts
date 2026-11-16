import { NextResponse } from 'next/server';
import { sharedDb } from '@bancactiu/db';
import { hashPassword, verifyPassword } from '@/lib/crypto-security';
import { saveUserPasswordDirect } from '@/lib/server-credentials-store';

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

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: 'La contrasenya ha de tenir com a mínim 8 caràcters.'
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

    // Validació estricta de l'historial de 10 darreres contrasenyes
    const history: string[] = Array.isArray(user.passwordHistory) ? [...user.passwordHistory] : [];
    if (user.passwordHash && !history.includes(user.passwordHash)) {
      history.unshift(user.passwordHash);
    }

    const matchesPrevious = history.slice(0, 10).some((prevHash) => {
      if (!prevHash) return false;
      return verifyPassword(newPassword.trim(), prevHash);
    });

    if (matchesPrevious) {
      return NextResponse.json(
        {
          success: false,
          error: 'La nova contrasenya no pot ser igual a cap de les darreres 10 contrasenyes utilitzades.'
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

    const response = NextResponse.json({
      success: true,
      user: authenticatedUser,
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

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error en configurar la contrasenya' },
      { status: 500 }
    );
  }
}
