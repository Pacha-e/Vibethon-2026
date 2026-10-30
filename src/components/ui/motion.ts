// Constantes de movimiento compartidas (ver docs/design/DESIGN.md §Movimiento).
// Regla: solo se anima un cambio ya confirmado por rootReduce; solo transform y opacity.
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Respuesta firme: pestañas, botones, contadores. */
export const SPRING = { type: 'spring', stiffness: 480, damping: 38 } as const;
/** Reacomodo de objetos físicos: vehículos en la fila, celdas. */
export const SPRING_SOFT = { type: 'spring', stiffness: 320, damping: 32, mass: 0.9 } as const;

export const FADE_UP = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
} as const;
