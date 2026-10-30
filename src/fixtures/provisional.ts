// FIXTURE PROVISIONAL — NO OFICIAL. Sustituir por los mapas/condiciones/eventos de la organización
// cuando estén disponibles (mismo shape SimConfig). Las 16 celdas y la tarifa son supuestos del equipo.
import type { CellSeed, SimConfig } from '../contracts/types';

const zoneA: CellSeed[] = Array.from({ length: 8 }, (_, i) => ({
  id: `A-${String(i + 1).padStart(2, '0')}`, zone: 'A',
  route: `Portería → giro a la izquierda → Zona A, celda ${i + 1}`,
}));
const zoneB: CellSeed[] = Array.from({ length: 8 }, (_, i) => ({
  id: `B-${String(i + 1).padStart(2, '0')}`, zone: 'B',
  route: `Portería → recto junto a oficina de valets → Zona B, celda ${i + 1}`,
}));

export const PROVISIONAL_CONFIG: SimConfig = {
  fixtureName: 'Provisional EAFIT (equipo)',
  isOfficial: false,
  laneCapacity: { LV: 4, RG: 6 },
  valetsPerAccess: 8,
  valetPrice: 8000,
  holdMinutes: 2,
  etaWindowMinutes: 30,
  etaMinSamples: 2,
  valetSuggestMinutes: 15,
  // 13 de 16 celdas ocupadas al inicio por vehículos no registrados en la simulación → hora pico.
  cells: [...zoneA, ...zoneB].map((c, i) => ({ ...c, initiallyOccupied: i !== 2 && i !== 9 && i !== 14 })),
};
