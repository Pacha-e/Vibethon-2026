// Invariantes globales del estado simulado. Devuelve violaciones en español (vacío = OK).
import type { AccessId, ServiceStage, SimState } from '../src/contracts/types';

const LANE_MAX: Record<AccessId, number> = { LV: 4, RG: 6 };
const ACCESSES: AccessId[] = ['LV', 'RG'];
const ACTIVE_SERVICE: ServiceStage[] = ['payment_pending', 'confirmed', 'car_handed', 'parked'];

export function checkInvariants(state: SimState): string[] {
  const out: string[] = [];
  const vehicles = state.vehicles;
  const services = Object.values(state.services);

  // Pasarela: capacidad por acceso
  for (const a of ACCESSES) {
    if (state.lane[a].length > LANE_MAX[a]) out.push(`pasarela ${a} tiene ${state.lane[a].length} > ${LANE_MAX[a]}`);
  }

  // Celdas: coherencia status <-> dueño <-> vehicle.cellId
  const cellsOfVehicle = new Map<string, string[]>();
  for (const c of state.cells) {
    if (c.vehicleId !== null) cellsOfVehicle.set(c.vehicleId, [...(cellsOfVehicle.get(c.vehicleId) ?? []), c.id]);
    const owner = c.vehicleId !== null ? vehicles[c.vehicleId] : undefined;
    if (c.status === 'free') {
      if (c.vehicleId !== null) out.push(`celda ${c.id} libre pero con dueño ${c.vehicleId}`);
    } else if (c.status === 'reserved') {
      if (!owner) out.push(`celda ${c.id} reservada sin vehículo válido`);
      else {
        if (owner.cellId !== c.id) out.push(`celda ${c.id} reservada a ${owner.id} pero vehículo.cellId=${owner.cellId}`);
        if (owner.stage !== 'in_lane' && owner.stage !== 'entering') out.push(`celda ${c.id} reservada a ${owner.id} en etapa ${owner.stage}`);
      }
    } else if (c.status === 'occupied' && c.vehicleId !== null) {
      if (!owner) out.push(`celda ${c.id} ocupada con dueño inexistente ${c.vehicleId}`);
      else {
        if (owner.cellId !== c.id) out.push(`celda ${c.id} ocupada por ${owner.id} pero vehículo.cellId=${owner.cellId}`);
        if (owner.stage !== 'parked') out.push(`celda ${c.id} ocupada por ${owner.id} en etapa ${owner.stage}`);
      }
    }
  }
  for (const [vid, ids] of cellsOfVehicle) {
    if (ids.length > 1) out.push(`vehículo ${vid} con ${ids.length} celdas: ${ids.join(',')}`);
  }

  // Vehículos: su celda debe apuntar de vuelta; una celda, un solo dueño
  const vehiclesOfCell = new Map<string, string[]>();
  for (const v of Object.values(vehicles)) {
    if (v.cellId !== null) {
      vehiclesOfCell.set(v.cellId, [...(vehiclesOfCell.get(v.cellId) ?? []), v.id]);
      const c = state.cells.find((x) => x.id === v.cellId);
      if (!c) out.push(`vehículo ${v.id} apunta a celda inexistente ${v.cellId}`);
      else if (c.vehicleId !== v.id) out.push(`vehículo ${v.id} dice celda ${c.id} pero su dueño es ${c.vehicleId}`);
    }
    if (v.stage === 'parked' && v.cellId === null) out.push(`vehículo ${v.id} estacionado sin celda`);
    if (v.stage === 'exited' && v.cellId !== null) out.push(`vehículo ${v.id} salido conserva celda ${v.cellId}`);
  }
  for (const [cid, ids] of vehiclesOfCell) {
    if (ids.length > 1) out.push(`celda ${cid} con ${ids.length} dueños: ${ids.join(',')}`);
  }

  // Filas: vehículo outside/in_lane aparece exactamente una vez en SU cola; el resto en ninguna
  for (const a of ACCESSES) {
    for (const id of state.outside[a]) {
      const v = vehicles[id];
      if (!v) out.push(`fila exterior ${a} referencia vehículo inexistente ${id}`);
      else if (v.stage !== 'outside' || v.access !== a) out.push(`fila exterior ${a} contiene ${id} en etapa ${v.stage} acceso ${v.access}`);
    }
    for (const id of state.lane[a]) {
      const v = vehicles[id];
      if (!v) out.push(`pasarela ${a} referencia vehículo inexistente ${id}`);
      else if (v.stage !== 'in_lane' || v.access !== a) out.push(`pasarela ${a} contiene ${id} en etapa ${v.stage} acceso ${v.access}`);
    }
  }
  for (const v of Object.values(vehicles)) {
    const outCount = state.outside[v.access].filter((x) => x === v.id).length;
    const laneCount = state.lane[v.access].filter((x) => x === v.id).length;
    if (v.stage === 'outside') {
      if (outCount !== 1) out.push(`${v.id} outside aparece ${outCount} veces en su fila exterior`);
    } else if (outCount !== 0) out.push(`${v.id} en fila exterior con etapa ${v.stage}`);
    if (v.stage === 'in_lane') {
      if (laneCount !== 1) out.push(`${v.id} in_lane aparece ${laneCount} veces en la pasarela`);
    } else if (laneCount !== 0) out.push(`${v.id} en pasarela con etapa ${v.stage}`);
  }

  // Servicios: referencias válidas
  for (const sv of services) {
    if (!vehicles[sv.vehicleId]) out.push(`servicio ${sv.id} referencia vehículo inexistente ${sv.vehicleId}`);
  }

  // Fichos únicos
  const tickets = services.map((s) => s.ticketCode).filter((t): t is string => t !== null);
  const dup = tickets.filter((t, i) => tickets.indexOf(t) !== i);
  if (dup.length) out.push(`fichos duplicados: ${[...new Set(dup)].join(',')}`);

  // Valets: <=1 servicio activo; disponible <=> sin servicio activo
  for (const val of state.valets) {
    const active = services.filter((s) => s.valetId === val.id && ACTIVE_SERVICE.includes(s.stage));
    if (active.length > 1) out.push(`${val.id} con ${active.length} servicios activos`);
    if (val.status === 'available' && active.length > 0) out.push(`${val.id} disponible pero con servicio activo`);
    if (val.status !== 'available' && active.length !== 1) out.push(`${val.id} ${val.status} sin exactamente 1 servicio activo (hay ${active.length})`);
    if (val.status === 'held_for_payment' && active[0]?.stage !== 'payment_pending') out.push(`${val.id} held_for_payment sin servicio payment_pending`);
    if (val.status === 'in_service' && active[0]?.stage === 'payment_pending') out.push(`${val.id} in_service con servicio payment_pending`);
  }

  return out;
}
