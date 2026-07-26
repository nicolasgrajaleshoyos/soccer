import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { canManageTournament, ROLES } from '@/lib/permissions';

// GET /api/equipos - List teams
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tourId = searchParams.get('tournament_id');
    const adminId = searchParams.get('admin_id');

    let query = 'SELECT t.*, tr.name as tournament_name FROM teams t JOIN tournaments tr ON t.tournament_id = tr.id WHERE 1=1';
    const params = [];

    if (tourId) {
      query += ' AND t.tournament_id = ?';
      params.push(parseInt(tourId));
    }
    if (adminId) {
      query += ' AND t.admin_id = ?';
      params.push(parseInt(adminId));
    }

    query += ' ORDER BY t.name ASC';

    const teams = db.prepare(query).all(...params);

    return NextResponse.json({ teams });

  } catch (error) {
    console.error('Error al obtener equipos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/equipos - Create a team
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      tournament_id,
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

    const tourId = parseInt(tournament_id);

    if (isNaN(tourId) || !name) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (tournament_id, name)' }, { status: 400 });
    }

    // Check tournament status
    const tournament = db.prepare('SELECT status, organization_id, max_teams FROM tournaments WHERE id = ?').get(tourId);
    if (!tournament) {
      return NextResponse.json({ error: 'El torneo no existe' }, { status: 404 });
    }

    // Check capacity
    const currentTeams = db.prepare('SELECT COUNT(*) as count FROM teams WHERE tournament_id = ?').get(tourId);
    if (currentTeams && currentTeams.count >= tournament.max_teams) {
      return NextResponse.json({ error: 'El torneo ha alcanzado la cantidad máxima de equipos participantes' }, { status: 400 });
    }

    // Check permissions: Only superadmin, tournament organizer, or if tournament registrations are open
    const isOrgAdmin = db.prepare('SELECT 1 FROM organization_admins WHERE organization_id = ? AND user_id = ?').get(tournament.organization_id, user.id);
    const isAllowed = user.role === ROLES.SUPERADMIN || !!isOrgAdmin || tournament.status === 'inscripciones_abiertas';

    if (!isAllowed) {
      return NextResponse.json({ error: 'Las inscripciones están cerradas o no tienes permiso para agregar equipos' }, { status: 403 });
    }

    const insertTeam = db.prepare(`
      INSERT INTO teams (
        tournament_id, name, shield, neighborhood, city, founded, 
        colors, home_uniform, away_uniform, coach, captain, 
        social_media, group_photo, admin_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Default admin of the team is the creating user if they are an admin_equipo, or the specified admin_id
    let teamAdminId = admin_id ? parseInt(admin_id) : null;
    if (!teamAdminId && user.role === ROLES.ADMIN_EQUIPO) {
      teamAdminId = user.id;
    }

    const result = insertTeam.run(
      tourId,
      name,
      shield || null,
      neighborhood || null,
      city || null,
      founded || null,
      colors || null,
      home_uniform || null,
      away_uniform || null,
      coach || null,
      captain || null,
      social_media || null,
      group_photo || null,
      teamAdminId
    );

    const newTeam = db.prepare('SELECT * FROM teams WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json({
      message: 'Equipo registrado exitosamente',
      team: newTeam
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear equipo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
