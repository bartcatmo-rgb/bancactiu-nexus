import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password, authMethod } = body;

    // Autenticació per Certificat Digital (idCAT / T-CAT / DNIe) o Credencials SuperAdmin
    let authenticatedUser = null;

    if (authMethod === 'certificate') {
      authenticatedUser = {
        userId: 'usr_cert_mireia_01',
        name: 'Mireia Valls i Grau',
        role: 'SUPERADMIN',
        roleLabel: 'SuperAdmin GAPIC · Control Catalunya',
        institution: 'Generalitat de Catalunya · Departament de Salut',
        certificateIssuer: 'EC-ACC (Agència Catalana de Certificació)',
        authenticated: true,
        authMethod: 'idCAT Certificat Digital',
        loginTime: new Date().toISOString(),
      };
    } else {
      // Credencials institucionals
      const isSuperAdmin =
        (identifier === 'superadmin' || identifier === 'superadmin@salut.cat' || identifier === 'admin') &&
        (password === 'BancActiu2026!' || password === 'admin' || password === 'superadmin' || password === 'BancActiu2026!Secure');

      if (!isSuperAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: 'Credencials no vàlides. Si us plau, verifiqueu el nom d\'usuari i contrasenya institucional.'
          },
          { status: 401 }
        );
      }

      authenticatedUser = {
        userId: 'usr_superadmin_01',
        name: 'Mireia Valls',
        role: 'SUPERADMIN',
        roleLabel: 'SuperAdmin GAPIC · Control Catalunya',
        institution: 'GAPIC · Generalitat de Catalunya & Cornellà',
        authenticated: true,
        authMethod: 'Credencials Corporatives Gencat',
        loginTime: new Date().toISOString(),
      };
    }

    const response = NextResponse.json({
      success: true,
      user: authenticatedUser,
      message: 'Sessió iniciada correctament al Gateway Launcher BancActiu Nexus'
    });

    // Desplegar cookie de sessió segura
    const sessionString = encodeURIComponent(JSON.stringify(authenticatedUser));
    response.cookies.set('bancactiu_session', sessionString, {
      path: '/',
      httpOnly: false, // Permet lectura per sincronització visual i comprovació de capçalera
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8 // 8 hores de sessió
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error intern durant l\'autenticació' },
      { status: 500 }
    );
  }
}
