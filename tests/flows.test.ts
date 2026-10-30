import { describe, it, expect } from 'vitest';
import { PROVISIONAL_CONFIG } from '../src/fixtures/provisional';
import { vid } from '../src/fixtures/scenarios';
import { bootState, rootReduce } from '../src/state/reducer';
import type { Command, SimState } from '../src/contracts/types';
import { checkInvariants } from './invariants';

// Aplica un comando exigiendo éxito e invariantes limpias tras él.
function step(s: SimState, cmd: Command): SimState {
  const r = rootReduce(s, cmd);
  expect(r.error, `${cmd.type} debería funcionar`).toBeUndefined();
  expect(checkInvariants(r.state), `invariantes tras ${cmd.type}`).toEqual([]);
  return r.state;
}

const arrive = (plate: string, driver: string): Command => ({ type: 'arrive', plate, access: 'LV', driver });

describe('flujo conductor', () => {
  it('arrive → asignación → gateAdmit → park → leave', () => {
    let s = bootState(PROVISIONAL_CONFIG);
    s = step(s, arrive('CND001', 'Conductor'));
    const id = vid(s, 'CND001');
    const cellId = s.vehicles[id].cellId;
    expect(s.vehicles[id].stage).toBe('in_lane');
    expect(cellId).not.toBeNull();
    expect(s.cells.find((c) => c.id === cellId)!.status).toBe('reserved');
    expect(s.assignLog.some((a) => a.vehicleId === id && a.cellId === cellId)).toBe(true);

    s = step(s, { type: 'gateAdmit', access: 'LV' });
    expect(s.vehicles[id].stage).toBe('entering');
    expect(s.vehicles[id].cellId).toBe(cellId);

    s = step(s, { type: 'park', vehicleId: id });
    expect(s.vehicles[id].stage).toBe('parked');
    expect(s.cells.find((c) => c.id === cellId)!.status).toBe('occupied');

    const releasesBefore = s.releaseLog.length;
    s = step(s, { type: 'leave', vehicleId: id });
    expect(s.vehicles[id].stage).toBe('exited');
    expect(s.vehicles[id].cellId).toBeNull();
    const cell = s.cells.find((c) => c.id === cellId)!;
    expect(cell.status).toBe('free');
    expect(cell.vehicleId).toBeNull();
    expect(s.releaseLog.length).toBe(releasesBefore + 1);
  });
});

describe('flujo valet', () => {
  it('hold → pay → handover → gateAdmit → park → deposit → claim', () => {
    let s = bootState(PROVISIONAL_CONFIG);
    s = step(s, arrive('VAL001', 'Valet'));
    const id = vid(s, 'VAL001');

    s = step(s, { type: 'valetHold', vehicleId: id, valetId: 'LV-V1' });
    let valet = s.valets.find((v) => v.id === 'LV-V1')!;
    expect(valet.status).toBe('held_for_payment');
    const serviceId = valet.serviceId!;
    expect(serviceId).toBeTruthy();
    let sv = s.services[serviceId];
    expect(sv.stage).toBe('payment_pending');
    expect(sv.vehicleId).toBe(id);
    expect(sv.price).toBe(PROVISIONAL_CONFIG.valetPrice);

    s = step(s, { type: 'valetPay', serviceId, approved: true });
    sv = s.services[serviceId];
    expect(sv.stage).toBe('confirmed');
    valet = s.valets.find((v) => v.id === 'LV-V1')!;
    expect(valet.status).toBe('in_service');
    expect(valet.earnings).toBe(PROVISIONAL_CONFIG.valetPrice);

    s = step(s, { type: 'valetHandover', serviceId });
    sv = s.services[serviceId];
    expect(sv.stage).toBe('car_handed');
    expect(sv.ticketCode).toMatch(/^LV-/);
    const ticket = sv.ticketCode!;

    s = step(s, { type: 'gateAdmit', access: 'LV' });
    expect(s.vehicles[id].stage).toBe('entering');

    s = step(s, { type: 'park', vehicleId: id });
    expect(s.vehicles[id].stage).toBe('parked');
    sv = s.services[serviceId];
    expect(sv.stage).toBe('parked');
    expect(sv.cellId).toBe(s.vehicles[id].cellId);

    s = step(s, { type: 'valetDeposit', serviceId });
    expect(s.services[serviceId].stage).toBe('keys_deposited');
    valet = s.valets.find((v) => v.id === 'LV-V1')!;
    expect(valet.status).toBe('available');
    expect(valet.serviceId).toBeNull();
    expect(s.office.some((o) => o.kind === 'keys_received' && o.ticketCode === ticket && o.serviceId === serviceId)).toBe(true);

    s = step(s, { type: 'claimKeys', ticketCode: ticket });
    expect(s.services[serviceId].stage).toBe('keys_delivered');
    expect(s.office.some((o) => o.kind === 'keys_delivered' && o.ticketCode === ticket)).toBe(true);
  });
});

describe('batch', () => {
  it('batch: subcomandos atómicos, rechazados sin efecto', () => {
    let s = bootState(PROVISIONAL_CONFIG);
    s = step(s, arrive('BAT001', 'Conductor A'));
    s = step(s, arrive('BAT002', 'Conductor B'));
    const a = vid(s, 'BAT001');
    const b = vid(s, 'BAT002');
    const servicesBefore = Object.keys(s.services).length;
    // dos holds con el mismo valet: el primero aplica, el segundo se rechaza
    const r = rootReduce(s, {
      type: 'batch',
      commands: [
        { type: 'valetHold', vehicleId: a, valetId: 'LV-V1' },
        { type: 'valetHold', vehicleId: b, valetId: 'LV-V1' },
      ],
    });
    expect(r.error).toMatch(/disponib/i);

    const va = r.state.vehicles[a];
    expect(va.valetServiceId).toBeTruthy();
    const valet = r.state.valets.find((v) => v.id === 'LV-V1')!;
    expect(valet.status).toBe('held_for_payment');
    expect(valet.serviceId).toBe(va.valetServiceId);
    expect(r.state.services[va.valetServiceId!].vehicleId).toBe(a);

    expect(r.state.vehicles[b].valetServiceId).toBeNull();
    expect(Object.keys(r.state.services).length - servicesBefore).toBe(1);
    expect(checkInvariants(r.state)).toEqual([]);
  });
});

describe('vencimiento de hold', () => {
  it('advanceTime > holdMinutes: payment_expired, valet disponible, turno conservado', () => {
    let s = bootState(PROVISIONAL_CONFIG);
    s = step(s, arrive('EXP001', 'Conductor A'));
    s = step(s, arrive('EXP002', 'Conductor B'));
    const a = vid(s, 'EXP001');
    const b = vid(s, 'EXP002');
    const cellA = s.vehicles[a].cellId;

    s = step(s, { type: 'valetHold', vehicleId: a, valetId: 'LV-V1' });
    const serviceId = s.valets.find((v) => v.id === 'LV-V1')!.serviceId!;
    expect(serviceId).toBeTruthy();

    const t0 = s.now;
    const minutes = PROVISIONAL_CONFIG.holdMinutes + 1;
    s = step(s, { type: 'advanceTime', minutes });
    expect(s.now).toBe(t0 + minutes);

    expect(s.services[serviceId].stage).toBe('payment_expired');
    const valet = s.valets.find((v) => v.id === 'LV-V1')!;
    expect(valet.status).toBe('available');
    expect(valet.serviceId).toBeNull();

    expect(s.vehicles[a].stage).toBe('in_lane');
    expect(s.vehicles[a].cellId).toBe(cellA);
    expect(s.lane.LV.indexOf(a)).toBe(0);
    expect(s.lane.LV.indexOf(b)).toBe(1);

    const late = rootReduce(s, { type: 'valetPay', serviceId, approved: true });
    expect(late.error).toBeTruthy();
    expect(late.state).toBe(s);
  });
});
