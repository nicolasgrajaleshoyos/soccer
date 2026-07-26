import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { hasRole, ROLES } from '@/lib/permissions';

// POST /api/galeria/[id]/media - Add photo/video to an album
export async function POST(request, { params }) {
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

    // Verify album exists
    const album = db.prepare('SELECT id FROM albums WHERE id = ?').get(albumId);
    if (!album) {
      return NextResponse.json({ error: 'El álbum no existe' }, { status: 404 });
    }

    const body = await request.json();
    const { type, url, caption } = body;

    if (!type || !url) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (type, url)' }, { status: 400 });
    }

    if (!['image', 'video'].includes(type)) {
      return NextResponse.json({ error: 'Tipo multimedia inválido' }, { status: 400 });
    }

    const insertMedia = db.prepare(`
      INSERT INTO media (album_id, type, url, caption)
      VALUES (?, ?, ?, ?)
    `);

    const result = insertMedia.run(albumId, type, url, caption || null);
    const newMedia = db.prepare('SELECT * FROM media WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json({
      message: 'Recurso añadido exitosamente al álbum',
      media: newMedia
    }, { status: 201 });

  } catch (error) {
    console.error('Error al añadir recurso al álbum:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
