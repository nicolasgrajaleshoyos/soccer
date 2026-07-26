import React from 'react';
import db from '@/lib/db';
import { Calendar, Trophy, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';

function getScheduledMatches() {
  try {
    return db.prepare(`
      SELECT m.*, 
             h.name as home_team_name, h.shield as home_team_shield,
             a.name as away_team_name, a.shield as away_team_shield,
             t.name as tournament_name, f.name as field_name, f.municipality as field_city
      FROM matches m
      JOIN teams h ON m.home_team_id = h.id
      JOIN teams a ON m.away_team_id = a.id
      JOIN tournaments t ON m.tournament_id = t.id
      LEFT JOIN fields f ON m.field_id = f.id
      WHERE m.status IN ('programado', 'en_juego')
      ORDER BY m.date ASC, m.time ASC
    `).all();
  } catch (error) {
    console.error('Error fetching calendar matches:', error);
    return [];
  }
}

export default function CalendarioPage() {
  const matches = getScheduledMatches();

  return (
    <div className="page-container py-14 space-y-10">
      {/* Page Header */}
      <div className="section-header">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10">
            <Calendar className="text-emerald-400 h-7 w-7" />
          </div>
          Calendario de Partidos
        </h1>
        <p className="text-slate-400 mt-3 max-w-2xl">
          Fecha, hora, ubicación y detalles de los próximos encuentros oficiales.
        </p>
      </div>

      {/* Match Cards */}
      {matches.length === 0 ? (
        <div className="glass-card p-16 text-center text-slate-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No hay partidos programados</p>
          <p className="text-sm mt-1">Los partidos aparecerán aquí cuando sean agendados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map(match => (
            <div key={match.id} className="glass-card hover:glass-card-hover p-6 flex flex-col gap-4 transition-all duration-300">
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-800/50 text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5" />
                  {match.tournament_name}
                </span>
                <span className="badge-status bg-slate-700/50 text-slate-300">
                  Jornada {match.matchday}
                </span>
              </div>

              {/* VS Section */}
              <div className="flex justify-between items-center py-4">
                <div className="w-5/12 text-center space-y-2">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-3xl mx-auto border border-slate-700/50">
                    🛡️
                  </div>
                  <Link href={`/equipos/${match.home_team_id}`} className="font-bold text-sm text-white hover:text-emerald-400 transition-colors block truncate">
                    {match.home_team_name}
                  </Link>
                </div>

                <div className="w-2/12 text-center">
                  <span className="inline-block px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-wider">
                    VS
                  </span>
                </div>

                <div className="w-5/12 text-center space-y-2">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-3xl mx-auto border border-slate-700/50">
                    🛡️
                  </div>
                  <Link href={`/equipos/${match.away_team_id}`} className="font-bold text-sm text-white hover:text-emerald-400 transition-colors block truncate">
                    {match.away_team_name}
                  </Link>
                </div>
              </div>

              {/* Footer details */}
              <div className="pt-3 border-t border-slate-800/50 grid grid-cols-2 gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>{match.date} • {match.time}</span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="truncate">{match.field_name || 'Por asignar'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
