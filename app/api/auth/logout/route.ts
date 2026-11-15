import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Sessió tancada correctament.'
  });

  response.cookies.delete('bancactiu_session');
  return response;
}

export async function GET() {
  const response = NextResponse.json({
    success: true,
    message: 'Sessió tancada correctament.'
  });

  response.cookies.delete('bancactiu_session');
  return response;
}
