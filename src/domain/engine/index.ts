// parKING — motor de filas, celdas y asignación justa (propiedad: engine-haiku).
// Reducers puros e inmutables. Determinista: sin Date.now(), sin Math.random().
// Error → mismo state, events vacíos y mensaje en español.
import { ACCESSES, ACCESS_NAME } from '../../contracts/types';
import type { AccessId, Cell, Command, Result, SimConfig, SimEvent, SimState, Valet, Vehicle } from '../../contracts/types';
import { addEvent, fail, fmtMin, nextId } from '../../contracts/util';
import { demandingVehicles, enteringWaiting, nextAccessToServe } from './selectors';

export { getEta, cellCounts, laneView, nextAccessToServe, POLICY_TEXT } from './selectors';

// ---------- Utilidades internas ----------
type Step = { state: SimState; events: SimEvent[] };
type Ev = Omit<SimEvent, 'seq' | 'at'>;
type Cmd<T extends Command['type']> = Extract<Command, { type: T }>;

const start = (state: SimState): Step => ({ state, events: [] });
const ok = (step: Step): Result => ({ state: step.state, events: step.events });

function emit(step: Step, ev: Ev): Step {
  const [state, event] = addEvent(step.state, ev);
  return { state, events: [...step.events, event] };
}

const isAccess = (value: string): value is AccessId => (ACCESSES as string[]).includes(value);
const vehicleOf = (state: SimState, id: string): Vehicle | undefined => state.vehicles[id] as Vehicle | undefined;
const cellOf = (state: SimState, id: string | null): Cell | undefined =>
  id === null ? undefined : state.cells.find(c => c.id === id);
const ownsCell = (cell: Cell | undefined, vehicleId: string): cell is Cell =>
  cell !== undefined && cell.status === 'reserved' && cell.vehicleId === vehicleId;

const putVehicle = (state: SimState, v: Vehicle): SimState => ({ ...state, vehicles: { ...state.vehicles, [v.id]: v } });
const putCell = (state: SimState, cell: Cell): SimState => ({
  ...state,
  cells: state.cells.map(c => (c.id === cell.id ? cell : c)),
});
const logRelease = (state: SimState): SimState => ({ ...state, releaseLog: [...state.releaseLog, state.now] });

/** Reserva una celda libre para un vehículo: celda reserved, dueño, lastServed, assignLog. */
function assignCell(state: SimState, cell: Cell, v: Vehicle, access: AccessId, notice: string): SimState {
  let next = putCell(state, { ...cell, status: 'reserved', vehicleId: v.id });
  next = putVehicle(next, { ...v, cellId: cell.id, notice });
  return {
    ...next,
    lastServed: access,
    assignLog: [...next.assignLog, { at: next.now, access, vehicleId: v.id, cellId: cell.id }],
  };
}

// ---------- Estado inicial ----------
export function createInitialState(config: SimConfig): SimState {
  const cells: Cell[] = config.cells.map((c): Cell => ({
    id: c.id,
    zone: c.zone,
    route: c.route,
    status: c.initiallyOccupied ? 'occupied' : 'free',
    vehicleId: null,
  }));
  const valets: Valet[] = [];
  for (const access of ACCESSES) {
    for (let i = 1; i <= config.valetsPerAccess; i++) {
      valets.push({
        id: `${access}-V${i}`, name: `Valet ${access} ${i}`, access,
        status: 'available', serviceId: null, holdExpiresAt: null, earnings: 0,
      });
    }
  }
  return {
    now: 0,
    seq: 0,
    config,
    cells,
    vehicles: {},
    outside: { LV: [], RG: [] },
    lane: { LV: [], RG: [] },
    lastServed: null,
    releaseLog: [],
    assignLog: [],
    valets,
    services: {},
    office: [],
    log: [],
  };
}

// ---------- Reducer del motor ----------
export function engineReduce(state: SimState, cmd: Command): Result {
  switch (cmd.type) {
    case 'arrive': return arrive(state, cmd);
    case 'gateAdmit': return gateAdmit(state, cmd.access);
    case 'park': return park(state, cmd.vehicleId);
    case 'leave': return leave(state, cmd.vehicleId);
    case 'requestExitWithoutParking': return requestExit(state, cmd.vehicleId);
    case 'completeExit': return completeExit(state, cmd.vehicleId);
    case 'reportCellOccupied': return reportCellOccupied(state, cmd.vehicleId);
    case 'releaseCell': return releaseCell(state, cmd.cellId);
    case 'occupyCellExternally': return occupyCellExternally(state, cmd.cellId);
    case 'advanceTime': return advanceTime(state, cmd.minutes);
    default: return fail(state, `El motor no atiende el comando ${cmd.type}.`);
  }
}

function arrive(state: SimState, cmd: Cmd<'arrive'>): Result {
  const plate = cmd.plate.trim().toUpperCase();
  if (plate === '') return fail(state, 'Escribe la placa del vehículo.');
  if (!isAccess(cmd.access)) return fail(state, 'Acceso no válido.');
  const active = Object.values(state.vehicles).find(v => v.stage !== 'exited' && v.plate === plate);
  if (active) return fail(state, `La placa ${plate} ya está en el sistema.`);

  const [withSeq, id] = nextId(state, 'V');
  const vehicle: Vehicle = {
    id, plate, driver: cmd.driver.trim(), access: cmd.access, stage: 'outside', arrivedAt: withSeq.now,
    registeredAt: null, cellId: null, exitWithoutParking: false, valetServiceId: null, reassignments: 0, notice: null,
  };
  const next: SimState = {
    ...withSeq,
    vehicles: { ...withSeq.vehicles, [id]: vehicle },
    outside: { ...withSeq.outside, [cmd.access]: [...withSeq.outside[cmd.access], id] },
  };
  return ok(emit(start(next), {
    type: 'arrive', vehicleId: id, access: cmd.access,
    message: `${plate} llega a la fila de ${ACCESS_NAME[cmd.access]} (${cmd.access}) y debe registrarse en portería.`,
  }));
}

function gateAdmit(state: SimState, access: AccessId): Result {
  if (!isAccess(access)) return fail(state, 'Acceso no válido.');
  const frontId = state.lane[access][0];
  const front = frontId === undefined ? undefined : vehicleOf(state, frontId);
  if (!front) return fail(state, `No hay vehículo junto a la portería de ${ACCESS_NAME[access]}.`);

  const withoutFront: SimState = { ...state, lane: { ...state.lane, [access]: state.lane[access].slice(1) } };

  if (front.exitWithoutParking) {
    const next = putVehicle(withoutFront, { ...front, stage: 'exiting' });
    return ok(emit(start(next), {
      type: 'gate_exit', vehicleId: front.id, access,
      message: `${front.plate} cruza la portería hacia la salida sin estacionar.`,
    }));
  }

  const cell = cellOf(state, front.cellId);
  if (ownsCell(cell, front.id)) {
    const next = putVehicle(withoutFront, { ...front, stage: 'entering' });
    return ok(emit(start(next), {
      type: 'gate_cross', vehicleId: front.id, cellId: cell.id, access,
      message: `${front.plate} cruza la portería rumbo a la celda ${cell.id}.`,
    }));
  }

  return fail(state, 'El primero aún no tiene celda; nadie puede adelantarlo.');
}

function park(state: SimState, vehicleId: string): Result {
  const v = vehicleOf(state, vehicleId);
  if (!v) return fail(state, `No existe el vehículo ${vehicleId}.`);
  if (v.stage !== 'entering') return fail(state, `${v.plate} no está cruzando hacia su celda.`);
  const cell = cellOf(state, v.cellId);
  if (!ownsCell(cell, v.id)) return fail(state, `${v.plate} no tiene una celda reservada para estacionar.`);

  let next = putCell(state, { ...cell, status: 'occupied' });
  next = putVehicle(next, { ...v, stage: 'parked' });
  return ok(emit(start(next), {
    type: 'park', vehicleId: v.id, cellId: cell.id, access: v.access,
    message: `${v.plate} estacionado en la celda ${cell.id}.`,
  }));
}

function leave(state: SimState, vehicleId: string): Result {
  const v = vehicleOf(state, vehicleId);
  if (!v) return fail(state, `No existe el vehículo ${vehicleId}.`);
  if (v.stage !== 'parked') return fail(state, `${v.plate} no está estacionado.`);
  const cell = cellOf(state, v.cellId);
  if (!cell) return fail(state, `${v.plate} no tiene celda registrada.`);

  let next = putCell(state, { ...cell, status: 'free', vehicleId: null });
  next = logRelease(next);
  next = putVehicle(next, { ...v, stage: 'exited', cellId: null });
  return ok(emit(start(next), {
    type: 'leave', vehicleId: v.id, cellId: cell.id, access: v.access,
    message: `${v.plate} sale del parqueadero; la celda ${cell.id} queda libre.`,
  }));
}

function requestExit(state: SimState, vehicleId: string): Result {
  const v = vehicleOf(state, vehicleId);
  if (!v) return fail(state, `No existe el vehículo ${vehicleId}.`);
  if (v.stage !== 'in_lane') return fail(state, `${v.plate} debe estar en la pasarela para pedir salir sin estacionar.`);
  if (v.exitWithoutParking) return fail(state, `${v.plate} ya pidió salir sin estacionar.`);

  const cell = cellOf(state, v.cellId);
  let next: SimState = state;
  let message = `${v.plate} pide salir sin estacionar; conserva su lugar en la pasarela.`;
  if (ownsCell(cell, v.id)) {
    next = logRelease(putCell(next, { ...cell, status: 'free', vehicleId: null }));
    message = `${v.plate} pide salir sin estacionar; libera la celda ${cell.id} y conserva su lugar en la pasarela.`;
  }
  next = putVehicle(next, { ...v, exitWithoutParking: true, cellId: null });
  return ok(emit(start(next), { type: 'exit_request', vehicleId: v.id, access: v.access, message }));
}

function completeExit(state: SimState, vehicleId: string): Result {
  const v = vehicleOf(state, vehicleId);
  if (!v) return fail(state, `No existe el vehículo ${vehicleId}.`);
  if (v.stage !== 'exiting') return fail(state, `${v.plate} no está saliendo sin estacionar.`);

  const next = putVehicle(state, { ...v, stage: 'exited' });
  return ok(emit(start(next), {
    type: 'exit_done', vehicleId: v.id, access: v.access,
    message: `${v.plate} completa la salida sin estacionar.`,
  }));
}

function reportCellOccupied(state: SimState, vehicleId: string): Result {
  const v = vehicleOf(state, vehicleId);
  if (!v) return fail(state, `No existe el vehículo ${vehicleId}.`);
  const cell = cellOf(state, v.cellId);
  if ((v.stage !== 'in_lane' && v.stage !== 'entering') || !ownsCell(cell, v.id)) {
    return fail(state, `${v.plate} no tiene una celda reservada que reportar como ocupada.`);
  }

  // La celda queda ocupada por un vehículo no registrado; el vehículo pierde la reserva.
  let vehicle: Vehicle = { ...v, cellId: null, reassignments: v.reassignments + 1 };
  let next = putVehicle(putCell(state, { ...cell, status: 'occupied', vehicleId: null }), vehicle);
  let step = emit(start(next), {
    type: 'cell_occupied', vehicleId: v.id, cellId: cell.id, access: v.access,
    message: `La celda ${cell.id} apareció ocupada por un vehículo no registrado; ${v.plate} pierde su reserva.`,
  });

  // Intento inmediato con una celda libre, salvo que otro cruzado espere (tiene prioridad).
  const free = next.cells.find(c => c.status === 'free');
  const othersWaiting = enteringWaiting(next).some(x => x.id !== v.id);
  if (free && !othersWaiting) {
    next = assignCell(next, free, vehicle, v.access, `Reasignado de ${cell.id} a ${free.id}`);
    step = emit({ state: next, events: step.events }, {
      type: 'reassign', vehicleId: v.id, cellId: free.id, access: v.access,
      message: `Reasignado de ${cell.id} a ${free.id} para ${v.plate}.`,
    });
    return ok(step);
  }

  vehicle = { ...vehicle, notice: `Celda ${cell.id} ocupada. Esperando una celda libre con prioridad.` };
  next = putVehicle(next, vehicle);
  return ok({ state: next, events: step.events });
}

function releaseCell(state: SimState, cellId: string): Result {
  const cell = cellOf(state, cellId);
  if (!cell) return fail(state, `No existe la celda ${cellId}.`);
  if (cell.status !== 'occupied') return fail(state, `La celda ${cellId} no está ocupada.`);
  if (cell.vehicleId !== null) {
    const owner = vehicleOf(state, cell.vehicleId);
    return fail(state, `La celda ${cellId} es de ${owner ? owner.plate : cell.vehicleId}; solo se libera cuando ese vehículo sale.`);
  }

  const next = logRelease(putCell(state, { ...cell, status: 'free', vehicleId: null }));
  return ok(emit(start(next), {
    type: 'release', cellId, message: `Sale un vehículo no registrado de la celda ${cellId}; queda libre.`,
  }));
}

function occupyCellExternally(state: SimState, cellId: string): Result {
  const cell = cellOf(state, cellId);
  if (!cell) return fail(state, `No existe la celda ${cellId}.`);
  if (cell.status !== 'free') return fail(state, `La celda ${cellId} no está libre.`);

  const next = putCell(state, { ...cell, status: 'occupied', vehicleId: null });
  return ok(emit(start(next), {
    type: 'external_occupy', cellId, message: `Un vehículo no registrado ocupa la celda ${cellId}.`,
  }));
}

function advanceTime(state: SimState, minutes: number): Result {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return fail(state, 'Los minutos a avanzar deben ser un número mayor que cero.');
  }
  const next: SimState = { ...state, now: state.now + minutes };
  return ok(emit(start(next), {
    type: 'time', message: `Pasan ${minutes} min; hora simulada ${fmtMin(next.now)}.`,
  }));
}

// ---------- Settle: admisión y asignación (idempotente) ----------
function pickForFreeCell(state: SimState): { vehicle: Vehicle; access: AccessId } | null {
  const [priority] = enteringWaiting(state);
  if (priority) return { vehicle: priority, access: priority.access };
  const access = nextAccessToServe(state);
  if (!access) return null;
  const [head] = demandingVehicles(state, access);
  return head ? { vehicle: head, access } : null;
}

/** Admite y asigna. Si nada cambia devuelve el MISMO objeto state. */
export function settle(state: SimState): Result {
  let step = start(state);

  // (a) Admisión: fila exterior -> pasarela mientras haya cupo.
  for (const access of ACCESSES) {
    while (step.state.outside[access].length > 0 && step.state.lane[access].length < step.state.config.laneCapacity[access]) {
      const s = step.state;
      const v = vehicleOf(s, s.outside[access][0]);
      if (!v) break;
      const next: SimState = {
        ...s,
        outside: { ...s.outside, [access]: s.outside[access].slice(1) },
        lane: { ...s.lane, [access]: [...s.lane[access], v.id] },
        vehicles: { ...s.vehicles, [v.id]: { ...v, stage: 'in_lane', registeredAt: s.now } },
      };
      step = emit({ state: next, events: step.events }, {
        type: 'admit', vehicleId: v.id, access,
        message: `${v.plate} se registra y entra a la pasarela de ${ACCESS_NAME[access]}.`,
      });
    }
  }

  // (b) Asignación: cada celda libre, en orden de configuración.
  for (let i = 0; i < step.state.cells.length; i++) {
    const cell = step.state.cells[i];
    if (cell.status !== 'free') continue;
    const pick = pickForFreeCell(step.state);
    if (!pick) break;
    const next = assignCell(step.state, cell, pick.vehicle, pick.access, `Celda ${cell.id} reservada`);
    step = emit({ state: next, events: step.events }, {
      type: 'assign', vehicleId: pick.vehicle.id, cellId: cell.id, access: pick.access,
      message: `Celda ${cell.id} reservada para ${pick.vehicle.plate} (${pick.access}).`,
    });
  }

  return ok(step);
}
