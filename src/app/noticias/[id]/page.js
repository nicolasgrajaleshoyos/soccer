import React from 'react';
import Link from 'next/link';
import db from '@/lib/db';
import { ArrowLeft, Calendar, FileText } from 'lucide-react';

function getNewsPost(id) {
  try {
    return db.prepare(`
      SELECT n.*, t.name as tournament_name, u.name as author_name 
      FROM news n
      LEFT JOIN tournaments t ON n.tournament_id = t.id
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.id = ?
    `).get(id);
  } catch (error) {
    console.error('Error fetching news post:', error);
    return null;
  }
}

export default async function NewsDetailPage({ params }) {
  const { id } = await params;
  const newsId = parseInt(id);

  if (isNaN(newsId)) {
    return (
      <div className="page-container py-20 text-center">
        <h1 className="text-2xl text-red-500 font-bold">ID de noticia no válido</h1>
        <Link href="/noticias" className="text-emerald-400 mt-4 inline-block hover:underline">Volver a Noticias</Link>
      </div>
    );
  }

  const post = getNewsPost(newsId);

  if (!post) {
    return (
      <div className="page-container py-20 text-center">
        <h1 className="text-2xl text-white font-bold">Noticia no encontrada</h1>
        <Link href="/noticias" className="text-emerald-400 mt-4 inline-block hover:underline">Volver a Noticias</Link>
      </div>
    );
  }

  return (
    <div className="page-container py-8 max-w-3xl space-y-6">
      
      {/* Back button */}
      <Link href="/noticias" className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs font-semibold">
        <ArrowLeft className="h-4 w-4" />
        Volver a Noticias
      </Link>

      {/* Main Post article */}
      <article className="glass-card overflow-hidden">
        {/* Cover image if available */}
        {post.image && (
          <div className="h-64 bg-slate-800 bg-cover bg-center" style={{ backgroundImage: `url(${post.image})` }} />
        )}

        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-0.5 rounded-full inline-block">
              {post.tournament_name || 'Liga General'}
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">{post.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-b border-slate-800/80 pb-4">
              <span>Por: <strong className="text-slate-300">{post.author_name || 'Organización'}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Body Content */}
          <div className="text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-line space-y-4">
            {post.content}
          </div>

          {/* Attached Document */}
          {post.document && (
            <div className="pt-6 border-t border-slate-800/80">
              <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-lg border border-slate-800">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Documento Oficial Adjunto</p>
                    <p className="text-[10px] text-slate-500">PDF / Archivo de sanción o circular</p>
                  </div>
                </div>
                <a 
                  href={post.document} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-secondary px-4 py-2 text-xs"
                >
                  Ver Documento
                </a>
              </div>
            </div>
          )}

        </div>
      </article>

    </div>
  );
}
