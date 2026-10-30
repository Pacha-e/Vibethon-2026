import type { ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import type { AccessId, Vehicle } from "../contracts/types";
import { ACCESS_NAME } from "../contracts/types";
import { Badge } from "./Badge";
import { Plate } from "./ui/Plate";
import { Icon } from "./ui/Icon";
import { SPRING_SOFT } from "./ui/motion";

export interface LaneData {
  outside: Vehicle[];
  lane: Vehicle[];
  capacity: number;
}

export interface LaneViewProps {
  access: AccessId;
  view: LaneData;
  highlightId?: string | null;
  /** Acción en la barrera (p. ej. «Dar paso»). Va pegada a la portería, junto al primer vehículo. */
  gateAction?: ReactNode;
}

// Solo transform/opacity; reducedMotion lo resuelve MotionConfig en App.
const ENTER = { opacity: 0, y: 14 };
const SHOW = { opacity: 1, y: 0 };
const CROSS = { opacity: 0, y: -22, transition: { duration: 0.22 } };

function cellLine(v: Vehicle): string {
  if (v.exitWithoutParking) return "Sale sin estacionar";
  return v.cellId ? `Celda ${v.cellId} reservada` : "Esperando celda";
}

/** Medidor de capacidad: un segmento por puesto de la pasarela, con el conteo en texto. */
function Capacity({ used, capacity }: { used: number; capacity: number }) {
  const full = used >= capacity;
  return (
    <div className="flex items-center gap-3">
      <div aria-hidden="true" className="flex gap-1">
        {Array.from({ length: capacity }, (_, i) => (
          <span
            key={i}
            className={`h-2 w-4 rounded-full transition-colors duration-300 ${i < used ? (full ? "bg-state-occupied" : "bg-king-royal") : "bg-line"}`}
          />
        ))}
      </div>
      {full ? (
        <Badge tone="error" symbol="●">
          Llena · {used}/{capacity}
        </Badge>
      ) : (
        <Badge tone="neutral">
          {used} de {capacity}
        </Badge>
      )}
    </div>
  );
}

/** Pasarela de un acceso dibujada como carril: barrera de portería arriba, puesto 1 debajo, fila exterior al final. */
export function LaneView({
  access,
  view,
  highlightId,
  gateAction,
}: LaneViewProps) {
  const { outside, lane, capacity } = view;
  const name = ACCESS_NAME[access];
  const [first, ...rest] = lane;
  const freeSlots = Math.max(0, capacity - lane.length);
  const mine = (v: Vehicle) => v.id === highlightId;

  return (
    <section
      aria-labelledby={`lane-title-${access}`}
      className="card overflow-hidden p-0 sm:p-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-6">
        <h2 id={`lane-title-${access}`} className="text-lg font-bold">
          {name} <span className="font-semibold text-fg-muted">{access}</span>
        </h2>
        <Capacity used={lane.length} capacity={capacity} />
      </div>

      <LayoutGroup id={`lane-${access}`}>
        {/* Barrera de portería */}
        <div className="mx-5 mt-4 flex items-center gap-2 rounded-t-tile bg-king-ink px-3 py-2 text-sm font-semibold text-white sm:mx-6">
          <Icon name="gate" className="h-4 w-4 text-king-gold" />
          Portería
          <span
            aria-hidden="true"
            className="ml-auto h-1 w-16 rounded-full bg-king-gold"
          />
        </div>

        <ol
          aria-label={`Pasarela ${name}; el puesto 1 está junto a portería`}
          className="mx-5 space-y-2 rounded-b-tile border border-t-0 border-line bg-surface-sunken p-2 sm:mx-6"
        >
          <AnimatePresence initial={false} mode="popLayout">
            {first ? (
              <motion.li
                key={first.id}
                layoutId={`veh-${first.id}`}
                initial={ENTER}
                animate={SHOW}
                exit={CROSS}
                transition={SPRING_SOFT}
                className={`rounded-control border bg-surface-card p-3 shadow-e1 ${mine(first) ? "border-king-goldlogo ring-2 ring-king-gold" : "border-line"}`}
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-xs font-semibold text-fg-muted">
                    Puesto 1
                  </span>
                  <Plate>{first.plate}</Plate>
                  <span className="text-sm text-fg-body">{first.driver}</span>
                  {mine(first) && (
                    <Badge tone="gold" symbol="★">
                      Su vehículo
                    </Badge>
                  )}
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={cellLine(first)}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`mt-2 flex items-center gap-1.5 text-sm font-semibold ${first.cellId || first.exitWithoutParking ? "text-state-free-ink" : "text-state-reserved-ink"}`}
                  >
                    <span aria-hidden="true">
                      {first.cellId || first.exitWithoutParking ? "✓" : "◷"}
                    </span>
                    {cellLine(first)}
                  </motion.p>
                </AnimatePresence>
                {gateAction && <div className="mt-3">{gateAction}</div>}
              </motion.li>
            ) : (
              <li
                key="vacia"
                className="rounded-control border border-dashed border-line-strong p-3 text-sm text-fg-muted"
              >
                Nadie junto a portería.
                {gateAction && <div className="mt-3">{gateAction}</div>}
              </li>
            )}
            {rest.map((v, i) => (
              <motion.li
                key={v.id}
                layout
                layoutId={`veh-${v.id}`}
                initial={ENTER}
                animate={SHOW}
                exit={CROSS}
                transition={SPRING_SOFT}
                className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-control border bg-surface-card px-3 py-2 ${mine(v) ? "border-king-goldlogo ring-2 ring-king-gold" : "border-line"}`}
              >
                <span className="w-14 text-xs font-semibold text-fg-muted">
                  Puesto {i + 2}
                </span>
                <Plate>{v.plate}</Plate>
                <span className="min-w-0 flex-1 truncate text-sm text-fg-body">
                  {v.driver}
                </span>
                <span
                  className={`text-sm font-semibold ${v.cellId ? "text-state-free-ink" : "text-fg-muted"}`}
                >
                  {v.exitWithoutParking ? "Sale" : (v.cellId ?? "Sin celda")}
                </span>
              </motion.li>
            ))}
            {Array.from(
              { length: first ? freeSlots : Math.max(0, capacity - 1) },
              (_, i) => (
                <li
                  key={`hueco-${i}`}
                  className="rounded-control border border-dashed border-line-strong/70 px-3 py-2 text-sm text-fg-muted"
                >
                  ○ Puesto {lane.length + i + (first ? 1 : 2)} libre
                </li>
              ),
            )}
          </AnimatePresence>
        </ol>

        <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          <h3 className="text-sm font-semibold text-fg-strong">
            Fila exterior{" "}
            <span className="font-normal text-fg-muted">
              ·{" "}
              {outside.length === 0
                ? "nadie espera"
                : `${outside.length} esperando registro`}
            </span>
          </h3>
          {outside.length > 0 && (
            <ol
              aria-label="Fila exterior, en orden de llegada"
              className="mt-2 flex flex-wrap gap-2"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {outside.map((v, i) => (
                  <motion.li
                    key={v.id}
                    layoutId={`veh-${v.id}`}
                    initial={ENTER}
                    animate={SHOW}
                    exit={{ opacity: 0 }}
                    transition={SPRING_SOFT}
                    className={`inline-flex items-center gap-1.5 rounded-full py-1 pl-2 pr-1 text-sm ${mine(v) ? "bg-king-goldtint ring-2 ring-king-gold" : "bg-surface-sunken"}`}
                  >
                    <span className="text-xs font-semibold text-fg-muted">
                      {i + 1}
                    </span>
                    <Plate>{v.plate}</Plate>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>
          )}
        </div>
      </LayoutGroup>
    </section>
  );
}
