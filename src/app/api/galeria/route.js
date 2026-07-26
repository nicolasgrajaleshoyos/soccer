import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { hasRole, ROLES } from '@/lib/permissions';

// GET /api/galeria - List albums
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tourId = searchParams.get('tournament_id');

    let query = 'SELECT a.*, t.name as tournament_name FROM albums a JOIN tournaments t ON a.tournament_id = t.id WHERE 1=1';
    const params = [];

    if (tourId) {
      query += ' AND a.tournament_id = ?';
      params.push(parseInt(tourId));
    }

    query += ' ORDER BY a.created_at DESC';

    const albums = db.prepare(query).all(...params);

    // Fetch first image of each album as thumbnail
    const updatedAlbums = albums.map(album => {
      const cover = db.prepare("SELECT url FROM media WHERE album_id = ? AND type = 'image' LIMIT 1").get(album.id);
      return {
        ...album,
        cover_url: cover ? cover.url : '/uploads/album_placeholder.jpg'
      };
    });

    return NextResponse.json({ albums: updatedAlbums });

  } catch (error) {
    console.error('Error al obtener galería de álbumes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/galeria - Create an album
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || !hasRole(user, [ROLES.SUPERADMIN, ROLES.ORGANIZADOR])) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { tournament_id, name, description } = body;

    const tourId = parseInt(tournament_id);

    if (isNaN(tourId) || !name) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (tournament_id, name)' }, { status: 400 });
    }

    const insertAlbum = db.prepare(`
      INSERT INTO albums (tournament_id, name, description)
      VALUES (?, ?, ?)
    `);

    const result = insertAlbum.run(tourId, name, description || null);
    const newAlbum = db.prepare('SELECT * FROM albums WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json({
      message: 'Álbum creado exitosamente',
      album: newAlbum
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear álbum:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
