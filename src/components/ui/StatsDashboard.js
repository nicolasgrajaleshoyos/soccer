'use client';

import React, { useState } from 'react';
import { Trophy, Award, Shield, AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function StatsDashboard({ tournaments, initialStats, selectedTourId }) {
  const [selectedTour, setSelectedTour] = useState(selectedTourId);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);

  const handleTournamentChange = async (e) => {
    const tourId = e.target.value;
    setSelectedTour(tourId);
    setLoading(true);
    try {
      const res = await fetch(`/api/torneos/${tourId}/estadisticas`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Selector de Torneo */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Selecciona un Torneo</h2>
          <p className="text-xs text-slate-500">Consulta los datos del torneo seleccionado en tiempo real.</p>
        </div>
        <div>
          <select
            value={selectedTour}
            onChange={handleTournamentChange}
            className="form-input bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 px-4 outline-none w-full sm:w-64 cursor-pointer text-sm font-bold"
          >
            {tournaments.map(tour => (
              <option key={tour.id} value={tour.id}>
                {tour.name} ({tour.season})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-20 text-center text-slate-400 font-medium">
          Cargando estadísticas del torneo...
        </div>
      ) : !stats ? (
        <div className="glass-card p-12 text-center text-slate-500">
          No hay estadísticas disponibles para este torneo.
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Posiciones y Atacantes/Defensores */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tabla de Clasificación (2/3 de ancho) */}
            <div className="lg:col-span-2 glass-card overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-white text-base">Tabla General de Posiciones</h3>
                <Link href={`/torneos/${selectedTour}`} className="text-xs text-emerald-400 hover:underline flex items-center gap-0.5">
                  Ver Fixture <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
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
                        <td colSpan="10" className="px-6 py-8 text-center text-slate-500">
                          Aún no se registran resultados.
                        </td>
                      </tr>
                    ) : (
                      stats.standings.map((team, idx) => (
                        <tr key={team.team_id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-6 py-3 font-bold text-white flex items-center gap-2">
                            <span>🛡️</span>
                            <Link href={`/equipos/${team.team_id}`} className="hover:text-emerald-400 hover:underline">
                              {team.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-center">{team.pj}</td>
                          <td className="px-4 py-3 text-center">{team.pg}</td>
                          <td className="px-4 py-3 text-center">{team.pe}</td>
                          <td className="px-4 py-3 text-center">{team.pp}</td>
                          <td className="px-4 py-3 text-center">{team.gf}</td>
                          <td className="px-4 py-3 text-center">{team.gc}</td>
                          <td className="px-4 py-3 text-center text-slate-400 font-semibold">{team.dg > 0 ? `+${team.dg}` : team.dg}</td>
                          <td className="px-6 py-3 text-center font-bold text-emerald-400 bg-emerald-500/5">{team.pts}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rendimientos Destacados (1/3 de ancho) */}
            <div className="space-y-6">
              <div className="glass-card p-6 flex flex-col justify-between h-36">
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">🔥 Mejor Ataque</span>
                  <h3 className="text-xl font-bold text-white mt-1">{stats.overview.bestAttack.name}</h3>
                </div>
                <div className="border-t border-slate-800/60 pt-3 flex justify-between items-center text-xs text-slate-400">
                  <span>Goles Anotados</span>
                  <span className="font-extrabold text-white text-sm">{stats.overview.bestAttack.goals} Goles</span>
                </div>
              </div>

              <div className="glass-card p-6 flex flex-col justify-between h-36">
                <div>
                  <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">🛡️ Mejor Defensa</span>
                  <h3 className="text-xl font-bold text-white mt-1">{stats.overview.bestDefense.name}</h3>
                </div>
                <div className="border-t border-slate-800/60 pt-3 flex justify-between items-center text-xs text-slate-400">
                  <span>Goles Recibidos</span>
                  <span className="font-extrabold text-white text-sm">{stats.overview.bestDefense.goals} Goles</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rankings: Goleadores y Asistentes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Goleadores */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-slate-800 pb-3">
                <Award className="text-emerald-400 h-5 w-5" />
                Máximos Goleadores
              </h3>
              <div className="space-y-2">
                {stats.scorers.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No hay goles registrados.</p>
                ) : (
                  stats.scorers.map((player, idx) => (
                    <div key={player.player_id} className="flex justify-between items-center p-2 rounded bg-slate-900/30 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-400 w-4">{idx + 1}</span>
                        <div>
                          <p className="font-bold text-white">{player.full_name}</p>
                          <p className="text-[9px] text-slate-500">🛡️ {player.team_name}</p>
                        </div>
                      </div>
                      <span className="font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded">
                        ⚽ {player.goals}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Asistentes */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-slate-800 pb-3">
                <Award className="text-amber-500 h-5 w-5" />
                Máximos Asistentes
              </h3>
              <div className="space-y-2">
                {stats.assistants.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No hay asistencias registradas.</p>
                ) : (
                  stats.assistants.map((player, idx) => (
                    <div key={player.player_id} className="flex justify-between items-center p-2 rounded bg-slate-900/30 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-400 w-4">{idx + 1}</span>
                        <div>
                          <p className="font-bold text-white">{player.full_name}</p>
                          <p className="text-[9px] text-slate-500">🛡️ {player.team_name}</p>
                        </div>
                      </div>
                      <span className="font-black text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded">
                        👟 {player.assists}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Valla Menos Vencida y Fair Play */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Valla Menos Vencida */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-slate-800 pb-3">
                <Shield className="text-blue-400 h-5 w-5" />
                Valla Menos Vencida (Porteros)
              </h3>
              <div className="space-y-2">
                {stats.goalkeepers.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No hay porteros elegibles.</p>
                ) : (
                  stats.goalkeepers.map((gk, idx) => (
                    <div key={gk.player_id} className="flex justify-between items-center p-2 rounded bg-slate-900/30 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-400 w-4">{idx + 1}</span>
                        <div>
                          <p className="font-bold text-white">{gk.full_name}</p>
                          <p className="text-[9px] text-slate-500">🛡️ {gk.team_name} • {gk.matches_played} PJ</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-200">Goles Concedidos: <strong className="text-red-400">{gk.goals_conceded}</strong></p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Fair Play */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-slate-800 pb-3">
                <AlertTriangle className="text-yellow-500 h-5 w-5" />
                Fair Play (Juego Limpio)
              </h3>
              <div className="space-y-2">
                {stats.fairPlay.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No hay registros de juego limpio.</p>
                ) : (
                  stats.fairPlay.map((team, idx) => (
                    <div key={team.team_id} className="flex justify-between items-center p-2 rounded bg-slate-900/30 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-400 w-4">{idx + 1}</span>
                        <p className="font-bold text-white">{team.name}</p>
                      </div>
                      <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                        {team.fair_play_points || 0} pts castigo
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
