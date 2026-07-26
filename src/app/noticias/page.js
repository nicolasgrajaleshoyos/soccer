import React from 'react';
import Link from 'next/link';
import db from '@/lib/db';
import { Newspaper, ChevronRight } from 'lucide-react';

function getNews() {
  try {
    return db.prepare(`
      SELECT n.*, t.name as tournament_name 
      FROM news n
      LEFT JOIN tournaments t ON n.tournament_id = t.id
      ORDER BY n.created_at DESC
    `).all();
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

export default function NoticiasPage() {
  const newsList = getNews();

  return (
    <div className="page-container py-14 space-y-10">
      {/* Page Header */}
      <div className="section-header">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10">
            <Newspaper className="text-emerald-400 h-7 w-7" />
          </div>
          Noticias y Novedades
        </h1>
        <p className="text-slate-400 mt-3 max-w-2xl">
          Últimas novedades, comunicados oficiales, sanciones y crónicas de los partidos.
        </p>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {newsList.length === 0 ? (
          <div className="col-span-full glass-card p-16 text-center text-slate-500">
            <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No hay noticias publicadas</p>
            <p className="text-sm mt-1">Las noticias aparecerán aquí cuando sean redactadas.</p>
          </div>
        ) : (
          newsList.map(post => (
            <article key={post.id} className="glass-card overflow-hidden flex flex-col h-full group transition-all duration-300">
              {/* Cover */}
              <div className="h-48 bg-slate-800 relative overflow-hidden">
                {post.image ? (
                  <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: `url(${post.image})` }} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-10">⚽</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              </div>

              {/* Body */}
              <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                    {post.tournament_name || 'Liga General'}
                  </span>
                  <h3 className="font-bold text-white text-lg line-clamp-2 leading-snug">{post.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{post.content}</p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-800/50 text-[10px] text-slate-500">
                  <span>{new Date(post.created_at).toLocaleDateString('es-CO')}</span>
                  <Link href={`/noticias/${post.id}`} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-0.5">
                    Leer más <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
