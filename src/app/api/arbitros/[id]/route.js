import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { hasRole, ROLES } from '@/lib/permissions';

// GET /api/arbitros/[id] - Get referee details and match history
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const refId = parseInt(id);

    if (isNaN(refId)) {
      return NextResponse.json({ error: 'ID de árbitro no válido' }, { status: 400 });
    }

    const referee = db.prepare('SELECT * FROM referees WHERE id = ?').get(refId);
    if (!referee) {
      return NextResponse.json({ error: 'Árbitro no encontrado' }, { status: 404 });
    }

    // Get match history directed by this referee
    const matches = db.prepare(`
      SELECT m.id, m.matchday, m.date, m.time, m.status,
             h.name as home_team_name, h.shield as home_team_shield,
             a.name as away_team_name, a.shield as away_team_shield,
             t.name as tournament_name, f.name as field_name,
             r.home_score, r.away_score
      FROM matches m
      JOIN teams h ON m.home_team_id = h.id
      JOIN teams a ON m.away_team_id = a.id
      JOIN tournaments t ON m.tournament_id = t.id
      LEFT JOIN fields f ON m.field_id = f.id
      LEFT JOIN match_results r ON m.id = r.match_id
      WHERE m.referee_id = ?
      ORDER BY m.date DESC, m.time DESC
    `).all(refId);

    referee.matches = matches;

    return NextResponse.json({ referee });

  } catch (error) {
    console.error('Error al obtener árbitro:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT /api/arbitros/[id] - Update referee details
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const refId = parseInt(id);

    if (isNaN(refId)) {
      return NextResponse.json({ error: 'ID de árbitro no válido' }, { status: 400 });
    }

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

    db.prepare(`
      UPDATE referees SET
        tournament_id = ?, photo = ?, name = ?, document = ?, 
        category = ?, experience = ?, phone = ?, email = ?
      WHERE id = ?
    `).run(
      tournament_id ? parseInt(tournament_id) : null,
      photo !== undefined ? photo : null,
      name,
      document !== undefined ? document : null,
      category !== undefined ? category : null,
      experience !== undefined ? parseInt(experience) : 0,
      phone !== undefined ? phone : null,
      email !== undefined ? email : null,
      refId
    );

    const updatedReferee = db.prepare('SELECT * FROM referees WHERE id = ?').get(refId);

    return NextResponse.json({
      message: 'Árbitro actualizado exitosamente',
      referee: updatedReferee
    });

  } catch (error) {
    console.error('Error al actualizar árbitro:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE /api/arbitros/[id] - Delete referee
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const refId = parseInt(id);

    if (isNaN(refId)) {
      return NextResponse.json({ error: 'ID de árbitro no válido' }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user || !hasRole(user, [ROLES.SUPERADMIN, ROLES.ORGANIZADOR])) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    db.prepare('DELETE FROM referees WHERE id = ?').run(refId);

    return NextResponse.json({ message: 'Árbitro eliminado exitosamente' });

  } catch (error) {
    console.error('Error al eliminar árbitro:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
