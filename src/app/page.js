import React from 'react';
import Link from 'next/link';
import db from '@/lib/db';
import { Trophy, Calendar, Users, Newspaper, Image as ImageIcon, ChevronRight, Zap, BarChart2, MapPin } from 'lucide-react';

function getHomeData() {
  try {
    const activeTournaments = db.prepare(`
      SELECT t.*, o.name as organization_name 
      FROM tournaments t 
      JOIN organizations o ON t.organization_id = o.id 
      WHERE t.status IN ('inscripciones_abiertas', 'activo') 
      LIMIT 3
    `).all();

    const upcomingMatches = db.prepare(`
      SELECT m.*, 
             h.name as home_team_name, h.shield as home_team_shield,
             a.name as away_team_name, a.shield as away_team_shield,
             f.name as field_name
      FROM matches m
      JOIN teams h ON m.home_team_id = h.id
      JOIN teams a ON m.away_team_id = a.id
      LEFT JOIN fields f ON m.field_id = f.id
      WHERE m.status = 'programado'
      ORDER BY m.date ASC, m.time ASC
      LIMIT 4
    `).all();

    const featuredNews = db.prepare(`
      SELECT n.*, t.name as tournament_name 
      FROM news n
      LEFT JOIN tournaments t ON n.tournament_id = t.id
      ORDER BY n.created_at DESC
      LIMIT 3
    `).all();

    return { activeTournaments, upcomingMatches, featuredNews };
  } catch (error) {
    console.error('Error loading home data:', error);
    return { activeTournaments: [], upcomingMatches: [], featuredNews: [] };
  }
}

export default function HomePage() {
  const { activeTournaments, upcomingMatches, featuredNews } = getHomeData();

  return (
    <div>
      {/* ═══ HERO ═══ */}
      <section className="relative py-24 lg:py-36 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(245,158,11,0.1),transparent_50%)]" />

        <div className="relative z-10 page-container text-center">
          {/* Season Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Temporada 2026 en Vivo
          </div>

          <h1 className="font-[Outfit] text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
            La Pasión del Fútbol <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400">
              Amateur al Siguiente Nivel
            </span>
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg text-slate-400 leading-relaxed">
            Administra ligas, programa partidos en tiempo real, registra eventos
            detallados y visualiza tablas automatizadas.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/torneos" className="btn-base btn-primary hover:btn-primary-hover inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold">
              <Trophy className="h-5 w-5" />
              Explorar Torneos
            </Link>
            <Link href="/login" className="btn-base btn-secondary hover:btn-secondary-hover inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold">
              Panel Administrativo
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ QUICK ACCESS ═══ */}
      <section className="py-16 bg-slate-950/60">
        <div className="page-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { href: '/torneos', icon: Trophy, label: 'Torneos', desc: 'Clasificaciones y fixtures' },
              { href: '/equipos', icon: Users, label: 'Equipos', desc: 'Plantillas y clubes' },
              { href: '/calendario', icon: Calendar, label: 'Calendario', desc: 'Próximos partidos' },
              { href: '/galeria', icon: ImageIcon, label: 'Galería', desc: 'Fotos y videos' },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="glass-card hover:glass-card-hover p-6 flex flex-col items-center text-center gap-3 group">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-white">{item.label}</h3>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TOURNAMENTS + MATCHES ═══ */}
      <section className="py-16">
        <div className="page-container">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* Active Tournaments */}
            <div className="lg:col-span-3 space-y-6">
              <div className="section-header flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-emerald-400" />
                  Torneos Activos
                </h2>
                <Link href="/torneos" className="text-xs text-emerald-400 flex items-center gap-1 hover:underline font-semibold">
                  Ver todos <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="space-y-4">
                {activeTournaments.length === 0 ? (
                  <div className="glass-card p-10 text-center text-slate-500">
                    No hay torneos activos en este momento.
                  </div>
                ) : (
                  activeTournaments.map(tour => (
                    <div key={tour.id} className="glass-card hover:glass-card-hover p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center text-2xl shrink-0">
                          🏆
                        </div>
                        <div>
                          <h3 className="font-bold text-white">{tour.name}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {tour.organization_name} • {tour.season}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                        <span className="badge-status bg-emerald-500/15 text-emerald-400">
                          {tour.status.replace(/_/g, ' ')}
                        </span>
                        <Link href={`/torneos/${tour.id}`} className="btn-base btn-secondary hover:btn-secondary-hover px-4 py-2 text-xs rounded-lg">
                          Ver Detalles
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Matches */}
            <div className="lg:col-span-2 space-y-6">
              <div className="section-header flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-400" />
                  Próximos Partidos
                </h2>
              </div>

              <div className="space-y-3">
                {upcomingMatches.length === 0 ? (
                  <div className="glass-card p-10 text-center text-slate-500 text-sm">
                    No hay partidos programados.
                  </div>
                ) : (
                  upcomingMatches.map(match => (
                    <div key={match.id} className="glass-card hover:glass-card-hover p-4 space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-medium">Jornada {match.matchday}</span>
                        <span>{match.date} • {match.time}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="font-semibold text-sm text-slate-200 truncate w-5/12">{match.home_team_name}</span>
                        <span className="text-emerald-400 font-black text-[10px] px-2.5 py-1 rounded-md bg-emerald-500/10">VS</span>
                        <span className="font-semibold text-sm text-slate-200 truncate text-right w-5/12">{match.away_team_name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1 pt-2 border-t border-slate-800/50">
                        <MapPin className="h-3 w-3" />
                        {match.field_name || 'Cancha por definir'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ NEWS ═══ */}
      <section className="py-16 bg-slate-950/40">
        <div className="page-container">
          <div className="section-header flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Newspaper className="h-6 w-6 text-emerald-400" />
              Noticias Recientes
            </h2>
            <Link href="/noticias" className="text-xs text-emerald-400 flex items-center gap-1 hover:underline font-semibold">
              Ver todas <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredNews.length === 0 ? (
              <div className="md:col-span-3 glass-card p-12 text-center text-slate-500">
                No hay noticias publicadas.
              </div>
            ) : (
              featuredNews.map(post => (
                <article key={post.id} className="glass-card overflow-hidden flex flex-col h-full group">
                  <div className="h-48 bg-slate-800 relative overflow-hidden">
                    {post.image ? (
                      <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: `url(${post.image})` }} />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-10">⚽</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                  </div>
                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                        {post.tournament_name || 'General'}
                      </span>
                      <h3 className="font-bold text-white text-lg leading-snug line-clamp-2">{post.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-3">{post.content}</p>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-800/60">
                      <span className="text-[10px] text-slate-500">
                        {new Date(post.created_at).toLocaleDateString('es-CO')}
                      </span>
                      <Link href={`/noticias/${post.id}`} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                        Leer Más →
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
