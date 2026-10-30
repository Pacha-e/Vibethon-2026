import { describe, it, expect } from 'vitest';
import { SCENARIOS, vid } from '../src/fixtures/scenarios';
import { PROVISIONAL_CONFIG } from '../src/fixtures/provisional';
import { bootState, rootReduce } from '../src/state/reducer';
import { getEta } from '../src/domain/engine';
import type { SimState, Vehicle } from '../src/contracts/types';
import { checkInvariants } from './invariants';

interface Replay { states: SimState[]; errors: (string | undefined)[]; violations: string[] }

// Reset (bootState) + comandos del escenario uno a uno; invariantes tras CADA paso.
function replay(id: number): Replay {
  const sc = SCENARIOS.find((x) => x.id === id);
  if (!sc) throw new Error(`escenario ${id} no existe`);
  if (sc.resolveError) throw new Error(`escenario ${id} no resuelve: ${sc.resolveError}`);
  const states: SimState[] = [];
  const errors: (string | undefined)[] = [];
  const violations: string[] = [];
  let s = bootState(PROVISIONAL_CONFIG);
  for (const v of checkInvariants(s)) violations.push(`boot: ${v}`);
  sc.commands.forEach((cmd, i) => {
    const r = rootReduce(s, cmd);
    s = r.state;
    states.push(s);
    errors.push(r.error);
    for (const v of checkInvariants(s)) violations.push(`paso ${i} (${cmd.type}): ${v}`);
  });
  return { states, errors, violations };
}

const last = (r: Replay): SimState => r.states[r.states.length - 1];
const byPlate = (s: SimState, plate: string): Vehicle => {
  const v = Object.values(s.vehicles).find((x) => x.plate === plate && x.stage !== 'exited');
  if (!v) throw new Error(`placa ${plate} no encontrada`);
  return v;
};
const plates = (s: SimState, ids: string[]) => ids.map((id) => s.vehicles[id].plate);
const freeCount = (s: SimState) => s.cells.filter((c) => c.status === 'free').length;
const scenarioExpected = (id: number) => SCENARIOS.find((x) => x.id === id)!.expected;

describe('invariantes base', () => {
  it('bootState cumple todas las invariantes', () => {
    expect(checkInvariants(bootState(PROVISIONAL_CONFIG))).toEqual([]);
  });
});

describe('escenarios oficiales 1-9 (fixture provisional)', () => {
  it('los 9 escenarios se resuelven sin error', () => {
    expect(SCENARIOS.map((x) => x.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const sc of SCENARIOS) expect(sc.resolveError, sc.title).toBeUndefined();
  });

  it('1 Pasarela llena: LV 4/4, LVA105 y LVA106 esperan antes del registro', () => {
    const r = replay(1);
    expect(r.violations).toEqual([]);
    expect(r.errors.filter((e) => e !== undefined)).toEqual([]);
    const s = last(r);
    expect(plates(s, s.lane.LV)).toEqual(['LVA101', 'LVA102', 'LVA103', 'LVA104']);
    expect(plates(s, s.outside.LV)).toEqual(['LVA105', 'LVA106']);
    expect(s.lane.RG).toEqual([]);
    expect(freeCount(s)).toBe(0);
  });

  it('2 Parqueadero lleno: nadie recibe celda, filas conservadas, ETA sin datos', () => {
    const r = replay(2);
    expect(r.violations).toEqual([]);
    const s = last(r);
    expect(freeCount(s)).toBe(0);
    expect(plates(s, s.lane.LV)).toEqual(['LVB201', 'LVB203']);
    expect(plates(s, s.lane.RG)).toEqual(['RGB202', 'RGB204']);
    const inLane = Object.values(s.vehicles).filter((v) => v.stage === 'in_lane');
    expect(inLane).toHaveLength(4);
    for (const v of inLane) {
      expect(v.cellId, v.plate).toBeNull();
      const eta = getEta(s, v.id);
      expect(eta.kind, v.plate).toBe('insufficient_data');
      expect(eta.minMinutes, v.plate).toBeUndefined();
    }
  });

  it('3 Liberación: 1.ª celda → LVC301 (FIFO LV), 2.ª → RGC303 (Round Robin)', () => {
    const r = replay(3);
    expect(r.violations).toEqual([]);
    // índices: 0 batch llenado, 1-3 llegadas, 4 avance, 5 liberación, 6 avance, 7 liberación
    const afterFirst = r.states[5];
    const afterSecond = r.states[7];
    const lv301 = byPlate(afterFirst, 'LVC301');
    expect(lv301.cellId).not.toBeNull();
    expect(byPlate(afterFirst, 'LVC302').cellId).toBeNull();
    expect(byPlate(afterFirst, 'RGC303').cellId).toBeNull();
    const cell = afterFirst.cells.find((c) => c.id === lv301.cellId)!;
    expect(cell.status).toBe('reserved');
    expect(cell.vehicleId).toBe(lv301.id);

    const rgc303 = byPlate(afterSecond, 'RGC303');
    expect(rgc303.cellId).not.toBeNull();
    expect(rgc303.cellId).not.toBe(lv301.cellId);
    expect(byPlate(afterSecond, 'LVC302').cellId).toBeNull();
  });

  it('4 Solicitudes simultáneas: una celda → solo LVD401; segundo hold de LV-V1 → «no disponible»', () => {
    const r = replay(4);
    expect(r.violations).toEqual([]);
    // índices: 0 batch llenado (dejando 1 libre), 1 batch llegadas, 2 batch holds
    const afterArrivals = r.states[1];
    expect(freeCount(afterArrivals)).toBe(0);
    expect(byPlate(afterArrivals, 'LVD401').cellId).not.toBeNull();
    expect(byPlate(afterArrivals, 'LVD403').cellId).toBeNull();
    expect(byPlate(afterArrivals, 'RGD402').cellId).toBeNull();

    expect(r.errors[2]).toMatch(/disponib/i);
    const s = last(r);
    const v1 = s.valets.find((x) => x.id === 'LV-V1')!;
    expect(v1.status).toBe('held_for_payment');
    expect(v1.serviceId).not.toBeNull();
    expect(s.services[v1.serviceId!].vehicleId).toBe(byPlate(s, 'LVD401').id);
    expect(byPlate(s, 'LVD403').valetServiceId).toBeNull();
  });

  it('5 Pago rechazado: LVE502 sigue posición 2; LV-V2 vuelve a disponible', () => {
    const r = replay(5);
    expect(r.violations).toEqual([]);
    expect(r.errors.filter((e) => e !== undefined)).toEqual([]);
    const s = last(r);
    const e502 = byPlate(s, 'LVE502');
    expect(s.lane.LV.indexOf(e502.id)).toBe(1);
    const services = Object.values(s.services).filter((x) => x.vehicleId === e502.id);
    expect(services).toHaveLength(1);
    expect(services[0].stage).toBe('payment_rejected');
    const v2 = s.valets.find((x) => x.id === 'LV-V2')!;
    expect(v2.status).toBe('available');
    expect(v2.serviceId).toBeNull();
  });

  it('6 Valets ocupados: 8 LV en servicio; LVF699 sin valet (error, estado intacto)', () => {
    const r = replay(6);
    expect(r.violations).toEqual([]);
    const failIdx = r.errors.length - 1; // último paso: valetHold de LVF699
    expect(r.errors.slice(0, failIdx).filter((e) => e !== undefined)).toEqual([]);
    expect(r.errors[failIdx]).toMatch(/valet|disponib/i);
    expect(r.states[failIdx]).toBe(r.states[failIdx - 1]);

    const s = last(r);
    const lvValets = s.valets.filter((v) => v.access === 'LV');
    expect(lvValets).toHaveLength(8);
    expect(lvValets.every((v) => v.status === 'in_service')).toBe(true);
    for (let i = 1; i <= 4; i++) expect(byPlate(s, `LVF6${String(i).padStart(2, '0')}`).stage).toBe('parked');
    const f699 = byPlate(s, 'LVF699');
    expect(f699.valetServiceId).toBeNull();
    expect(f699.stage).toBe('in_lane');
    expect(s.lane.LV).toContain(f699.id);
  });

  it('7 Salida sin estacionar: LVG702 conserva lugar, primero en portería; «dar paso» → exiting', () => {
    const r = replay(7);
    expect(r.violations).toEqual([]);
    const s = last(r);
    const g702 = byPlate(s, 'LVG702');
    expect(g702.exitWithoutParking).toBe(true);
    expect(g702.cellId).toBeNull();
    expect(g702.stage).toBe('in_lane');
    expect(s.lane.LV[0]).toBe(g702.id);
    expect(byPlate(s, 'LVG701').stage).toBe('entering');
    expect(byPlate(s, 'LVG701').cellId).not.toBeNull();

    const next = rootReduce(s, { type: 'gateAdmit', access: 'LV' });
    expect(next.error).toBeUndefined();
    expect(checkInvariants(next.state)).toEqual([]);
    expect(next.state.vehicles[g702.id].stage).toBe('exiting');
    expect(next.state.lane.LV).not.toContain(g702.id);
  });

  it('8 Celda asignada ocupada: marcada ocupada (no registrado), reasignación con aviso', () => {
    const r = replay(8);
    expect(r.violations).toEqual([]);
    expect(r.errors.filter((e) => e !== undefined)).toEqual([]);
    const c0 = byPlate(r.states[0], 'LVH801').cellId;
    expect(c0).not.toBeNull();

    const s = last(r);
    const v = byPlate(s, 'LVH801');
    const oldCell = s.cells.find((c) => c.id === c0)!;
    expect(oldCell.status).toBe('occupied');
    expect(oldCell.vehicleId).toBeNull();
    expect(v.cellId).not.toBeNull();
    expect(v.cellId).not.toBe(c0);
    expect(v.reassignments).toBe(1);
    expect(v.notice).toBeTruthy();
    expect(v.stage).toBe('in_lane');
    expect(scenarioExpected(8)).toContain(v.cellId as string);
  });

  it('9 Reclamación de llaves: depósito → LV-V3 disponible; ficho válido entrega, inválido rechazado', () => {
    const r = replay(9);
    expect(r.violations).toEqual([]);
    expect(r.errors.filter((e) => e !== undefined)).toEqual([]);
    const s = last(r);
    const v = byPlate(s, 'LVK901');
    const sv = Object.values(s.services).find((x) => x.vehicleId === v.id)!;
    expect(sv.stage).toBe('keys_deposited');
    expect(sv.ticketCode).toMatch(/^LV-/);
    expect(scenarioExpected(9)).toContain(sv.ticketCode!);

    const valet = s.valets.find((x) => x.id === 'LV-V3')!;
    expect(valet.status).toBe('available');
    expect(valet.serviceId).toBeNull();
    expect(s.office.some((o) => o.kind === 'keys_received' && o.ticketCode === sv.ticketCode && o.plate === 'LVK901')).toBe(true);

    const bad = rootReduce(s, { type: 'claimKeys', ticketCode: 'XX-0000' });
    expect(bad.error).toBeTruthy();
    expect(bad.state).toBe(s);

    const ok = rootReduce(s, { type: 'claimKeys', ticketCode: sv.ticketCode! });
    expect(ok.error).toBeUndefined();
    expect(checkInvariants(ok.state)).toEqual([]);
    expect(ok.state.services[sv.id].stage).toBe('keys_delivered');
    expect(ok.state.office.some((o) => o.kind === 'keys_delivered' && o.ticketCode === sv.ticketCode)).toBe(true);
  });
});
