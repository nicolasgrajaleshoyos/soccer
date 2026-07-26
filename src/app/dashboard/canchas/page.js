'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { MapPin, PlusCircle, Pencil, Trash2, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CanchasAdmin() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fields, setFields] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ tournament_id: '', name: '', address: '', municipality: '', latitude: '', longitude: '', capacity: '', surface_type: 'Sintética' });
  const [error, setError] = useState('');

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);
  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    const [fRes, tRes] = await Promise.all([fetch('/api/canchas'), fetch('/api/torneos')]);
    if (fRes.ok) { const d = await fRes.json(); setFields(d.fields || []); }
    if (tRes.ok) { const d = await tRes.json(); setTournaments(d.tournaments || []); }
  }

  function openCreate() {
    setEditing(null);
    setForm({ tournament_id: tournaments[0]?.id || '', name: '', address: '', municipality: '', latitude: '', longitude: '', capacity: '', surface_type: 'Sintética' });
    setShowForm(true); setError('');
  }

  function openEdit(f) {
    setEditing(f);
    setForm({ tournament_id: f.tournament_id, name: f.name, address: f.address || '', municipality: f.municipality || '', latitude: f.latitude || '', longitude: f.longitude || '', capacity: f.capacity || '', surface_type: f.surface_type || 'Sintética' });
    setShowForm(true); setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    const url = editing ? `/api/canchas/${editing.id}` : '/api/canchas';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setShowForm(false); loadData(); }
    else { const d = await res.json(); setError(d.error || 'Error'); }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta cancha?')) return;
    await fetch(`/api/canchas/${id}`, { method: 'DELETE' });
    loadData();
  }

  if (loading || !user) return <div className="page-container py-20 text-center text-slate-400">Cargando...</div>;

  return (
    <div className="page-container py-14 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><MapPin className="h-6 w-6 text-emerald-400" /> Canchas</h1>
            <p className="text-xs text-slate-400 mt-1">{fields.length} registradas</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn-base btn-primary hover:btn-primary-hover px-5 py-2.5 rounded-xl text-xs font-bold">
          <PlusCircle className="h-4 w-4" /> Nueva
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
          <div className="glass-card w-full max-w-lg p-8 space-y-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editing ? 'Editar' : 'Nueva'} Cancha</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Torneo Asociado</label>
                <select value={form.tournament_id} onChange={e => setForm({ ...form, tournament_id: e.target.value })} required className="input-field focus:input-field-focus bg-slate-950/80">
                  <option value="">Seleccionar...</option>
                  {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              {[
                { key: 'name', label: 'Nombre de la Cancha', required: true },
                { key: 'address', label: 'Dirección' },
                { key: 'municipality', label: 'Municipio/Ciudad' },
                { key: 'latitude', label: 'Latitud GPS (ej: 6.2442)' },
                { key: 'longitude', label: 'Longitud GPS (ej: -75.5812)' },
                { key: 'capacity', label: 'Capacidad de Espectadores' },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{f.label}</label>
                  <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required={f.required} className="input-field focus:input-field-focus" />
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipo de Superficie</label>
                <select value={form.surface_type} onChange={e => setForm({ ...form, surface_type: e.target.value })} className="input-field focus:input-field-focus bg-slate-950/80">
                  <option value="Sintética">Sintética</option>
                  <option value="Césped Natural">Césped Natural</option>
                  <option value="Tierra / Arena">Tierra / Arena</option>
                  <option value="Coliseo / Parqué">Coliseo / Parqué</option>
                </select>
              </div>
              <button type="submit" className="btn-base btn-primary hover:btn-primary-hover w-full py-3 rounded-xl font-bold">
                {editing ? 'Guardar' : 'Crear Cancha'}
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
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4 hidden md:table-cell">Dirección</th>
                <th className="px-6 py-4 hidden lg:table-cell">Superficie</th>
                <th className="px-6 py-4 hidden lg:table-cell">Capacidad</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {fields.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No hay canchas registradas.</td></tr>
              ) : fields.map(f => (
                <tr key={f.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-white">{f.name}</td>
                  <td className="px-6 py-4 text-slate-400 hidden md:table-cell">{f.address || '—'} ({f.municipality || '—'})</td>
                  <td className="px-6 py-4 text-slate-400 hidden lg:table-cell">{f.surface_type || 'Sintética'}</td>
                  <td className="px-6 py-4 text-slate-400 hidden lg:table-cell">{f.capacity ? `${f.capacity} pax` : '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(f)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(f.id)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
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
