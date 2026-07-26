import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { hasRole, ROLES } from '@/lib/permissions';

// GET /api/noticias - List news posts
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tourId = searchParams.get('tournament_id');
    const featured = searchParams.get('featured');

    let query = `
      SELECT n.*, t.name as tournament_name, u.name as author_name 
      FROM news n
      LEFT JOIN tournaments t ON n.tournament_id = t.id
      LEFT JOIN users u ON n.author_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (tourId) {
      query += ' AND n.tournament_id = ?';
      params.push(parseInt(tourId));
    }
    if (featured) {
      query += ' AND n.featured = ?';
      params.push(featured === 'true' ? 1 : 0);
    }

    query += ' ORDER BY n.created_at DESC';

    const news = db.prepare(query).all(...params);

    return NextResponse.json({ news });

  } catch (error) {
    console.error('Error al obtener noticias:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/noticias - Create a news post
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || !hasRole(user, [ROLES.SUPERADMIN, ROLES.ORGANIZADOR])) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { tournament_id, title, content, image, document, featured } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Título y contenido son obligatorios' }, { status: 400 });
    }

    const insertNews = db.prepare(`
      INSERT INTO news (tournament_id, title, content, image, document, featured, author_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    let newsId;
    db.transaction(() => {
      const result = insertNews.run(
        tournament_id ? parseInt(tournament_id) : null,
        title,
        content,
        image || null,
        document || null,
        featured ? 1 : 0,
        user.id
      );
      newsId = result.lastInsertRowid;

      // Add a global notification for new post (Módulo 13)
      const notifyMessage = `Nueva noticia publicada: "${title}"`;
      db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)')
        .run(null, 'new_post', 'Nueva Noticia', notifyMessage);
    })();

    const newPost = db.prepare('SELECT * FROM news WHERE id = ?').get(newsId);

    return NextResponse.json({
      message: 'Noticia creada exitosamente',
      news: newPost
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear noticia:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
