// Lógica valet/oficina (propiedad: valet-haiku). Reducers puros, inmutables y deterministas.
import { ACCESS_NAME } from '../../contracts/types';
import type {
  Command, OfficeRecord, Result, ServiceStage, SimEvent, SimState, Valet, ValetService, Vehicle,
} from '../../contracts/types';
import { addEvent, fail, nextId } from '../../contracts/util';

/** Servicios que siguen comprometiendo al valet o al vehículo. */
export const ACTIVE_SERVICE_STAGES: ServiceStage[] = [
  'payment_pending', 'confirmed', 'car_handed', 'parked', 'keys_deposited',
];
/** Servicios con pago aprobado (generan ingreso). */
export const EARNING_STAGES: ServiceStage[] = ['confirmed', 'car_handed', 'parked', 'keys_deposited', 'keys_delivered'];

/** Formato de dinero determinista: "COP 8.000". */
export const fmtCOP = (n: number): string =>
  `COP ${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

/** Número de secuencia de un id tipo "S12" -> 12. */
export const serviceSeq = (id: string): number => Number(id.replace(/\D/g, '')) || 0;

type Ev = Omit<SimEvent, 'seq' | 'at'>;

function emit(state: SimState, ev: Ev): Result {
  const [next, full] = addEvent(state, ev);
  return { state: next, events: [full] };
}

function withService(state: SimState, svc: ValetService): SimState {
  return { ...state, services: { ...state.services, [svc.id]: svc } };
}

function withValet(state: SimState, valet: Valet): SimState {
  return { ...state, valets: state.valets.map((v) => (v.id === valet.id ? valet : v)) };
}

function withVehicle(state: SimState, vehicle: Vehicle): SimState {
  return { ...state, vehicles: { ...state.vehicles, [vehicle.id]: vehicle } };
}

function step(svc: ValetService, stage: ServiceStage, at: number, note: string): ValetService {
  return { ...svc, stage, history: [...svc.history, { at, stage, note }] };
}

function hasActiveService(state: SimState, vehicle: Vehicle): boolean {
  const svc = vehicle.valetServiceId ? state.services[vehicle.valetServiceId] : undefined;
  return svc !== undefined && ACTIVE_SERVICE_STAGES.includes(svc.stage);
}

function hold(state: SimState, vehicleId: string, valetId: string): Result {
  const vehicle = state.vehicles[vehicleId];
  if (!vehicle) return fail(state, 'Vehículo no encontrado');
  if (vehicle.stage !== 'in_lane') return fail(state, 'Solo puedes contratar valet dentro de la pasarela');
  const valet = state.valets.find((v) => v.id === valetId);
  if (!valet) return fail(state, 'Valet no encontrado');
  if (valet.access !== vehicle.access) return fail(state, `${valet.name} solo atiende el acceso ${ACCESS_NAME[valet.access]}`);
  if (valet.status !== 'available') return fail(state, `${valet.name} no está disponible`);
  if (hasActiveService(state, vehicle)) return fail(state, 'Ya tienes un servicio de valet activo');
  if (vehicle.exitWithoutParking) return fail(state, 'Este vehículo sale sin estacionar; no puede contratar valet');

  const { holdMinutes, valetPrice } = state.config;
  const [withSeq, id] = nextId(state, 'S');
  const svc: ValetService = {
    id,
    valetId: valet.id,
    vehicleId: vehicle.id,
    access: vehicle.access,
    price: valetPrice,
    createdAt: state.now,
    stage: 'payment_pending',
    ticketCode: null,
    cellId: null,
    history: [{ at: state.now, stage: 'payment_pending', note: `Bloqueo de pago ${holdMinutes} min` }],
  };
  let s = withService(withSeq, svc);
  s = withValet(s, { ...valet, status: 'held_for_payment', serviceId: id, holdExpiresAt: state.now + holdMinutes });
  s = withVehicle(s, { ...vehicle, valetServiceId: id });
  return emit(s, {
    type: 'valet_hold',
    message: `${valet.name} reservado para ${vehicle.plate}: pago pendiente de ${fmtCOP(valetPrice)} (vence en ${holdMinutes} min)`,
    vehicleId: vehicle.id,
    valetId: valet.id,
    serviceId: id,
    access: vehicle.access,
  });
}

function pay(state: SimState, serviceId: string, approved: boolean): Result {
  const svc = state.services[serviceId];
  if (!svc) return fail(state, 'Servicio no encontrado');
  if (svc.stage !== 'payment_pending') return fail(state, 'El servicio no está esperando pago');
  const valet = state.valets.find((v) => v.id === svc.valetId);
  const vehicle = state.vehicles[svc.vehicleId];
  if (!valet || !vehicle) return fail(state, 'Datos del servicio no disponibles');
  const ref = { vehicleId: vehicle.id, valetId: valet.id, serviceId, access: svc.access };

  if (approved) {
    let s = withService(state, step(svc, 'confirmed', state.now, `Pago aprobado (simulado) ${fmtCOP(svc.price)}`));
    s = withValet(s, { ...valet, status: 'in_service', holdExpiresAt: null, earnings: valet.earnings + svc.price });
    return emit(s, {
      type: 'valet_paid',
      message: `Pago aprobado (simulado): ${valet.name} atiende a ${vehicle.plate}; ingreso ${fmtCOP(svc.price)}`,
      ...ref,
    });
  }

  // Rechazo: libera valet y servicio. Nunca toca lane ni outside (el conductor conserva turno).
  let s = withService(state, step(svc, 'payment_rejected', state.now, 'Pago rechazado; valet liberado'));
  s = withValet(s, { ...valet, status: 'available', serviceId: null, holdExpiresAt: null });
  s = withVehicle(s, { ...vehicle, valetServiceId: null });
  return emit(s, {
    type: 'valet_rejected',
    message: `Pago rechazado: ${valet.name} liberado; ${vehicle.plate} conserva su turno en la pasarela`,
    ...ref,
  });
}

function handover(state: SimState, serviceId: string): Result {
  const svc = state.services[serviceId];
  if (!svc) return fail(state, 'Servicio no encontrado');
  if (svc.stage !== 'confirmed') return fail(state, 'Solo puedes entregar el auto con el pago aprobado');
  const valet = state.valets.find((v) => v.id === svc.valetId);
  const vehicle = state.vehicles[svc.vehicleId];
  if (!valet || !vehicle) return fail(state, 'Datos del servicio no disponibles');

  // Ficho único: el seq consumido por nextId nunca se repite.
  const [withSeq] = nextId(state, 'F');
  const ticketCode = `${svc.access}-${String(withSeq.seq).padStart(4, '0')}`;
  const next: ValetService = {
    ...step(svc, 'car_handed', state.now, `Auto entregado al valet; ficho ${ticketCode}`),
    ticketCode,
  };
  return emit(withService(withSeq, next), {
    type: 'valet_handover',
    message: `${valet.name} recibió el auto de ${vehicle.plate}; ficho ${ticketCode}`,
    vehicleId: vehicle.id,
    valetId: valet.id,
    serviceId,
    access: svc.access,
  });
}

function deposit(state: SimState, serviceId: string): Result {
  const svc = state.services[serviceId];
  if (!svc) return fail(state, 'Servicio no encontrado');
  const valet = state.valets.find((v) => v.id === svc.valetId);
  const vehicle = state.vehicles[svc.vehicleId];
  if (!valet || !vehicle) return fail(state, 'Datos del servicio no disponibles');
  const parked = svc.stage === 'parked' || (svc.stage === 'car_handed' && vehicle.stage === 'parked');
  if (!parked) return fail(state, 'Las llaves solo se depositan cuando el auto está estacionado');

  const cellId = svc.cellId ?? vehicle.cellId;
  const next: ValetService = {
    ...step(svc, 'keys_deposited', state.now, `Llaves depositadas en oficina${cellId ? ` (celda ${cellId})` : ''}`),
    cellId,
  };
  let s = withService(state, next);
  s = withValet(s, { ...valet, status: 'available', serviceId: null, holdExpiresAt: null });
  const rec: OfficeRecord = {
    at: state.now,
    kind: 'keys_received',
    serviceId,
    ticketCode: svc.ticketCode ?? '',
    plate: vehicle.plate,
    note: `Llaves recibidas de ${valet.name}`,
  };
  s = { ...s, office: [...s.office, rec] };
  return emit(s, {
    type: 'valet_keys_deposited',
    message: `Llaves de ${vehicle.plate} depositadas en oficina; ${valet.name} disponible`,
    vehicleId: vehicle.id,
    valetId: valet.id,
    serviceId,
    cellId: cellId ?? undefined,
    access: svc.access,
  });
}

function claim(state: SimState, ticketCode: string): Result {
  const code = ticketCode.trim().toUpperCase();
  const svc = Object.values(state.services).find((s) => s.ticketCode === code);
  if (!svc) return fail(state, 'Ficho inválido');
  if (svc.stage !== 'keys_deposited') return fail(state, 'Las llaves aún no están en oficina');
  const vehicle = state.vehicles[svc.vehicleId];
  const plate = vehicle ? vehicle.plate : svc.vehicleId;

  let s = withService(state, step(svc, 'keys_delivered', state.now, `Llaves entregadas con ficho ${code}`));
  const rec: OfficeRecord = {
    at: state.now,
    kind: 'keys_delivered',
    serviceId: svc.id,
    ticketCode: code,
    plate,
    note: 'Entrega con ficho',
  };
  s = { ...s, office: [...s.office, rec] };
  return emit(s, {
    type: 'keys_delivered',
    message: `Llaves de ${plate} entregadas con ficho ${code}`,
    vehicleId: svc.vehicleId,
    serviceId: svc.id,
    access: svc.access,
  });
}

/** Comandos de valet. Error -> mismo state + mensaje en español. */
export function valetReduce(state: SimState, cmd: Command): Result {
  switch (cmd.type) {
    case 'valetHold': return hold(state, cmd.vehicleId, cmd.valetId);
    case 'valetPay': return pay(state, cmd.serviceId, cmd.approved);
    case 'valetHandover': return handover(state, cmd.serviceId);
    case 'valetDeposit': return deposit(state, cmd.serviceId);
    case 'claimKeys': return claim(state, cmd.ticketCode);
    default: return { state, events: [] };
  }
}

/**
 * Sincronización idempotente. Devuelve el MISMO state si nada cambia.
 * (a) holds vencidos -> payment_expired, valet available, vehicle sin servicio.
 * (b) car_handed con vehículo parked -> parked + cellId.
 */
export function valetSettle(state: SimState): Result {
  let s = state;
  const events: SimEvent[] = [];
  const log = (ev: Ev) => {
    const [next, e] = addEvent(s, ev);
    s = next;
    events.push(e);
  };

  for (const v of state.valets) {
    if (v.status !== 'held_for_payment' || v.holdExpiresAt === null || v.holdExpiresAt > state.now) continue;
    const svc = v.serviceId ? s.services[v.serviceId] : undefined;
    if (svc && svc.stage === 'payment_pending') {
      s = withService(s, step(svc, 'payment_expired', s.now, 'Bloqueo vencido sin pago; valet liberado'));
      const veh = s.vehicles[svc.vehicleId];
      if (veh && veh.valetServiceId === svc.id) s = withVehicle(s, { ...veh, valetServiceId: null });
      log({
        type: 'valet_expired',
        message: `Bloqueo de pago vencido: ${v.name} liberado; ${veh ? veh.plate : svc.vehicleId} conserva su turno`,
        valetId: v.id,
        serviceId: svc.id,
        vehicleId: svc.vehicleId,
        access: v.access,
      });
    }
    s = withValet(s, { ...v, status: 'available', serviceId: null, holdExpiresAt: null });
  }

  for (const svc of Object.values(state.services)) {
    if (svc.stage !== 'car_handed') continue;
    const vehicle = s.vehicles[svc.vehicleId];
    if (!vehicle || vehicle.stage !== 'parked') continue;
    const valetName = s.valets.find((v) => v.id === svc.valetId)?.name ?? svc.valetId;
    const where = vehicle.cellId ?? 'celda sin registrar';
    s = withService(s, { ...step(s.services[svc.id], 'parked', s.now, `Auto estacionado en ${where}`), cellId: vehicle.cellId });
    log({
      type: 'valet_parked',
      message: `${valetName} estacionó ${vehicle.plate} en ${where}`,
      vehicleId: vehicle.id,
      valetId: svc.valetId,
      serviceId: svc.id,
      cellId: vehicle.cellId ?? undefined,
      access: svc.access,
    });
  }

  return s === state ? { state, events: [] } : { state: s, events };
}
