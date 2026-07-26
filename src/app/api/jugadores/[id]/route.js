import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { canManageTeam, ROLES } from '@/lib/permissions';

// GET /api/jugadores/[id] - Get individual player details and history
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const playerId = parseInt(id);

    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'ID de jugador no válido' }, { status: 400 });
    }

    const player = db.prepare(`
      SELECT p.*, t.name as team_name, t.tournament_id 
      FROM players p 
      JOIN teams t ON p.team_id = t.id 
      WHERE p.id = ?
    `).get(playerId);

    if (!player) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 });
    }

    // Calculate age if birth_date is available
    if (player.birth_date) {
      const birth = new Date(player.birth_date);
      const diff = Date.now() - birth.getTime();
      const ageDate = new Date(diff);
      player.age = Math.abs(ageDate.getUTCFullYear() - 1970);
    } else {
      player.age = null;
    }

    // Fetch player sports stats
    const goalsCount = db.prepare('SELECT COUNT(*) as count FROM match_goals WHERE player_id = ? AND is_own_goal = 0').get(playerId);
    const assistsCount = db.prepare('SELECT COUNT(*) as count FROM match_assists WHERE player_id = ?').get(playerId);
    const yellowCards = db.prepare("SELECT COUNT(*) as count FROM match_cards WHERE player_id = ? AND card_type = 'amarilla'").get(playerId);
    const redCards = db.prepare("SELECT COUNT(*) as count FROM match_cards WHERE player_id = ? AND card_type = 'roja'").get(playerId);
    const mvpCount = db.prepare('SELECT COUNT(*) as count FROM match_results WHERE mvp_player_id = ?').get(playerId);

    player.stats = {
      goals: goalsCount ? goalsCount.count : 0,
      assists: assistsCount ? assistsCount.count : 0,
      yellow_cards: yellowCards ? yellowCards.count : 0,
      red_cards: redCards ? redCards.count : 0,
      mvps: mvpCount ? mvpCount.count : 0
    };

    // Fetch transfers history
    const transfers = db.prepare(`
      SELECT pt.*, f.name as from_team_name, t.name as to_team_name 
      FROM player_transfers pt
      LEFT JOIN teams f ON pt.from_team_id = f.id
      JOIN teams t ON pt.to_team_id = t.id
      WHERE pt.player_id = ?
      ORDER BY pt.transfer_date DESC
    `).all(playerId);
    
    player.transfers = transfers;

    return NextResponse.json({ player });

  } catch (error) {
    console.error('Error al obtener jugador:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT /api/jugadores/[id] - Update player details
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const playerId = parseInt(id);

    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'ID de jugador no válido' }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get current player details to check permission on their team
    const player = db.prepare('SELECT team_id FROM players WHERE id = ?').get(playerId);
    if (!player) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 });
    }

    if (!canManageTeam(user, player.team_id)) {
      return NextResponse.json({ error: 'No tienes permisos para editar este jugador' }, { status: 403 });
    }

    const body = await request.json();
    const {
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

    if (!full_name || !document_id) {
      return NextResponse.json({ error: 'Nombre y documento son obligatorios' }, { status: 400 });
    }

    db.prepare(`
      UPDATE players SET
        photo = ?, full_name = ?, document_id = ?, birth_date = ?,
        jersey_number = ?, height = ?, weight = ?, dominant_foot = ?,
        nationality = ?, status = ?
      WHERE id = ?
    `).run(
      photo !== undefined ? photo : null,
      full_name,
      document_id,
      birth_date !== undefined ? birth_date : null,
      jersey_number !== undefined ? parseInt(jersey_number) : null,
      height !== undefined ? parseFloat(height) : null,
      weight !== undefined ? parseFloat(weight) : null,
      dominant_foot !== undefined ? dominant_foot : 'derecho',
      nationality !== undefined ? nationality : 'Colombiana',
      status !== undefined ? status : 'activo',
      playerId
    );

    const updatedPlayer = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);

    return NextResponse.json({
      message: 'Jugador actualizado exitosamente',
      player: updatedPlayer
    });

  } catch (error) {
    console.error('Error al actualizar jugador:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE /api/jugadores/[id] - Remove player
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const playerId = parseInt(id);

    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'ID de jugador no válido' }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const player = db.prepare('SELECT team_id FROM players WHERE id = ?').get(playerId);
    if (!player) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 });
    }

    if (!canManageTeam(user, player.team_id)) {
      return NextResponse.json({ error: 'No tienes permisos para retirar este jugador' }, { status: 403 });
    }

    db.prepare('DELETE FROM players WHERE id = ?').run(playerId);

    return NextResponse.json({ message: 'Jugador retirado exitosamente del equipo' });

  } catch (error) {
    console.error('Error al eliminar jugador:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
