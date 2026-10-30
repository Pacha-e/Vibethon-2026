// Etiquetas y clases compartidas por las vistas valet/oficina (propiedad: valet-haiku).
import type { ServiceStage, ValetStatus, VehicleStage } from '../../contracts/types';

export const VEHICLE_STAGE_TEXT: Record<VehicleStage, string> = {
  outside: 'fuera de la pasarela, esperando registro',
  in_lane: 'dentro de la pasarela',
  entering: 'entrando a su celda',
  exiting: 'saliendo sin estacionar',
  parked: 'estacionado',
  exited: 'fuera del parqueadero',
};

export const SERVICE_STAGE_TEXT: Record<ServiceStage, string> = {
  payment_pending: 'Pago pendiente',
  payment_rejected: 'Pago rechazado',
  payment_expired: 'Pago vencido',
  confirmed: 'Pago confirmado',
  car_handed: 'Auto entregado al valet',
  parked: 'Auto estacionado',
  keys_deposited: 'Llaves en oficina',
  keys_delivered: 'Llaves entregadas',
};

/** Orden del seguimiento para el conductor. */
export const TRACK_ORDER: ServiceStage[] = [
  'payment_pending', 'confirmed', 'car_handed', 'parked', 'keys_deposited', 'keys_delivered',
];

/** Estado de valet: texto + símbolo + color (nunca solo color). */
export const VALET_STATUS_LABEL: Record<ValetStatus, { text: string; symbol: string; className: string }> = {
  available: { text: 'Disponible', symbol: '○', className: 'text-emerald-300' },
  held_for_payment: { text: 'Reservado (pago)', symbol: '◐', className: 'text-king-gold' },
  in_service: { text: 'En servicio', symbol: '●', className: 'text-sky-300' },
};

export const BTN_PRIMARY =
  'min-h-[44px] w-full rounded-lg bg-king-gold px-3 py-2 text-left font-semibold text-king-ink hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-king-gold disabled:opacity-50';

export const BTN_SECONDARY =
  'min-h-[44px] rounded-lg border border-white px-3 py-2 font-semibold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-king-gold';
