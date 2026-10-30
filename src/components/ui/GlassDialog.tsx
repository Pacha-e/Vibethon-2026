import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SPRING } from './motion';

/**
 * Diálogo modal sobre <dialog> nativo: foco atrapado, Escape y capa superior los da el navegador.
 * Solo para confirmar acciones destructivas; el resto del flujo no usa modales.
 */
export function GlassDialog({
  open, title, children, actions, onClose,
}: { open: boolean; title: string; children: ReactNode; actions: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="!m-auto w-[min(28rem,calc(100vw-2rem))] overflow-visible bg-transparent p-0 backdrop:bg-king-deep/40 backdrop:backdrop-blur-[2px]"
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={SPRING}
            className="glass p-6"
          >
            <h2 id="dialog-title" className="text-lg font-bold">{title}</h2>
            <div className="mt-2 text-base text-fg-body">{children}</div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">{actions}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </dialog>
  );
}
