import { AnimatePresence, motion } from "motion/react";
import type { Cell, CellStatus, Vehicle } from "../contracts/types";
import { Plate } from "./ui/Plate";
import { SPRING_SOFT } from "./ui/motion";

// Tinte + borde + texto «ink» del estado; el texto siempre acompaña al color.
const LOOK: Record<
  CellStatus,
  { tile: string; ink: string; ring: string; symbol: string; word: string }
> = {
  free: {
    tile: "bg-state-free-tint border-state-free/35",
    ink: "text-state-free-ink",
    ring: "ring-state-free",
    symbol: "○",
    word: "Libre",
  },
  reserved: {
    tile: "bg-state-reserved-tint border-state-reserved/45",
    ink: "text-state-reserved-ink",
    ring: "ring-state-reserved",
    symbol: "◐",
    word: "Reservada",
  },
  occupied: {
    tile: "bg-state-occupied-tint border-state-occupied/35",
    ink: "text-state-occupied-ink",
    ring: "ring-state-occupied",
    symbol: "●",
    word: "Ocupada",
  },
};

/** Texto + símbolo de la celda (nunca solo color). */
export function cellText(
  cell: Cell,
  vehicles: Record<string, Vehicle>,
): string {
  if (cell.status === "free") return "○ Libre";
  const plate = cell.vehicleId ? vehicles[cell.vehicleId]?.plate : undefined;
  if (cell.status === "reserved")
    return plate ? `◐ Reservada · ${plate}` : "◐ Reservada";
  if (cell.vehicleId === null) return "● Ocupada (no registrado)";
  return plate ? `● Ocupada · ${plate}` : "● Ocupada";
}

function groupByZone(cells: Cell[]): [string, Cell[]][] {
  const map = new Map<string, Cell[]>();
  for (const c of cells) {
    const list = map.get(c.zone);
    if (list) list.push(c);
    else map.set(c.zone, [c]);
  }
  return Array.from(map.entries());
}

export interface CellMapProps {
  cells: Cell[];
  vehicles: Record<string, Vehicle>;
  highlightId?: string | null;
  onCellAction?: (cell: Cell) => void;
  /** Texto del botón de acción de cada celda; null = esa celda no tiene acción. */
  actionLabel?: (cell: Cell) => string | null;
}

export function CellMap({
  cells,
  vehicles,
  highlightId,
  onCellAction,
  actionLabel,
}: CellMapProps) {
  const zones = groupByZone(cells);
  if (zones.length === 0)
    return (
      <p className="text-base text-fg-muted">No hay celdas configuradas.</p>
    );

  return (
    <div className="space-y-5">
      {zones.map(([zone, list]) => (
        <section key={zone} aria-label={`Zona ${zone}`}>
          <h3 className="mb-2 text-sm font-semibold text-fg-strong">
            Zona {zone}
          </h3>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2">
            {list.map((cell) => {
              const look = LOOK[cell.status];
              const mine = cell.id === highlightId;
              const label = onCellAction
                ? actionLabel
                  ? actionLabel(cell)
                  : "Acción"
                : null;
              const plate = cell.vehicleId
                ? vehicles[cell.vehicleId]?.plate
                : undefined;
              return (
                <li key={cell.id} aria-current={mine ? "true" : undefined}>
                  <div
                    className={`relative flex h-full flex-col gap-1 rounded-control border p-2.5 transition-colors duration-300 ${look.tile} ${
                      mine
                        ? "ring-[3px] ring-king-goldlogo ring-offset-2 ring-offset-surface-card"
                        : ""
                    }`}
                  >
                    {/* Pulso solo al cambiar estado o dueño; initial={false} evita pulsar al montar. */}
                    <AnimatePresence initial={false}>
                      <motion.span
                        key={cell.id + cell.status + (cell.vehicleId ?? "")}
                        aria-hidden="true"
                        className={`pointer-events-none absolute -inset-px rounded-control ring-[3px] ${look.ring}`}
                        initial={{ opacity: 0.85, scale: 0.94 }}
                        animate={{ opacity: 0, scale: 1.06 }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </AnimatePresence>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-display text-base font-bold text-fg-strong">
                        {cell.id}
                      </p>
                      {mine && (
                        <span className="text-xs font-bold text-king-ink">
                          ★ Su celda
                        </span>
                      )}
                    </div>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.p
                        key={cell.status + (cell.vehicleId ?? "")}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={SPRING_SOFT}
                        className={`flex flex-wrap items-center gap-1.5 text-sm font-semibold ${look.ink}`}
                      >
                        <span aria-hidden="true">{look.symbol}</span>
                        {look.word}
                        {plate ? (
                          <Plate className="text-[0.8rem]">{plate}</Plate>
                        ) : (
                          cell.status === "occupied" && (
                            <span className="font-normal">sin registro</span>
                          )
                        )}
                      </motion.p>
                    </AnimatePresence>
                    {onCellAction && label && (
                      <button
                        type="button"
                        onClick={() => onCellAction(cell)}
                        aria-label={`${label}, celda ${cell.id}`}
                        className="btn btn-ghost btn-sm mt-auto min-h-[2.75rem] justify-start px-2 text-sm underline decoration-from-font underline-offset-2"
                      >
                        {label}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
