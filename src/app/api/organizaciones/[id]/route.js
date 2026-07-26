import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { canManageOrganization, ROLES } from '@/lib/permissions';

// GET /api/organizaciones/[id] - Get individual organization details
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const orgId = parseInt(id);

    if (isNaN(orgId)) {
      return NextResponse.json({ error: 'ID de organización no válido' }, { status: 400 });
    }

    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId);
    
    if (!org) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    // Attach admins
    const admins = db.prepare(`
      SELECT u.id, u.name, u.email FROM users u
      JOIN organization_admins oa ON u.id = oa.user_id
      WHERE oa.organization_id = ?
    `).all(orgId);

    return NextResponse.json({ organization: { ...org, admins } });

  } catch (error) {
    console.error('Error al obtener organización:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT /api/organizaciones/[id] - Update organization details
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const orgId = parseInt(id);

    if (isNaN(orgId)) {
      return NextResponse.json({ error: 'ID de organización no válido' }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user || !canManageOrganization(user, orgId)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { name, logo, address, municipality, department, phone, email, website, active, adminIds } = body;

    if (!name) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    // Update organization details
    db.transaction(() => {
      db.prepare(`
        UPDATE organizations 
        SET name = ?, logo = ?, address = ?, municipality = ?, department = ?, phone = ?, email = ?, website = ?, active = ?
        WHERE id = ?
      `).run(
        name,
        logo !== undefined ? logo : null,
        address !== undefined ? address : null,
        municipality !== undefined ? municipality : null,
        department !== undefined ? department : null,
        phone !== undefined ? phone : null,
        email !== undefined ? email : null,
        website !== undefined ? website : null,
        active !== undefined ? active : 1,
        orgId
      );

      // Superadmin can change organization admins
      if (user.role === ROLES.SUPERADMIN && adminIds && Array.isArray(adminIds)) {
        // Clear current admins
        db.prepare('DELETE FROM organization_admins WHERE organization_id = ?').run(orgId);
        
        // Add new admins
        const insertAdmin = db.prepare('INSERT INTO organization_admins (organization_id, user_id) VALUES (?, ?)');
        for (const adminId of adminIds) {
          insertAdmin.run(orgId, adminId);
        }
      }
    })();

    const updatedOrg = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId);
    return NextResponse.json({
      message: 'Organización actualizada exitosamente',
      organization: updatedOrg
    });

  } catch (error) {
    console.error('Error al actualizar organización:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE /api/organizaciones/[id] - Delete organization
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const orgId = parseInt(id);

    if (isNaN(orgId)) {
      return NextResponse.json({ error: 'ID de organización no válido' }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user || !canManageOrganization(user, orgId)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    db.prepare('DELETE FROM organizations WHERE id = ?').run(orgId);

    return NextResponse.json({ message: 'Organización eliminada exitosamente' });

  } catch (error) {
    console.error('Error al eliminar organización:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
