import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { hasRole, ROLES } from '@/lib/permissions';

// GET /api/organizaciones - List organizations
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('active') === 'true' || !user;

    let orgs;

    if (!user || user.role === ROLES.AFICIONADO || onlyActive) {
      // Public view or restricted active view
      orgs = db.prepare('SELECT * FROM organizations WHERE active = 1 ORDER BY name ASC').all();
    } else if (user.role === ROLES.SUPERADMIN) {
      // Superadmin views all
      orgs = db.prepare('SELECT * FROM organizations ORDER BY name ASC').all();
    } else if (user.role === ROLES.ORGANIZADOR) {
      // Organizer views only their managed organizations
      orgs = db.prepare(`
        SELECT o.* FROM organizations o
        JOIN organization_admins oa ON o.id = oa.organization_id
        WHERE oa.user_id = ?
        ORDER BY o.name ASC
      `).all(user.id);
    } else {
      orgs = [];
    }

    // Attach admin info to each organization if authenticated
    if (user && orgs.length > 0) {
      orgs = orgs.map(org => {
        const admins = db.prepare(`
          SELECT u.id, u.name, u.email FROM users u
          JOIN organization_admins oa ON u.id = oa.user_id
          WHERE oa.organization_id = ?
        `).all(org.id);
        return { ...org, admins };
      });
    }

    return NextResponse.json({ organizations: orgs });

  } catch (error) {
    console.error('Error al obtener organizaciones:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/organizaciones - Create organization
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || !hasRole(user, [ROLES.SUPERADMIN, ROLES.ORGANIZADOR])) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { name, logo, address, municipality, department, phone, email, website, active, adminIds } = body;

    if (!name) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const insertOrg = db.prepare(`
      INSERT INTO organizations (name, logo, address, municipality, department, phone, email, website, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let orgId;
    db.transaction(() => {
      const result = insertOrg.run(
        name,
        logo || null,
        address || null,
        municipality || null,
        department || null,
        phone || null,
        email || null,
        website || null,
        active !== undefined ? active : 1
      );
      orgId = result.lastInsertRowid;

      // Assign admins
      if (user.role === ROLES.SUPERADMIN && adminIds && Array.isArray(adminIds)) {
        const insertAdmin = db.prepare('INSERT INTO organization_admins (organization_id, user_id) VALUES (?, ?)');
        for (const adminId of adminIds) {
          insertAdmin.run(orgId, adminId);
        }
      } else {
        // If organizer, assign themselves
        const insertAdmin = db.prepare('INSERT INTO organization_admins (organization_id, user_id) VALUES (?, ?)');
        insertAdmin.run(orgId, user.id);
      }
    })();

    // Fetch created organization
    const newOrg = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId);

    return NextResponse.json({
      message: 'Organización creada exitosamente',
      organization: newOrg
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear organización:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
