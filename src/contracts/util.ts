// Utilidades puras compartidas (propiedad: Team Lead).
import type { SimEvent, SimState } from './types';

/** Devuelve [nuevoEstado, id] con id = prefix + seq (determinista). */
export function nextId(state: SimState, prefix: string): [SimState, string] {
  const seq = state.seq + 1;
  return [{ ...state, seq }, `${prefix}${seq}`];
}

/** Crea un evento con seq/at y lo añade a state.log. Devuelve [estado, evento]. */
export function addEvent(state: SimState, ev: Omit<SimEvent, 'seq' | 'at'>): [SimState, SimEvent] {
  const seq = state.seq + 1;
  const full: SimEvent = { ...ev, seq, at: state.now };
  return [{ ...state, seq, log: [...state.log, full] }, full];
}

export const fail = (state: SimState, error: string) => ({ state, events: [] as SimEvent[], error });
export const fmtMin = (m: number) => `${Math.floor(m / 60).toString().padStart(2, '0')}:${Math.round(m % 60).toString().padStart(2, '0')}`;
