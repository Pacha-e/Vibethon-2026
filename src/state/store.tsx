// Store React sobre rootReduce. Las vistas SOLO leen state y llaman dispatch(Command).
// El estado se comparte entre pestañas del mismo navegador (localStorage + evento `storage`), para que
// las cuentas de conductor, portería, valet y oficina abiertas a la vez operen el MISMO parqueadero.
// No hay segundo motor: cada pestaña aplica rootReduce sobre el último estado compartido.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Command, SimEvent, SimState } from "../contracts/types";
import { PROVISIONAL_CONFIG } from "../fixtures/provisional";
import { bootState, rootReduce } from "./reducer";

export interface Feedback {
  kind: "ok" | "error";
  text: string;
  id: number;
}
interface SimCtx {
  state: SimState;
  dispatch: (cmd: Command) => {
    ok: boolean;
    error?: string;
    events: SimEvent[];
  };
  feedback: Feedback | null;
  clearFeedback: () => void;
}
const Ctx = createContext<SimCtx | null>(null);

const SHARED_KEY = "parking.sim.state.v1";

function readShared(): SimState | null {
  try {
    const raw = window.localStorage.getItem(SHARED_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as SimState;
    // Un estado guardado con otro fixture no se reutiliza.
    return s.config?.fixtureName === PROVISIONAL_CONFIG.fixtureName ? s : null;
  } catch {
    return null;
  }
}

function writeShared(s: SimState): void {
  try {
    window.localStorage.setItem(SHARED_KEY, JSON.stringify(s));
  } catch {
    // Sin almacenamiento disponible la app sigue funcionando en esta pestaña.
  }
}

export function SimProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: SimState;
}) {
  const shared = initial === undefined;
  const [state, setState] = useState<SimState>(
    () => initial ?? readShared() ?? bootState(PROVISIONAL_CONFIG),
  );
  const ref = useRef(state);
  ref.current = state;
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    if (!shared) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== SHARED_KEY) return;
      const next = readShared();
      if (next) {
        ref.current = next;
        setState(next);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [shared]);

  const dispatch = useCallback(
    (cmd: Command) => {
      const base = (shared && readShared()) || ref.current; // último estado de cualquier pestaña
      const r = rootReduce(base, cmd); // síncrono: verificación + reserva en una sola transición
      ref.current = r.state;
      setState(r.state);
      if (shared && r.state !== base) writeShared(r.state); // batch con errores parciales también cambia el estado
      const text =
        r.error ??
        r.events
          .map((e) => e.message)
          .slice(-2)
          .join(" · ");
      if (text)
        setFeedback({
          kind: r.error ? "error" : "ok",
          text,
          id: r.state.seq + (r.error ? 0.5 : 0),
        });
      return { ok: !r.error, error: r.error, events: r.events };
    },
    [shared],
  );

  return (
    <Ctx.Provider
      value={{
        state,
        dispatch,
        feedback,
        clearFeedback: () => setFeedback(null),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSim(): SimCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSim fuera de SimProvider");
  return c;
}
