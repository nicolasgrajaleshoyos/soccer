import db from './db';

// Calculate tournament statistics dynamically from database records
export function getTournamentStats(tournamentId) {
  // 1. Fetch all teams in the tournament
  const teams = db.prepare('SELECT id, name, shield FROM teams WHERE tournament_id = ?').all(tournamentId);
  
  // Initialize stats dictionary
  const table = {};
  for (const team of teams) {
    table[team.id] = {
      team_id: team.id,
      name: team.name,
      shield: team.shield,
      pj: 0,
      pg: 0,
      pe: 0,
      pp: 0,
      gf: 0,
      gc: 0,
      dg: 0,
      pts: 0,
    };
  }

  // 2. Fetch all finished matches with their results for this tournament
  const matches = db.prepare(`
    SELECT m.home_team_id, m.away_team_id, r.home_score, r.away_score 
    FROM matches m
    JOIN match_results r ON m.id = r.match_id
    WHERE m.tournament_id = ? AND m.status = 'finalizado'
  `).all(tournamentId);

  // Process results
  for (const match of matches) {
    const home = table[match.home_team_id];
    const away = table[match.away_team_id];

    // If teams have been deleted but matches persist, skip
    if (!home || !away) continue;

    home.pj += 1;
    away.pj += 1;

    home.gf += match.home_score;
    home.gc += match.away_score;
    away.gf += match.away_score;
    away.gc += match.home_score;

    if (match.home_score > match.away_score) {
      home.pg += 1;
      home.pts += 3;
      away.pp += 1;
    } else if (match.home_score < match.away_score) {
      away.pg += 1;
      away.pts += 3;
      home.pp += 1;
    } else {
      home.pe += 1;
      home.pts += 1;
      away.pe += 1;
      away.pts += 1;
    }
  }

  // Calculate Goal Difference and convert to array
  const standings = Object.values(table).map(team => {
    team.dg = team.gf - team.gc;
    return team;
  });

  // Sort standings: 1) Points (desc), 2) Goal Difference (desc), 3) Goals For (desc), 4) Name (asc)
  standings.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dg !== a.dg) return b.dg - a.dg;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.name.localeCompare(b.name);
  });

  // 3. Fetch Top Scorers (Goleadores)
  const scorers = db.prepare(`
    SELECT p.id as player_id, p.full_name, p.jersey_number, p.photo, t.name as team_name, t.shield as team_shield, COUNT(g.id) as goals
    FROM match_goals g
    JOIN players p ON g.player_id = p.id
    JOIN teams t ON p.team_id = t.id
    JOIN matches m ON g.match_id = m.id
    WHERE m.tournament_id = ? AND g.is_own_goal = 0
    GROUP BY p.id
    ORDER BY goals DESC, p.full_name ASC
    LIMIT 20
  `).all(tournamentId);

  // 4. Fetch Top Assistants (Asistentes)
  const assistants = db.prepare(`
    SELECT p.id as player_id, p.full_name, p.jersey_number, p.photo, t.name as team_name, t.shield as team_shield, COUNT(a.id) as assists
    FROM match_assists a
    JOIN players p ON a.player_id = p.id
    JOIN teams t ON p.team_id = t.id
    JOIN matches m ON a.match_id = m.id
    WHERE m.tournament_id = ?
    GROUP BY p.id
    ORDER BY assists DESC, p.full_name ASC
    LIMIT 20
  `).all(tournamentId);

  // 5. Fair Play Rank (Cards count per team)
  const fairPlay = db.prepare(`
    SELECT t.id as team_id, t.name, t.shield,
           SUM(CASE WHEN c.card_type = 'amarilla' THEN 1 ELSE 0 END) as yellow_cards,
           SUM(CASE WHEN c.card_type = 'roja' THEN 1 ELSE 0 END) as red_cards,
           (SUM(CASE WHEN c.card_type = 'amarilla' THEN 1 ELSE 0 END) * 1 + 
            SUM(CASE WHEN c.card_type = 'roja' THEN 1 ELSE 0 END) * 3) as fair_play_points
    FROM teams t
    LEFT JOIN players p ON t.id = p.team_id
    LEFT JOIN match_cards c ON p.id = c.player_id
    LEFT JOIN matches m ON c.match_id = m.id AND m.tournament_id = ?
    WHERE t.tournament_id = ?
    GROUP BY t.id
    ORDER BY fair_play_points ASC, t.name ASC
  `).all(tournamentId, tournamentId);

  // 6. Porteros Menos Vencidos (Clean Sheets or Less Goals Conceded)
  // For simplicity, we calculate total goals conceded by the team where the goalkeeper is active
  const goalkeepers = db.prepare(`
    SELECT p.id as player_id, p.full_name, p.photo, t.id as team_id, t.name as team_name, t.shield as team_shield,
           (SELECT COUNT(*) FROM matches m JOIN match_results mr ON m.id = mr.match_id 
            WHERE m.tournament_id = ? AND m.status = 'finalizado' AND (m.home_team_id = t.id OR m.away_team_id = t.id)) as matches_played
    FROM players p
    JOIN teams t ON p.team_id = t.id
    WHERE t.tournament_id = ? AND p.position = 'Portero' AND p.status = 'activo'
  `).all(tournamentId, tournamentId);

  // Calculate goals conceded for each goalkeeper's team
  const goalkeepersStats = goalkeepers.map(gk => {
    // Total goals conceded by goalkeeper's team in tournament
    const homeConceded = db.prepare(`
      SELECT SUM(r.away_score) as goals
      FROM matches m
      JOIN match_results r ON m.id = r.match_id
      WHERE m.tournament_id = ? AND m.status = 'finalizado' AND m.home_team_id = ?
    `).get(tournamentId, gk.team_id);

    const awayConceded = db.prepare(`
      SELECT SUM(r.home_score) as goals
      FROM matches m
      JOIN match_results r ON m.id = r.match_id
      WHERE m.tournament_id = ? AND m.status = 'finalizado' AND m.away_team_id = ?
    `).get(tournamentId, gk.team_id);

    const conceded = (homeConceded?.goals || 0) + (awayConceded?.goals || 0);
    const average = gk.matches_played > 0 ? (conceded / gk.matches_played).toFixed(2) : '0.00';

    return {
      ...gk,
      goals_conceded: conceded,
      average: parseFloat(average)
    };
  }).sort((a, b) => a.goals_conceded - b.goals_conceded || b.matches_played - a.matches_played);

  // 7. Team stats overview (Best Attack, Best Defense)
  let bestAttack = { name: 'N/A', goals: 0 };
  let bestDefense = { name: 'N/A', goals: 999 };

  for (const team of standings) {
    if (team.pj > 0) {
      if (team.gf > bestAttack.goals) {
        bestAttack = { name: team.name, shield: team.shield, goals: team.gf };
      }
      if (team.gc < bestDefense.goals) {
        bestDefense = { name: team.name, shield: team.shield, goals: team.gc };
      }
    }
  }

  return {
    standings,
    scorers,
    assistants,
    fairPlay,
    goalkeepers: goalkeepersStats,
    overview: {
      bestAttack,
      bestDefense: bestDefense.goals === 999 ? { name: 'N/A', goals: 0 } : bestDefense
    }
  };
}
