import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'El correo electrónico es requerido' }, { status: 400 });
    }

    const user = db.prepare('SELECT id, name FROM users WHERE email = ?').get(email);

    if (user) {
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

      db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?')
        .run(resetToken, expires, user.id);

      console.log(`[EMAIL SIMULATION] Enlace de recuperación para ${email}: http://localhost:3000/reset-password?token=${resetToken}`);
    }

    // Always return success to prevent user enumeration
    return NextResponse.json({
      message: 'Si el correo electrónico está registrado, recibirás un enlace de recuperación pronto.'
    });

  } catch (error) {
    console.error('Error en recuperación de contraseña:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
