import React from 'react';
import Link from 'next/link';
import db from '@/lib/db';
import { ArrowLeft, Image as ImageIcon, Trophy } from 'lucide-react';
import MediaLightbox from '@/components/ui/MediaLightbox';

function getAlbumData(id) {
  try {
    const album = db.prepare(`
      SELECT a.*, t.name as tournament_name 
      FROM albums a
      JOIN tournaments t ON a.tournament_id = t.id
      WHERE a.id = ?
    `).get(id);

    if (!album) return null;

    const media = db.prepare('SELECT * FROM media WHERE album_id = ? ORDER BY created_at DESC').all(id);

    return { album, media };
  } catch (error) {
    console.error('Error fetching album data:', error);
    return null;
  }
}

export default async function AlbumDetailPage({ params }) {
  const { id } = await params;
  const albumId = parseInt(id);

  if (isNaN(albumId)) {
    return (
      <div className="page-container py-20 text-center">
        <h1 className="text-2xl text-red-500 font-bold">ID de álbum no válido</h1>
        <Link href="/galeria" className="text-emerald-400 mt-4 inline-block hover:underline">Volver a Galería</Link>
      </div>
    );
  }

  const data = getAlbumData(albumId);

  if (!data) {
    return (
      <div className="page-container py-20 text-center">
        <h1 className="text-2xl text-white font-bold">Álbum no encontrado</h1>
        <Link href="/galeria" className="text-emerald-400 mt-4 inline-block hover:underline">Volver a Galería</Link>
      </div>
    );
  }

  const { album, media } = data;

  return (
    <div className="page-container py-8 space-y-6">
      
      {/* Back button */}
      <Link href="/galeria" className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs font-semibold">
        <ArrowLeft className="h-4 w-4" />
        Volver a Galería
      </Link>

      {/* Header Info */}
      <div className="glass-card p-6 space-y-2">
        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
          <Trophy className="h-3.5 w-3.5 text-amber-500" />
          Torneo: {album.tournament_name}
        </span>
        <h1 className="text-2xl font-extrabold text-white">{album.name}</h1>
        <p className="text-xs text-slate-400">{album.description}</p>
      </div>

      {/* Lightbox Interactive Component */}
      <MediaLightbox media={media} />

    </div>
  );
}
