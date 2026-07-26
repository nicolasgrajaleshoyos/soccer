import React from 'react';
import db from '@/lib/db';
import { getTournamentStats } from '@/lib/stats';
import StatsDashboard from '@/components/ui/StatsDashboard';
import { BarChart2 } from 'lucide-react';

function getTournamentsAndFirstStats() {
  try {
    const tournaments = db.prepare('SELECT id, name, season FROM tournaments ORDER BY created_at DESC').all();
    
    let initialStats = null;
    let selectedTourId = null;

    if (tournaments.length > 0) {
      selectedTourId = tournaments[0].id;
      initialStats = getTournamentStats(selectedTourId);
    }

    return { tournaments, initialStats, selectedTourId };
  } catch (error) {
    console.error('Error loading stats page:', error);
    return { tournaments: [], initialStats: null, selectedTourId: null };
  }
}

export default function EstadisticasPage() {
  const { tournaments, initialStats, selectedTourId } = getTournamentsAndFirstStats();

  return (
    <div className="page-container py-14 space-y-10">
      {/* Page Header */}
      <div className="section-header">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10">
            <BarChart2 className="text-emerald-400 h-7 w-7" />
          </div>
          Estadísticas y Rankings
        </h1>
        <p className="text-slate-400 mt-3 max-w-2xl">
          Tablas de goleadores, porteros menos vencidos, asistencias y tarjetas acumuladas de todos los torneos.
        </p>
      </div>

      {tournaments.length === 0 ? (
        <div className="glass-card p-16 text-center text-slate-500">
          <BarChart2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">Sin datos estadísticos</p>
          <p className="text-sm mt-1">Las estadísticas aparecerán cuando haya torneos registrados.</p>
        </div>
      ) : (
        <StatsDashboard 
          tournaments={tournaments} 
          initialStats={initialStats} 
          selectedTourId={selectedTourId} 
        />
      )}
    </div>
  );
}
