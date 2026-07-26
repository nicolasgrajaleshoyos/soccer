'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  FORMATIONS,
  DEFAULT_FORMATION_ID,
  getFormationById,
  getFormationSlots,
  getFormationSize,
  autoAssignPlayers,
} from '@/lib/formations';
import { LayoutGrid, RotateCcw, Trash2, Users } from 'lucide-react';

// Colores por rol para identificar posiciones en la cancha.
const ROLE_COLORS = {
  Portero: { chip: 'bg-amber-500', ring: 'ring-amber-300', dot: 'bg-amber-400' },
  Defensa: { chip: 'bg-sky-500', ring: 'ring-sky-300', dot: 'bg-sky-400' },
  Centrocampista: { chip: 'bg-emerald-500', ring: 'ring-emerald-300', dot: 'bg-emerald-400' },
  Delantero: { chip: 'bg-rose-500', ring: 'ring-rose-300', dot: 'bg-rose-400' },
};

function storageKey(teamId) {
  return `lineup_${teamId}`;
}

// Toma el apellido (ultima palabra) del nombre completo para mostrarlo corto.
function shortName(fullName) {
  if (!fullName) return '';
  return fullName.trim().split(/\s+/).slice(-1)[0];
}

export default function FormationField({ players = [], teamId }) {
  const [formationId, setFormationId] = useState(DEFAULT_FORMATION_ID);
  const [assignments, setAssignments] = useState(() => {
    // Estado inicial determinista (server + cliente coinciden) para evitar mismatch.
    return autoAssignPlayers(
      getFormationSlots(getFormationById(DEFAULT_FORMATION_ID)),
      players
    );
  });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  const formation = getFormationById(formationId);
  const slots = useMemo(() => getFormationSlots(formation), [formation]);
  const formationSize = getFormationSize(formation);

  // Al montar, intenta cargar una alineacion guardada localmente.
  useEffect(() => {
    setHydrated(true);
    try {
      const raw = window.localStorage.getItem(storageKey(teamId));
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.formationId && getFormationById(saved.formationId)) {
          const savedFormation = getFormationById(saved.formationId);
          const savedSlots = getFormationSlots(savedFormation);
          if (
            Array.isArray(saved.assignments) &&
            saved.assignments.length === savedSlots.length
          ) {
            setFormationId(saved.formationId);
            setAssignments(saved.assignments);
            return;
          }
        }
      }
    } catch (e) {
      /* almacenamiento no disponible: se ignora */
    }
    setAssignments(autoAssignPlayers(slots, players));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistencia local de la alineacion planificada.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        storageKey(teamId),
        JSON.stringify({ formationId, assignments })
      );
    } catch (e) {
      /* almacenamiento no disponible: se ignora */
    }
  }, [hydrated, teamId, formationId, assignments]);

  // Cambiar de alineacion recalcula los slots y reorganiza automaticamente.
  function handleFormationChange(id) {
    setFormationId(id);
    const newSlots = getFormationSlots(getFormationById(id));
    setAssignments(autoAssignPlayers(newSlots, players));
    setSelectedSlot(null);
  }

  function handleAutoOrganize() {
    setAssignments(autoAssignPlayers(slots, players));
    setSelectedSlot(null);
  }

  function handleClear() {
    setAssignments(new Array(slots.length).fill(null));
    setSelectedSlot(null);
  }

  function handleSlotClick(idx) {
    if (assignments[idx] != null) {
      // Ya hay un jugador ahi: lo regresa a la banca.
      setAssignments((prev) => prev.map((pid, i) => (i === idx ? null : pid)));
    } else {
      // Selecciona/deselecciona el slot vacio para asignar luego.
      setSelectedSlot((prev) => (prev === idx ? null : idx));
    }
  }

  function handleBenchPlayerClick(playerId) {
    let target = selectedSlot;
    if (target == null) {
      target = assignments.findIndex((a) => a == null);
    }
    if (target === null || target === -1) return; // cancha llena
    setAssignments((prev) =>
      prev.map((pid, i) => {
        if (i === target) return playerId;
        // Evita duplicar al jugador en otro slot.
        if (pid === playerId) return null;
        return pid;
      })
    );
    setSelectedSlot(null);
  }

  const playersById = useMemo(() => {
    const map = {};
    players.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [players]);

  const assignedIds = useMemo(
    () => new Set(assignments.filter(Boolean)),
    [assignments]
  );
  const benchPlayers = useMemo(
    () => players.filter((p) => !assignedIds.has(p.id)),
    [players, assignedIds]
  );
  const filledCount = assignments.filter(Boolean).length;

  return (
    <section className="space-y-4">
      {/* Encabezado y acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <LayoutGrid className="text-emerald-400 h-5 w-5" />
          Alineacion y Posiciones
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAutoOrganize}
            className="btn-base btn-secondary hover:btn-secondary-hover px-3 py-1.5 text-xs rounded-lg"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Auto-organizar
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="btn-base btn-secondary hover:btn-secondary-hover px-3 py-1.5 text-xs rounded-lg"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Limpiar
          </button>
        </div>
      </div>

      {/* Selector de formacion */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {FORMATIONS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => handleFormationChange(f.id)}
            title={f.description}
            className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold tracking-wide transition-all border ${
              formationId === f.id
                ? 'bg-emerald-500 text-emerald-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900/50 text-slate-300 border-slate-700 hover:border-emerald-500/50 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400">
        Formacion <span className="text-white font-bold">{formation.label}</span> ·{' '}
        {formation.description} · {formationSize} jugadores en cancha
      </p>

      {/* Cancha / simulacion */}
      <div className="relative mx-auto w-full max-w-[460px]">
        <div
          className="relative w-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
          style={{ aspectRatio: '68 / 105', backgroundColor: '#15803d' }}
        >
          {/* Rayas del cesped (franjas horizontales del corte) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(180deg, rgba(255,255,255,0.055) 0 10%, rgba(0,0,0,0.055) 10% 20%)',
            }}
          />
          {/* Viñeta para dar profundidad */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.08), rgba(0,0,0,0.30) 100%)',
            }}
          />

          {/* Lineamientos de la cancha */}
          <PitchMarkings />

          {/* Slots / jugadores */}
          {slots.map((slot, idx) => {
            const playerId = assignments[idx];
            const player = playerId != null ? playersById[playerId] : null;
            const colors = ROLE_COLORS[slot.role] || ROLE_COLORS.Centrocampista;
            const isSelected = selectedSlot === idx;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => handleSlotClick(idx)}
                className="absolute z-10 flex flex-col items-center gap-1 group cursor-pointer"
                style={{
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                title={
                  player
                    ? `${player.full_name} · ${slot.role}`
                    : `Posicion libre · ${slot.role}`
                }
              >
                {player ? (
                  <>
                    <span
                      className={`flex items-center justify-center rounded-full ${colors.chip} text-white font-black shadow-lg ring-2 ${colors.ring}`}
                      style={{ width: 30, height: 30, fontSize: 12 }}
                    >
                      {player.jersey_number ?? '?'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-950/85 text-white text-[9px] font-semibold max-w-[64px] truncate">
                      {shortName(player.full_name)}
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      className={`flex items-center justify-center rounded-full border-2 border-dashed ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                          : 'border-white/50 bg-white/10 text-white/70 group-hover:border-white/80 group-hover:text-white'
                      }`}
                      style={{ width: 30, height: 30, fontSize: 13 }}
                    >
                      {isSelected ? '+' : '·'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-950/70 text-white/75 text-[8px] font-bold uppercase tracking-wider">
                      {slot.label}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Leyenda de colores por posicion */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-slate-400">
        {Object.entries(ROLE_COLORS).map(([role, c]) => (
          <span key={role} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full ${c.dot}`} />
            {role}
          </span>
        ))}
      </div>

      {/* Banca / suplentes */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center gap-2 text-white">
            <Users className="h-4 w-4 text-emerald-400" />
            Banca / Suplentes
            <span className="text-xs text-slate-400 font-normal">
              ({benchPlayers.length})
            </span>
          </h3>
          <p className="text-[11px] text-slate-400">
            En cancha:{' '}
            <span className="text-emerald-400 font-bold">{filledCount}</span> /{' '}
            {slots.length}
          </p>
        </div>

        {benchPlayers.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-3">
            Todos los jugadores estan en cancha.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {benchPlayers.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleBenchPlayerClick(p.id)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700 hover:border-emerald-500/60 hover:bg-slate-800/60 transition-all text-xs"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-white font-bold text-[10px]">
                  {p.jersey_number ?? '?'}
                </span>
                <span className="text-slate-200 font-medium max-w-[120px] truncate">
                  {p.full_name}
                </span>
                <span className="text-[9px] text-slate-500 uppercase">
                  {p.position || ''}
                </span>
              </button>
            ))}
          </div>
        )}

        <p className="mt-3 text-[10px] text-slate-500 leading-relaxed">
          Toca una posicion vacia para seleccionarla y luego un suplente para
          ubicarlo. Toca un jugador en cancha para regresarlo a la banca. La
          alineacion se guarda solo en este navegador.
        </p>
      </div>
    </section>
  );
}

// Dibuja los lineamientos reglamentarios sobre una cancha de 105 x 68 m
// (vista vertical: arco propio abajo, arco rival arriba).
function PitchMarkings() {
  const W = 68;
  const H = 105;
  const CX = W / 2;
  const stroke = 'rgba(255,255,255,0.55)';
  const sw = 0.35;

  // Medidas FIFA en metros.
  const PA_W = 40.32; // area grande
  const PA_D = 16.5;
  const GA_W = 18.32; // area chica
  const GA_D = 5.5;
  const PEN_DIST = 11; // punto penal
  const CIRCLE_R = 9.15;
  const GOAL_W = 7.32;
  const CORNER_R = 1;

  const paX = CX - PA_W / 2;
  const gaX = CX - GA_W / 2;

  // Arco del area: parte del circulo de 9.15 m que sobresale del area grande.
  const dx = Math.sqrt(CIRCLE_R * CIRCLE_R - (PA_D - PEN_DIST) ** 2);
  const arcTop = `M ${CX - dx} ${PA_D} A ${CIRCLE_R} ${CIRCLE_R} 0 0 0 ${CX + dx} ${PA_D}`;
  const arcBottom = `M ${CX - dx} ${H - PA_D} A ${CIRCLE_R} ${CIRCLE_R} 0 0 1 ${CX + dx} ${H - PA_D}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    >
      <g fill="none" stroke={stroke} strokeWidth={sw}>
        {/* Perimetro */}
        <rect x={sw} y={sw} width={W - sw * 2} height={H - sw * 2} rx={0.4} />

        {/* Linea de medio campo y circulo central */}
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} />
        <circle cx={CX} cy={H / 2} r={CIRCLE_R} />

        {/* Areas del arco rival (arriba) */}
        <rect x={paX} y={0} width={PA_W} height={PA_D} />
        <rect x={gaX} y={0} width={GA_W} height={GA_D} />
        <path d={arcTop} />

        {/* Areas del arco propio (abajo) */}
        <rect x={paX} y={H - PA_D} width={PA_W} height={PA_D} />
        <rect x={gaX} y={H - GA_D} width={GA_W} height={GA_D} />
        <path d={arcBottom} />

        {/* Corners */}
        <path d={`M 0 ${CORNER_R} A ${CORNER_R} ${CORNER_R} 0 0 0 ${CORNER_R} 0`} />
        <path d={`M ${W - CORNER_R} 0 A ${CORNER_R} ${CORNER_R} 0 0 0 ${W} ${CORNER_R}`} />
        <path d={`M ${CORNER_R} ${H} A ${CORNER_R} ${CORNER_R} 0 0 0 0 ${H - CORNER_R}`} />
        <path d={`M ${W} ${H - CORNER_R} A ${CORNER_R} ${CORNER_R} 0 0 0 ${W - CORNER_R} ${H}`} />
      </g>

      {/* Puntos: centro y penales */}
      <g fill="rgba(255,255,255,0.7)">
        <circle cx={CX} cy={H / 2} r={0.5} />
        <circle cx={CX} cy={PEN_DIST} r={0.5} />
        <circle cx={CX} cy={H - PEN_DIST} r={0.5} />
      </g>

      {/* Arcos */}
      <g stroke="rgba(255,255,255,0.85)" strokeWidth={0.6} fill="none">
        <line x1={CX - GOAL_W / 2} y1={0.3} x2={CX + GOAL_W / 2} y2={0.3} />
        <line x1={CX - GOAL_W / 2} y1={H - 0.3} x2={CX + GOAL_W / 2} y2={H - 0.3} />
      </g>
    </svg>
  );
}




