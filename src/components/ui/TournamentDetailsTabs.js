'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Trophy, Calendar, Users, FileText, BarChart2, Shield, User, Award, AlertTriangle } from 'lucide-react';

export default function TournamentDetailsTabs({ tournament, stats, teams, matches }) {
  const [activeTab, setActiveTab] = useState('posiciones');
  
  // Group matches by matchday
  const matchesByMatchday = {};
  for (const match of matches) {
    if (!matchesByMatchday[match.matchday]) {
      matchesByMatchday[match.matchday] = [];
    }
    matchesByMatchday[match.matchday].push(match);
  }
  const matchdays = Object.keys(matchesByMatchday).sort((a, b) => parseInt(a) - parseInt(b));
  
  const [selectedMatchday, setSelectedMatchday] = useState(
    matchdays.length > 0 ? matchdays[0] : '1'
  );

  return (
    <div className="space-y-6">
      
      {/* Tabs Selector Bar */}
      <div className="flex border-b border-slate-800 overflow-x-auto pb-px gap-2">
        <button
          onClick={() => setActiveTab('posiciones')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'posiciones'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="h-4 w-4" />
          Tabla de Posiciones
        </button>
        
        <button
          onClick={() => setActiveTab('calendario')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'calendario'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Calendario / Fixture
        </button>

        <button
          onClick={() => setActiveTab('estadisticas')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'estadisticas'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <BarChart2 className="h-4 w-4" />
          Estadísticas
        </button>

        <button
          onClick={() => setActiveTab('equipos')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'equipos'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="h-4 w-4" />
          Equipos ({teams.length})
        </button>

        <button
          onClick={() => setActiveTab('reglamento')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'reglamento'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="h-4 w-4" />
          Reglamento
        </button>
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        
        {/* TAB 1: Standings Table */}
        {activeTab === 'posiciones' && (
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Clasificación General</h2>
              <p className="text-xs text-slate-400">Actualizado automáticamente en tiempo real.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-center w-12">Pos</th>
                    <th className="px-6 py-3">Equipo</th>
                    <th className="px-4 py-3 text-center">PJ</th>
                    <th className="px-4 py-3 text-center">PG</th>
                    <th className="px-4 py-3 text-center">PE</th>
                    <th className="px-4 py-3 text-center">PP</th>
                    <th className="px-4 py-3 text-center">GF</th>
                    <th className="px-4 py-3 text-center">GC</th>
                    <th className="px-4 py-3 text-center">DG</th>
                    <th className="px-6 py-3 text-center font-bold text-emerald-400">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {stats.standings.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="px-6 py-12 text-center text-slate-500">
                        No hay partidos jugados o equipos registrados en este torneo.
                      </td>
                    </tr>
                  ) : (
                    stats.standings.map((team, idx) => (
                      <tr key={team.team_id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                          <span className="text-lg">🛡️</span>
                          <Link href={`/equipos/${team.team_id}`} className="hover:text-emerald-400 hover:underline">
                            {team.name}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-center">{team.pj}</td>
                        <td className="px-4 py-4 text-center">{team.pg}</td>
                        <td className="px-4 py-4 text-center">{team.pe}</td>
                        <td className="px-4 py-4 text-center">{team.pp}</td>
                        <td className="px-4 py-4 text-center">{team.gf}</td>
                        <td className="px-4 py-4 text-center">{team.gc}</td>
                        <td className="px-4 py-4 text-center font-semibold text-slate-400">
                          {team.dg > 0 ? `+${team.dg}` : team.dg}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-emerald-400 text-base bg-emerald-500/5">
                          {team.pts}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Calendar / Fixture */}
        {activeTab === 'calendario' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white">Fixture del Torneo</h2>
                <p className="text-xs text-slate-400">Filtra la programación por jornada.</p>
              </div>
              
              {/* Matchday Selector */}
              {matchdays.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                  {matchdays.map(day => (
                    <button
                      key={day}
                      onClick={() => setSelectedMatchday(day)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedMatchday === day
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      Jornada {day}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Matches List for selected matchday */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(!selectedMatchday || !matchesByMatchday[selectedMatchday] || matchesByMatchday[selectedMatchday].length === 0) ? (
                <div className="col-span-full glass-card p-12 text-center text-slate-500">
                  No se han programado partidos para esta jornada.
                </div>
              ) : (
                matchesByMatchday[selectedMatchday].map(match => (
                  <div key={match.id} className="glass-card p-6 flex flex-col justify-between gap-4">
                    <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-3">
                      <span>Jornada {match.matchday}</span>
                      <span className="font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                        {match.date} a las {match.time}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      {/* Home */}
                      <div className="w-5/12 text-center space-y-1">
                        <span className="block text-2xl">🛡️</span>
                        <Link href={`/equipos/${match.home_team_id}`} className="font-bold text-sm text-white hover:underline block truncate">
                          {match.home_team_name}
                        </Link>
                      </div>

                      {/* Score or VS */}
                      <div className="w-2/12 text-center">
                        {match.status === 'finalizado' ? (
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-xl font-black text-white">{match.home_score}</span>
                            <span className="text-slate-500 text-xs">-</span>
                            <span className="text-xl font-black text-white">{match.away_score}</span>
                          </div>
                        ) : (
                          <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-500 text-[10px] font-extrabold uppercase">
                            {match.status}
                          </span>
                        )}
                      </div>

                      {/* Away */}
                      <div className="w-5/12 text-center space-y-1">
                        <span className="block text-2xl">🛡️</span>
                        <Link href={`/equipos/${match.away_team_id}`} className="font-bold text-sm text-white hover:underline block truncate">
                          {match.away_team_name}
                        </Link>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/60 flex justify-between items-center text-[10px] text-slate-400">
                      <span>📍 {match.field_name || 'Cancha por asignar'}</span>
                      {match.referee_name && (
                        <span>🏁 Árbitro: {match.referee_name}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Statistics Rankings */}
        {activeTab === 'estadisticas' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Top Scorers */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-bold text-white text-lg flex items-center gap-2 border-b border-slate-800 pb-3">
                <Award className="text-emerald-400 h-5 w-5" />
                Máximos Goleadores
              </h3>
              <div className="space-y-3">
                {stats.scorers.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No hay goles registrados.</p>
                ) : (
                  stats.scorers.map((player, idx) => (
                    <div key={player.player_id} className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/30 hover:bg-slate-900/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-sm">👤</div>
                        <div>
                          <p className="font-bold text-sm text-white">{player.full_name}</p>
                          <p className="text-[10px] text-slate-500">🛡️ {player.team_name} • Dorsal {player.jersey_number || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg">
                          ⚽ {player.goals}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Assistants */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-bold text-white text-lg flex items-center gap-2 border-b border-slate-800 pb-3">
                <Award className="text-amber-500 h-5 w-5" />
                Máximos Asistentes
              </h3>
              <div className="space-y-3">
                {stats.assistants.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No hay asistencias registradas.</p>
                ) : (
                  stats.assistants.map((player, idx) => (
                    <div key={player.player_id} className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/30 hover:bg-slate-900/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-sm">👤</div>
                        <div>
                          <p className="font-bold text-sm text-white">{player.full_name}</p>
                          <p className="text-[10px] text-slate-500">🛡️ {player.team_name} • Dorsal {player.jersey_number || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-lg">
                          👟 {player.assists}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Porteros Menos Vencidos */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-bold text-white text-lg flex items-center gap-2 border-b border-slate-800 pb-3">
                <Shield className="text-blue-400 h-5 w-5" />
                Valla Menos Vencida (Porteros)
              </h3>
              <div className="space-y-3">
                {stats.goalkeepers.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No hay porteros elegibles.</p>
                ) : (
                  stats.goalkeepers.map((gk, idx) => (
                    <div key={gk.player_id} className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/30 hover:bg-slate-900/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-sm">🧤</div>
                        <div>
                          <p className="font-bold text-sm text-white">{gk.full_name}</p>
                          <p className="text-[10px] text-slate-500">🛡️ {gk.team_name} • {gk.matches_played} PJ</p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-xs font-bold text-slate-200">Goles encajados: <span className="text-red-400 font-extrabold">{gk.goals_conceded}</span></p>
                        <p className="text-[9px] text-slate-500">Promedio: {gk.average} por partido</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Fair Play (Cards) */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-bold text-white text-lg flex items-center gap-2 border-b border-slate-800 pb-3">
                <AlertTriangle className="text-yellow-500 h-5 w-5" />
                Ranking Fair Play (Juego Limpio)
              </h3>
              <div className="space-y-3">
                {stats.fairPlay.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No hay tarjetas registradas.</p>
                ) : (
                  stats.fairPlay.map((team, idx) => (
                    <div key={team.team_id} className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/30 hover:bg-slate-900/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                        <span className="text-base">🛡️</span>
                        <div>
                          <p className="font-bold text-sm text-white">{team.name}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[9px] text-yellow-500 bg-yellow-500/10 px-1 py-0.5 rounded">🟨 {team.yellow_cards || 0}</span>
                            <span className="text-[9px] text-red-500 bg-red-500/10 px-1 py-0.5 rounded">🟥 {team.red_cards || 0}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">Puntaje Castigo</p>
                        <span className="text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                          {team.fair_play_points || 0} pts
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: Teams Grid */}
        {activeTab === 'equipos' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {teams.length === 0 ? (
              <div className="col-span-full glass-card p-12 text-center text-slate-500">
                No hay equipos participantes registrados en este torneo.
              </div>
            ) : (
              teams.map(team => (
                <div key={team.id} className="glass-card p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-2xl shadow">
                      🛡️
                    </div>
                    <div>
                      <Link href={`/equipos/${team.id}`} className="font-bold text-white hover:text-emerald-400 hover:underline text-base block">
                        {team.name}
                      </Link>
                      <p className="text-[10px] text-slate-400 mt-1">Entrenador: {team.coach || 'N/A'}</p>
                      <p className="text-[10px] text-slate-500">Capitán: {team.captain || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 5: Regulations */}
        {activeTab === 'reglamento' && (
          <div className="glass-card p-8 text-center space-y-4 max-w-lg mx-auto">
            <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mx-auto text-3xl">
              📝
            </div>
            <h3 className="font-bold text-white text-xl">Reglamento Oficial</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Descarga o consulta las reglas oficiales del torneo Copa de Campeones. Es de obligatorio cumplimiento conocer el reglamento por parte de los capitanes, entrenadores y jugadores antes del inicio de la temporada.
            </p>
            {tournament.regulations ? (
              <a 
                href={tournament.regulations} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-primary inline-flex mt-2 text-xs"
              >
                Descargar Reglamento (PDF)
              </a>
            ) : (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-500 inline-block">
                No se ha subido ningún reglamento oficial para este torneo.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
