'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Building2, PlusCircle, Pencil, Trash2, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function OrganizacionesAdmin() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orgs, setOrgs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', address: '', municipality: '', department: '', phone: '', email: '' });
  const [error, setError] = useState('');

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  useEffect(() => { if (user) loadOrgs(); }, [user]);

  async function loadOrgs() {
    const res = await fetch('/api/organizaciones');
    if (res.ok) { const data = await res.json(); setOrgs(data.organizations || []); }
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: '', description: '', address: '', municipality: '', department: '', phone: '', email: '' });
    setShowForm(true);
    setError('');
  }

  function openEdit(org) {
    setEditing(org);
    setForm({ name: org.name, description: org.description || '', address: org.address || '', municipality: org.municipality || '', department: org.department || '', phone: org.phone || '', email: org.email || '' });
    setShowForm(true);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const url = editing ? `/api/organizaciones/${editing.id}` : '/api/organizaciones';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setShowForm(false); loadOrgs(); }
    else { const data = await res.json(); setError(data.error || 'Error al guardar'); }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta organización?')) return;
    await fetch(`/api/organizaciones/${id}`, { method: 'DELETE' });
    loadOrgs();
  }

  if (loading || !user) return <div className="page-container py-20 text-center text-slate-400">Cargando...</div>;

  return (
    <div className="page-container py-14 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Building2 className="h-6 w-6 text-emerald-400" /> Organizaciones
            </h1>
            <p className="text-xs text-slate-400 mt-1">{orgs.length} registradas</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn-base btn-primary hover:btn-primary-hover px-5 py-2.5 rounded-xl text-xs font-bold">
          <PlusCircle className="h-4 w-4" /> Nueva
        </button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
          <div className="glass-card w-full max-w-lg p-8 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editing ? 'Editar' : 'Nueva'} Organización</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { key: 'name', label: 'Nombre', required: true },
                { key: 'description', label: 'Descripción' },
                { key: 'address', label: 'Dirección' },
                { key: 'municipality', label: 'Municipio' },
                { key: 'department', label: 'Departamento' },
                { key: 'phone', label: 'Teléfono' },
                { key: 'email', label: 'Email' },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{f.label}</label>
                  <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required={f.required} className="input-field focus:input-field-focus" />
                </div>
              ))}
              <button type="submit" className="btn-base btn-primary hover:btn-primary-hover w-full py-3 rounded-xl font-bold">
                {editing ? 'Guardar Cambios' : 'Crear Organización'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase text-slate-400 bg-slate-800/50">
              <tr>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4 hidden md:table-cell">Municipio</th>
                <th className="px-6 py-4 hidden lg:table-cell">Contacto</th>
                <th className="px-6 py-4 hidden lg:table-cell">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {orgs.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No hay organizaciones registradas.</td></tr>
              ) : orgs.map(org => (
                <tr key={org.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{org.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{org.description || 'Sin descripción'}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 hidden md:table-cell">{org.municipality || '—'}</td>
                  <td className="px-6 py-4 text-slate-400 hidden lg:table-cell">{org.email || org.phone || '—'}</td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className={`badge-status ${org.status === 'activo' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-400'}`}>
                      {org.status || 'activo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(org)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(org.id)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
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
