import { AnimatePresence, motion } from 'motion/react';
import { SPRING } from './motion';

/** Contador: el valor nuevo entra desde arriba y el anterior sale hacia abajo. Solo transform/opacity. */
export function AnimatedNumber({ value, className = '' }: { value: number | string; className?: string }) {
  return (
    <span className={`relative inline-grid overflow-hidden tabular-nums ${className}`}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: '-60%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '60%', opacity: 0 }}
          transition={SPRING}
          className="col-start-1 row-start-1"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
