import React from 'react';
import Link from 'next/link';
import db from '@/lib/db';
import { Image as ImageIcon, Trophy } from 'lucide-react';

function getAlbums() {
  try {
    const albums = db.prepare(`
      SELECT a.*, t.name as tournament_name 
      FROM albums a
      JOIN tournaments t ON a.tournament_id = t.id
      ORDER BY a.created_at DESC
    `).all();

    return albums.map(album => {
      const cover = db.prepare("SELECT url FROM media WHERE album_id = ? AND type = 'image' LIMIT 1").get(album.id);
      const mediaCount = db.prepare('SELECT COUNT(*) as count FROM media WHERE album_id = ?').get(album.id);

      return {
        ...album,
        cover_url: cover ? cover.url : null,
        media_count: mediaCount ? mediaCount.count : 0
      };
    });
  } catch (error) {
    console.error('Error fetching gallery albums:', error);
    return [];
  }
}

export default function GaleriaPage() {
  const albums = getAlbums();

  return (
    <div className="page-container py-14 space-y-10">
      {/* Page Header */}
      <div className="section-header">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10">
            <ImageIcon className="text-emerald-400 h-7 w-7" />
          </div>
          Galería Multimedia
        </h1>
        <p className="text-slate-400 mt-3 max-w-2xl">
          Fotografías, videos oficiales y recuerdos de los torneos de la liga amateur.
        </p>
      </div>

      {/* Albums Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {albums.length === 0 ? (
          <div className="col-span-full glass-card p-16 text-center text-slate-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No hay álbumes registrados</p>
            <p className="text-sm mt-1">Los álbumes aparecerán aquí cuando sean creados.</p>
          </div>
        ) : (
          albums.map(album => (
            <Link key={album.id} href={`/galeria/${album.id}`} className="glass-card overflow-hidden flex flex-col justify-between h-full group transition-all duration-300 hover:glass-card-hover">
              {/* Thumbnail */}
              <div className="h-52 bg-slate-800 relative overflow-hidden">
                {album.cover_url ? (
                  <div className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700" style={{ backgroundImage: `url(${album.cover_url})` }} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-10">📸</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                <span className="absolute bottom-4 left-4 badge-status bg-slate-950/80 text-slate-300">
                  {album.media_count} archivos
                </span>
              </div>

              {/* Body */}
              <div className="p-6 flex-grow space-y-2">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-amber-500" />
                  {album.tournament_name}
                </span>
                <h3 className="font-bold text-white text-lg leading-snug">{album.name}</h3>
                {album.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{album.description}</p>
                )}
              </div>

              {/* Action */}
              <div className="px-6 pb-6">
                <span className="btn-base btn-secondary w-full text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 group-hover:btn-secondary-hover">
                  Abrir Álbum
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
