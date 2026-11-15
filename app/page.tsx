import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import BancActiuNexusClient from './BancActiuNexusClient';

export const dynamic = 'force-dynamic';

export default async function BancActiuNexusPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('bancactiu_session')?.value;

  if (!sessionCookie) {
    redirect('/login');
  }

  let sessionUser = null;
  try {
    sessionUser = JSON.parse(decodeURIComponent(sessionCookie));
  } catch {
    // Si no és un JSON vàlid o està corrupte, bloqueig per seguretat
    redirect('/login');
  }

  if (!sessionUser || !sessionUser.authenticated || sessionUser.role !== 'SUPERADMIN' || sessionUser.dni !== '52622304Y') {
    redirect('/login');
  }

  return <BancActiuNexusClient initialUser={sessionUser} />;
}
