'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Flag, PlusCircle, Pencil, Trash2, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ArbitrosAdmin() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [referees, setReferees] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ tournament_id: '', name: '', document: '', category: '', experience: '', phone: '', email: '' });
  const [error, setError] = useState('');

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);
  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    const [rRes, tRes] = await Promise.all([fetch('/api/arbitros'), fetch('/api/torneos')]);
    if (rRes.ok) { const d = await rRes.json(); setReferees(d.referees || []); }
    if (tRes.ok) { const d = await tRes.json(); setTournaments(d.tournaments || []); }
  }

  function openCreate() {
    setEditing(null);
    setForm({ tournament_id: tournaments[0]?.id || '', name: '', document: '', category: '', experience: '', phone: '', email: '' });
    setShowForm(true); setError('');
  }

  function openEdit(r) {
    setEditing(r);
    setForm({ tournament_id: r.tournament_id, name: r.name, document: r.document || '', category: r.category || '', experience: r.experience || '', phone: r.phone || '', email: r.email || '' });
    setShowForm(true); setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    const url = editing ? `/api/arbitros/${editing.id}` : '/api/arbitros';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setShowForm(false); loadData(); }
    else { const d = await res.json(); setError(d.error || 'Error'); }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este árbitro?')) return;
    await fetch(`/api/arbitros/${id}`, { method: 'DELETE' });
    loadData();
  }

  if (loading || !user) return <div className="page-container py-20 text-center text-slate-400">Cargando...</div>;

  return (
    <div className="page-container py-14 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><Flag className="h-6 w-6 text-emerald-400" /> Árbitros</h1>
            <p className="text-xs text-slate-400 mt-1">{referees.length} registrados</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn-base btn-primary hover:btn-primary-hover px-5 py-2.5 rounded-xl text-xs font-bold">
          <PlusCircle className="h-4 w-4" /> Nuevo
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
          <div className="glass-card w-full max-w-lg p-8 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editing ? 'Editar' : 'Nuevo'} Árbitro</h2>
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
              {[
                { key: 'name', label: 'Nombre Completo', required: true },
                { key: 'document', label: 'Documento' },
                { key: 'category', label: 'Categoría (ej: FIFA, Nacional)' },
                { key: 'experience', label: 'Años de Experiencia' },
                { key: 'phone', label: 'Teléfono' },
                { key: 'email', label: 'Email' },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{f.label}</label>
                  <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required={f.required} className="input-field focus:input-field-focus" />
                </div>
              ))}
              <button type="submit" className="btn-base btn-primary hover:btn-primary-hover w-full py-3 rounded-xl font-bold">
                {editing ? 'Guardar' : 'Registrar Árbitro'}
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
                <th className="px-6 py-4 hidden md:table-cell">Categoría</th>
                <th className="px-6 py-4 hidden lg:table-cell">Experiencia</th>
                <th className="px-6 py-4 hidden lg:table-cell">Contacto</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {referees.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No hay árbitros.</td></tr>
              ) : referees.map(r => (
                <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-white">{r.name}</td>
                  <td className="px-6 py-4 text-slate-400 hidden md:table-cell">{r.category || '—'}</td>
                  <td className="px-6 py-4 text-slate-400 hidden lg:table-cell">{r.experience ? `${r.experience} años` : '—'}</td>
                  <td className="px-6 py-4 text-slate-400 hidden lg:table-cell">{r.phone || r.email || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(r)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
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
