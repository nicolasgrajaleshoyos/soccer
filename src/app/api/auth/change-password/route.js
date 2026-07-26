import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { token, newPassword, currentPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const salt = bcrypt.genSaltSync(10);
    const newPasswordHash = bcrypt.hashSync(newPassword, salt);

    // Case 1: Password reset using token
    if (token) {
      const user = db.prepare('SELECT id, reset_token_expires FROM users WHERE reset_token = ?').get(token);
      
      if (!user) {
        return NextResponse.json({ error: 'Token de recuperación inválido o expirado' }, { status: 400 });
      }

      // Check expiry
      if (new Date() > new Date(user.reset_token_expires)) {
        return NextResponse.json({ error: 'El token de recuperación ha expirado' }, { status: 400 });
      }

      // Update password
      db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?')
        .run(newPasswordHash, user.id);

      return NextResponse.json({ message: 'Contraseña restablecida exitosamente' });
    }

    // Case 2: Change password from logged in session
    const authenticatedUser = await getAuthenticatedUser(request);
    if (!authenticatedUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!currentPassword) {
      return NextResponse.json({ error: 'La contraseña actual es requerida' }, { status: 400 });
    }

    // Fetch user password hash
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(authenticatedUser.id);
    const isPasswordValid = bcrypt.compareSync(currentPassword, user.password_hash);
    
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 });
    }

    // Update password
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newPasswordHash, authenticatedUser.id);

    return NextResponse.json({ message: 'Contraseña cambiada exitosamente' });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
