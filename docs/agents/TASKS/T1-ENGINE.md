# T1-ENGINE — Motor de filas, celdas y asignación justa
**Owner:** engine-haiku · **Modelo:** haiku, effort xhigh · **Deps:** `src/contracts/types.ts`, `src/contracts/util.ts` (solo lectura)
**Permitido:** `src/domain/engine/**` (incluye `*.test.ts` propios). Nada más.
**Salida:** `index.ts` exporta `createInitialState, engineReduce, settle` + re-export de `selectors.ts` (`getEta, cellCounts, laneView, nextAccessToServe, POLICY_TEXT`). Firmas en `docs/agents/CONTRACTS.md` §Motor.

## Reglas engineReduce (error → mismo state + mensaje español)
- `arrive`: placa no vacía y no activa (stage≠exited) → Vehicle `V{seq}` stage outside, push `outside[access]`.
- `gateAdmit(access)`: front=`lane[access][0]`. Sin front → error. `exitWithoutParking` → stage exiting. Con `cellId` reservada → stage entering. Sin celda → error "El primero aún no tiene celda; nadie puede adelantarlo". Al cruzar, sale de `lane`.
- `park`: stage entering + celda reserved por él → celda occupied, stage parked.
- `leave`: parked → celda free (vehicleId null), stage exited, cellId null, `releaseLog.push(now)`.
- `requestExitWithoutParking`: stage in_lane → flag true; si tenía celda reservada → free + releaseLog. Conserva posición en `lane`.
- `completeExit`: exiting → exited.
- `reportCellOccupied`: vehículo con celda reserved (in_lane|entering) → esa celda occupied con vehicleId null; vehicle.cellId=null, reassignments++, notice. Intentar YA otra celda free para ESTE vehículo (notice "Reasignado de X a Y"); si no hay, queda esperando con prioridad.
- `releaseCell`: celda occupied con vehicleId null → free + releaseLog; si tiene dueño registrado → error.
- `occupyCellExternally`: free → occupied (null). `advanceTime(minutes>0)`: now += minutes.
Cada cambio: `addEvent` con message en español (incluye placa/celda/acceso).

## settle (idempotente: si nada cambia, devuelve el MISMO objeto)
1. Admisión: mientras `lane[a].length < config.laneCapacity[a]` y hay outside → mover al final de lane, stage in_lane, registeredAt=now.
2. Asignación por cada celda free (orden de config): prioridad a `entering` sin celda; luego `nextAccessToServe`: accesos con demanda (in_lane, sin celda, !exitWithoutParking); si ambos → el distinto de `lastServed` (null → LV); si uno → ese. Vehículo = primero con demanda en `lane[acc]` (FIFO). Reservar, `lastServed=acc`, assignLog, notice "Celda X reservada".
## getEta
outside→kind not_registered (position en outside). cellId→assigned. exitWithoutParking→no_cell_needed. Si demanda: i=índice entre demandantes de su fila, o=demandantes del otro acceso; k = i + min(next===suAcceso ? i : i+1, o). n=liberaciones en [now-etaWindowMinutes, now]; n<etaMinSamples → insufficient_data con basis "Solo n liberaciones en W min". Si no: m=(k+1)/(n/W); min=floor(0.75m), max=ceil(1.5m) (min≥1). `basis` explica. position/vehiclesAhead según índice físico en lane.
## Aceptación / pruebas (vitest `src/domain/engine/engine.test.ts`)
Capacidad 4/6 nunca superada; FIFO; RR alterna LV/RG; sin doble reserva; reasignación conserva vehículo; ETA insufficient_data sin historial. Ejecutar `npx vitest run src/domain/engine` y `npx tsc --noEmit -p .`.
**Al terminar:** `DONE|T1-ENGINE|...` (≤5 líneas) vía tu respuesta final.
