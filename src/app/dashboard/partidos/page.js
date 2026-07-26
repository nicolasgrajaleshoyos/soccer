'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Calendar, PlusCircle, Pencil, Trash2, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PartidosAdmin() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [fields, setFields] = useState([]);
  const [referees, setReferees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ tournament_id: '', home_team_id: '', away_team_id: '', matchday: 1, date: '', time: '', field_id: '', referee_id: '', status: 'programado', observations: '' });
  const [error, setError] = useState('');

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);
  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    const [mRes, tRes, teRes, fRes, rRes] = await Promise.all([
      fetch('/api/partidos'), fetch('/api/torneos'), fetch('/api/equipos'), fetch('/api/canchas'), fetch('/api/arbitros')
    ]);
    if (mRes.ok) { const d = await mRes.json(); setMatches(d.matches || []); }
    if (tRes.ok) { const d = await tRes.json(); setTournaments(d.tournaments || []); }
    if (teRes.ok) { const d = await teRes.json(); setTeams(d.teams || []); }
    if (fRes.ok) { const d = await fRes.json(); setFields(d.fields || []); }
    if (rRes.ok) { const d = await rRes.json(); setReferees(d.referees || []); }
  }

  function openCreate() {
    setEditing(null);
    setForm({ tournament_id: tournaments[0]?.id || '', home_team_id: '', away_team_id: '', matchday: 1, date: '', time: '19:00', field_id: '', referee_id: '', status: 'programado', observations: '' });
    setShowForm(true); setError('');
  }

  function openEdit(m) {
    setEditing(m);
    setForm({ tournament_id: m.tournament_id, home_team_id: m.home_team_id, away_team_id: m.away_team_id, matchday: m.matchday, date: m.date, time: m.time, field_id: m.field_id || '', referee_id: m.referee_id || '', status: m.status, observations: m.observations || '' });
    setShowForm(true); setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    const url = editing ? `/api/partidos/${editing.id}` : '/api/partidos';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setShowForm(false); loadData(); }
    else { const d = await res.json(); setError(d.error || 'Error'); }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este partido?')) return;
    await fetch(`/api/partidos/${id}`, { method: 'DELETE' });
    loadData();
  }

  if (loading || !user) return <div className="page-container py-20 text-center text-slate-400">Cargando...</div>;

  const statusColors = { programado: 'bg-blue-500/15 text-blue-400', en_juego: 'bg-amber-500/15 text-amber-400', finalizado: 'bg-emerald-500/15 text-emerald-400', suspendido: 'bg-red-500/15 text-red-400' };

  return (
    <div className="page-container py-14 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><Calendar className="h-6 w-6 text-emerald-400" /> Partidos</h1>
            <p className="text-xs text-slate-400 mt-1">{matches.length} registrados</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn-base btn-primary hover:btn-primary-hover px-5 py-2.5 rounded-xl text-xs font-bold">
          <PlusCircle className="h-4 w-4" /> Nuevo
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
          <div className="glass-card w-full max-w-lg p-8 space-y-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editing ? 'Editar' : 'Nuevo'} Partido</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Torneo</label>
                <select value={form.tournament_id} onChange={e => setForm({ ...form, tournament_id: e.target.value })} required className="input-field focus:input-field-focus bg-slate-950/80">
                  <option value="">Seleccionar...</option>
                  {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Equipo Local</label>
                  <select value={form.home_team_id} onChange={e => setForm({ ...form, home_team_id: e.target.value })} required className="input-field focus:input-field-focus bg-slate-950/80">
                    <option value="">Seleccionar...</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Equipo Visitante</label>
                  <select value={form.away_team_id} onChange={e => setForm({ ...form, away_team_id: e.target.value })} required className="input-field focus:input-field-focus bg-slate-950/80">
                    <option value="">Seleccionar...</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jornada</label>
                  <input type="number" value={form.matchday} onChange={e => setForm({ ...form, matchday: parseInt(e.target.value) })} className="input-field focus:input-field-focus" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required className="input-field focus:input-field-focus" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hora</label>
                  <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} required className="input-field focus:input-field-focus" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cancha</label>
                  <select value={form.field_id} onChange={e => setForm({ ...form, field_id: e.target.value })} className="input-field focus:input-field-focus bg-slate-950/80">
                    <option value="">Seleccionar...</option>
                    {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Árbitro</label>
                  <select value={form.referee_id} onChange={e => setForm({ ...form, referee_id: e.target.value })} className="input-field focus:input-field-focus bg-slate-950/80">
                    <option value="">Seleccionar...</option>
                    {referees.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Observaciones</label>
                <input value={form.observations} onChange={e => setForm({ ...form, observations: e.target.value })} className="input-field focus:input-field-focus" />
              </div>
              <button type="submit" className="btn-base btn-primary hover:btn-primary-hover w-full py-3 rounded-xl font-bold">
                {editing ? 'Guardar' : 'Crear Partido'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase text-slate-400 bg-slate-800/50">
              <tr>
                <th className="px-6 py-4">Partido</th>
                <th className="px-6 py-4 hidden md:table-cell">Fecha</th>
                <th className="px-6 py-4 hidden lg:table-cell">Jornada</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {matches.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No hay partidos.</td></tr>
              ) : matches.map(m => (
                <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white text-xs">{m.home_team_name || `Equipo ${m.home_team_id}`} vs {m.away_team_name || `Equipo ${m.away_team_id}`}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 hidden md:table-cell">{m.date} {m.time}</td>
                  <td className="px-6 py-4 text-slate-400 hidden lg:table-cell">{m.matchday}</td>
                  <td className="px-6 py-4">
                    <span className={`badge-status ${statusColors[m.status] || 'bg-slate-500/15 text-slate-400'}`}>{m.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(m)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(m.id)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
