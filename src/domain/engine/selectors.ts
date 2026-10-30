// parKING — selectores y política del motor (propiedad: engine-haiku). Puros, sin efectos ni reloj real.
import { ACCESSES, ACCESS_NAME } from '../../contracts/types';
import type { AccessId, Eta, SimState, Vehicle } from '../../contracts/types';

export const POLICY_TEXT =
  'Política de asignación: 1) los vehículos que ya cruzaron la portería y perdieron su celda tienen prioridad; ' +
  '2) cada celda libre se reserva alternando Las Vegas y Regional (Round Robin): si ambos accesos tienen demanda, ' +
  'recibe la celda el acceso distinto al último servido; 3) dentro de cada fila el orden es FIFO. ' +
  'Solo demandan celda los vehículos en la pasarela sin celda que no pidieron salir sin estacionar.';

export interface CellCounts { free: number; reserved: number; occupied: number }
export interface LaneView { outside: Vehicle[]; lane: Vehicle[]; capacity: number }

const vehicleOf = (state: SimState, id: string): Vehicle | undefined => state.vehicles[id] as Vehicle | undefined;
const seqOf = (id: string): number => Number(id.slice(1)); // "V12" -> 12

/** Vehículos cruzados rumbo a su celda que aún no tienen una (prioridad máxima), por orden de llegada. */
export function enteringWaiting(state: SimState): Vehicle[] {
  return Object.values(state.vehicles)
    .filter(v => v.stage === 'entering' && v.cellId === null)
    .sort((a, b) => seqOf(a.id) - seqOf(b.id));
}

/** Demandantes de celda de una fila: en pasarela, sin celda y sin pedido de salida. Orden FIFO. */
export function demandingVehicles(state: SimState, access: AccessId): Vehicle[] {
  return state.lane[access]
    .map(id => vehicleOf(state, id))
    .filter((v): v is Vehicle => v !== undefined && v.stage === 'in_lane' && v.cellId === null && !v.exitWithoutParking);
}

/** Próximo acceso que recibe celda por Round Robin con FIFO interno; null si nadie demanda. */
export function nextAccessToServe(state: SimState): AccessId | null {
  const withDemand = ACCESSES.filter(a => demandingVehicles(state, a).length > 0);
  const [first, second] = withDemand;
  if (!first) return null;
  if (!second) return first;
  return state.lastServed === first ? second : first;
}

export function cellCounts(state: SimState): CellCounts {
  const counts: CellCounts = { free: 0, reserved: 0, occupied: 0 };
  for (const c of state.cells) counts[c.status] += 1;
  return counts;
}

export function laneView(state: SimState, access: AccessId): LaneView {
  const pick = (ids: string[]): Vehicle[] =>
    ids.map(id => vehicleOf(state, id)).filter((v): v is Vehicle => v !== undefined);
  return {
    outside: pick(state.outside[access]),
    lane: pick(state.lane[access]),
    capacity: state.config.laneCapacity[access],
  };
}

export function getEta(state: SimState, vehicleId: string): Eta {
  const v = vehicleOf(state, vehicleId);
  if (!v) {
    return { kind: 'not_registered', position: 0, vehiclesAhead: 0, demandAhead: 0, basis: 'Vehículo no encontrado.' };
  }
  if (v.stage === 'outside') {
    const idx = state.outside[v.access].indexOf(v.id);
    return {
      kind: 'not_registered', position: idx + 1, vehiclesAhead: idx, demandAhead: 0,
      basis: `Aún no te registras. Eres el puesto ${idx + 1} en la fila de ${ACCESS_NAME[v.access]}; el tiempo de celda empieza después del registro.`,
    };
  }
  const laneIdx = state.lane[v.access].indexOf(v.id);
  const position = laneIdx >= 0 ? laneIdx + 1 : 0;
  const vehiclesAhead = laneIdx >= 0 ? laneIdx : 0;
  if (v.cellId) {
    return { kind: 'assigned', position, vehiclesAhead, demandAhead: 0, basis: `Ya tienes la celda ${v.cellId}.` };
  }
  if (v.exitWithoutParking || (v.stage !== 'in_lane' && v.stage !== 'entering')) {
    return {
      kind: 'no_cell_needed', position, vehiclesAhead, demandAhead: 0,
      basis: v.exitWithoutParking ? 'Saldrás sin estacionar; no necesitas celda.' : 'Ya no necesitas celda.',
    };
  }

  // Cuántos vehículos reciben celda antes que este (k = demandAhead).
  const waiting = enteringWaiting(state);
  let k: number;
  if (v.stage === 'entering') {
    k = Math.max(0, waiting.findIndex(x => x.id === v.id));
  } else {
    const i = Math.max(0, demandingVehicles(state, v.access).findIndex(x => x.id === v.id));
    const other: AccessId = v.access === 'LV' ? 'RG' : 'LV';
    const o = demandingVehicles(state, other).length;
    const next = nextAccessToServe(state);
    const extra = next === v.access ? i : i + 1;
    k = waiting.length + i + Math.min(extra, o);
  }

  const W = state.config.etaWindowMinutes;
  const n = state.releaseLog.filter(t => t >= state.now - W && t <= state.now).length;
  const minSamples = Math.max(1, state.config.etaMinSamples);
  if (n < minSamples) {
    return {
      kind: 'insufficient_data', position, vehiclesAhead, demandAhead: k,
      basis: `Solo ${n} liberaciones en ${W} min (se necesitan ${minSamples}). Sin ritmo reciente no hay estimado.`,
    };
  }
  const m = ((k + 1) * W) / n;
  const minMinutes = Math.max(1, Math.floor(0.75 * m));
  const maxMinutes = Math.max(minMinutes, Math.ceil(1.5 * m));
  return {
    kind: 'estimate', position, vehiclesAhead, demandAhead: k, minMinutes, maxMinutes,
    basis: `${n} liberaciones en los últimos ${W} min. ${k} vehículo(s) recibirán celda antes que tú según la política. Estimado: ${minMinutes}–${maxMinutes} min.`,
  };
}
