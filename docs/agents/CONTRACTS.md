# Contratos (Team Lead) — tipos en `src/contracts/types.ts`, utilidades en `src/contracts/util.ts`
Reducers puros: `(state, cmd) => Result {state, events, error?}`. Con error → devolver el MISMO state y mensaje en español. Usar `nextId`, `addEvent`, `fail` de util. Inmutables (copiar objetos/arrays modificados).

## Motor — `src/domain/engine/index.ts` (engine-haiku)
- `createInitialState(config): SimState` — celdas desde `config.cells` (`initiallyOccupied` → occupied, vehicleId null); valets `LV-V1..LV-V8`, `RG-V1..RG-V8` (`name` "Valet LV 1"), available; now=0, seq=0, colas vacías, log vacío.
- `engineReduce(state, cmd): Result` — comandos `EngineCommandType`.
- `settle(state): Result` — idempotente; si nada cambia devuelve el MISMO objeto state. (a) admite fuera→pasarela mientras haya cupo (stage in_lane, registeredAt=now); (b) asigna cada celda `free` según la política (Round Robin `lastServed` + FIFO), status reserved, vehicleId; registra assignLog.
- Selectores en `src/domain/engine/selectors.ts` (re-exportar en index): `getEta(state, vehicleId): Eta`, `cellCounts(state): {free,reserved,occupied}`, `laneView(state, access): {outside: Vehicle[]; lane: Vehicle[]; capacity: number}`, `nextAccessToServe(state): AccessId|null`, `POLICY_TEXT: string`.
- Solo demandan celda: vehículos `in_lane` sin `cellId` y `!exitWithoutParking`, y `entering` sin celda (reasignación, prioridad máxima).

## Valet — `src/features/valet/logic.ts` (valet-haiku)
- `valetReduce(state, cmd): Result` — `ValetCommandType`.
- `valetSettle(state): Result` — idempotente (mismo objeto si nada cambia): vence holds (`holdExpiresAt <= now` → service `payment_expired`, valet available); sincroniza servicios `car_handed` cuyo vehículo está `parked` → stage `parked`, `cellId`.
- Ficho: `${access}-${seq 4 dígitos}` único. Ingreso simulado al aprobar pago (`valet.earnings += price`).

## Raíz — `src/state/reducer.ts` (Lead): `rootReduce(state, cmd)` despacha → `valetSettle` → `settle`. `batch` = varios comandos en orden, cada uno atómico: `state` incluye los aceptados y `error` lista los rechazados (excepción documentada al contrato Result). Store `useSim()` → `{state, dispatch, feedback}` en `src/state/store.tsx`.

## Propiedad
| Agente | Archivos |
|---|---|
| Lead | `src/contracts/**`, `src/state/**`, `src/App.tsx`, `src/main.tsx`, `src/fixtures/**`, config, `docs/**`, `.claude/**`, `scripts/**` |
| engine-haiku | `src/domain/engine/**` |
| ui-haiku | `src/features/driver/**`, `src/features/gate/**`, `src/features/sim/**`, `src/components/**`, `src/styles/**` |
| valet-haiku | `src/features/valet/**`, `src/features/office/**` |
| qa-haiku | `tests/**`, `evidence/test-results/**` |

## Mensajes: `BLOCKER|tarea|destinatario|dato|impacto` · `CONTRACT|tarea|cambio|motivo|módulos` · `READY|tarea|archivos|interfaz|pruebas` · `REVIEW|tarea|problema|evidencia|propuesta` · `DONE|tarea|resultado|pruebas|riesgos`
