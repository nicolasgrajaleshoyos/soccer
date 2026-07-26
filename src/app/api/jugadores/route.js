import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { canManageTeam, ROLES } from '@/lib/permissions';

// GET /api/jugadores - List players
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('team_id');
    const status = searchParams.get('status');

    let query = 'SELECT p.*, t.name as team_name FROM players p JOIN teams t ON p.team_id = t.id WHERE 1=1';
    const params = [];

    if (teamId) {
      query += ' AND p.team_id = ?';
      params.push(parseInt(teamId));
    }
    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.full_name ASC';

    const players = db.prepare(query).all(...params);

    return NextResponse.json({ players });

  } catch (error) {
    console.error('Error al obtener jugadores:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/jugadores - Create a player
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      team_id,
      photo,
      full_name,
      document_id,
      birth_date,
      jersey_number,
      height,
      weight,
      dominant_foot,
      nationality,
      status
    } = body;

    const teamId = parseInt(team_id);

    if (isNaN(teamId) || !full_name || !document_id) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (team_id, full_name, document_id)' }, { status: 400 });
    }

    // Check permissions on the team
    if (!canManageTeam(user, teamId)) {
      return NextResponse.json({ error: 'No tienes permisos para administrar este equipo' }, { status: 403 });
    }

    // Check if player with same document already exists in this team/tournament
    const existingPlayer = db.prepare('SELECT id FROM players WHERE document_id = ? AND team_id = ?').get(document_id, teamId);
    if (existingPlayer) {
      return NextResponse.json({ error: 'El jugador ya está registrado en este equipo' }, { status: 409 });
    }

    const insertPlayer = db.prepare(`
      INSERT INTO players (
        team_id, photo, full_name, document_id, birth_date, 
        jersey_number, height, weight, dominant_foot, nationality, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertPlayer.run(
      teamId,
      photo || null,
      full_name,
      document_id,
      birth_date || null,
      jersey_number !== undefined ? parseInt(jersey_number) : null,
      height !== undefined ? parseFloat(height) : null,
      weight !== undefined ? parseFloat(weight) : null,
      dominant_foot || 'derecho',
      nationality || 'Colombiana',
      status || 'activo'
    );

    const newPlayer = db.prepare('SELECT * FROM players WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json({
      message: 'Jugador registrado exitosamente',
      player: newPlayer
    }, { status: 201 });

  } catch (error) {
    console.error('Error al registrar jugador:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
