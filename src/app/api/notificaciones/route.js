import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

// GET /api/notificaciones - List user-specific and global notifications
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    
    let query = 'SELECT * FROM notifications WHERE user_id IS NULL';
    const params = [];

    if (user) {
      query += ' OR user_id = ?';
      params.push(user.id);
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const notifications = db.prepare(query).all(...params);

    return NextResponse.json({ notifications });

  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT /api/notificaciones - Mark notifications as read
export async function PUT(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { id } = body;

    if (id) {
      // Mark specific notification as read (only if it belongs to user or is global)
      const notification = db.prepare('SELECT user_id FROM notifications WHERE id = ?').get(id);
      if (!notification) {
        return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });
      }

      if (notification.user_id !== null && notification.user_id !== user.id) {
        return NextResponse.json({ error: 'No tienes permiso para modificar esta notificación' }, { status: 403 });
      }

      db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(id);
    } else {
      // Mark all user notifications as read
      db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(user.id);
    }

    return NextResponse.json({ message: 'Notificaciones marcadas como leídas' });

  } catch (error) {
    console.error('Error al actualizar notificaciones:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
