// parKING — contratos compartidos (propiedad: Team Lead). Cambios solo vía mensaje CONTRACT.
// Tiempo simulado en MINUTOS desde el inicio (state.now). Todo es determinista: sin Date.now(), sin Math.random().

export type AccessId = 'LV' | 'RG';
export const ACCESSES: AccessId[] = ['LV', 'RG'];
export const ACCESS_NAME: Record<AccessId, string> = { LV: 'Las Vegas', RG: 'Regional' };

// ---------- Celdas ----------
export type CellStatus = 'free' | 'reserved' | 'occupied';
export interface CellSeed { id: string; zone: string; route: string; initiallyOccupied?: boolean }
export interface Cell {
  id: string;            // p.ej. "A-03"
  zone: string;          // "A" | "B" ... (viene del fixture)
  route: string;         // texto de recorrido desde portería
  status: CellStatus;
  vehicleId: string | null; // dueño (reserved/occupied). null + occupied = ocupada por vehículo no registrado
}

// ---------- Vehículos ----------
// outside: espera ANTES del registro | in_lane: dentro de la pasarela (registrado)
// entering: cruzó portería rumbo a su celda | exiting: cruzó portería rumbo a la salida sin estacionar
// parked: estacionado | exited: salió del sistema
export type VehicleStage = 'outside' | 'in_lane' | 'entering' | 'exiting' | 'parked' | 'exited';
export interface Vehicle {
  id: string;            // "V1", "V2"... (state.seq)
  plate: string;
  driver: string;
  access: AccessId;
  stage: VehicleStage;
  arrivedAt: number;
  registeredAt: number | null;   // al cruzar la línea de registro (entrar a la pasarela)
  cellId: string | null;         // celda reservada/ocupada
  exitWithoutParking: boolean;
  valetServiceId: string | null;
  reassignments: number;
  notice: string | null;         // último aviso para el conductor (p.ej. reasignación)
}

// ---------- Valets ----------
export type ValetStatus = 'available' | 'held_for_payment' | 'in_service';
export interface Valet {
  id: string;            // "LV-V1".."LV-V8", "RG-V1".."RG-V8"
  name: string;
  access: AccessId;
  status: ValetStatus;
  serviceId: string | null;
  holdExpiresAt: number | null;
  earnings: number;      // ingresos simulados acumulados (COP)
}
export type ServiceStage =
  | 'payment_pending'   // valet bloqueado durante el pago
  | 'payment_rejected'  // terminal: valet liberado, conductor conserva turno
  | 'payment_expired'   // terminal: igual que rechazado
  | 'confirmed'         // pago aprobado, falta entrega del auto
  | 'car_handed'        // valet recibió el auto, ficho emitido; espera celda en la fila
  | 'parked'            // valet estacionó (vehículo parked)
  | 'keys_deposited'    // llaves en oficina; valet vuelve a available
  | 'keys_delivered';   // conductor reclamó con ficho
export interface ValetService {
  id: string;            // "S1".. (state.seq)
  valetId: string;
  vehicleId: string;
  access: AccessId;
  price: number;
  createdAt: number;
  stage: ServiceStage;
  ticketCode: string | null; // único, p.ej. "LV-0007"; se emite en valetHandover
  cellId: string | null;     // ubicación informada al estacionar
  history: { at: number; stage: ServiceStage; note: string }[];
}
export interface OfficeRecord { at: number; kind: 'keys_received' | 'keys_delivered'; serviceId: string; ticketCode: string; plate: string; note: string }

// ---------- Eventos / bitácora ----------
export interface SimEvent {
  seq: number; at: number; type: string; message: string; // message en español, legible para UI
  vehicleId?: string; cellId?: string; valetId?: string; serviceId?: string; access?: AccessId;
}

// ---------- Configuración / fixture ----------
export interface SimConfig {
  fixtureName: string;
  isOfficial: boolean;               // false = fixture provisional del equipo
  laneCapacity: Record<AccessId, number>;   // 4 / 6
  valetsPerAccess: number;           // 8
  valetPrice: number;                // configurable (8000 ilustrativo)
  holdMinutes: number;               // vencimiento del bloqueo de pago
  etaWindowMinutes: number;          // ventana de "ritmo reciente"
  etaMinSamples: number;             // mínimo de liberaciones para estimar
  valetSuggestMinutes: number;       // 15
  cells: CellSeed[];
}

export interface SimState {
  now: number;
  seq: number;                        // contador único para ids, fichos y eventos
  config: SimConfig;
  cells: Cell[];
  vehicles: Record<string, Vehicle>;
  outside: Record<AccessId, string[]>; // fila exterior, índice 0 = próximo en registrarse
  lane: Record<AccessId, string[]>;    // pasarela, índice 0 = junto a portería
  lastServed: AccessId | null;         // puntero Round Robin
  releaseLog: number[];                // minutos en que se liberó una celda (para ETA)
  assignLog: { at: number; access: AccessId; vehicleId: string; cellId: string }[];
  valets: Valet[];
  services: Record<string, ValetService>;
  office: OfficeRecord[];
  log: SimEvent[];                     // más reciente al final
}

// ---------- Comandos ----------
export type Command =
  | { type: 'arrive'; plate: string; driver: string; access: AccessId }
  | { type: 'gateAdmit'; access: AccessId }          // el primero de la pasarela cruza portería
  | { type: 'park'; vehicleId: string }               // entering -> parked (celda occupied)
  | { type: 'leave'; vehicleId: string }              // parked -> exited (celda free)
  | { type: 'requestExitWithoutParking'; vehicleId: string }
  | { type: 'completeExit'; vehicleId: string }       // exiting -> exited
  | { type: 'reportCellOccupied'; vehicleId: string } // su celda asignada apareció ocupada
  | { type: 'releaseCell'; cellId: string }           // sale un ocupante no registrado (simulación)
  | { type: 'occupyCellExternally'; cellId: string }  // un auto no registrado ocupa celda libre (simulación)
  | { type: 'advanceTime'; minutes: number }
  | { type: 'valetHold'; vehicleId: string; valetId: string }
  | { type: 'valetPay'; serviceId: string; approved: boolean }
  | { type: 'valetHandover'; serviceId: string }
  | { type: 'valetDeposit'; serviceId: string }
  | { type: 'claimKeys'; ticketCode: string }
  | { type: 'batch'; commands: Command[] }            // solicitudes simultáneas, aplicadas atómicamente en orden
  | { type: 'reset' };

export type EngineCommandType = 'arrive' | 'gateAdmit' | 'park' | 'leave' | 'requestExitWithoutParking'
  | 'completeExit' | 'reportCellOccupied' | 'releaseCell' | 'occupyCellExternally' | 'advanceTime';
export type ValetCommandType = 'valetHold' | 'valetPay' | 'valetHandover' | 'valetDeposit' | 'claimKeys';

// Resultado de cualquier reducer. Si error != undefined, state === estado de entrada (sin cambios).
// EXCEPCIÓN `batch` (solicitudes simultáneas): cada subcomando es atómico por separado; `state` incluye los
// subcomandos aceptados y `error` enumera los rechazados (que no dejaron ningún cambio). Ver REVIEW de T4-QA.
export interface Result { state: SimState; events: SimEvent[]; error?: string }

// ---------- Derivados para UI (implementados en src/domain/engine/selectors.ts) ----------
export interface Eta {
  kind: 'assigned' | 'no_cell_needed' | 'estimate' | 'insufficient_data' | 'not_registered';
  position: number;        // 1 = junto a portería (en pasarela) o 1 = próximo a registrarse (fuera)
  vehiclesAhead: number;   // en su misma fila física
  demandAhead: number;     // vehículos (ambos accesos) que recibirán celda antes según la política
  minMinutes?: number;     // solo si kind === 'estimate'
  maxMinutes?: number;
  basis: string;           // explicación en español de cómo se calculó / por qué no hay dato
}
