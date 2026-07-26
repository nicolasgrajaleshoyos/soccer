'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Newspaper, PlusCircle, Pencil, Trash2, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NoticiasAdmin() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [news, setNews] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ tournament_id: '', title: '', content: '', image: '', featured: 0 });
  const [error, setError] = useState('');

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);
  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    const [nRes, tRes] = await Promise.all([fetch('/api/noticias'), fetch('/api/torneos')]);
    if (nRes.ok) { const d = await nRes.json(); setNews(d.news || []); }
    if (tRes.ok) { const d = await tRes.json(); setTournaments(d.tournaments || []); }
  }

  function openCreate() {
    setEditing(null);
    setForm({ tournament_id: '', title: '', content: '', image: '', featured: 0 });
    setShowForm(true); setError('');
  }

  function openEdit(post) {
    setEditing(post);
    setForm({ tournament_id: post.tournament_id || '', title: post.title, content: post.content, image: post.image || '', featured: post.featured ? 1 : 0 });
    setShowForm(true); setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    const url = editing ? `/api/noticias/${editing.id}` : '/api/noticias';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setShowForm(false); loadData(); }
    else { const d = await res.json(); setError(d.error || 'Error'); }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta noticia?')) return;
    await fetch(`/api/noticias/${id}`, { method: 'DELETE' });
    loadData();
  }

  if (loading || !user) return <div className="page-container py-20 text-center text-slate-400">Cargando...</div>;

  return (
    <div className="page-container py-14 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><Newspaper className="h-6 w-6 text-emerald-400" /> Noticias</h1>
            <p className="text-xs text-slate-400 mt-1">{news.length} publicadas</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn-base btn-primary hover:btn-primary-hover px-5 py-2.5 rounded-xl text-xs font-bold">
          <PlusCircle className="h-4 w-4" /> Nueva Noticia
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
          <div className="glass-card w-full max-w-lg p-8 space-y-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editing ? 'Editar' : 'Nueva'} Noticia</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Torneo Relacionado (Opcional)</label>
                <select value={form.tournament_id} onChange={e => setForm({ ...form, tournament_id: e.target.value })} className="input-field focus:input-field-focus bg-slate-950/80">
                  <option value="">General / Liga Global</option>
                  {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Título</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="input-field focus:input-field-focus" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contenido de la Noticia</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required rows={5} className="input-field focus:input-field-focus py-3 resize-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">URL de Imagen de Portada</label>
                <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="/uploads/news1.png o enlace" className="input-field focus:input-field-focus" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Destacado</label>
                <select value={form.featured} onChange={e => setForm({ ...form, featured: parseInt(e.target.value) })} className="input-field focus:input-field-focus bg-slate-950/80">
                  <option value={0}>No</option>
                  <option value={1}>Sí (Aparece en la página de inicio)</option>
                </select>
              </div>
              <button type="submit" className="btn-base btn-primary hover:btn-primary-hover w-full py-3 rounded-xl font-bold">
                {editing ? 'Guardar Cambios' : 'Publicar Noticia'}
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
                <th className="px-6 py-4">Noticia</th>
                <th className="px-6 py-4 hidden md:table-cell">Torneo</th>
                <th className="px-6 py-4 hidden lg:table-cell">Fecha</th>
                <th className="px-6 py-4 hidden lg:table-cell">Destacado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {news.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No hay noticias redactadas.</td></tr>
              ) : news.map(post => (
                <tr key={post.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-white">{post.title}</td>
                  <td className="px-6 py-4 text-slate-400 hidden md:table-cell">{post.tournament_name || 'Liga General'}</td>
                  <td className="px-6 py-4 text-slate-400 hidden lg:table-cell">{new Date(post.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className={`badge-status ${post.featured ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-500/15 text-slate-400'}`}>
                      {post.featured ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(post)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(post.id)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
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
