import React from 'react';
import Link from 'next/link';
import db from '@/lib/db';
import { Users, Trophy, ArrowRight } from 'lucide-react';

function getTeams() {
  try {
    return db.prepare(`
      SELECT t.*, tr.name as tournament_name 
      FROM teams t
      JOIN tournaments tr ON t.tournament_id = tr.id
      ORDER BY t.name ASC
    `).all();
  } catch (error) {
    console.error('Error fetching teams:', error);
    return [];
  }
}

export default function EquiposPage() {
  const teams = getTeams();

  return (
    <div className="page-container py-14 space-y-10">
      {/* Page Header */}
      <div className="section-header">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10">
            <Users className="text-emerald-400 h-7 w-7" />
          </div>
          Equipos Registrados
        </h1>
        <p className="text-slate-400 mt-3 max-w-2xl">
          Conoce a los clubes participantes, plantillas oficiales e historial deportivo.
        </p>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.length === 0 ? (
          <div className="col-span-full glass-card p-16 text-center text-slate-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No hay equipos registrados</p>
            <p className="text-sm mt-1">Los equipos aparecerán aquí cuando sean inscritos.</p>
          </div>
        ) : (
          teams.map(team => (
            <div key={team.id} className="glass-card hover:glass-card-hover p-6 flex flex-col justify-between h-full gap-5 transition-all duration-300 group">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-3xl shadow-lg border border-slate-700/50 shrink-0">
                  🛡️
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="font-bold text-white text-lg leading-tight truncate">{team.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Trophy className="h-3 w-3 text-amber-500 shrink-0" />
                    <span className="truncate">{team.tournament_name}</span>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Fundado: {team.founded || 'N/A'} • {team.city || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Team meta */}
              <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-slate-800/50 text-center text-xs">
                <div>
                  <span className="block font-bold text-white">{team.founded || 'N/A'}</span>
                  <span className="text-[10px] text-slate-500">Fundación</span>
                </div>
                <div>
                  <span className="block font-bold text-white">{team.neighborhood || 'N/A'}</span>
                  <span className="text-[10px] text-slate-500">Barrio</span>
                </div>
              </div>

              {/* Action */}
              <Link
                href={`/equipos/${team.id}`}
                className="btn-base btn-secondary hover:btn-secondary-hover w-full text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2"
              >
                Ver Perfil Completo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
