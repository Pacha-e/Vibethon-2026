// parKING — pruebas del motor (engine-haiku). Deterministas: solo tiempo simulado.
import { describe, expect, it } from 'vitest';
import type { AccessId, CellSeed, Command, Result, SimConfig, SimState } from '../../contracts/types';
import {
  cellCounts, createInitialState, engineReduce, getEta, laneView, nextAccessToServe, POLICY_TEXT, settle,
} from './index';

// ---------- Fixtures y helpers ----------
function cellSeeds(free: number, occupied = 0): CellSeed[] {
  const seeds: CellSeed[] = [];
  for (let i = 1; i <= free + occupied; i++) {
    seeds.push({ id: `C${i}`, zone: i % 2 ? 'A' : 'B', route: `Ruta ${i}`, initiallyOccupied: i > free });
  }
  return seeds;
}

function cfg(seeds: CellSeed[]): SimConfig {
  return {
    fixtureName: 'Prueba', isOfficial: false, laneCapacity: { LV: 4, RG: 6 }, valetsPerAccess: 8,
    valetPrice: 8000, holdMinutes: 2, etaWindowMinutes: 30, etaMinSamples: 2, valetSuggestMinutes: 15,
    cells: seeds,
  };
}

const CONFIG = cfg(cellSeeds(4, 1)); // C1..C4 libres, C5 ocupada sin dueño

function must(r: Result): SimState {
  if (r.error !== undefined) throw new Error(r.error);
  return r.state;
}

/** Comando + settle, como hace el root. */
function run(state: SimState, cmd: Command): SimState {
  return settle(must(engineReduce(state, cmd))).state;
}

function arrive(state: SimState, plate: string, access: AccessId = 'LV'): SimState {
  return run(state, { type: 'arrive', plate, driver: `Conductor ${plate}`, access });
}

function idOf(state: SimState, plate: string): string {
  const v = Object.values(state.vehicles).find(x => x.plate === plate);
  if (!v) throw new Error(`Sin vehículo ${plate}`);
  return v.id;
}

function cellOf(state: SimState, id: string) {
  const c = state.cells.find(x => x.id === id);
  if (!c) throw new Error(`Sin celda ${id}`);
  return c;
}

/** Cruza la portería, estaciona y sale: libera la celda y registra la liberación. */
function cycle(state: SimState, plate: string, access: AccessId = 'LV'): SimState {
  const id = idOf(state, plate);
  let s = run(state, { type: 'gateAdmit', access });
  s = run(s, { type: 'park', vehicleId: id });
  return run(s, { type: 'leave', vehicleId: id });
}

// ---------- Estado inicial ----------
describe('createInitialState', () => {
  it('celdas desde config, valets LV/RG y reloj en 0', () => {
    const s = createInitialState(CONFIG);
    expect(s.now).toBe(0);
    expect(s.seq).toBe(0);
    expect(cellCounts(s)).toEqual({ free: 4, reserved: 0, occupied: 1 });
    expect(s.cells.find(c => c.id === 'C5')).toMatchObject({ status: 'occupied', vehicleId: null });
    const ids = s.valets.map(v => v.id);
    expect(ids).toEqual([
      ...Array.from({ length: 8 }, (_, i) => `LV-V${i + 1}`),
      ...Array.from({ length: 8 }, (_, i) => `RG-V${i + 1}`),
    ]);
    expect(s.valets[0].name).toBe('Valet LV 1');
    expect(s.valets.every(v => v.status === 'available')).toBe(true);
    expect(s.log).toEqual([]);
  });
});

// ---------- arrive ----------
describe('arrive', () => {
  it('crea vehículo V{seq} fuera de la fila con placa normalizada', () => {
    const r = engineReduce(createInitialState(CONFIG), { type: 'arrive', plate: ' abc123 ', driver: 'Ana', access: 'LV' });
    expect(r.error).toBeUndefined();
    expect(r.state.vehicles.V1).toMatchObject({ id: 'V1', plate: 'ABC123', stage: 'outside', access: 'LV', cellId: null });
    expect(r.state.outside.LV).toEqual(['V1']);
    expect(r.state.seq).toBe(2); // 1 para el id V1 y 1 para el evento
    expect(r.events[0].type).toBe('arrive');
    expect(r.events[0].message).toContain('ABC123');
  });

  it('rechaza placa activa repetida sin cambiar el estado', () => {
    const s = arrive(createInitialState(CONFIG), 'ABC123');
    const r = engineReduce(s, { type: 'arrive', plate: 'abc123', driver: 'x', access: 'RG' });
    expect(r.error).toMatch(/ya está en el sistema/);
    expect(r.state).toBe(s);
    expect(r.events).toEqual([]);
  });

  it('rechaza placa vacía y acceso inválido', () => {
    const s = createInitialState(CONFIG);
    expect(engineReduce(s, { type: 'arrive', plate: '  ', driver: 'x', access: 'LV' }).state).toBe(s);
    const bad = engineReduce(s, { type: 'arrive', plate: 'ZZZ', driver: 'x', access: 'XX' as AccessId });
    expect(bad.error).toBeDefined();
    expect(bad.state).toBe(s);
  });
});

// ---------- Admisión, capacidad, FIFO, RR ----------
describe('pasarela y asignación', () => {
  it('capacidad 4 LV / 6 RG nunca se supera', () => {
    let s = createInitialState(cfg(cellSeeds(12)));
    for (let i = 0; i < 10; i++) {
      s = arrive(s, `L${i}`, 'LV');
      s = arrive(s, `R${i}`, 'RG');
      expect(s.lane.LV.length).toBeLessThanOrEqual(4);
      expect(s.lane.RG.length).toBeLessThanOrEqual(6);
    }
    expect(s.lane.LV.length).toBe(4);
    expect(s.lane.RG.length).toBe(6);
    expect(s.outside.LV.length).toBe(6);
    expect(s.outside.RG.length).toBe(4);
    expect(laneView(s, 'LV')).toMatchObject({ capacity: 4 });
    expect(laneView(s, 'LV').outside.length).toBe(6);
  });

  it('FIFO: el primero en registrarse recibe antes la celda', () => {
    let s = createInitialState(CONFIG);
    s = arrive(s, 'P1');
    s = arrive(s, 'P2');
    s = arrive(s, 'P3');
    expect(s.lane.LV).toEqual([idOf(s, 'P1'), idOf(s, 'P2'), idOf(s, 'P3')]);
    expect(s.assignLog.map(a => a.vehicleId)).toEqual([idOf(s, 'P1'), idOf(s, 'P2'), idOf(s, 'P3')]);
    expect(s.assignLog.map(a => a.cellId)).toEqual(['C1', 'C2', 'C3']);
  });

  it('Round Robin alterna LV y RG cuando ambos tienen demanda', () => {
    let s = createInitialState(CONFIG);
    s = must(engineReduce(s, { type: 'arrive', plate: 'L1', driver: 'a', access: 'LV' }));
    s = must(engineReduce(s, { type: 'arrive', plate: 'L2', driver: 'b', access: 'LV' }));
    s = must(engineReduce(s, { type: 'arrive', plate: 'R1', driver: 'c', access: 'RG' }));
    s = must(engineReduce(s, { type: 'arrive', plate: 'R2', driver: 'd', access: 'RG' }));
    s = settle(s).state;
    expect(s.assignLog.map(a => a.access)).toEqual(['LV', 'RG', 'LV', 'RG']);
    expect(s.assignLog.map(a => a.vehicleId)).toEqual([idOf(s, 'L1'), idOf(s, 'R1'), idOf(s, 'L2'), idOf(s, 'R2')]);
    expect(s.lastServed).toBe('RG');
  });

  it('sin doble reserva: cada celda tiene como máximo un dueño y coincide con el vehículo', () => {
    let s = createInitialState(CONFIG);
    s = must(engineReduce(s, { type: 'arrive', plate: 'L1', driver: 'a', access: 'LV' }));
    s = must(engineReduce(s, { type: 'arrive', plate: 'R1', driver: 'b', access: 'RG' }));
    s = settle(s).state;
    const owners = s.cells.map(c => c.vehicleId).filter((x): x is string => x !== null);
    expect(new Set(owners).size).toBe(owners.length);
    for (const v of Object.values(s.vehicles)) {
      if (v.cellId) expect(cellOf(s, v.cellId)).toMatchObject({ status: 'reserved', vehicleId: v.id });
    }
    expect(nextAccessToServe(s)).toBeNull();
  });

  it('settle es idempotente y devuelve el MISMO objeto si nada cambia', () => {
    const init = createInitialState(CONFIG);
    expect(settle(init).state).toBe(init);
    const pending = must(engineReduce(init, { type: 'arrive', plate: 'S1', driver: 'a', access: 'LV' }));
    const s1 = settle(pending).state;
    expect(s1).not.toBe(pending);
    expect(settle(s1).state).toBe(s1);
  });

  it('POLICY_TEXT describe la política', () => {
    expect(POLICY_TEXT).toMatch(/Round Robin/);
    expect(POLICY_TEXT).toMatch(/FIFO/);
  });
});

// ---------- Flujos de vehículo ----------
describe('flujo de vehículo', () => {
  it('llegada → pasarela → celda → cruce → estacionado → salida libera celda', () => {
    let s = arrive(createInitialState(CONFIG), 'F1');
    const id = idOf(s, 'F1');
    expect(s.vehicles[id]).toMatchObject({ stage: 'in_lane', cellId: 'C1' });
    s = run(s, { type: 'gateAdmit', access: 'LV' });
    expect(s.vehicles[id].stage).toBe('entering');
    s = run(s, { type: 'park', vehicleId: id });
    expect(cellOf(s, 'C1')).toMatchObject({ status: 'occupied', vehicleId: id });
    s = run(s, { type: 'leave', vehicleId: id });
    expect(s.vehicles[id]).toMatchObject({ stage: 'exited', cellId: null });
    expect(cellOf(s, 'C1')).toMatchObject({ status: 'free', vehicleId: null });
    expect(s.releaseLog).toEqual([0]);
  });

  it('gateAdmit sin celda: error y mismo estado', () => {
    const s = arrive(createInitialState(cfg(cellSeeds(0, 2))), 'Z1');
    const r = engineReduce(s, { type: 'gateAdmit', access: 'LV' });
    expect(r.error).toBe('El primero aún no tiene celda; nadie puede adelantarlo.');
    expect(r.state).toBe(s);
    expect(r.events).toEqual([]);
  });

  it('gateAdmit sin vehículos en pasarela: error', () => {
    const s = createInitialState(CONFIG);
    expect(engineReduce(s, { type: 'gateAdmit', access: 'RG' }).error).toBeDefined();
  });

  it('park y leave validan etapa', () => {
    const s = arrive(createInitialState(CONFIG), 'V1X');
    const id = idOf(s, 'V1X');
    expect(engineReduce(s, { type: 'park', vehicleId: id }).error).toBeDefined();
    expect(engineReduce(s, { type: 'leave', vehicleId: id }).error).toBeDefined();
    expect(engineReduce(s, { type: 'park', vehicleId: 'V999' }).error).toBeDefined();
  });

  it('requestExitWithoutParking libera la celda, conserva posición y completa la salida', () => {
    let s = createInitialState(CONFIG);
    s = arrive(s, 'X1');
    s = arrive(s, 'X2');
    const x1 = idOf(s, 'X1');
    const x2 = idOf(s, 'X2');
    s = run(s, { type: 'requestExitWithoutParking', vehicleId: x1 });
    expect(s.vehicles[x1]).toMatchObject({ exitWithoutParking: true, cellId: null, stage: 'in_lane' });
    expect(s.lane.LV).toEqual([x1, x2]);
    expect(cellCounts(s).free).toBe(3);
    expect(s.releaseLog.length).toBe(1);
    s = run(s, { type: 'gateAdmit', access: 'LV' });
    expect(s.vehicles[x1].stage).toBe('exiting');
    s = run(s, { type: 'completeExit', vehicleId: x1 });
    expect(s.vehicles[x1].stage).toBe('exited');
    expect(s.vehicles[x2].cellId).toBe('C2');
  });

  it('requestExitWithoutParking fuera de pasarela: error', () => {
    // Sin settle: el vehículo sigue en la fila exterior.
    const s = must(engineReduce(createInitialState(CONFIG), { type: 'arrive', plate: 'Q1', driver: 'q', access: 'LV' }));
    expect(engineReduce(s, { type: 'requestExitWithoutParking', vehicleId: idOf(s, 'Q1') }).error).toBeDefined();
  });
});

// ---------- Reasignación ----------
describe('reportCellOccupied', () => {
  it('reasigna de inmediato, conserva el vehículo y avisa', () => {
    let s = arrive(createInitialState(CONFIG), 'G1');
    const id = idOf(s, 'G1');
    s = run(s, { type: 'reportCellOccupied', vehicleId: id });
    expect(s.vehicles[id]).toMatchObject({ id, cellId: 'C2', reassignments: 1, notice: 'Reasignado de C1 a C2' });
    expect(cellOf(s, 'C1')).toMatchObject({ status: 'occupied', vehicleId: null });
    expect(cellOf(s, 'C2')).toMatchObject({ status: 'reserved', vehicleId: id });
    expect(s.lane.LV).toEqual([id]);
  });

  it('sin celda libre espera; el cruzado tiene prioridad al liberarse una celda', () => {
    const tight = createInitialState(cfg(cellSeeds(1, 1))); // C1 libre, C2 ocupada
    let s = arrive(tight, 'H1');
    s = arrive(s, 'H2');
    const h1 = idOf(s, 'H1');
    const h2 = idOf(s, 'H2');
    s = run(s, { type: 'gateAdmit', access: 'LV' }); // H1 cruza rumbo a C1
    expect(s.vehicles[h1].stage).toBe('entering');
    s = run(s, { type: 'reportCellOccupied', vehicleId: h1 });
    expect(s.vehicles[h1]).toMatchObject({ stage: 'entering', cellId: null, reassignments: 1 });
    expect(s.vehicles[h2].cellId).toBeNull();
    s = run(s, { type: 'releaseCell', cellId: 'C2' });
    expect(s.vehicles[h1].cellId).toBe('C2');
    expect(s.vehicles[h2].cellId).toBeNull();
  });

  it('solo aplica a vehículos con celda reservada', () => {
    // Fuera de la fila: sin celda.
    const outside = must(engineReduce(createInitialState(CONFIG), { type: 'arrive', plate: 'NR1', driver: 'a', access: 'LV' }));
    const r1 = engineReduce(outside, { type: 'reportCellOccupied', vehicleId: idOf(outside, 'NR1') });
    expect(r1.error).toBeDefined();
    expect(r1.state).toBe(outside);
    // En pasarela sin celda (todas ocupadas): sin celda reservada.
    const noCell = arrive(createInitialState(cfg(cellSeeds(0, 2))), 'NR2');
    expect(engineReduce(noCell, { type: 'reportCellOccupied', vehicleId: idOf(noCell, 'NR2') }).error).toBeDefined();
    expect(engineReduce(noCell, { type: 'reportCellOccupied', vehicleId: 'V999' }).state).toBe(noCell);
  });
});

// ---------- Celdas externas ----------
describe('celdas no registradas', () => {
  it('releaseCell y occupyCellExternally validan estado y dueño', () => {
    let s = createInitialState(CONFIG);
    expect(engineReduce(s, { type: 'releaseCell', cellId: 'C1' }).error).toBeDefined();
    s = must(engineReduce(s, { type: 'releaseCell', cellId: 'C5' }));
    expect(cellOf(s, 'C5')).toMatchObject({ status: 'free', vehicleId: null });
    expect(s.releaseLog).toEqual([0]);
    s = must(engineReduce(s, { type: 'occupyCellExternally', cellId: 'C5' }));
    expect(cellOf(s, 'C5')).toMatchObject({ status: 'occupied', vehicleId: null });
    expect(engineReduce(s, { type: 'occupyCellExternally', cellId: 'C5' }).error).toBeDefined();
  });

  it('releaseCell de celda con vehículo registrado: error', () => {
    let s = arrive(createInitialState(CONFIG), 'OW1');
    s = run(s, { type: 'gateAdmit', access: 'LV' });
    s = run(s, { type: 'park', vehicleId: idOf(s, 'OW1') });
    const r = engineReduce(s, { type: 'releaseCell', cellId: 'C1' });
    expect(r.error).toMatch(/OW1/);
    expect(r.state).toBe(s);
  });

  it('occupyCellExternally sobre celda reservada: error', () => {
    const s = arrive(createInitialState(CONFIG), 'RS1');
    expect(engineReduce(s, { type: 'occupyCellExternally', cellId: 'C1' }).error).toBeDefined();
  });
});

// ---------- Tiempo ----------
describe('advanceTime', () => {
  it('suma minutos y registra evento; minutos no positivos: error', () => {
    const s = createInitialState(CONFIG);
    const r = engineReduce(s, { type: 'advanceTime', minutes: 5 });
    expect(r.state.now).toBe(5);
    expect(r.events[0].message).toContain('00:05');
    expect(engineReduce(s, { type: 'advanceTime', minutes: 0 }).error).toBeDefined();
    expect(engineReduce(s, { type: 'advanceTime', minutes: -3 }).state).toBe(s);
  });
});

// ---------- ETA ----------
describe('getEta', () => {
  it('not_registered para vehículo en fila exterior', () => {
    let s = createInitialState(CONFIG);
    s = must(engineReduce(s, { type: 'arrive', plate: 'U1', driver: 'a', access: 'LV' }));
    s = must(engineReduce(s, { type: 'arrive', plate: 'U2', driver: 'b', access: 'LV' }));
    expect(getEta(s, idOf(s, 'U2'))).toMatchObject({ kind: 'not_registered', position: 2, vehiclesAhead: 1 });
  });

  it('assigned cuando ya tiene celda', () => {
    const s = arrive(createInitialState(CONFIG), 'AS1');
    expect(getEta(s, idOf(s, 'AS1'))).toMatchObject({ kind: 'assigned', position: 1, vehiclesAhead: 0 });
  });

  it('insufficient_data sin historial de liberaciones', () => {
    const s = arrive(createInitialState(cfg(cellSeeds(0, 2))), 'N1');
    const eta = getEta(s, idOf(s, 'N1'));
    expect(eta.kind).toBe('insufficient_data');
    expect(eta.basis).toContain('Solo 0 liberaciones en 30 min');
  });

  it('estimate con historial reciente y demanda previa según la política', () => {
    let s = createInitialState(CONFIG);
    s = arrive(s, 'E1');          // C1, libera en t=0
    s = cycle(s, 'E1');
    s = run(s, { type: 'advanceTime', minutes: 5 });
    s = arrive(s, 'E2');          // C1 otra vez, libera en t=5
    s = cycle(s, 'E2');
    for (const id of ['C1', 'C2', 'C3', 'C4']) s = run(s, { type: 'occupyCellExternally', cellId: id });
    s = arrive(s, 'E3');
    s = arrive(s, 'E4');
    // n=2 liberaciones en 30 min; E3 es primero de la fila sin celda: k=0, m=15
    expect(getEta(s, idOf(s, 'E3'))).toMatchObject({
      kind: 'estimate', position: 1, vehiclesAhead: 0, demandAhead: 0, minMinutes: 11, maxMinutes: 23,
    });
    // E4 es segundo: k=1, m=30
    expect(getEta(s, idOf(s, 'E4'))).toMatchObject({
      kind: 'estimate', position: 2, vehiclesAhead: 1, demandAhead: 1, minMinutes: 22, maxMinutes: 45,
    });
  });
});

// ---------- Errores e inmutabilidad ----------
describe('errores e inmutabilidad', () => {
  it('todo error devuelve el mismo state y events vacíos', () => {
    const s = arrive(createInitialState(CONFIG), 'ER1');
    const cmds: Command[] = [
      { type: 'park', vehicleId: 'V404' },
      { type: 'leave', vehicleId: 'V404' },
      { type: 'completeExit', vehicleId: 'V404' },
      { type: 'releaseCell', cellId: 'NOPE' },
      { type: 'occupyCellExternally', cellId: 'NOPE' },
      { type: 'advanceTime', minutes: 0 },
      { type: 'valetPay', serviceId: 'S1', approved: true },
    ];
    for (const cmd of cmds) {
      const r = engineReduce(s, cmd);
      expect(r.error).toBeDefined();
      expect(r.state).toBe(s);
      expect(r.events).toEqual([]);
    }
  });

  it('determinista e inmutable: mismas entradas, mismo resultado; entrada intacta', () => {
    const build = (): SimState => {
      let s = createInitialState(CONFIG);
      s = arrive(s, 'D1');
      s = arrive(s, 'D2', 'RG');
      return s;
    };
    const a = build();
    const b = build();
    expect(a).toEqual(b);
    const snapshot = JSON.stringify(a);
    run(a, { type: 'advanceTime', minutes: 3 });
    run(a, { type: 'gateAdmit', access: 'LV' });
    expect(JSON.stringify(a)).toBe(snapshot);
  });
});
