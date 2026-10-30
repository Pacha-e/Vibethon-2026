// Store React sobre rootReduce. Las vistas SOLO leen state y llaman dispatch(Command).
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import type { Command, SimEvent, SimState } from '../contracts/types';
import { PROVISIONAL_CONFIG } from '../fixtures/provisional';
import { bootState, rootReduce } from './reducer';

export interface Feedback { kind: 'ok' | 'error'; text: string; id: number }
interface SimCtx {
  state: SimState;
  dispatch: (cmd: Command) => { ok: boolean; error?: string; events: SimEvent[] };
  feedback: Feedback | null;
  clearFeedback: () => void;
}
const Ctx = createContext<SimCtx | null>(null);

export function SimProvider({ children, initial }: { children: ReactNode; initial?: SimState }) {
  const [state, setState] = useState<SimState>(() => initial ?? bootState(PROVISIONAL_CONFIG));
  const ref = useRef(state); ref.current = state;
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const dispatch = useCallback((cmd: Command) => {
    const r = rootReduce(ref.current, cmd); // síncrono: verificación + reserva en una sola transición
    ref.current = r.state; setState(r.state);
    const text = r.error ?? r.events.map((e) => e.message).slice(-2).join(' · ');
    if (text) setFeedback({ kind: r.error ? 'error' : 'ok', text, id: r.state.seq + (r.error ? 0.5 : 0) });
    return { ok: !r.error, error: r.error, events: r.events };
  }, []);
  return <Ctx.Provider value={{ state, dispatch, feedback, clearFeedback: () => setFeedback(null) }}>{children}</Ctx.Provider>;
}

export function useSim(): SimCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSim fuera de SimProvider');
  return c;
}
