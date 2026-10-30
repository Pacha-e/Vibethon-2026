// Los 9 escenarios oficiales sobre el fixture PROVISIONAL (propiedad: Lead).
// Cada escenario se define con pasos que pueden depender del estado (p.ej. buscar un vehículo por placa).
// Al cargar el módulo se resuelven simulando desde un reset, y se exponen como lista estática de Command:
// la UI ejecuta dispatch({type:'reset'}) y luego dispatch({type:'batch', commands}).
import type { AccessId, Command, SimState } from '../contracts/types';
import { bootState, rootReduce } from '../state/reducer';
import { PROVISIONAL_CONFIG } from './provisional';

type Step = Command | ((s: SimState) => Command);
interface ScenarioDef { id: number; title: string; expected: string | ((s: SimState) => string); steps: Step[] }
export interface Scenario { id: number; title: string; expected: string; commands: Command[]; resolveError?: string }

export const vid = (s: SimState, plate: string): string => {
  const v = Object.values(s.vehicles).find((x) => x.plate === plate && x.stage !== 'exited');
  if (!v) throw new Error(`placa ${plate} no encontrada`);
  return v.id;
};
const arrive = (plate: string, access: AccessId, driver = 'Estudiante'): Command => ({ type: 'arrive', plate, access, driver });
const freeIds = (s: SimState) => s.cells.filter((c) => c.status === 'free').map((c) => c.id);
const fillAll = (s: SimState): Command => ({ type: 'batch', commands: freeIds(s).map((cellId) => ({ type: 'occupyCellExternally', cellId })) });
const releaseExternal = (s: SimState): Command => {
  const c = s.cells.find((x) => x.status === 'occupied' && x.vehicleId === null);
  return c ? { type: 'releaseCell', cellId: c.id } : { type: 'advanceTime', minutes: 0.0001 };
};
const svc = (s: SimState, plate: string) => s.vehicles[vid(s, plate)].valetServiceId ?? 'S?';
const hireAndHand = (plate: string, valetId: string): Step[] => [
  (s) => ({ type: 'valetHold', vehicleId: vid(s, plate), valetId }),
  (s) => ({ type: 'valetPay', serviceId: svc(s, plate), approved: true }),
  (s) => ({ type: 'valetHandover', serviceId: svc(s, plate) }),
];

const DEFS: ScenarioDef[] = [
  { id: 1, title: 'Pasarela llena', steps: [fillAll, ...['LVA101', 'LVA102', 'LVA103', 'LVA104', 'LVA105', 'LVA106'].map((p) => arrive(p, 'LV'))],
    expected: 'Las Vegas muestra 4/4 en pasarela; LVA105 y LVA106 esperan ANTES del registro. Nunca hay más de 4 (Regional: 6).' },
  { id: 2, title: 'Parqueadero lleno', steps: [fillAll, arrive('LVB201', 'LV'), arrive('RGB202', 'RG'), arrive('LVB203', 'LV'), arrive('RGB204', 'RG'),
      { type: 'advanceTime', minutes: 6 }],
    expected: '0 celdas libres: nadie recibe celda, las filas se conservan y la espera dice «datos insuficientes» (no se inventan cupos ni minutos). Libera celdas en Portería para ver la estimación actualizarse.' },
  { id: 3, title: 'Se libera una celda', steps: [fillAll, arrive('LVC301', 'LV'), arrive('LVC302', 'LV'), arrive('RGC303', 'RG'),
      { type: 'advanceTime', minutes: 5 }, releaseExternal, { type: 'advanceTime', minutes: 5 }, releaseExternal],
    expected: '1.ª celda liberada → LVC301 (FIFO Las Vegas). 2.ª → RGC303: Round Robin alterna a Regional aunque LVC302 siga esperando. Cada celda queda reservada a un único vehículo.' },
  { id: 4, title: 'Solicitudes simultáneas', steps: [
      (s) => ({ type: 'batch', commands: freeIds(s).slice(0, -1).map((cellId) => ({ type: 'occupyCellExternally', cellId }) as Command) }),
      { type: 'batch', commands: [arrive('LVD401', 'LV'), arrive('RGD402', 'RG'), arrive('LVD403', 'LV')] },
      (s) => ({ type: 'batch', commands: [
        { type: 'valetHold', vehicleId: vid(s, 'LVD401'), valetId: 'LV-V1' },
        { type: 'valetHold', vehicleId: vid(s, 'LVD403'), valetId: 'LV-V1' }] })],
    expected: 'Una sola celda libre y tres llegadas simultáneas: solo LVD401 la reserva. Dos conductores piden a la vez el valet LV-V1: el segundo recibe «no disponible».' },
  { id: 5, title: 'Pago rechazado', steps: [fillAll, arrive('LVE501', 'LV'), arrive('LVE502', 'LV'), arrive('LVE503', 'LV'),
      (s) => ({ type: 'valetHold', vehicleId: vid(s, 'LVE502'), valetId: 'LV-V2' }),
      (s) => ({ type: 'valetPay', serviceId: svc(s, 'LVE502'), approved: false })],
    expected: 'El pago de LVE502 es rechazado: el servicio no se confirma, LV-V2 vuelve a Disponible y LVE502 sigue en la posición 2.' },
  { id: 6, title: 'Todos los valets ocupados', steps: (() => {
      const st: Step[] = [fillAll];
      const p = (i: number) => `LVF6${String(i).padStart(2, '0')}`;
      for (let i = 1; i <= 8; i++) st.push(arrive(p(i), 'LV'));
      for (let i = 1; i <= 4; i++) st.push(...hireAndHand(p(i), `LV-V${i}`));
      for (let i = 1; i <= 4; i++) st.push(releaseExternal, { type: 'advanceTime', minutes: 2 }, { type: 'gateAdmit', access: 'LV' }, (s) => ({ type: 'park', vehicleId: vid(s, p(i)) }));
      for (let i = 5; i <= 8; i++) st.push(...hireAndHand(p(i), `LV-V${i}`));
      st.push(releaseExternal, { type: 'gateAdmit', access: 'LV' }, arrive('LVF699', 'LV'),
        (s) => ({ type: 'valetHold', vehicleId: vid(s, 'LVF699'), valetId: 'LV-V1' }));
      return st;
    })(),
    expected: 'Los 8 valets de Las Vegas siguen en servicio (4 esperan depositar llaves). LVF699 intenta contratar y se le informa que no hay valets; continúa en la fila normal.' },
  { id: 7, title: 'Salida sin estacionar', steps: [fillAll, arrive('LVG701', 'LV'), arrive('LVG702', 'LV'), arrive('LVG703', 'LV'),
      (s) => ({ type: 'requestExitWithoutParking', vehicleId: vid(s, 'LVG702') }),
      releaseExternal, { type: 'gateAdmit', access: 'LV' }],
    expected: 'LVG702 pidió salir sin estacionar: no recibe celda pero conserva su lugar; ahora es el primero en portería. «Dar paso» lo envía a la salida; no desaparece antes.' },
  { id: 8, title: 'Celda asignada ocupada', steps: [arrive('LVH801', 'LV'), (s) => ({ type: 'reportCellOccupied', vehicleId: vid(s, 'LVH801') })],
    expected: (s) => {
      const v = Object.values(s.vehicles).find((x) => x.plate === 'LVH801');
      return `La celda asignada a LVH801 apareció ocupada: queda marcada «ocupada (no registrado)» y LVH801 se reasigna a ${v?.cellId ?? '—'} con aviso al conductor.`;
    } },
  { id: 9, title: 'Reclamación de llaves', steps: [arrive('LVK901', 'LV', 'Ana'), ...hireAndHand('LVK901', 'LV-V3'), { type: 'gateAdmit', access: 'LV' },
      (s) => ({ type: 'park', vehicleId: vid(s, 'LVK901') }), (s) => ({ type: 'valetDeposit', serviceId: svc(s, 'LVK901') })],
    expected: (s) => {
      const sv = Object.values(s.services).find((x) => s.vehicles[x.vehicleId]?.plate === 'LVK901');
      return `Llaves de LVK901 depositadas en oficina; LV-V3 vuelve a Disponible. Ve a Oficina e ingresa el ficho ${sv?.ticketCode ?? '—'} para registrar la entrega (un ficho inválido es rechazado).`;
    } },
];

function resolve(def: ScenarioDef): Scenario {
  let s = bootState(PROVISIONAL_CONFIG);
  const commands: Command[] = [];
  try {
    for (const step of def.steps) {
      const cmd = typeof step === 'function' ? step(s) : step;
      commands.push(cmd);
      s = rootReduce(s, cmd).state;
    }
    return { id: def.id, title: def.title, commands, expected: typeof def.expected === 'function' ? def.expected(s) : def.expected };
  } catch (e) {
    return { id: def.id, title: def.title, commands, expected: typeof def.expected === 'string' ? def.expected : '', resolveError: String(e) };
  }
}

export const SCENARIOS: Scenario[] = DEFS.map(resolve);
