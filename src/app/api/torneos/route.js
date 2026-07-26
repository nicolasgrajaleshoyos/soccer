import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { canManageOrganization, ROLES } from '@/lib/permissions';

// GET /api/torneos - List tournaments
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organization_id');
    const status = searchParams.get('status');

    let query = 'SELECT t.*, o.name as organization_name FROM tournaments t JOIN organizations o ON t.organization_id = o.id WHERE 1=1';
    const params = [];

    if (orgId) {
      query += ' AND t.organization_id = ?';
      params.push(parseInt(orgId));
    }
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    query += ' ORDER BY t.created_at DESC';

    const tournaments = db.prepare(query).all(...params);

    return NextResponse.json({ tournaments });

  } catch (error) {
    console.error('Error al obtener torneos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/torneos - Create a tournament
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      organization_id,
      name,
      logo,
      description,
      category,
      season,
      start_date,
      end_date,
      status,
      regulations,
      cover_image,
      max_teams,
      scoring_system
    } = body;

    const orgId = parseInt(organization_id);

    if (isNaN(orgId) || !name || !season) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (organization_id, name, season)' }, { status: 400 });
    }

    // Check if user has permissions to create tournaments for this organization
    if (!canManageOrganization(user, orgId)) {
      return NextResponse.json({ error: 'No tienes permiso para administrar esta organización' }, { status: 403 });
    }

    const insertTournament = db.prepare(`
      INSERT INTO tournaments (
        organization_id, name, logo, description, category, season, 
        start_date, end_date, status, regulations, cover_image, 
        max_teams, scoring_system
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertTournament.run(
      orgId,
      name,
      logo || null,
      description || null,
      category || null,
      season,
      start_date || null,
      end_date || null,
      status || 'creado',
      regulations || null,
      cover_image || null,
      max_teams !== undefined ? parseInt(max_teams) : 20,
      scoring_system || 'standard'
    );

    const newTournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json({
      message: 'Torneo creado exitosamente',
      tournament: newTournament
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear torneo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
