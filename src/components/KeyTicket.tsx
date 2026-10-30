import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Plate } from "./ui/Plate";
import { Icon } from "./ui/Icon";
import { EASE_OUT, SPRING } from "./ui/motion";

export type TicketStatus = "issued" | "ready" | "delivered";

export interface KeyTicketProps {
  code: string;
  plate: string;
  accessName: string;
  cellId: string | null;
  valetName: string | null;
  status: TicketStatus;
  /** Oficina: el talón se desprende al entregar las llaves. */
  tear?: boolean;
}

// Cada animación ocurre una vez por ficho y por pestaña: volver a la vista no reimprime ni resella.
const printed = new Set<string>();
const stamped = new Set<string>();

const STATUS_TEXT: Record<TicketStatus, string> = {
  issued: "Guárdelo: lo necesita para reclamar sus llaves en la oficina.",
  ready: "Sus llaves ya están en la oficina. Presente este ficho.",
  delivered: "Llaves entregadas. Este ficho ya no es válido.",
};

/** Ficho de llaves: se imprime al emitirse, se sella «Entregado» al reclamar. Solo transform/opacity. */
export function KeyTicket({
  code,
  plate,
  accessName,
  cellId,
  valetName,
  status,
  tear = false,
}: KeyTicketProps) {
  // Se decide en el primer render (StrictMode llama dos veces al inicializador antes del efecto).
  const [print] = useState(() => !printed.has(code));
  const stamp = status === "delivered" && !stamped.has(code);
  useEffect(() => {
    printed.add(code);
    if (status === "delivered") stamped.add(code);
  }, [code, status]);

  return (
    <figure aria-label={`Ficho de llaves ${code}`} className="relative max-w-xl">
      {/* Ranura de la impresora: el ficho sale de aquí. */}
      <div
        aria-hidden="true"
        className="relative z-10 mx-3 h-2.5 rounded-full bg-king-ink shadow-e2"
      />
      <div className="-mt-1.5 overflow-hidden px-4 pb-3 pt-2.5">
        <motion.div
          initial={print ? { y: "-104%" } : false}
          animate={{ y: 0 }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
          className="relative flex drop-shadow-[0_10px_14px_rgb(22_30_41_/_0.18)]"
        >
          {/* Cuerpo */}
          <div className="relative flex-1 rounded-l-tile border border-r-0 border-king-goldlogo/60 bg-king-goldtint px-4 pb-4 pt-5">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-fg-muted">
              <Icon name="ticket" className="h-4 w-4" /> Ficho de llaves ·
              parKING
            </p>
            <motion.p
              initial={print ? { opacity: 0, y: 6 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: print ? 0.55 : 0, ...SPRING }}
              className="mt-1 font-display text-3xl font-bold tracking-[0.14em] text-king-ink sm:text-4xl"
            >
              {code}
            </motion.p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-body">
              <Plate>{plate}</Plate>
              <span>{accessName}</span>
              {cellId && <span>Celda {cellId}</span>}
              {valetName && <span>{valetName}</span>}
            </div>
            <p className="mt-3 text-sm text-fg-muted">{STATUS_TEXT[status]}</p>

            {status === "delivered" && (
              <motion.span
                aria-hidden="true"
                initial={
                  stamp ? { opacity: 0, scale: 2.2, rotate: -24 } : false
                }
                animate={{ opacity: 0.92, scale: 1, rotate: -12 }}
                transition={{
                  type: "spring",
                  stiffness: 520,
                  damping: 26,
                  delay: tear ? (print ? 1.4 : 0.6) : 0, // después de imprimir y desprender el talón
                }}
                className="pointer-events-none absolute right-4 top-4 rounded-control border-[3px] border-state-occupied px-2.5 py-1 font-display text-lg font-bold uppercase tracking-[0.12em] text-state-occupied"
              >
                Entregado
              </motion.span>
            )}
            {status === "delivered" && (
              <span className="sr-only">Estado: entregado.</span>
            )}
          </div>

          {/* Talón con troquel: muescas arriba y abajo, línea punteada. */}
          <motion.div
            aria-hidden="true"
            initial={false}
            animate={
              tear
                ? { x: 18, y: 6, rotate: 7, opacity: 0.55 }
                : { x: 0, y: 0, rotate: 0, opacity: 1 }
            }
            transition={{ duration: 0.6, ease: EASE_OUT, delay: print ? 0.95 : 0.15 }}
            style={{ transformOrigin: "top left" }}
            className="relative grid w-14 place-items-center rounded-r-tile border border-l-2 border-dashed border-king-goldlogo/60 border-l-king-goldlogo/70 bg-king-goldtint"
          >
            <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-surface-card" />
            <span className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-surface-card" />
            <span className="rotate-90 whitespace-nowrap font-display text-sm font-bold tracking-[0.2em] text-king-goldlogo">
              {code}
            </span>
          </motion.div>
        </motion.div>
      </div>
    </figure>
  );
}
