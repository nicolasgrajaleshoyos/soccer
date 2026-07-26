import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { canManageTournament, ROLES } from '@/lib/permissions';

// GET /api/partidos/[id] - Get individual match details
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const matchId = parseInt(id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'ID de partido no válido' }, { status: 400 });
    }

    const match = db.prepare(`
      SELECT m.*, 
             h.name as home_team_name, h.shield as home_team_shield,
             a.name as away_team_name, a.shield as away_team_shield,
             t.name as tournament_name, f.name as field_name, f.address as field_address,
             f.latitude as field_latitude, f.longitude as field_longitude,
             ref.name as referee_name,
             r.home_score, r.away_score, r.mvp_player_id, r.referee_observations
      FROM matches m
      JOIN teams h ON m.home_team_id = h.id
      JOIN teams a ON m.away_team_id = a.id
      JOIN tournaments t ON m.tournament_id = t.id
      LEFT JOIN fields f ON m.field_id = f.id
      LEFT JOIN referees ref ON m.referee_id = ref.id
      LEFT JOIN match_results r ON m.id = r.match_id
      WHERE m.id = ?
    `).get(matchId);

    if (!match) {
      return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 });
    }

    // Fetch goals
    const goals = db.prepare(`
      SELECT mg.*, p.full_name as player_name 
      FROM match_goals mg
      JOIN players p ON mg.player_id = p.id
      WHERE mg.match_id = ?
      ORDER BY mg.minute ASC
    `).all(matchId);
    match.goals_list = goals;

    // Fetch assists
    const assists = db.prepare(`
      SELECT ma.*, p.full_name as player_name 
      FROM match_assists ma
      JOIN players p ON ma.player_id = p.id
      WHERE ma.match_id = ?
      ORDER BY ma.minute ASC
    `).all(matchId);
    match.assists_list = assists;

    // Fetch cards
    const cards = db.prepare(`
      SELECT mc.*, p.full_name as player_name 
      FROM match_cards mc
      JOIN players p ON mc.player_id = p.id
      WHERE mc.match_id = ?
      ORDER BY mc.minute ASC
    `).all(matchId);
    match.cards_list = cards;

    // Fetch substitutions
    const substitutions = db.prepare(`
      SELECT ms.*, 
             pin.full_name as player_in_name, 
             pout.full_name as player_out_name
      FROM match_substitutions ms
      JOIN players pin ON ms.player_in_id = pin.id
      JOIN players pout ON ms.player_out_id = pout.id
      WHERE ms.match_id = ?
      ORDER BY ms.minute ASC
    `).all(matchId);
    match.substitutions_list = substitutions;

    return NextResponse.json({ match });

  } catch (error) {
    console.error('Error al obtener partido:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT /api/partidos/[id] - Update match schedule / status
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const matchId = parseInt(id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'ID de partido no válido' }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get existing match
    const existingMatch = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
    if (!existingMatch) {
      return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 });
    }

    // Check permissions
    if (!canManageTournament(user, existingMatch.tournament_id)) {
      return NextResponse.json({ error: 'No tienes permiso para reprogramar este partido' }, { status: 403 });
    }

    const body = await request.json();
    const {
      date,
      time,
      field_id,
      referee_id,
      status,
      observations
    } = body;

    if (!date || !time) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (date, time)' }, { status: 400 });
    }

    db.transaction(() => {
      // 1. Update match details
      db.prepare(`
        UPDATE matches SET
          date = ?, time = ?, field_id = ?, referee_id = ?, status = ?, observations = ?
        WHERE id = ?
      `).run(
        date,
        time,
        field_id ? parseInt(field_id) : null,
        referee_id ? parseInt(referee_id) : null,
        status || 'programado',
        observations || null,
        matchId
      );

      // Check if critical details changed to send notification (Módulo 13)
      const dateChanged = existingMatch.date !== date || existingMatch.time !== time;
      const fieldChanged = existingMatch.field_id !== (field_id ? parseInt(field_id) : null);
      const statusChanged = existingMatch.status !== status;

      if (dateChanged || fieldChanged || statusChanged) {
        // Get team names and admins
        const homeTeam = db.prepare('SELECT name, admin_id FROM teams WHERE id = ?').get(existingMatch.home_team_id);
        const awayTeam = db.prepare('SELECT name, admin_id FROM teams WHERE id = ?').get(existingMatch.away_team_id);

        let notifyTitle = 'Actualización de Partido';
        let notifyMessage = `El encuentro ${homeTeam.name} vs ${awayTeam.name} ha sido actualizado. `;

        if (statusChanged && status === 'suspendido') {
          notifyTitle = 'Partido Suspendido';
          notifyMessage = `El encuentro ${homeTeam.name} vs ${awayTeam.name} ha sido suspendido.`;
        } else if (statusChanged && status === 'cancelado') {
          notifyTitle = 'Partido Cancelado';
          notifyMessage = `El encuentro ${homeTeam.name} vs ${awayTeam.name} ha sido cancelado.`;
        } else if (dateChanged || fieldChanged) {
          notifyTitle = 'Cambio de Horario/Cancha';
          notifyMessage += `Nuevo horario: ${date} a las ${time}`;
          if (field_id) {
            const field = db.prepare('SELECT name FROM fields WHERE id = ?').get(field_id);
            if (field) notifyMessage += ` en Cancha: ${field.name}`;
          }
        }

        const insertNotification = db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)');
        
        // Notify team admins
        if (homeTeam.admin_id) {
          insertNotification.run(homeTeam.admin_id, 'match_update', notifyTitle, notifyMessage);
        }
        if (awayTeam.admin_id) {
          insertNotification.run(awayTeam.admin_id, 'match_update', notifyTitle, notifyMessage);
        }
        
        // Public notification
        insertNotification.run(null, 'match_update', notifyTitle, notifyMessage);
      }
    })();

    const updatedMatch = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);

    return NextResponse.json({
      message: 'Partido actualizado exitosamente',
      match: updatedMatch
    });

  } catch (error) {
    console.error('Error al reprogramar partido:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE /api/partidos/[id] - Delete a match
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const matchId = parseInt(id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'ID de partido no válido' }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const match = db.prepare('SELECT tournament_id FROM matches WHERE id = ?').get(matchId);
    if (!match) {
      return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 });
    }

    if (!canManageTournament(user, match.tournament_id)) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar este partido' }, { status: 403 });
    }

    db.prepare('DELETE FROM matches WHERE id = ?').run(matchId);

    return NextResponse.json({ message: 'Partido eliminado exitosamente de la programación' });

  } catch (error) {
    console.error('Error al eliminar partido:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
