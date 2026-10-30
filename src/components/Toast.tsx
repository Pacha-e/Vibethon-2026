import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSim } from "../state/store";
import { Icon } from "./ui/Icon";
import { SPRING } from "./ui/motion";

/** Confirmación del motor: solo aparece después de que rootReduce aplicó (o rechazó) el comando. */
export function Toast() {
  const { feedback, clearFeedback } = useSim();
  // Ref: un re-render del store no reinicia el temporizador.
  const closeRef = useRef(clearFeedback);
  closeRef.current = clearFeedback;

  // Auto-cierre a los 6 s. Depende del objeto feedback (cada dispatch crea uno nuevo); id puede repetirse.
  useEffect(() => {
    if (!feedback) return;
    const t = window.setTimeout(() => closeRef.current(), 6000);
    return () => window.clearTimeout(t);
  }, [feedback]);

  const isError = feedback?.kind === "error";

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-3 z-40 flex justify-center bottom-[calc(var(--dock-h)+env(safe-area-inset-bottom)+1.25rem)] md:inset-x-auto md:bottom-6 md:right-6 md:justify-end"
    >
      <AnimatePresence>
        {feedback && (
          <motion.div
            key={feedback.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={SPRING}
            className="glass-dark pointer-events-auto flex w-full max-w-md items-start gap-3 py-3 pl-3 pr-2"
          >
            <span
              className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-white ${isError ? "bg-state-occupied" : "bg-state-free"}`}
            >
              <Icon name={isError ? "x" : "check"} className="h-4 w-4" />
            </span>
            <p className="flex-1 py-0.5 text-sm font-medium leading-6 text-white">
              <span className="sr-only">{isError ? "Error: " : "Hecho: "}</span>
              {feedback.text}
            </p>
            <button
              type="button"
              onClick={clearFeedback}
              aria-label="Cerrar aviso"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
