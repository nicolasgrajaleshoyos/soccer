import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { canManageTournament } from '@/lib/permissions';

// POST /api/partidos/[id]/registrar - Register all match results and events (goals, cards, assists, etc.)
export async function POST(request, { params }) {
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

    // Fetch match details to verify existence and check permissions
    const match = db.prepare('SELECT tournament_id, home_team_id, away_team_id FROM matches WHERE id = ?').get(matchId);
    if (!match) {
      return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 });
    }

    if (!canManageTournament(user, match.tournament_id)) {
      return NextResponse.json({ error: 'No tienes permiso para registrar resultados en este torneo' }, { status: 403 });
    }

    const body = await request.json();
    const {
      home_score,
      away_score,
      extra_time,
      final_status,
      mvp_player_id,
      referee_observations,
      goals,          // Array: [{ player_id, team_id, minute, is_own_goal }]
      assists,        // Array: [{ player_id, minute }]
      cards,          // Array: [{ player_id, card_type, minute, reason }]
      substitutions   // Array: [{ player_in_id, player_out_id, team_id, minute }]
    } = body;

    if (home_score === undefined || away_score === undefined) {
      return NextResponse.json({ error: 'Marcadores local y visitante son obligatorios' }, { status: 400 });
    }

    db.transaction(() => {
      // 1. Insert or Replace match result
      db.prepare(`
        INSERT OR REPLACE INTO match_results (
          match_id, home_score, away_score, extra_time, final_status, mvp_player_id, referee_observations
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        matchId,
        parseInt(home_score),
        parseInt(away_score),
        extra_time ? 1 : 0,
        final_status || 'normal',
        mvp_player_id ? parseInt(mvp_player_id) : null,
        referee_observations || null
      );

      // 2. Update match status to 'finalizado'
      db.prepare("UPDATE matches SET status = 'finalizado' WHERE id = ?").run(matchId);

      // 3. Clear and insert goals
      db.prepare('DELETE FROM match_goals WHERE match_id = ?').run(matchId);
      if (goals && Array.isArray(goals)) {
        const insertGoal = db.prepare(`
          INSERT INTO match_goals (match_id, player_id, team_id, minute, is_own_goal)
          VALUES (?, ?, ?, ?, ?)
        `);
        for (const goal of goals) {
          insertGoal.run(
            matchId,
            parseInt(goal.player_id),
            parseInt(goal.team_id),
            parseInt(goal.minute),
            goal.is_own_goal ? 1 : 0
          );
        }
      }

      // 4. Clear and insert assists
      db.prepare('DELETE FROM match_assists WHERE match_id = ?').run(matchId);
      if (assists && Array.isArray(assists)) {
        const insertAssist = db.prepare(`
          INSERT INTO match_assists (match_id, player_id, minute)
          VALUES (?, ?, ?)
        `);
        for (const assist of assists) {
          insertAssist.run(matchId, parseInt(assist.player_id), parseInt(assist.minute));
        }
      }

      // 5. Clear and insert cards
      db.prepare('DELETE FROM match_cards WHERE match_id = ?').run(matchId);
      if (cards && Array.isArray(cards)) {
        const insertCard = db.prepare(`
          INSERT INTO match_cards (match_id, player_id, card_type, minute, reason)
          VALUES (?, ?, ?, ?, ?)
        `);
        for (const card of cards) {
          insertCard.run(
            matchId,
            parseInt(card.player_id),
            card.card_type, // 'amarilla' or 'roja'
            parseInt(card.minute),
            card.reason || null
          );
        }
      }

      // 6. Clear and insert substitutions
      db.prepare('DELETE FROM match_substitutions WHERE match_id = ?').run(matchId);
      if (substitutions && Array.isArray(substitutions)) {
        const insertSub = db.prepare(`
          INSERT INTO match_substitutions (match_id, player_in_id, player_out_id, team_id, minute)
          VALUES (?, ?, ?, ?, ?)
        `);
        for (const sub of substitutions) {
          insertSub.run(
            matchId,
            parseInt(sub.player_in_id),
            parseInt(sub.player_out_id),
            parseInt(sub.team_id),
            parseInt(sub.minute)
          );
        }
      }

      // 7. Trigger a notification (Módulo 13)
      const homeTeam = db.prepare('SELECT name, admin_id FROM teams WHERE id = ?').get(match.home_team_id);
      const awayTeam = db.prepare('SELECT name, admin_id FROM teams WHERE id = ?').get(match.away_team_id);

      const insertNotification = db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)');
      const message = `Finalizado: ${homeTeam.name} ${home_score} - ${away_score} ${awayTeam.name}`;

      // Notify team admins
      if (homeTeam.admin_id) {
        insertNotification.run(homeTeam.admin_id, 'match_finished', 'Resultado de Partido', message);
      }
      if (awayTeam.admin_id) {
        insertNotification.run(awayTeam.admin_id, 'match_finished', 'Resultado de Partido', message);
      }
      
      // Notify globally
      insertNotification.run(null, 'match_finished', 'Resultado de Partido', message);
    })();

    console.log(`[MATCH REGISTRY] Partido ID ${matchId} finalizado. Marcador: ${home_score} - ${away_score}`);

    return NextResponse.json({
      message: 'Resultado y eventos del partido registrados exitosamente'
    });

  } catch (error) {
    console.error('Error al registrar resultado del partido:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
