import { describe, it, expect } from 'vitest';
import { PROVISIONAL_CONFIG } from '../src/fixtures/provisional';
import { bootState } from '../src/state/reducer';
import type { SimState } from '../src/contracts/types';
import { checkInvariants } from './invariants';

// Autoprueba del checker: cada corrupción manual debe ser detectada (si no, las invariantes no prueban nada).
const base = (): SimState => structuredClone(bootState(PROVISIONAL_CONFIG));

describe('checkInvariants detecta corrupciones', () => {
  it('estado base sin violaciones', () => {
    expect(checkInvariants(base())).toEqual([]);
  });

  it('pasarela LV con 5 vehículos (cap 4)', () => {
    const s = base();
    s.lane.LV = ['x1', 'x2', 'x3', 'x4', 'x5'];
    expect(checkInvariants(s).some((m) => m.includes('pasarela LV'))).toBe(true);
  });

  it('celda reservada con vehicle.cellId distinto', () => {
    const s = base();
    const c = s.cells[0];
    s.vehicles['V-fake'] = { id: 'V-fake', plate: 'F', driver: 'F', access: 'LV', stage: 'in_lane', arrivedAt: 0, registeredAt: 0, cellId: null, exitWithoutParking: false, valetServiceId: null, reassignments: 0, notice: null };
    c.status = 'reserved';
    c.vehicleId = 'V-fake';
    expect(checkInvariants(s).length).toBeGreaterThan(0);
  });

  it('dos vehículos apuntan a la misma celda', () => {
    const s = base();
    const c = s.cells[0];
    for (const id of ['VA', 'VB']) {
      s.vehicles[id] = { id, plate: id, driver: id, access: 'LV', stage: 'in_lane', arrivedAt: 0, registeredAt: 0, cellId: c.id, exitWithoutParking: false, valetServiceId: null, reassignments: 0, notice: null };
    }
    c.status = 'reserved';
    c.vehicleId = 'VA';
    expect(checkInvariants(s).some((m) => m.includes('dueños') || m.includes('dice celda'))).toBe(true);
  });

  it('valet disponible con servicio activo', () => {
    const s = base();
    s.vehicles.VZ = { id: 'VZ', plate: 'Z', driver: 'Z', access: 'LV', stage: 'in_lane', arrivedAt: 0, registeredAt: 0, cellId: null, exitWithoutParking: false, valetServiceId: 'S9', reassignments: 0, notice: null };
    s.services.S9 = { id: 'S9', valetId: 'LV-V1', vehicleId: 'VZ', access: 'LV', price: 1, createdAt: 0, stage: 'confirmed', ticketCode: 'LV-0001', cellId: null, history: [] };
    s.valets[0].status = 'available';
    s.valets[0].serviceId = 'S9';
    expect(checkInvariants(s).some((m) => m.includes('disponible'))).toBe(true);
  });

  it('fichos duplicados', () => {
    const s = base();
    for (const id of ['S1', 'S2']) {
      s.services[id] = { id, valetId: 'LV-V1', vehicleId: 'VX', access: 'LV', price: 1, createdAt: 0, stage: 'keys_delivered', ticketCode: 'LV-0007', cellId: null, history: [] };
    }
    expect(checkInvariants(s).some((m) => m.includes('fichos duplicados'))).toBe(true);
  });

  it('vehículo outside ausente de su fila', () => {
    const s = base();
    s.vehicles.VO = { id: 'VO', plate: 'O', driver: 'O', access: 'RG', stage: 'outside', arrivedAt: 0, registeredAt: null, cellId: null, exitWithoutParking: false, valetServiceId: null, reassignments: 0, notice: null };
    expect(checkInvariants(s).some((m) => m.includes('VO'))).toBe(true);
  });
});
