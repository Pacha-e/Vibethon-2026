import { describe, expect, it } from 'vitest';
import { ACCESSES } from '../../contracts/types';
import type {
  AccessId, Cell, Command, Result, SimConfig, SimState, Valet, Vehicle,
} from '../../contracts/types';
import { valetReduce, valetSettle } from './logic';

const config: SimConfig = {
  fixtureName: 'test',
  isOfficial: false,
  laneCapacity: { LV: 4, RG: 6 },
  valetsPerAccess: 8,
  valetPrice: 8000,
  holdMinutes: 5,
  etaWindowMinutes: 30,
  etaMinSamples: 2,
  valetSuggestMinutes: 15,
  cells: [{ id: 'A-01', zone: 'A', route: 'Recta' }],
};

const mkVehicle = (id: string, access: AccessId, stage: Vehicle['stage'], over: Partial<Vehicle> = {}): Vehicle => ({
  id,
  plate: `P-${id}`,
  driver: 'Conductor',
  access,
  stage,
  arrivedAt: 0,
  registeredAt: stage === 'outside' ? null : 0,
  cellId: null,
  exitWithoutParking: false,
  valetServiceId: null,
  reassignments: 0,
  notice: null,
  ...over,
});

const mkValet = (access: AccessId, i: number): Valet => ({
  id: `${access}-V${i}`,
  name: `Valet ${access} ${i}`,
  access,
  status: 'available',
  serviceId: null,
  holdExpiresAt: null,
  earnings: 0,
});

function makeState(over: Partial<SimState> = {}): SimState {
  const valets: Valet[] = ACCESSES.flatMap((access) => [1, 2, 3, 4, 5, 6, 7, 8].map((i) => mkValet(access, i)));
  const cells: Cell[] = [{ id: 'A-01', zone: 'A', route: 'Recta', status: 'free', vehicleId: null }];
  return {
    now: 10,
    seq: 0,
    config,
    cells,
    vehicles: {
      V1: mkVehicle('V1', 'LV', 'in_lane'),
      V2: mkVehicle('V2', 'RG', 'in_lane'),
      V3: mkVehicle('V3', 'LV', 'outside'),
    },
    outside: { LV: ['V3'], RG: [] },
    lane: { LV: ['V1'], RG: ['V2'] },
    lastServed: null,
    releaseLog: [],
    assignLog: [],
    valets,
    services: {},
    office: [],
    log: [],
    ...over,
  };
}

function run(state: SimState, cmd: Command): Result {
  return valetReduce(state, cmd);
}

/** Hold + pago aprobado para V1 con LV-V1. Devuelve el estado y el id del servicio. */
function confirmedState(): { state: SimState; serviceId: string } {
  const r1 = run(makeState(), { type: 'valetHold', vehicleId: 'V1', valetId: 'LV-V1' });
  const r2 = run(r1.state, { type: 'valetPay', serviceId: 'S1', approved: true });
  expect(r2.error).toBeUndefined();
  return { state: r2.state, serviceId: 'S1' };
}

describe('valetHold', () => {
  it('rechaza vehículo fuera de la pasarela y no cambia el estado', () => {
    const s = makeState();
    const r = run(s, { type: 'valetHold', vehicleId: 'V3', valetId: 'LV-V1' });
    expect(r.error).toBe('Solo puedes contratar valet dentro de la pasarela');
    expect(r.state).toBe(s);
    expect(r.events).toEqual([]);
  });

  it('crea servicio payment_pending con bloqueo y vincula vehículo y valet', () => {
    const s = makeState();
    const r = run(s, { type: 'valetHold', vehicleId: 'V1', valetId: 'LV-V1' });
    expect(r.error).toBeUndefined();
    const svc = r.state.services.S1;
    expect(svc.stage).toBe('payment_pending');
    expect(svc.price).toBe(8000);
    expect(svc.ticketCode).toBeNull();
    expect(r.state.valets.find((v) => v.id === 'LV-V1')).toMatchObject({
      status: 'held_for_payment', serviceId: 'S1', holdExpiresAt: 15,
    });
    expect(r.state.vehicles.V1.valetServiceId).toBe('S1');
    expect(r.state.lane).toBe(s.lane);
    expect(r.events).toHaveLength(1);
    expect(r.events[0].type).toBe('valet_hold');
  });

  it('rechaza valet de otro acceso', () => {
    const s = makeState();
    const r = run(s, { type: 'valetHold', vehicleId: 'V1', valetId: 'RG-V1' });
    expect(r.error).toBe('Valet RG 1 solo atiende el acceso Regional');
    expect(r.state).toBe(s);
  });

  it('rechaza un segundo servicio activo para el mismo vehículo', () => {
    const r1 = run(makeState(), { type: 'valetHold', vehicleId: 'V1', valetId: 'LV-V1' });
    const r2 = run(r1.state, { type: 'valetHold', vehicleId: 'V1', valetId: 'LV-V2' });
    expect(r2.error).toBe('Ya tienes un servicio de valet activo');
    expect(r2.state).toBe(r1.state);
  });

  it('rechaza valet ocupado', () => {
    const r1 = run(makeState(), { type: 'valetHold', vehicleId: 'V1', valetId: 'LV-V1' });
    const s = { ...r1.state, vehicles: { ...r1.state.vehicles, V3: mkVehicle('V3', 'LV', 'in_lane') } };
    const r2 = run(s, { type: 'valetHold', vehicleId: 'V3', valetId: 'LV-V1' });
    expect(r2.error).toBe('Valet LV 1 no está disponible');
  });

  it('rechaza vehículo que sale sin estacionar', () => {
    const s = makeState({
      vehicles: { V1: mkVehicle('V1', 'LV', 'in_lane', { exitWithoutParking: true }) },
    });
    const r = run(s, { type: 'valetHold', vehicleId: 'V1', valetId: 'LV-V1' });
    expect(r.error).toBe('Este vehículo sale sin estacionar; no puede contratar valet');
  });

  it('no muta el estado de entrada', () => {
    const s = makeState();
    const before = JSON.parse(JSON.stringify(s));
    run(s, { type: 'valetHold', vehicleId: 'V1', valetId: 'LV-V1' });
    expect(s).toEqual(before);
  });
});

describe('valetPay', () => {
  it('aprobado: confirmed, valet en servicio, ingreso y lane intacto', () => {
    const r1 = run(makeState(), { type: 'valetHold', vehicleId: 'V1', valetId: 'LV-V1' });
    const r2 = run(r1.state, { type: 'valetPay', serviceId: 'S1', approved: true });
    expect(r2.error).toBeUndefined();
    expect(r2.state.services.S1.stage).toBe('confirmed');
    expect(r2.state.valets.find((v) => v.id === 'LV-V1')).toMatchObject({
      status: 'in_service', holdExpiresAt: null, earnings: 8000,
    });
    expect(r2.state.lane).toBe(r1.state.lane);
    expect(r2.state.outside).toBe(r1.state.outside);
  });

  it('rechazado: payment_rejected, valet liberado, conserva turno en lane', () => {
    const r1 = run(makeState(), { type: 'valetHold', vehicleId: 'V1', valetId: 'LV-V1' });
    const r2 = run(r1.state, { type: 'valetPay', serviceId: 'S1', approved: false });
    expect(r2.error).toBeUndefined();
    expect(r2.state.services.S1.stage).toBe('payment_rejected');
    expect(r2.state.valets.find((v) => v.id === 'LV-V1')).toMatchObject({
      status: 'available', serviceId: null, holdExpiresAt: null, earnings: 0,
    });
    expect(r2.state.vehicles.V1.valetServiceId).toBeNull();
    expect(r2.state.vehicles.V1.stage).toBe('in_lane');
    expect(r2.state.lane).toBe(r1.state.lane);
    expect(r2.state.outside).toBe(r1.state.outside);
    // Tras rechazo, el conductor puede volver a contratar.
    const r3 = run(r2.state, { type: 'valetHold', vehicleId: 'V1', valetId: 'LV-V2' });
    expect(r3.error).toBeUndefined();
  });

  it('rechaza pagar un servicio que no está pendiente', () => {
    const { state } = confirmedState();
    const r = run(state, { type: 'valetPay', serviceId: 'S1', approved: true });
    expect(r.error).toBe('El servicio no está esperando pago');
    expect(r.state).toBe(state);
  });
});

describe('valetSettle', () => {
  it('vence el bloqueo sin pago: payment_expired, valet libre, lane intacto', () => {
    const r1 = run(makeState(), { type: 'valetHold', vehicleId: 'V1', valetId: 'LV-V1' });
    const expiredNow = { ...r1.state, now: 15 };
    const r2 = valetSettle(expiredNow);
    expect(r2.state.services.S1.stage).toBe('payment_expired');
    expect(r2.state.valets.find((v) => v.id === 'LV-V1')).toMatchObject({ status: 'available', serviceId: null });
    expect(r2.state.vehicles.V1.valetServiceId).toBeNull();
    expect(r2.state.lane).toBe(expiredNow.lane);
    expect(r2.state.outside).toBe(expiredNow.outside);
  });

  it('no vence antes de holdExpiresAt', () => {
    const r1 = run(makeState(), { type: 'valetHold', vehicleId: 'V1', valetId: 'LV-V1' });
    const r2 = valetSettle({ ...r1.state, now: 14 });
    expect(r2.state.services.S1.stage).toBe('payment_pending');
  });

  it('es idempotente y devuelve el mismo objeto si nada cambia', () => {
    const s = makeState();
    const once = valetSettle(s);
    expect(once.state).toBe(s);
    expect(once.events).toEqual([]);
    const { state } = confirmedState();
    expect(valetSettle(state).state).toBe(state);
  });

  it('sincroniza car_handed a parked cuando el vehículo está estacionado', () => {
    const { state } = confirmedState();
    const handed = run(state, { type: 'valetHandover', serviceId: 'S1' });
    expect(handed.error).toBeUndefined();
    const parkedState: SimState = {
      ...handed.state,
      vehicles: { ...handed.state.vehicles, V1: { ...handed.state.vehicles.V1, stage: 'parked', cellId: 'A-01' } },
    };
    const synced = valetSettle(parkedState);
    expect(synced.state.services.S1).toMatchObject({ stage: 'parked', cellId: 'A-01' });
    const again = valetSettle(synced.state);
    expect(again.state).toBe(synced.state);
  });
});

describe('valetHandover', () => {
  it('emite ficho único con formato access-seq de 4 dígitos', () => {
    const { state } = confirmedState();
    const r = run(state, { type: 'valetHandover', serviceId: 'S1' });
    expect(r.error).toBeUndefined();
    const svc = r.state.services.S1;
    expect(svc.stage).toBe('car_handed');
    expect(svc.ticketCode).toMatch(/^LV-\d{4}$/);
    expect(r.state.vehicles.V1.stage).toBe('in_lane');
  });

  it('exige pago aprobado', () => {
    const r1 = run(makeState(), { type: 'valetHold', vehicleId: 'V1', valetId: 'LV-V1' });
    const r2 = run(r1.state, { type: 'valetHandover', serviceId: 'S1' });
    expect(r2.error).toBe('Solo puedes entregar el auto con el pago aprobado');
    expect(r2.state).toBe(r1.state);
  });
});

describe('valetDeposit y claimKeys', () => {
  it('flujo completo: estacionar, depositar llaves y reclamar con ficho', () => {
    const { state } = confirmedState();
    const handed = run(state, { type: 'valetHandover', serviceId: 'S1' });
    const ticket = handed.state.services.S1.ticketCode;
    expect(ticket).not.toBeNull();

    const early = run(handed.state, { type: 'valetDeposit', serviceId: 'S1' });
    expect(early.error).toBe('Las llaves solo se depositan cuando el auto está estacionado');

    const parkedState: SimState = {
      ...handed.state,
      vehicles: { ...handed.state.vehicles, V1: { ...handed.state.vehicles.V1, stage: 'parked', cellId: 'A-01' } },
    };
    const synced = valetSettle(parkedState).state;
    const dep = run(synced, { type: 'valetDeposit', serviceId: 'S1' });
    expect(dep.error).toBeUndefined();
    expect(dep.state.services.S1.stage).toBe('keys_deposited');
    expect(dep.state.valets.find((v) => v.id === 'LV-V1')).toMatchObject({ status: 'available', serviceId: null });
    expect(dep.state.office).toHaveLength(1);
    expect(dep.state.office[0]).toMatchObject({ kind: 'keys_received', ticketCode: ticket, plate: 'P-V1' });

    const claim = run(dep.state, { type: 'claimKeys', ticketCode: ticket ?? '' });
    expect(claim.error).toBeUndefined();
    expect(claim.state.services.S1.stage).toBe('keys_delivered');
    expect(claim.state.office).toHaveLength(2);
    expect(claim.state.office[1]).toMatchObject({ kind: 'keys_delivered', ticketCode: ticket });
    expect(claim.events[0].message).toContain('entregadas');

    const twice = run(claim.state, { type: 'claimKeys', ticketCode: ticket ?? '' });
    expect(twice.error).toBe('Las llaves aún no están en oficina');
    expect(twice.state).toBe(claim.state);
  });

  it('claimKeys rechaza ficho inexistente', () => {
    const { state } = confirmedState();
    const r = run(state, { type: 'claimKeys', ticketCode: 'LV-9999' });
    expect(r.error).toBe('Ficho inválido');
    expect(r.state).toBe(state);
  });

  it('claimKeys rechaza cuando las llaves aún no llegaron a oficina', () => {
    const { state } = confirmedState();
    const handed = run(state, { type: 'valetHandover', serviceId: 'S1' });
    const ticket = handed.state.services.S1.ticketCode ?? '';
    const r = run(handed.state, { type: 'claimKeys', ticketCode: ticket });
    expect(r.error).toBe('Las llaves aún no están en oficina');
  });
});
