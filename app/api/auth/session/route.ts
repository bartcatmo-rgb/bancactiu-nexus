import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/security/session';

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('bancactiu_session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const session = verifySessionToken(sessionCookie);
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, user: session });
}
