import type { VehicleStage } from '../contracts/types';

export const STAGE_LABEL: Record<VehicleStage, string> = {
  outside: 'En fila exterior, antes del registro',
  in_lane: 'En la pasarela, esperando portería',
  entering: 'Cruzó portería, va a su celda',
  exiting: 'Saliendo sin estacionar',
  parked: 'Estacionado',
  exited: 'Salió del parqueadero',
};

/** Minutos simulados desde 00:00 a "hh:mm". Determinista, sin reloj real. */
export function clock(minutes: number): string {
  const total = Math.max(0, Math.floor(minutes));
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}
