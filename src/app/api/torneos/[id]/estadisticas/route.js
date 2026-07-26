import { NextResponse } from 'next/server';
import { getTournamentStats } from '@/lib/stats';
import db from '@/lib/db';

// GET /api/torneos/[id]/estadisticas - Retrieve tournament standings and rankings
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const tourId = parseInt(id);

    if (isNaN(tourId)) {
      return NextResponse.json({ error: 'ID de torneo no válido' }, { status: 400 });
    }

    // Verify tournament exists
    const tournament = db.prepare('SELECT id, name FROM tournaments WHERE id = ?').get(tourId);
    if (!tournament) {
      return NextResponse.json({ error: 'El torneo no existe' }, { status: 404 });
    }

    const stats = getTournamentStats(tourId);

    return NextResponse.json({
      tournament_name: tournament.name,
      ...stats
    });

  } catch (error) {
    console.error('Error al obtener estadísticas del torneo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
