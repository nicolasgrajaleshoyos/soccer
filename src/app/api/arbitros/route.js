import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { hasRole, ROLES } from '@/lib/permissions';

// GET /api/arbitros - List referees
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tourId = searchParams.get('tournament_id');

    let query = 'SELECT * FROM referees WHERE 1=1';
    const params = [];

    if (tourId) {
      query += ' AND (tournament_id = ? OR tournament_id IS NULL)';
      params.push(parseInt(tourId));
    }

    query += ' ORDER BY name ASC';

    const referees = db.prepare(query).all(...params);

    return NextResponse.json({ referees });

  } catch (error) {
    console.error('Error al obtener árbitros:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/arbitros - Create a referee
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || !hasRole(user, [ROLES.SUPERADMIN, ROLES.ORGANIZADOR])) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const {
      tournament_id,
      photo,
      name,
      document,
      category,
      experience,
      phone,
      email
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const insertReferee = db.prepare(`
      INSERT INTO referees (
        tournament_id, photo, name, document, category, experience, phone, email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertReferee.run(
      tournament_id ? parseInt(tournament_id) : null,
      photo || null,
      name,
      document || null,
      category || null,
      experience !== undefined ? parseInt(experience) : 0,
      phone || null,
      email || null
    );

    const newReferee = db.prepare('SELECT * FROM referees WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json({
      message: 'Árbitro registrado exitosamente',
      referee: newReferee
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear árbitro:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
