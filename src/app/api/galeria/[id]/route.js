import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { hasRole, ROLES } from '@/lib/permissions';

// GET /api/galeria/[id] - Get individual album with all its media
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const albumId = parseInt(id);

    if (isNaN(albumId)) {
      return NextResponse.json({ error: 'ID de álbum no válido' }, { status: 400 });
    }

    const album = db.prepare(`
      SELECT a.*, t.name as tournament_name 
      FROM albums a 
      JOIN tournaments t ON a.tournament_id = t.id 
      WHERE a.id = ?
    `).get(albumId);

    if (!album) {
      return NextResponse.json({ error: 'Álbum no encontrado' }, { status: 404 });
    }

    // Fetch all media elements in the album
    const media = db.prepare('SELECT * FROM media WHERE album_id = ? ORDER BY created_at DESC').all(albumId);
    album.media = media;

    return NextResponse.json({ album });

  } catch (error) {
    console.error('Error al obtener álbum:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE /api/galeria/[id] - Delete album (and its cascade media due to SQLite ON DELETE CASCADE)
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const albumId = parseInt(id);

    if (isNaN(albumId)) {
      return NextResponse.json({ error: 'ID de álbum no válido' }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user || !hasRole(user, [ROLES.SUPERADMIN, ROLES.ORGANIZADOR])) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    db.prepare('DELETE FROM albums WHERE id = ?').run(albumId);

    return NextResponse.json({ message: 'Árbol y contenido del álbum eliminados exitosamente' });

  } catch (error) {
    console.error('Error al eliminar álbum:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
