import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { canManageTournament, ROLES } from '@/lib/permissions';

// GET /api/partidos - List matches with optional filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tourId = searchParams.get('tournament_id');
    const teamId = searchParams.get('team_id');
    const matchday = searchParams.get('matchday');
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    let query = `
      SELECT m.*, 
             h.name as home_team_name, h.shield as home_team_shield,
             a.name as away_team_name, a.shield as away_team_shield,
             t.name as tournament_name, f.name as field_name, f.address as field_address,
             ref.name as referee_name,
             r.home_score, r.away_score, r.mvp_player_id, r.referee_observations
      FROM matches m
      JOIN teams h ON m.home_team_id = h.id
      JOIN teams a ON m.away_team_id = a.id
      JOIN tournaments t ON m.tournament_id = t.id
      LEFT JOIN fields f ON m.field_id = f.id
      LEFT JOIN referees ref ON m.referee_id = ref.id
      LEFT JOIN match_results r ON m.id = r.match_id
      WHERE 1=1
    `;
    const params = [];

    if (tourId) {
      query += ' AND m.tournament_id = ?';
      params.push(parseInt(tourId));
    }
    if (teamId) {
      query += ' AND (m.home_team_id = ? OR m.away_team_id = ?)';
      params.push(parseInt(teamId), parseInt(teamId));
    }
    if (matchday) {
      query += ' AND m.matchday = ?';
      params.push(parseInt(matchday));
    }
    if (status) {
      query += ' AND m.status = ?';
      params.push(status);
    }
    if (date) {
      query += ' AND m.date = ?';
      params.push(date);
    }

    query += ' ORDER BY m.date ASC, m.time ASC';

    const matches = db.prepare(query).all(...params);

    return NextResponse.json({ matches });

  } catch (error) {
    console.error('Error al obtener partidos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/partidos - Schedule a match
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      tournament_id,
      home_team_id,
      away_team_id,
      matchday,
      date,
      time,
      field_id,
      referee_id,
      status,
      observations
    } = body;

    const tourId = parseInt(tournament_id);
    const homeId = parseInt(home_team_id);
    const awayId = parseInt(away_team_id);

    if (isNaN(tourId) || isNaN(homeId) || isNaN(awayId) || !matchday || !date || !time) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    if (homeId === awayId) {
      return NextResponse.json({ error: 'El equipo local y el visitante no pueden ser el mismo' }, { status: 400 });
    }

    // Check permissions
    if (!canManageTournament(user, tourId)) {
      return NextResponse.json({ error: 'No tienes permiso para programar partidos en este torneo' }, { status: 403 });
    }

    const insertMatch = db.prepare(`
      INSERT INTO matches (
        tournament_id, home_team_id, away_team_id, matchday, 
        date, time, field_id, referee_id, status, observations
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let matchId;
    db.transaction(() => {
      const result = insertMatch.run(
        tourId,
        homeId,
        awayId,
        parseInt(matchday),
        date,
        time,
        field_id ? parseInt(field_id) : null,
        referee_id ? parseInt(referee_id) : null,
        status || 'programado',
        observations || null
      );
      matchId = result.lastInsertRowid;

      // Get team names for notifications
      const homeTeam = db.prepare('SELECT name, admin_id FROM teams WHERE id = ?').get(homeId);
      const awayTeam = db.prepare('SELECT name, admin_id FROM teams WHERE id = ?').get(awayId);

      // Create notification for team admins (Módulo 13)
      const notifyAdmin = db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)');
      const message = `Nuevo partido programado: ${homeTeam.name} vs ${awayTeam.name} - Fecha: ${date} a las ${time}`;
      
      if (homeTeam.admin_id) {
        notifyAdmin.run(homeTeam.admin_id, 'match_scheduled', 'Partido Programado', message);
      }
      if (awayTeam.admin_id) {
        notifyAdmin.run(awayTeam.admin_id, 'match_scheduled', 'Partido Programado', message);
      }
      
      // Global notification (public notification has user_id = NULL)
      notifyAdmin.run(null, 'match_scheduled', 'Partido Programado', message);
    })();

    const newMatch = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);

    return NextResponse.json({
      message: 'Partido programado exitosamente',
      match: newMatch
    }, { status: 201 });

  } catch (error) {
    console.error('Error al programar partido:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
