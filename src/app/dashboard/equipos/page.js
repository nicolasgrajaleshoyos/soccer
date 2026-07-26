'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Users, PlusCircle, Pencil, Trash2, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EquiposAdmin() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ tournament_id: '', name: '', city: '', neighborhood: '', founded: '', home_kit: '', away_kit: '', coach: '', captain: '' });
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState({ home_kit: false, away_kit: false });

  // Players Management States
  const [selectedTeamForPlayers, setSelectedTeamForPlayers] = useState(null);
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [playerForm, setPlayerForm] = useState({
    full_name: '',
    document_id: '',
    jersey_number: '',
    position: 'Delantero',
    birth_date: '',
    height: '',
    weight: '',
    dominant_foot: 'derecho',
    nationality: 'Colombiana',
    status: 'activo',
    photo: ''
  });
  const [playerError, setPlayerError] = useState('');
  const [uploadingPlayerPhoto, setUploadingPlayerPhoto] = useState(false);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);
  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadTeamPlayers(teamId) {
    const res = await fetch(`/api/jugadores?team_id=${teamId}`);
    if (res.ok) {
      const data = await res.json();
      setTeamPlayers(data.players || []);
    }
  }

  function openManagePlayers(team) {
    setSelectedTeamForPlayers(team);
    loadTeamPlayers(team.id);
  }

  function openCreatePlayer() {
    setEditingPlayer(null);
    setPlayerForm({
      full_name: '',
      document_id: '',
      jersey_number: '',
      position: 'Delantero',
      birth_date: '',
      height: '',
      weight: '',
      dominant_foot: 'derecho',
      nationality: 'Colombiana',
      status: 'activo',
      photo: ''
    });
    setShowPlayerForm(true);
    setPlayerError('');
  }

  function openEditPlayer(p) {
    setEditingPlayer(p);
    setPlayerForm({
      full_name: p.full_name,
      document_id: p.document_id,
      jersey_number: p.jersey_number || '',
      position: p.position || 'Delantero',
      birth_date: p.birth_date || '',
      height: p.height || '',
      weight: p.weight || '',
      dominant_foot: p.dominant_foot || 'derecho',
      nationality: p.nationality || 'Colombiana',
      status: p.status || 'activo',
      photo: p.photo || ''
    });
    setShowPlayerForm(true);
    setPlayerError('');
  }

  async function handlePlayerSubmit(e) {
    e.preventDefault();
    setPlayerError('');
    const url = editingPlayer ? `/api/jugadores/${editingPlayer.id}` : '/api/jugadores';
    const method = editingPlayer ? 'PUT' : 'POST';
    
    const payload = {
      ...playerForm,
      team_id: selectedTeamForPlayers.id,
      jersey_number: playerForm.jersey_number ? parseInt(playerForm.jersey_number) : null,
      height: playerForm.height ? parseFloat(playerForm.height) : null,
      weight: playerForm.weight ? parseFloat(playerForm.weight) : null
    };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setShowPlayerForm(false);
      loadTeamPlayers(selectedTeamForPlayers.id);
    } else {
      const d = await res.json();
      setPlayerError(d.error || 'Error al guardar el jugador');
    }
  }

  async function handlePlayerDelete(id) {
    if (!confirm('¿Eliminar este jugador de la plantilla?')) return;
    const res = await fetch(`/api/jugadores/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadTeamPlayers(selectedTeamForPlayers.id);
    }
  }

  async function handlePlayerPhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPlayerPhoto(true);
    setPlayerError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setPlayerForm(prev => ({ ...prev, photo: data.url }));
      } else {
        const data = await res.json();
        setPlayerError(data.error || 'Error al subir la foto');
      }
    } catch (err) {
      console.error(err);
      setPlayerError('Error de red al subir la foto');
    } finally {
      setUploadingPlayerPhoto(false);
    }
  }

  async function loadData() {
    const [tRes, trRes] = await Promise.all([fetch('/api/equipos'), fetch('/api/torneos')]);
    if (tRes.ok) { const d = await tRes.json(); setTeams(d.teams || []); }
    if (trRes.ok) { const d = await trRes.json(); setTournaments(d.tournaments || []); }
  }

  async function handleFileChange(e, field) {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(prev => ({ ...prev, [field]: true }));
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({ ...prev, [field]: data.url }));
      } else {
        const data = await res.json();
        setError(data.error || 'Error al subir la imagen');
      }
    } catch (err) {
      console.error(err);
      setError('Error al subir la imagen');
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }));
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ tournament_id: tournaments[0]?.id || '', name: '', city: '', neighborhood: '', founded: '', home_kit: '', away_kit: '', coach: '', captain: '' });
    setShowForm(true); setError('');
  }

  function openEdit(t) {
    setEditing(t);
    setForm({ tournament_id: t.tournament_id, name: t.name, city: t.city || '', neighborhood: t.neighborhood || '', founded: t.founded || '', home_kit: t.home_kit || '', away_kit: t.away_kit || '', coach: t.coach || '', captain: t.captain || '' });
    setShowForm(true); setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    const url = editing ? `/api/equipos/${editing.id}` : '/api/equipos';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setShowForm(false); loadData(); }
    else { const d = await res.json(); setError(d.error || 'Error'); }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este equipo?')) return;
    await fetch(`/api/equipos/${id}`, { method: 'DELETE' });
    loadData();
  }

  if (loading || !user) return <div className="page-container py-20 text-center text-slate-400">Cargando...</div>;

  return (
    <div className="page-container py-14 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><Users className="h-6 w-6 text-emerald-400" /> Equipos</h1>
            <p className="text-xs text-slate-400 mt-1">{teams.length} registrados</p>
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
              <h2 className="text-lg font-bold text-white">{editing ? 'Editar' : 'Nuevo'} Equipo</h2>
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

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre del Equipo</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="input-field focus:input-field-focus" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ciudad</label>
                  <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="input-field focus:input-field-focus" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Barrio</label>
                  <input value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} className="input-field focus:input-field-focus" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1 col-span-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Año de Fundación</label>
                  <input value={form.founded} onChange={e => setForm({ ...form, founded: e.target.value })} className="input-field focus:input-field-focus" />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Director Técnico</label>
                  <input value={form.coach} onChange={e => setForm({ ...form, coach: e.target.value })} className="input-field focus:input-field-focus" />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Capitán</label>
                  <input value={form.captain} onChange={e => setForm({ ...form, captain: e.target.value })} className="input-field focus:input-field-focus" />
                </div>
              </div>

              {/* Uniforme Local Image Upload */}
              <div className="space-y-2 border border-slate-800/80 rounded-xl p-4 bg-slate-950/20">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Uniforme Local</label>
                <div className="flex items-center gap-4">
                  {form.home_kit ? (
                    <div className="h-16 w-16 bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shrink-0 relative group">
                      <img src={form.home_kit} alt="Local" className="h-full w-full object-contain" />
                      <button type="button" onClick={() => setForm(prev => ({ ...prev, home_kit: '' }))} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-red-400 font-bold transition-opacity">Eliminar</button>
                    </div>
                  ) : (
                    <div className="h-16 w-16 bg-slate-900/60 rounded-lg border border-dashed border-slate-700 flex items-center justify-center text-xl shrink-0 text-slate-500">👕</div>
                  )}
                  <div className="flex-grow">
                    <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'home_kit')} className="hidden" id="home-kit-file" />
                    <label htmlFor="home-kit-file" className="btn-base btn-secondary hover:btn-secondary-hover px-4 py-2 text-xs rounded-lg cursor-pointer block text-center">
                      {uploading.home_kit ? 'Subiendo...' : 'Cargar Imagen'}
                    </label>
                  </div>
                </div>
              </div>

              {/* Uniforme Visitante Image Upload */}
              <div className="space-y-2 border border-slate-800/80 rounded-xl p-4 bg-slate-950/20">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Uniforme Visitante</label>
                <div className="flex items-center gap-4">
                  {form.away_kit ? (
                    <div className="h-16 w-16 bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shrink-0 relative group">
                      <img src={form.away_kit} alt="Visitante" className="h-full w-full object-contain" />
                      <button type="button" onClick={() => setForm(prev => ({ ...prev, away_kit: '' }))} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-red-400 font-bold transition-opacity">Eliminar</button>
                    </div>
                  ) : (
                    <div className="h-16 w-16 bg-slate-900/60 rounded-lg border border-dashed border-slate-700 flex items-center justify-center text-xl shrink-0 text-slate-500">👕</div>
                  )}
                  <div className="flex-grow">
                    <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'away_kit')} className="hidden" id="away-kit-file" />
                    <label htmlFor="away-kit-file" className="btn-base btn-secondary hover:btn-secondary-hover px-4 py-2 text-xs rounded-lg cursor-pointer block text-center">
                      {uploading.away_kit ? 'Subiendo...' : 'Cargar Imagen'}
                    </label>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-base btn-primary hover:btn-primary-hover w-full py-3 rounded-xl font-bold">
                {editing ? 'Guardar' : 'Crear Equipo'}
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
                <th className="px-6 py-4">Equipo</th>
                <th className="px-6 py-4 hidden md:table-cell">Torneo</th>
                <th className="px-6 py-4 hidden lg:table-cell">Ciudad</th>
                <th className="px-6 py-4 hidden lg:table-cell">DT</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {teams.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No hay equipos.</td></tr>
              ) : teams.map(t => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-white">{t.name}</td>
                  <td className="px-6 py-4 text-slate-400 hidden md:table-cell">{t.tournament_name || '—'}</td>
                  <td className="px-6 py-4 text-slate-400 hidden lg:table-cell">{t.city || '—'}</td>
                  <td className="px-6 py-4 text-slate-400 hidden lg:table-cell">{t.coach || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openManagePlayers(t)} 
                        className="flex items-center gap-1 bg-emerald-500/15 hover:bg-emerald-500/25 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 transition-colors"
                      >
                        Plantilla
                      </button>
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

      {/* ═══ MODAL: GESTION DE PLANTILLA ═══ */}
      {selectedTeamForPlayers && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setSelectedTeamForPlayers(null)}>
          <div className="glass-card w-full max-w-4xl p-8 space-y-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block">Plantilla Oficial</span>
                <h2 className="text-xl font-extrabold text-white mt-1">🛡️ {selectedTeamForPlayers.name}</h2>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={openCreatePlayer}
                  className="btn-base btn-primary hover:btn-primary-hover px-4 py-2 text-xs rounded-xl font-bold"
                >
                  <PlusCircle className="h-4 w-4" /> Agregar Jugador
                </button>
                <button onClick={() => setSelectedTeamForPlayers(null)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamPlayers.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-500 text-sm">
                  👕 No hay jugadores inscritos en esta plantilla. Comienza agregando uno nuevo.
                </div>
              ) : (
                teamPlayers.map(p => (
                  <div key={p.id} className="glass-card p-4 bg-slate-950/40 hover:bg-slate-900/60 border-slate-800/80 flex items-center justify-between gap-4 transition-all duration-300">
                    <div className="flex items-center gap-3 min-w-0">
                      {p.photo ? (
                        <div className="h-11 w-11 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                          <img src={p.photo} alt={p.full_name} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-11 w-11 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-400 shrink-0">
                          {p.jersey_number || '🏃'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-sm truncate">{p.full_name}</span>
                          {p.jersey_number && (
                            <span className="text-[10px] bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded font-black">
                              #{p.jersey_number}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 capitalize">
                          {p.position} • DNI: {p.document_id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEditPlayer(p)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handlePlayerDelete(p.id)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

      {/* ═══ SUBMODAL: FORMULARIO JUGADOR ═══ */}
      {showPlayerForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowPlayerForm(false)}>
          <div className="glass-card w-full max-w-lg p-8 space-y-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">{editingPlayer ? 'Editar' : 'Nuevo'} Jugador</h3>
              <button onClick={() => setShowPlayerForm(false)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            {playerError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium">
                {playerError}
              </div>
            )}

            <form onSubmit={handlePlayerSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre Completo</label>
                <input value={playerForm.full_name} onChange={e => setPlayerForm({ ...playerForm, full_name: e.target.value })} required className="input-field focus:input-field-focus" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Documento / DNI</label>
                  <input value={playerForm.document_id} onChange={e => setPlayerForm({ ...playerForm, document_id: e.target.value })} required className="input-field focus:input-field-focus" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Número de Camiseta</label>
                  <input type="number" value={playerForm.jersey_number ?? ''} onChange={e => { const val = e.target.value; setPlayerForm({ ...playerForm, jersey_number: val === '' ? '' : parseInt(val) }); }} className="input-field focus:input-field-focus" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Posición en el Campo</label>
                  <select value={playerForm.position} onChange={e => setPlayerForm({ ...playerForm, position: e.target.value })} className="input-field focus:input-field-focus bg-slate-950/80 cursor-pointer">
                    <option value="Portero">Portero</option>
                    <option value="Defensa">Defensa</option>
                    <option value="Centrocampista">Centrocampista</option>
                    <option value="Delantero">Delantero</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha de Nacimiento</label>
                  <input type="date" value={playerForm.birth_date} onChange={e => setPlayerForm({ ...playerForm, birth_date: e.target.value })} className="input-field focus:input-field-focus cursor-pointer" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estatura (m)</label>
                  <input type="number" step="0.01" placeholder="1.80" value={playerForm.height} onChange={e => setPlayerForm({ ...playerForm, height: e.target.value })} className="input-field focus:input-field-focus" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Peso (kg)</label>
                  <input type="number" step="0.1" placeholder="75.5" value={playerForm.weight} onChange={e => setPlayerForm({ ...playerForm, weight: e.target.value })} className="input-field focus:input-field-focus" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pie Dominante</label>
                  <select value={playerForm.dominant_foot} onChange={e => setPlayerForm({ ...playerForm, dominant_foot: e.target.value })} className="input-field focus:input-field-focus bg-slate-950/80 cursor-pointer">
                    <option value="derecho">Derecho</option>
                    <option value="izquierdo">Izquierdo</option>
                    <option value="ambidiestro">Ambidiestro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nacionalidad</label>
                  <input value={playerForm.nationality} onChange={e => setPlayerForm({ ...playerForm, nationality: e.target.value })} className="input-field focus:input-field-focus" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado Deportivo</label>
                  <select value={playerForm.status} onChange={e => setPlayerForm({ ...form, status: e.target.value })} className="input-field focus:input-field-focus bg-slate-950/80 cursor-pointer">
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="lesionado">Lesionado</option>
                    <option value="sancionado">Sancionado</option>
                  </select>
                </div>
              </div>

              {/* Player Photo Image Upload */}
              <div className="space-y-2 border border-slate-800/80 rounded-xl p-4 bg-slate-950/20">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Foto del Jugador</label>
                <div className="flex items-center gap-4">
                  {playerForm.photo ? (
                    <div className="h-16 w-16 bg-slate-900 rounded-full overflow-hidden border border-slate-700 shrink-0 relative group">
                      <img src={playerForm.photo} alt="Jugador" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => setPlayerForm(prev => ({ ...prev, photo: '' }))} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-red-400 font-bold transition-opacity rounded-full">Eliminar</button>
                    </div>
                  ) : (
                    <div className="h-16 w-16 bg-slate-900/60 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-xl shrink-0 text-slate-500">🏃</div>
                  )}
                  <div className="flex-grow">
                    <input type="file" accept="image/*" onChange={handlePlayerPhotoChange} className="hidden" id="player-photo-file" />
                    <label htmlFor="player-photo-file" className="btn-base btn-secondary hover:btn-secondary-hover px-4 py-2 text-xs rounded-lg cursor-pointer block text-center">
                      {uploadingPlayerPhoto ? 'Subiendo...' : 'Cargar Foto'}
                    </label>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-base btn-primary hover:btn-primary-hover w-full py-3 rounded-xl font-bold">
                {editingPlayer ? 'Guardar Cambios' : 'Registrar Jugador'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
