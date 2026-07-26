import React from 'react';
import Link from 'next/link';
import db from '@/lib/db';
import { ArrowLeft, Users, Trophy, Award, Calendar, ExternalLink } from 'lucide-react';
import FormationField from '@/components/ui/FormationField';

function getTeamData(id) {
  try {
    const team = db.prepare(`
      SELECT t.*, tr.name as tournament_name, tr.id as tournament_id
      FROM teams t
      JOIN tournaments tr ON t.tournament_id = tr.id
      WHERE t.id = ?
    `).get(id);

    if (!team) return null;

    // Fetch players
    const players = db.prepare('SELECT * FROM players WHERE team_id = ? ORDER BY jersey_number ASC, full_name ASC').all(id);

    // Fetch sponsors
    const sponsors = db.prepare('SELECT * FROM team_sponsors WHERE team_id = ?').all(id);

    // Fetch match history (all matches home or away that have been finished)
    const matches = db.prepare(`
      SELECT m.*, 
             h.name as home_team_name, h.shield as home_team_shield,
             a.name as away_team_name, a.shield as away_team_shield,
             r.home_score, r.away_score
      FROM matches m
      JOIN teams h ON m.home_team_id = h.id
      JOIN teams a ON m.away_team_id = a.id
      JOIN match_results r ON m.id = r.match_id
      WHERE (m.home_team_id = ? OR m.away_team_id = ?) AND m.status = 'finalizado'
      ORDER BY m.date DESC, m.time DESC
    `).all(id, id);

    return { team, players, sponsors, matches };
  } catch (error) {
    console.error('Error fetching team data:', error);
    return null;
  }
}

export default async function TeamDetailPage({ params }) {
  const { id } = await params;
  const teamId = parseInt(id);

  if (isNaN(teamId)) {
    return (
      <div className="page-container py-20 text-center">
        <h1 className="text-2xl text-red-500 font-bold">ID de equipo no válido</h1>
        <Link href="/equipos" className="text-emerald-400 mt-4 inline-block hover:underline">Volver a Equipos</Link>
      </div>
    );
  }

  const data = getTeamData(teamId);

  if (!data) {
    return (
      <div className="page-container py-20 text-center">
        <h1 className="text-2xl text-white font-bold">Equipo no encontrado</h1>
        <Link href="/equipos" className="text-emerald-400 mt-4 inline-block hover:underline">Volver a Equipos</Link>
      </div>
    );
  }

  const { team, players, sponsors, matches } = data;

  return (
    <div className="page-container py-8 space-y-8">
      
      {/* Back Button */}
      <Link href="/equipos" className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs font-semibold">
        <ArrowLeft className="h-4 w-4" />
        Volver a Equipos
      </Link>

      {/* Hero Header */}
      <div className="glass-card p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-3xl bg-slate-800 flex items-center justify-center text-5xl shadow border border-slate-700">
            🛡️
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white">{team.name}</h1>
            <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
              <Trophy className="h-4 w-4 text-amber-500" />
              Torneo: <Link href={`/torneos/${team.tournament_id}`} className="text-emerald-400 hover:underline">{team.tournament_name}</Link>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Fundado: {team.founded || 'N/A'} • {team.city} • Barrio {team.neighborhood || 'N/A'}
            </p>
          </div>
        </div>

        {/* Uniforms Display */}
        <div className="flex gap-4 w-full md:w-auto">
          <div className="glass-card p-3 px-5 flex flex-col items-center justify-center text-center flex-grow md:flex-grow-0 min-w-[120px]">
            <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Uniforme Local</span>
            {team.home_kit ? (
              <a href={team.home_kit} target="_blank" rel="noopener noreferrer" className="mt-2 block h-12 w-12 bg-slate-900/50 rounded-lg overflow-hidden border border-slate-800 hover:border-emerald-500/50 transition-colors">
                <img src={team.home_kit} alt="Local" className="h-full w-full object-contain" />
              </a>
            ) : (
              <span className="text-xs font-semibold text-slate-400 mt-2 block">👕 Sin registrar</span>
            )}
          </div>
          <div className="glass-card p-3 px-5 flex flex-col items-center justify-center text-center flex-grow md:flex-grow-0 min-w-[120px]">
            <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Uniforme Visita</span>
            {team.away_kit ? (
              <a href={team.away_kit} target="_blank" rel="noopener noreferrer" className="mt-2 block h-12 w-12 bg-slate-900/50 rounded-lg overflow-hidden border border-slate-800 hover:border-emerald-500/50 transition-colors">
                <img src={team.away_kit} alt="Visita" className="h-full w-full object-contain" />
              </a>
            ) : (
              <span className="text-xs font-semibold text-slate-400 mt-2 block">👕 Sin registrar</span>
            )}
          </div>
        </div>
      </div>

      {/* Formacion / Alineacion visual en la cancha */}
      <FormationField players={players} teamId={teamId} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Squad Players (2/3 Width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="text-emerald-400" />
              Plantilla de Jugadores ({players.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {players.length === 0 ? (
              <div className="col-span-full glass-card p-12 text-center text-slate-500">
                El club no tiene jugadores registrados en su plantilla.
              </div>
            ) : (
              players.map(player => (
                <div key={player.id} className="glass-card p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center text-base">
                      👤
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{player.full_name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{player.position} • {player.nationality || 'Colombiana'}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-xs font-black bg-slate-800 text-emerald-400 px-2.5 py-1 rounded">
                      #{player.jersey_number || 'N/A'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Sports Info, Sponsors, Matches (1/3 Width) */}
        <div className="space-y-8">
          
          {/* Sports staff */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-white text-base border-b border-slate-800 pb-2 flex items-center gap-2">
              <Award className="text-emerald-400 h-4 w-4" />
              Cuerpo Técnico y Líderes
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Entrenador / D.T.:</span>
                <span className="font-semibold text-slate-200">{team.coach || 'No asignado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Capitán de Campo:</span>
                <span className="font-semibold text-slate-200">{team.captain || 'No asignado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Colores oficiales:</span>
                <span className="font-semibold text-slate-200">{team.colors || 'No especificado'}</span>
              </div>
            </div>
          </div>

          {/* Sponsors */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-white text-base border-b border-slate-800 pb-2">
              Patrocinadores Oficiales
            </h3>
            {sponsors.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-2">No hay patrocinadores registrados.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {sponsors.map(sponsor => (
                  <div key={sponsor.id} className="p-3 bg-slate-900/40 rounded-lg text-center border border-slate-800">
                    <p className="font-bold text-xs text-white truncate">{sponsor.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Match History */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-white text-base border-b border-slate-800 pb-2 flex items-center gap-2">
              <Calendar className="text-amber-500 h-4 w-4" />
              Historial de Partidos
            </h3>

            <div className="space-y-3">
              {matches.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No se han registrado encuentros finalizados.</p>
              ) : (
                matches.slice(0, 5).map(match => {
                  const isHome = match.home_team_id === teamId;
                  const isWin = (isHome && match.home_score > match.away_score) || (!isHome && match.away_score > match.home_score);
                  const isLoss = (isHome && match.home_score < match.away_score) || (!isHome && match.away_score < match.home_score);
                  const isDraw = match.home_score === match.away_score;
                  
                  let badgeColor = 'bg-slate-800 text-slate-400';
                  let badgeText = 'E';
                  if (isWin) { badgeColor = 'bg-emerald-500/10 text-emerald-400'; badgeText = 'V'; }
                  if (isLoss) { badgeColor = 'bg-red-500/10 text-red-400'; badgeText = 'D'; }

                  return (
                    <div key={match.id} className="flex justify-between items-center p-2 rounded bg-slate-900/30 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`h-5 w-5 rounded flex items-center justify-center font-bold text-[10px] ${badgeColor}`}>
                          {badgeText}
                        </span>
                        <span className="text-slate-400 truncate max-w-[120px]">
                          {isHome ? `vs ${match.away_team_name}` : `@ ${match.home_team_name}`}
                        </span>
                      </div>
                      <span className="font-black text-slate-200">
                        {match.home_score} - {match.away_score}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
