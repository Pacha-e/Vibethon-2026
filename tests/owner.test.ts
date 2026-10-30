import { describe, expect, it } from 'vitest';
import { PROVISIONAL_CONFIG } from '../src/fixtures/provisional';
import { bootState, rootReduce } from '../src/state/reducer';

describe('dueño del vehículo (cuenta que lo registró)', () => {
  it('arrive guarda el correo de la cuenta; sin cuenta queda null', () => {
    let s = bootState(PROVISIONAL_CONFIG);
    s = rootReduce(s, { type: 'arrive', plate: 'OWN001', driver: 'Ana', access: 'LV', owner: 'ana@eafit.edu.co' }).state;
    s = rootReduce(s, { type: 'arrive', plate: 'OWN002', driver: 'Sin cuenta', access: 'RG' }).state;
    const byPlate = Object.fromEntries(Object.values(s.vehicles).map((v) => [v.plate, v.owner]));
    expect(byPlate.OWN001).toBe('ana@eafit.edu.co');
    expect(byPlate.OWN002).toBeNull();
  });
});
