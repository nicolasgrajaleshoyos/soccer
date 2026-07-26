import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (email, password, name)' }, { status: 400 });
    }

    const targetRole = role || 'aficionado';
    if (!['aficionado', 'admin_equipo'].includes(targetRole)) {
      return NextResponse.json({ error: 'Rol no permitido para autoregistro' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return NextResponse.json({ error: 'El correo electrónico ya está registrado' }, { status: 409 });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Insert user
    const insertQuery = db.prepare(`
      INSERT INTO users (email, password_hash, name, role, email_verified, active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // For simplicity, automatic email verification is enabled or we can send a token
    const result = insertQuery.run(email, passwordHash, name, targetRole, 0, 1);
    
    // Create verification token (simulating verification email)
    const verificationToken = Math.random().toString(36).substring(2, 15);
    db.prepare('UPDATE users SET verification_token = ? WHERE id = ?').run(verificationToken, result.lastInsertRowid);

    console.log(`[EMAIL SIMULATION] Enlace de verificación para ${email}: http://localhost:3000/api/auth/verify-email?token=${verificationToken}`);

    return NextResponse.json({
      message: 'Usuario registrado exitosamente. Por favor verifica tu correo.',
      user: {
        id: result.lastInsertRowid,
        email,
        name,
        role: targetRole,
        email_verified: 0,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
