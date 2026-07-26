import React from 'react';
import Link from 'next/link';
import db from '@/lib/db';
import { Trophy, ArrowRight, Users, Calendar } from 'lucide-react';

function getTournaments() {
  try {
    return db.prepare(`
      SELECT t.*, o.name as organization_name,
             (SELECT COUNT(*) FROM teams WHERE tournament_id = t.id) as team_count
      FROM tournaments t
      JOIN organizations o ON t.organization_id = o.id
      ORDER BY t.created_at DESC
    `).all();
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return [];
  }
}

const statusColors = {
  inscripciones_abiertas: 'bg-emerald-500/15 text-emerald-400',
  activo: 'bg-blue-500/15 text-blue-400',
  finalizado: 'bg-slate-500/15 text-slate-400',
  cancelado: 'bg-red-500/15 text-red-400',
};

export default function TorneosPage() {
  const tournaments = getTournaments();

  return (
    <div className="page-container py-14 space-y-10">
      {/* Page Header */}
      <div className="section-header">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10">
            <Trophy className="text-emerald-400 h-7 w-7" />
          </div>
          Torneos Disponibles
        </h1>
        <p className="text-slate-400 mt-3 max-w-2xl">
          Consulta las tablas de posiciones, el fixture y las estadísticas oficiales de las ligas amateurs.
        </p>
      </div>

      {/* Tournament Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.length === 0 ? (
          <div className="col-span-full glass-card p-16 text-center text-slate-500">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No hay torneos registrados</p>
            <p className="text-sm mt-1">Los torneos aparecerán aquí cuando sean creados.</p>
          </div>
        ) : (
          tournaments.map(tour => (
            <div key={tour.id} className="glass-card hover:glass-card-hover flex flex-col justify-between h-full overflow-hidden group transition-all duration-300">
              {/* Cover */}
              <div className="h-36 bg-gradient-to-br from-slate-800 via-slate-800 to-slate-700 relative overflow-hidden">
                {tour.cover_image && (
                  <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: `url(${tour.cover_image})` }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
                <span className={`absolute top-4 right-4 badge-status ${statusColors[tour.status] || 'bg-slate-500/15 text-slate-400'}`}>
                  {tour.status.replace(/_/g, ' ')}
                </span>
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <span className="text-3xl">🏆</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 flex-grow space-y-4">
                <div>
                  <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">{tour.organization_name}</span>
                  <h3 className="font-bold text-white text-xl mt-1 leading-tight">{tour.name}</h3>
                </div>

                {tour.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{tour.description}</p>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 py-3 border-t border-b border-slate-800/50">
                  <div className="text-center">
                    <span className="block text-sm font-bold text-white">{tour.category || 'Libre'}</span>
                    <span className="text-[10px] text-slate-500">Categoría</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-sm font-bold text-white">{tour.season}</span>
                    <span className="text-[10px] text-slate-500">Temporada</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-sm font-bold text-white">{tour.team_count}/{tour.max_teams}</span>
                    <span className="text-[10px] text-slate-500">Equipos</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="px-6 pb-6">
                <Link
                  href={`/torneos/${tour.id}`}
                  className="btn-base btn-primary hover:btn-primary-hover w-full text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  Ver Detalles y Estadísticas
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
