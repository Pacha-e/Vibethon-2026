import { AnimatePresence, motion } from "motion/react";
import type { Eta } from "../contracts/types";
import { SPRING_SOFT } from "./ui/motion";

function headline(eta: Eta): { symbol: string; text: string } {
  switch (eta.kind) {
    case "estimate":
      return {
        symbol: "◷",
        text: `Posición ${eta.position} · ${eta.vehiclesAhead} delante · ${eta.minMinutes ?? "?"}–${eta.maxMinutes ?? "?"} min (estimado, no garantizado)`,
      };
    case "insufficient_data":
      return { symbol: "!", text: `Datos insuficientes: ${eta.basis}` };
    case "assigned":
      return { symbol: "✓", text: "Ya tiene celda asignada" };
    case "no_cell_needed":
      return { symbol: "–", text: "No necesita celda: sale sin estacionar" };
    case "not_registered":
      return {
        symbol: "…",
        text: `Fila exterior · posición ${eta.position} · ${eta.vehiclesAhead} delante · sin estimado todavía`,
      };
  }
}

export function EtaCard({ eta }: { eta: Eta }) {
  const { symbol, text } = headline(eta);
  const tone =
    eta.kind === "insufficient_data"
      ? "bg-state-reserved-tint"
      : "bg-surface-sunken";
  return (
    <div className={`rounded-tile border border-line p-4 ${tone}`}>
      <p className="text-sm font-semibold text-fg-muted">Tiempo estimado</p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={text}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={SPRING_SOFT}
          className="mt-2 text-base font-semibold text-fg-strong"
        >
          <span aria-hidden="true">{symbol} </span>
          {text}
        </motion.p>
      </AnimatePresence>
      {eta.kind !== "insufficient_data" && (
        <p className="mt-2 text-sm text-fg-muted">Cálculo: {eta.basis}</p>
      )}
      {eta.kind === "estimate" && (
        <p className="mt-1 text-sm text-fg-muted">
          Celdas que se asignan antes: {eta.demandAhead}.
        </p>
      )}
    </div>
  );
}
