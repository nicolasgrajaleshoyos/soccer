// Definiciones de alineaciones y utilidades para posicionar jugadores en la cancha.
//
// Todas las formaciones son de futbol 11: las lineas suman 10 jugadores de campo
// y el arquero se agrega automaticamente. Las lineas van ordenadas desde la
// defensa (cerca del arco propio) hacia el ataque.

export const FORMATIONS = [
  { id: '4-4-2',   label: '4-4-2',   rows: [4, 4, 2],     description: 'El clasico equilibrado' },
  { id: '4-3-3',   label: '4-3-3',   rows: [4, 3, 3],     description: 'Ofensivo con extremos' },
  { id: '4-2-3-1', label: '4-2-3-1', rows: [4, 2, 3, 1], description: 'Moderno con mediapunta' },
  { id: '4-1-4-1', label: '4-1-4-1', rows: [4, 1, 4, 1], description: 'Con pivote defensivo' },
  { id: '4-4-1-1', label: '4-4-1-1', rows: [4, 4, 1, 1], description: 'Delantero y enganche' },
  { id: '4-5-1',   label: '4-5-1',   rows: [4, 5, 1],     description: 'Control del mediocampo' },
  { id: '4-2-2-2', label: '4-2-2-2', rows: [4, 2, 2, 2], description: 'Cuatro lineas equilibradas' },
  { id: '3-5-2',   label: '3-5-2',   rows: [3, 5, 2],     description: 'Tres defensores y carrileros' },
  { id: '3-4-3',   label: '3-4-3',   rows: [3, 4, 3],     description: 'Ofensivo y ambicioso' },
  { id: '3-4-2-1', label: '3-4-2-1', rows: [3, 4, 2, 1], description: 'Dos mediapuntas por dentro' },
  { id: '5-3-2',   label: '5-3-2',   rows: [5, 3, 2],     description: 'Defensa de cinco' },
  { id: '5-4-1',   label: '5-4-1',   rows: [5, 4, 1],     description: 'Muy defensivo' },
];

export const DEFAULT_FORMATION_ID = '4-4-2';

export function getFormationById(id) {
  return FORMATIONS.find((f) => f.id === id) || FORMATIONS[0];
}

// Abreviatura corta del rol para mostrar en la cancha.
export function roleAbbr(role) {
  switch (role) {
    case 'Portero':
      return 'POR';
    case 'Defensa':
      return 'DEF';
    case 'Centrocampista':
      return 'MED';
    case 'Delantero':
      return 'DEL';
    default:
      return '';
  }
}

// Rol sugerido segun la linea: la primera linea es Defensa, la ultima Delantero,
// las intermedias Centrocampista. Si hay una sola linea se considera mediocampo.
function roleForRowIndex(rowCount, rowIndex) {
  if (rowCount === 1) return 'Centrocampista';
  if (rowIndex === 0) return 'Defensa';
  if (rowIndex === rowCount - 1) return 'Delantero';
  return 'Centrocampista';
}

// Profundidad (eje Y en % de la cancha vertical: 0 = arco rival, 100 = arco propio)
// de cada linea segun cuantas lineas tenga la formacion. El indice 0 es la linea
// mas defensiva. Los valores dejan la defensa por delante del area propia y el
// ataque dentro del campo rival, como en una alineacion real.
const ROW_DEPTHS = {
  1: [50],
  2: [76, 32],
  3: [77, 55, 26],
  4: [78, 61, 42, 22],
};

// Dispersion horizontal (eje X en %) por cantidad de jugadores en la linea.
// Las lineas defensivas abren mas hacia los laterales; el ataque se cierra al
// centro salvo cuando son tres (extremos bien abiertos).
const DEFENSIVE_SPREAD = {
  3: [27, 50, 73],
  4: [14, 38, 62, 86],
  5: [10, 29, 50, 71, 90],
};

const MIDFIELD_SPREAD = {
  1: [50],
  2: [36, 64],
  3: [22, 50, 78],
  4: [14, 38, 62, 86],
  5: [10, 31, 50, 69, 90],
};

const ATTACK_SPREAD = {
  1: [50],
  2: [38, 62],
  3: [19, 50, 81],
  4: [16, 39, 61, 84],
};

function spreadForRow(role, count) {
  const table =
    role === 'Defensa'
      ? DEFENSIVE_SPREAD
      : role === 'Delantero'
        ? ATTACK_SPREAD
        : MIDFIELD_SPREAD;
  const preset = table[count];
  if (preset) return preset;
  return Array.from({ length: count }, (_, k) => 10 + ((k + 1) / (count + 1)) * 80);
}

// Genera los "slots" (posiciones) de una alineacion sobre una cancha vertical.
// Coordenadas en porcentaje: x de 0 (izquierda) a 100 (derecha);
// y de 0 (arco rival / ataque) a 100 (arco propio).
export function getFormationSlots(formation) {
  const rows = formation.rows;
  const rowCount = rows.length;
  const depths = ROW_DEPTHS[rowCount] || ROW_DEPTHS[4];

  const slots = [];

  // Arquero dentro del area chica, al centro del arco.
  slots.push({
    id: 'gk',
    x: 50,
    y: 93,
    role: 'Portero',
    rowIndex: -1,
    indexInRow: 0,
    label: roleAbbr('Portero'),
  });

  rows.forEach((count, i) => {
    const role = roleForRowIndex(rowCount, i);
    const xs = spreadForRow(role, count);
    for (let k = 0; k < count; k++) {
      slots.push({
        id: `${i}-${k}`,
        x: xs[k],
        y: depths[i],
        role,
        rowIndex: i,
        indexInRow: k,
        label: roleAbbr(role),
      });
    }
  });

  return slots;
}

// Cantidad total de jugadores que ocupa una alineacion (incluye arquero).
export function getFormationSize(formation) {
  return formation.rows.reduce((acc, n) => acc + n, 0) + 1;
}

// Asignacion automatica de jugadores a slots respetando su posicion.
// Devuelve un array (alineado con `slots`) de playerId | null.
export function autoAssignPlayers(slots, players) {
  const assignments = new Array(slots.length).fill(null);
  const usedIds = new Set();

  const pickByRole = (role) => {
    for (const p of players) {
      if (!usedIds.has(p.id) && p.position === role) {
        usedIds.add(p.id);
        return p;
      }
    }
    return null;
  };

  const pickAny = () => {
    for (const p of players) {
      if (!usedIds.has(p.id)) {
        usedIds.add(p.id);
        return p;
      }
    }
    return null;
  };

  slots.forEach((slot, idx) => {
    let chosen = pickByRole(slot.role);
    if (!chosen) chosen = pickAny();
    assignments[idx] = chosen ? chosen.id : null;
  });

  return assignments;
}
