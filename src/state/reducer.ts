// Reducer raíz: ÚNICA fuente de verdad. Compone motor + valet y estabiliza el estado tras cada comando.
import type { Command, Result, SimConfig, SimEvent, SimState } from '../contracts/types';
import { createInitialState, engineReduce, settle } from '../domain/engine';
import { valetReduce, valetSettle } from '../features/valet/logic';

const VALET_CMDS = new Set(['valetHold', 'valetPay', 'valetHandover', 'valetDeposit', 'claimKeys']);

function stabilize(state: SimState): { state: SimState; events: SimEvent[] } {
  const events: SimEvent[] = [];
  let s = state;
  for (let i = 0; i < 3; i++) { // valet sync/expiry -> motor (admisión + asignación) -> valet sync
    const v = valetSettle(s); events.push(...v.events);
    const e = settle(v.state); events.push(...e.events);
    if (e.state === s) break;
    s = e.state;
  }
  return { state: s, events };
}

export function rootReduce(state: SimState, cmd: Command): Result {
  if (cmd.type === 'reset') return { state: stabilize(createInitialState(state.config)).state, events: [] };
  if (cmd.type === 'batch') {
    let s = state; const events: SimEvent[] = []; const errors: string[] = [];
    for (const c of cmd.commands) {
      const r = rootReduce(s, c);
      if (r.error) errors.push(r.error); else { s = r.state; events.push(...r.events); }
    }
    return { state: s, events, error: errors.length ? errors.join(' · ') : undefined };
  }
  const r = VALET_CMDS.has(cmd.type) ? valetReduce(state, cmd) : engineReduce(state, cmd);
  if (r.error) return { state, events: [], error: r.error };
  const st = stabilize(r.state);
  return { state: st.state, events: [...r.events, ...st.events] };
}

export function bootState(config: SimConfig): SimState {
  return stabilize(createInitialState(config)).state;
}
