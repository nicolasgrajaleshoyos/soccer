import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { canManageTournament } from '@/lib/permissions';

// GET /api/torneos/[id] - Get individual tournament details
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const tourId = parseInt(id);

    if (isNaN(tourId)) {
      return NextResponse.json({ error: 'ID de torneo no válido' }, { status: 400 });
    }

    const tournament = db.prepare(`
      SELECT t.*, o.name as organization_name 
      FROM tournaments t 
      JOIN organizations o ON t.organization_id = o.id 
      WHERE t.id = ?
    `).get(tourId);

    if (!tournament) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 });
    }

    // Attach count of participating teams
    const teamCount = db.prepare('SELECT COUNT(*) as count FROM teams WHERE tournament_id = ?').get(tourId);
    tournament.team_count = teamCount ? teamCount.count : 0;

    return NextResponse.json({ tournament });

  } catch (error) {
    console.error('Error al obtener torneo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT /api/torneos/[id] - Update tournament details
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const tourId = parseInt(id);

    if (isNaN(tourId)) {
      return NextResponse.json({ error: 'ID de torneo no válido' }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user || !canManageTournament(user, tourId)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const {
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

    if (!name || !season) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (name, season)' }, { status: 400 });
    }

    db.prepare(`
      UPDATE tournaments SET
        name = ?, logo = ?, description = ?, category = ?, season = ?,
        start_date = ?, end_date = ?, status = ?, regulations = ?, cover_image = ?,
        max_teams = ?, scoring_system = ?
      WHERE id = ?
    `).run(
      name,
      logo !== undefined ? logo : null,
      description !== undefined ? description : null,
      category !== undefined ? category : null,
      season,
      start_date !== undefined ? start_date : null,
      end_date !== undefined ? end_date : null,
      status !== undefined ? status : 'creado',
      regulations !== undefined ? regulations : null,
      cover_image !== undefined ? cover_image : null,
      max_teams !== undefined ? parseInt(max_teams) : 20,
      scoring_system !== undefined ? scoring_system : 'standard',
      tourId
    );

    const updatedTournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(tourId);

    return NextResponse.json({
      message: 'Torneo actualizado exitosamente',
      tournament: updatedTournament
    });

  } catch (error) {
    console.error('Error al actualizar torneo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE /api/torneos/[id] - Delete tournament
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const tourId = parseInt(id);

    if (isNaN(tourId)) {
      return NextResponse.json({ error: 'ID de torneo no válido' }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user || !canManageTournament(user, tourId)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    db.prepare('DELETE FROM tournaments WHERE id = ?').run(tourId);

    return NextResponse.json({ message: 'Torneo eliminado exitosamente' });

  } catch (error) {
    console.error('Error al eliminar torneo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
