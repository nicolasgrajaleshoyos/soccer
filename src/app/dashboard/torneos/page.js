'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Trophy, PlusCircle, Pencil, Trash2, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TorneosAdmin() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tournaments, setTournaments] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ organization_id: '', name: '', description: '', season: '', category: 'Libre', max_teams: 16, status: 'inscripciones_abiertas' });
  const [error, setError] = useState('');

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);
  useEffect(() => { if (user) { loadData(); } }, [user]);

  async function loadData() {
    const [tRes, oRes] = await Promise.all([fetch('/api/torneos'), fetch('/api/organizaciones')]);
    if (tRes.ok) { const d = await tRes.json(); setTournaments(d.tournaments || []); }
    if (oRes.ok) { const d = await oRes.json(); setOrgs(d.organizations || []); }
  }

  function openCreate() {
    setEditing(null);
    setForm({ organization_id: orgs[0]?.id || '', name: '', description: '', season: '', category: 'Libre', max_teams: 16, status: 'inscripciones_abiertas' });
    setShowForm(true); setError('');
  }

  function openEdit(t) {
    setEditing(t);
    setForm({ organization_id: t.organization_id, name: t.name, description: t.description || '', season: t.season || '', category: t.category || 'Libre', max_teams: t.max_teams || 16, status: t.status });
    setShowForm(true); setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    const url = editing ? `/api/torneos/${editing.id}` : '/api/torneos';
    const method = editing ? 'PUT' : 'POST';
    const payload = {
      ...form,
      max_teams: parseInt(form.max_teams) || 16
    };
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { setShowForm(false); loadData(); }
    else { const d = await res.json(); setError(d.error || 'Error'); }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este torneo?')) return;
    await fetch(`/api/torneos/${id}`, { method: 'DELETE' });
    loadData();
  }

  if (loading || !user) return <div className="page-container py-20 text-center text-slate-400">Cargando...</div>;

  const statusLabels = { inscripciones_abiertas: 'Inscripciones Abiertas', activo: 'Activo', finalizado: 'Finalizado', cancelado: 'Cancelado' };
  const statusColors = { inscripciones_abiertas: 'bg-emerald-500/15 text-emerald-400', activo: 'bg-blue-500/15 text-blue-400', finalizado: 'bg-slate-500/15 text-slate-400', cancelado: 'bg-red-500/15 text-red-400' };

  return (
    <div className="page-container py-14 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><Trophy className="h-6 w-6 text-emerald-400" /> Torneos</h1>
            <p className="text-xs text-slate-400 mt-1">{tournaments.length} registrados</p>
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
              <h2 className="text-lg font-bold text-white">{editing ? 'Editar' : 'Nuevo'} Torneo</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Organización</label>
                <select value={form.organization_id} onChange={e => setForm({ ...form, organization_id: e.target.value })} required className="input-field focus:input-field-focus bg-slate-950/80">
                  <option value="">Seleccionar...</option>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              {[
                { key: 'name', label: 'Nombre del Torneo', required: true },
                { key: 'description', label: 'Descripción' },
                { key: 'season', label: 'Temporada (ej: 2026-I)', required: true },
                { key: 'category', label: 'Categoría' },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{f.label}</label>
                  <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required={f.required} className="input-field focus:input-field-focus" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Máx. Equipos</label>
                  <input type="number" value={form.max_teams ?? ''} onChange={e => { const val = e.target.value; setForm({ ...form, max_teams: val === '' ? '' : parseInt(val) }); }} className="input-field focus:input-field-focus" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field focus:input-field-focus bg-slate-950/80">
                    <option value="inscripciones_abiertas">Inscripciones Abiertas</option>
                    <option value="activo">Activo</option>
                    <option value="finalizado">Finalizado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-base btn-primary hover:btn-primary-hover w-full py-3 rounded-xl font-bold">
                {editing ? 'Guardar Cambios' : 'Crear Torneo'}
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
                <th className="px-6 py-4">Torneo</th>
                <th className="px-6 py-4 hidden md:table-cell">Temporada</th>
                <th className="px-6 py-4 hidden lg:table-cell">Categoría</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {tournaments.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No hay torneos.</td></tr>
              ) : tournaments.map(t => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{t.name}</div>
                    <div className="text-[10px] text-slate-500">{t.organization_name || ''}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 hidden md:table-cell">{t.season}</td>
                  <td className="px-6 py-4 text-slate-400 hidden lg:table-cell">{t.category || 'Libre'}</td>
                  <td className="px-6 py-4">
                    <span className={`badge-status ${statusColors[t.status] || 'bg-slate-500/15 text-slate-400'}`}>
                      {statusLabels[t.status] || t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(t)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(t.id)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
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
