import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token de verificación faltante' }, { status: 400 });
    }

    // Find user by verification token
    const user = db.prepare('SELECT id, name FROM users WHERE verification_token = ?').get(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 });
    }

    // Verify user email
    db.prepare('UPDATE users SET email_verified = 1, verification_token = NULL WHERE id = ?').run(user.id);

    // Redirect to login page with verified parameter
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('verified', 'true');
    
    return NextResponse.redirect(loginUrl);
    
  } catch (error) {
    console.error('Error en verificación de correo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
