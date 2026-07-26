import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { hasRole, ROLES } from '@/lib/permissions';

// GET /api/canchas/[id] - Get individual field details
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const fieldId = parseInt(id);

    if (isNaN(fieldId)) {
      return NextResponse.json({ error: 'ID de cancha no válido' }, { status: 400 });
    }

    const field = db.prepare('SELECT * FROM fields WHERE id = ?').get(fieldId);
    if (!field) {
      return NextResponse.json({ error: 'Cancha no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ field });

  } catch (error) {
    console.error('Error al obtener cancha:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT /api/canchas/[id] - Update field details
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const fieldId = parseInt(id);

    if (isNaN(fieldId)) {
      return NextResponse.json({ error: 'ID de cancha no válido' }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user || !hasRole(user, [ROLES.SUPERADMIN, ROLES.ORGANIZADOR])) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const {
      tournament_id,
      name,
      address,
      municipality,
      latitude,
      longitude,
      photo,
      capacity,
      surface_type
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    db.prepare(`
      UPDATE fields SET
        tournament_id = ?, name = ?, address = ?, municipality = ?, 
        latitude = ?, longitude = ?, photo = ?, capacity = ?, surface_type = ?
      WHERE id = ?
    `).run(
      tournament_id ? parseInt(tournament_id) : null,
      name,
      address !== undefined ? address : null,
      municipality !== undefined ? municipality : null,
      latitude !== undefined ? parseFloat(latitude) : null,
      longitude !== undefined ? parseFloat(longitude) : null,
      photo !== undefined ? photo : null,
      capacity !== undefined ? parseInt(capacity) : null,
      surface_type !== undefined ? surface_type : null,
      fieldId
    );

    const updatedField = db.prepare('SELECT * FROM fields WHERE id = ?').get(fieldId);

    return NextResponse.json({
      message: 'Cancha actualizada exitosamente',
      field: updatedField
    });

  } catch (error) {
    console.error('Error al actualizar cancha:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE /api/canchas/[id] - Delete field
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const fieldId = parseInt(id);

    if (isNaN(fieldId)) {
      return NextResponse.json({ error: 'ID de cancha no válido' }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user || !hasRole(user, [ROLES.SUPERADMIN, ROLES.ORGANIZADOR])) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    db.prepare('DELETE FROM fields WHERE id = ?').run(fieldId);

    return NextResponse.json({ message: 'Cancha eliminada exitosamente' });

  } catch (error) {
    console.error('Error al eliminar cancha:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
