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
  available: { text: 'Disponible', symbol: '○', className: 'text-state-free-ink' },
  held_for_payment: { text: 'Reservado (pago)', symbol: '◐', className: 'text-state-reserved-ink' },
  in_service: { text: 'En servicio', symbol: '●', className: 'text-king-royal' },
};

export const BTN_PRIMARY = 'btn btn-primary w-full';

export const BTN_SECONDARY = 'btn btn-secondary';
