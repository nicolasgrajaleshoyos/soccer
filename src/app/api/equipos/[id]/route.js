import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { canManageTeam, ROLES } from '@/lib/permissions';

// GET /api/equipos/[id] - Get individual team details
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const teamId = parseInt(id);

    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'ID de equipo no válido' }, { status: 400 });
    }

    const team = db.prepare(`
      SELECT t.*, tr.name as tournament_name, tr.organization_id 
      FROM teams t 
      JOIN tournaments tr ON t.tournament_id = tr.id 
      WHERE t.id = ?
    `).get(teamId);

    if (!team) {
      return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
    }

    // Fetch players
    const players = db.prepare('SELECT * FROM players WHERE team_id = ? ORDER BY full_name ASC').all(teamId);
    team.players = players;

    // Fetch sponsors
    const sponsors = db.prepare('SELECT * FROM team_sponsors WHERE team_id = ?').all(teamId);
    team.sponsors = sponsors;

    // Fetch admin details
    if (team.admin_id) {
      const admin = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(team.admin_id);
      team.admin = admin;
    } else {
      team.admin = null;
    }

    return NextResponse.json({ team });

  } catch (error) {
    console.error('Error al obtener equipo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT /api/equipos/[id] - Update team details
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const teamId = parseInt(id);

    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'ID de equipo no válido' }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user || !canManageTeam(user, teamId)) {
      return NextResponse.json({ error: 'No autorizado para modificar este equipo' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      shield,
      neighborhood,
      city,
      founded,
      colors,
      home_uniform,
      away_uniform,
      coach,
      captain,
      social_media,
      group_photo,
      admin_id
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    // Only superadmin or tournament organizer can change the team's assigned admin
    const team = db.prepare('SELECT tournament_id, admin_id FROM teams WHERE id = ?').get(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
    }

    let finalAdminId = team.admin_id;
    if (admin_id !== undefined) {
      const isTourManager = user.role === ROLES.SUPERADMIN || db.prepare(`
        SELECT 1 FROM organization_admins oa
        JOIN tournaments t ON oa.organization_id = t.organization_id
        WHERE t.id = ? AND oa.user_id = ?
      `).get(team.tournament_id, user.id);

      if (isTourManager) {
        finalAdminId = admin_id ? parseInt(admin_id) : null;
      }
    }

    db.prepare(`
      UPDATE teams SET
        name = ?, shield = ?, neighborhood = ?, city = ?, founded = ?,
        colors = ?, home_uniform = ?, away_uniform = ?, coach = ?, captain = ?,
        social_media = ?, group_photo = ?, admin_id = ?
      WHERE id = ?
    `).run(
      name,
      shield !== undefined ? shield : null,
      neighborhood !== undefined ? neighborhood : null,
      city !== undefined ? city : null,
      founded !== undefined ? founded : null,
      colors !== undefined ? colors : null,
      home_uniform !== undefined ? home_uniform : null,
      away_uniform !== undefined ? away_uniform : null,
      coach !== undefined ? coach : null,
      captain !== undefined ? captain : null,
      social_media !== undefined ? social_media : null,
      group_photo !== undefined ? group_photo : null,
      finalAdminId,
      teamId
    );

    const updatedTeam = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);

    return NextResponse.json({
      message: 'Equipo actualizado exitosamente',
      team: updatedTeam
    });

  } catch (error) {
    console.error('Error al actualizar equipo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE /api/equipos/[id] - Delete team
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const teamId = parseInt(id);

    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'ID de equipo no válido' }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const team = db.prepare('SELECT tournament_id FROM teams WHERE id = ?').get(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
    }

    // Only superadmin or tournament organizer can delete a team
    const tournament = db.prepare('SELECT organization_id FROM tournaments WHERE id = ?').get(team.tournament_id);
    const isOrgAdmin = db.prepare('SELECT 1 FROM organization_admins WHERE organization_id = ? AND user_id = ?').get(tournament.organization_id, user.id);
    const isAllowed = user.role === ROLES.SUPERADMIN || !!isOrgAdmin;

    if (!isAllowed) {
      return NextResponse.json({ error: 'No autorizado para eliminar este equipo' }, { status: 403 });
    }

    db.prepare('DELETE FROM teams WHERE id = ?').run(teamId);

    return NextResponse.json({ message: 'Equipo eliminado exitosamente' });

  } catch (error) {
    console.error('Error al eliminar equipo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
