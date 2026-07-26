import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { hasRole, ROLES } from '@/lib/permissions';

// GET /api/canchas - List fields (canchas)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tourId = searchParams.get('tournament_id');

    let query = 'SELECT * FROM fields WHERE 1=1';
    const params = [];

    if (tourId) {
      query += ' AND (tournament_id = ? OR tournament_id IS NULL)';
      params.push(parseInt(tourId));
    }

    query += ' ORDER BY name ASC';

    const fields = db.prepare(query).all(...params);

    return NextResponse.json({ fields });

  } catch (error) {
    console.error('Error al obtener canchas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/canchas - Create a field (cancha)
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || !hasRole(user, [ROLES.SUPERADMIN, ROLES.ORGANIZADOR])) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const {
      tournament_id,
      name,
      address,
      municipality,
      latitude,
      longitude,
      photo,
      capacity,
      surface_type
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const insertField = db.prepare(`
      INSERT INTO fields (
        tournament_id, name, address, municipality, latitude, longitude, photo, capacity, surface_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertField.run(
      tournament_id ? parseInt(tournament_id) : null,
      name,
      address || null,
      municipality || null,
      latitude !== undefined ? parseFloat(latitude) : null,
      longitude !== undefined ? parseFloat(longitude) : null,
      photo || null,
      capacity !== undefined ? parseInt(capacity) : null,
      surface_type || null
    );

    const newField = db.prepare('SELECT * FROM fields WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json({
      message: 'Cancha registrada exitosamente',
      field: newField
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear cancha:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
