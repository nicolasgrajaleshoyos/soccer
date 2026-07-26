import React from 'react';
import Link from 'next/link';
import db from '@/lib/db';
import { getTournamentStats } from '@/lib/stats';
import { Trophy, Calendar, Users, Newspaper, Shield, FileText, ArrowLeft, BarChart2 } from 'lucide-react';
import TournamentDetailsTabs from '@/components/ui/TournamentDetailsTabs';

// Fetch tournament data on the server
function getTournamentData(id) {
  try {
    const tournament = db.prepare(`
      SELECT t.*, o.name as organization_name 
      FROM tournaments t 
      JOIN organizations o ON t.organization_id = o.id 
      WHERE t.id = ?
    `).get(id);

    if (!tournament) return null;

    // Get statistics
    const stats = getTournamentStats(id);

    // Get participating teams
    const teams = db.prepare('SELECT id, name, shield, coach, captain FROM teams WHERE tournament_id = ? ORDER BY name ASC').all(id);

    // Get all matches grouped by matchday
    const matches = db.prepare(`
      SELECT m.*, 
             h.name as home_team_name, h.shield as home_team_shield,
             a.name as away_team_name, a.shield as away_team_shield,
             f.name as field_name, ref.name as referee_name,
             r.home_score, r.away_score
      FROM matches m
      JOIN teams h ON m.home_team_id = h.id
      JOIN teams a ON m.away_team_id = a.id
      LEFT JOIN fields f ON m.field_id = f.id
      LEFT JOIN referees ref ON m.referee_id = ref.id
      LEFT JOIN match_results r ON m.id = r.match_id
      WHERE m.tournament_id = ?
      ORDER BY m.matchday ASC, m.date ASC, m.time ASC
    `).all(id);

    return { tournament, stats, teams, matches };
  } catch (error) {
    console.error('Error fetching tournament data:', error);
    return null;
  }
}

export default async function TournamentDetailPage({ params }) {
  const { id } = await params;
  const tourId = parseInt(id);

  if (isNaN(tourId)) {
    return (
      <div className="page-container py-20 text-center">
        <h1 className="text-2xl text-red-500 font-bold">ID de torneo no válido</h1>
        <Link href="/torneos" className="text-emerald-400 mt-4 inline-block hover:underline">Volver a Torneos</Link>
      </div>
    );
  }

  const data = getTournamentData(tourId);

  if (!data) {
    return (
      <div className="page-container py-20 text-center">
        <h1 className="text-2xl text-white font-bold">Torneo no encontrado</h1>
        <Link href="/torneos" className="text-emerald-400 mt-4 inline-block hover:underline">Volver a Torneos</Link>
      </div>
    );
  }

  const { tournament, stats, teams, matches } = data;

  return (
    <div className="page-container py-8 space-y-6">
      
      {/* Back Button */}
      <Link href="/torneos" className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs font-semibold">
        <ArrowLeft className="h-4 w-4" />
        Volver a Torneos
      </Link>

      {/* Hero Header */}
      <div className="glass-card overflow-hidden">
        <div 
          className="h-48 bg-slate-800 relative bg-cover bg-center"
          style={{ backgroundImage: tournament.cover_image ? `url(${tournament.cover_image})` : 'none' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
          <div className="absolute bottom-6 left-6 flex items-end gap-4">
            <div className="h-16 w-16 bg-slate-900/90 rounded-2xl border border-slate-700/60 flex items-center justify-center font-bold text-3xl shadow-lg">
              🏆
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                {tournament.status.replace('_', ' ')}
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1 leading-tight">{tournament.name}</h1>
              <p className="text-xs text-slate-300 mt-1">{tournament.organization_name} • Temporada {tournament.season}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Layout (Client Component for Interactive Switching) */}
      <TournamentDetailsTabs 
        tournament={tournament} 
        stats={stats} 
        teams={teams} 
        matches={matches} 
      />

    </div>
  );
}
