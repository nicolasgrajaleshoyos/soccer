import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { hasRole, ROLES } from '@/lib/permissions';

// GET /api/noticias/[id] - Get individual news post
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const newsId = parseInt(id);

    if (isNaN(newsId)) {
      return NextResponse.json({ error: 'ID de noticia no válido' }, { status: 400 });
    }

    const news = db.prepare(`
      SELECT n.*, t.name as tournament_name, u.name as author_name 
      FROM news n
      LEFT JOIN tournaments t ON n.tournament_id = t.id
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.id = ?
    `).get(newsId);

    if (!news) {
      return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ news });

  } catch (error) {
    console.error('Error al obtener noticia:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT /api/noticias/[id] - Update news post
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const newsId = parseInt(id);

    if (isNaN(newsId)) {
      return NextResponse.json({ error: 'ID de noticia no válido' }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user || !hasRole(user, [ROLES.SUPERADMIN, ROLES.ORGANIZADOR])) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { tournament_id, title, content, image, document, featured } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Título y contenido son obligatorios' }, { status: 400 });
    }

    db.prepare(`
      UPDATE news SET
        tournament_id = ?, title = ?, content = ?, image = ?, 
        document = ?, featured = ?
      WHERE id = ?
    `).run(
      tournament_id ? parseInt(tournament_id) : null,
      title,
      content,
      image !== undefined ? image : null,
      document !== undefined ? document : null,
      featured ? 1 : 0,
      newsId
    );

    const updatedNews = db.prepare('SELECT * FROM news WHERE id = ?').get(newsId);

    return NextResponse.json({
      message: 'Noticia actualizada exitosamente',
      news: updatedNews
    });

  } catch (error) {
    console.error('Error al actualizar noticia:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE /api/noticias/[id] - Delete news post
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const newsId = parseInt(id);

    if (isNaN(newsId)) {
      return NextResponse.json({ error: 'ID de noticia no válido' }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user || !hasRole(user, [ROLES.SUPERADMIN, ROLES.ORGANIZADOR])) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    db.prepare('DELETE FROM news WHERE id = ?').run(newsId);

    return NextResponse.json({ message: 'Noticia eliminada exitosamente' });

  } catch (error) {
    console.error('Error al eliminar noticia:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
