import { AnimatePresence, motion } from 'motion/react';
import type { AccessId, Vehicle } from '../contracts/types';
import { ACCESS_NAME } from '../contracts/types';
import { Badge } from './Badge';

export interface LaneData {
  outside: Vehicle[];
  lane: Vehicle[];
  capacity: number;
}

export interface LaneViewProps {
  access: AccessId;
  view: LaneData;
  highlightId?: string | null;
}

// Solo transform/opacity. reducedMotion lo resuelve MotionConfig en App.
const ENTER = { opacity: 0, y: 12 };
const SHOW = { opacity: 1, y: 0 };
const LEAVE = { opacity: 0, y: -16 };
const SPRING = { type: 'spring', stiffness: 420, damping: 34 } as const;

/** Pasarela (índice 0 junto a portería, arriba) y fila exterior de un acceso. */
export function LaneView({ access, view, highlightId }: LaneViewProps) {
  const { outside, lane, capacity } = view;
  const name = ACCESS_NAME[access];
  const full = lane.length >= capacity;
  const slots: (Vehicle | null)[] = Array.from({ length: capacity }, (_, i) => lane[i] ?? null);

  return (
    <section aria-labelledby={`lane-title-${access}`} className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`lane-title-${access}`} className="text-lg font-bold text-king-ink">
          {name} <span className="text-king-royal">({access})</span>
        </h2>
        {full ? (
          <Badge tone="error" symbol="●">
            Lleno · {lane.length}/{capacity}
          </Badge>
        ) : (
          <Badge tone="ok" symbol="○">
            {lane.length}/{capacity} en pasarela
          </Badge>
        )}
      </div>

      <div className="rounded-lg bg-king-ink px-3 py-2 text-center text-sm font-bold tracking-widest text-white">
        PORTERÍA
      </div>

      <ol aria-label={`Pasarela ${name}, el primer hueco está junto a portería`} className="space-y-2">
        <AnimatePresence initial={false}>
          {slots.map((v, i) =>
            v ? (
              <motion.li
                key={v.id}
                layout
                initial={ENTER}
                animate={SHOW}
                exit={LEAVE}
                transition={SPRING}
                className={`rounded-lg border-2 p-3 ${
                  v.id === highlightId ? 'border-king-gold bg-king-gold/20 ring-2 ring-king-gold' : 'border-king-royal bg-blue-50'
                }`}
              >
                <p className="font-bold text-king-ink">
                  {v.plate} <span className="font-normal">· {v.driver}</span>
                </p>
                <p className="text-sm text-slate-900">
                  {v.cellId ? `Celda ${v.cellId}` : 'Esperando celda'}
                  {v.id === highlightId ? ' · ★ Su vehículo' : ''}
                </p>
              </motion.li>
            ) : (
              <li key={`hueco-${i}`} className="rounded-lg border-2 border-dashed border-slate-500 p-3 text-sm text-slate-900">
                ○ Hueco libre {i + 1}
              </li>
            ),
          )}
        </AnimatePresence>
      </ol>

      <div>
        <h3 className="text-sm font-bold text-king-ink">Fila exterior · {outside.length} esperando</h3>
        {outside.length === 0 ? (
          <p className="mt-1 text-sm text-slate-900">Nadie espera fuera.</p>
        ) : (
          <ol className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200 text-sm">
            <AnimatePresence initial={false}>
              {outside.map((v, i) => (
                <motion.li
                  key={v.id}
                  layout
                  initial={ENTER}
                  animate={SHOW}
                  exit={LEAVE}
                  transition={SPRING}
                  className={`flex justify-between gap-3 px-3 py-2 ${v.id === highlightId ? 'bg-king-gold/20 font-bold' : ''}`}
                >
                  <span>
                    {i + 1}. {v.plate}
                  </span>
                  <span className="text-slate-900">{v.driver}</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        )}
      </div>
    </section>
  );
}
