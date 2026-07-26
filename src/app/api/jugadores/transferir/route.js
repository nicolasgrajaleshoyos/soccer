import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { canManageTournament, ROLES } from '@/lib/permissions';

// POST /api/jugadores/transferir - Transfer a player between teams
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { player_id, to_team_id } = body;

    const playerId = parseInt(player_id);
    const toTeamId = parseInt(to_team_id);

    if (isNaN(playerId) || !toTeamId) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (player_id, to_team_id)' }, { status: 400 });
    }

    // Fetch player details
    const player = db.prepare('SELECT id, team_id, full_name FROM players WHERE id = ?').get(playerId);
    if (!player) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 });
    }

    // Fetch target team details to check tournament
    const toTeam = db.prepare('SELECT tournament_id, name FROM teams WHERE id = ?').get(toTeamId);
    if (!toTeam) {
      return NextResponse.json({ error: 'El equipo destino no existe' }, { status: 404 });
    }

    // Only superadmin or tournament organizers can transfer players (to avoid unauthorized moves)
    if (!canManageTournament(user, toTeam.tournament_id)) {
      return NextResponse.json({ error: 'No tienes autorización para realizar transferencias en este torneo' }, { status: 403 });
    }

    const fromTeamId = player.team_id;

    if (fromTeamId === toTeamId) {
      return NextResponse.json({ error: 'El jugador ya pertenece al equipo destino' }, { status: 400 });
    }

    // Execute transfer transaction
    db.transaction(() => {
      // 1. Update player's team
      db.prepare('UPDATE players SET team_id = ? WHERE id = ?').run(toTeamId, playerId);

      // 2. Insert transfer history record
      db.prepare(`
        INSERT INTO player_transfers (player_id, from_team_id, to_team_id)
        VALUES (?, ?, ?)
      `).run(playerId, fromTeamId, toTeamId);
    })();

    console.log(`[TRANSFER] Jugador ${player.full_name} transferido del equipo ID ${fromTeamId} al equipo ${toTeam.name} (ID ${toTeamId})`);

    return NextResponse.json({
      message: 'Transferencia completada exitosamente',
      player_id: playerId,
      from_team_id: fromTeamId,
      to_team_id: toTeamId
    });

  } catch (error) {
    console.error('Error al transferir jugador:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
