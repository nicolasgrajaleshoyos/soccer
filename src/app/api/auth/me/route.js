import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    // A "current user" endpoint is a query ("who am I?"), not a protected
    // action. Returning 200 with a null user (instead of 401) when there is
    // no session avoids a noisy red 401 error in the browser console on every
    // unauthenticated page load (the AuthProvider calls this on mount for all
    // pages, including /login and /register). The client treats user === null
    // as "not logged in". Genuinely protected endpoints still return 401.
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
