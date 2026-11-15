import { NextResponse } from 'next/server';
import { sharedDb } from '@bancactiu/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dni, newPassword, confirmPassword } = body;

    const normalizedDni = (dni || '').trim().toUpperCase();

    if (normalizedDni !== '52622304Y') {
      return NextResponse.json(
        {
          success: false,
          error: 'Operació denegada. L\'establiment inicial de contrasenya només està autoritzat per al Superadministrador arrel (DNI 52622304Y).'
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

    // Comprovació de complexitat: majúscula, minúscula, número i caràcter especial
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

    // Desar la nova contrasenya i completar el primer inici
    await sharedDb.setUserPassword(normalizedDni, newPassword);

    const authenticatedUser = {
      userId: 'usr-1',
      dni: '52622304Y',
      name: 'Mireia Valls (SuperAdmin GAPIC)',
      role: 'SUPERADMIN',
      roleLabel: 'SuperAdmin GAPIC · Control Catalunya',
      institution: 'GAPIC · Generalitat de Catalunya & Cornellà',
      authenticated: true,
      authMethod: 'Credencials Personals DNI 52622304Y',
      passwordConfigured: true,
      loginTime: new Date().toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      user: authenticatedUser,
      message: 'Contrasenya de Superadministrador configurada correctament. Accés autoritzat.'
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
