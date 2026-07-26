'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon, PlusCircle, Pencil, Trash2, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function GaleriaAdmin() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [albums, setAlbums] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ tournament_id: '', name: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);
  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    const [aRes, tRes] = await Promise.all([fetch('/api/galeria'), fetch('/api/torneos')]);
    if (aRes.ok) { const d = await aRes.json(); setAlbums(d.albums || []); }
    if (tRes.ok) { const d = await tRes.json(); setTournaments(d.tournaments || []); }
  }

  function openCreate() {
    setEditing(null);
    setForm({ tournament_id: tournaments[0]?.id || '', name: '', description: '' });
    setShowForm(true); setError('');
  }

  function openEdit(album) {
    setEditing(album);
    setForm({ tournament_id: album.tournament_id, name: album.name, description: album.description || '' });
    setShowForm(true); setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    const url = editing ? `/api/galeria/${editing.id}` : '/api/galeria';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setShowForm(false); loadData(); }
    else { const d = await res.json(); setError(d.error || 'Error'); }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este álbum?')) return;
    await fetch(`/api/galeria/${id}`, { method: 'DELETE' });
    loadData();
  }

  if (loading || !user) return <div className="page-container py-20 text-center text-slate-400">Cargando...</div>;

  return (
    <div className="page-container py-14 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><ImageIcon className="h-6 w-6 text-emerald-400" /> Álbumes de Galería</h1>
            <p className="text-xs text-slate-400 mt-1">{albums.length} creados</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn-base btn-primary hover:btn-primary-hover px-5 py-2.5 rounded-xl text-xs font-bold">
          <PlusCircle className="h-4 w-4" /> Nuevo Álbum
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
          <div className="glass-card w-full max-w-lg p-8 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editing ? 'Editar' : 'Nuevo'} Álbum</h2>
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
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre del Álbum</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="input-field focus:input-field-focus" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Descripción</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="input-field focus:input-field-focus py-3 resize-none" />
              </div>
              <button type="submit" className="btn-base btn-primary hover:btn-primary-hover w-full py-3 rounded-xl font-bold">
                {editing ? 'Guardar' : 'Crear Álbum'}
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
                <th className="px-6 py-4">Álbum</th>
                <th className="px-6 py-4 hidden md:table-cell">Torneo</th>
                <th className="px-6 py-4 hidden lg:table-cell">Fecha Creación</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {albums.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No hay álbumes creados.</td></tr>
              ) : albums.map(album => (
                <tr key={album.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-white">
                    {album.name}
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5 line-clamp-1">{album.description || 'Sin descripción'}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 hidden md:table-cell">{album.tournament_name || '—'}</td>
                  <td className="px-6 py-4 text-slate-400 hidden lg:table-cell">{new Date(album.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(album)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(album.id)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
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
