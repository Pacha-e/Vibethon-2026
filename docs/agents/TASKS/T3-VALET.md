# T3-VALET — Lógica valet/oficina + vistas
**Owner:** valet-haiku · **Modelo:** haiku, effort xhigh · **Deps:** `src/contracts/types.ts`, `src/contracts/util.ts`, `useSim()` de `src/state/store.tsx`; `getEta` de `src/domain/engine` (engine-haiku, en paralelo).
**Permitido:** `src/features/valet/**`, `src/features/office/**`.
## logic.ts — `valetReduce(state, cmd): Result`, `valetSettle(state): Result` (ver CONTRACTS.md §Valet). Error → mismo state + mensaje español.
- `valetHold(vehicleId, valetId)`: vehículo stage in_lane (si no: "Solo puedes contratar valet dentro de la pasarela"); `valet.access===vehicle.access`; valet available; sin servicio activo; no exitWithoutParking. Crea `S{seq}` payment_pending, price=config.valetPrice; valet held_for_payment, serviceId, holdExpiresAt=now+holdMinutes; vehicle.valetServiceId.
- `valetPay(serviceId, approved)`: requiere payment_pending. Aprobado → confirmed, valet in_service, holdExpiresAt null, earnings+=price. Rechazado → payment_rejected, valet available/serviceId null, vehicle.valetServiceId=null. **Nunca tocar lane/outside** (conserva turno).
- `valetHandover`: confirmed → car_handed, `ticketCode = access + '-' + seq 4 dígitos` (único). Vehículo sigue en su posición.
- `valetDeposit`: requiere parked → keys_deposited, valet available, serviceId null; `office.push(keys_received)`.
- `claimKeys(ticketCode)`: sin servicio con ese ficho → "Ficho inválido"; stage≠keys_deposited → "Las llaves aún no están en oficina"; si ok → keys_delivered + `office.push(keys_delivered)`.
- `valetSettle` (idempotente, MISMO objeto si nada cambia): holds vencidos (`holdExpiresAt<=now`, payment_pending) → payment_expired, valet available, vehicle.valetServiceId=null; servicio car_handed con vehículo parked → parked + cellId.
Cada transición: `history.push` y `addEvent` español.
## Vistas
- `HireValetPanel.tsx` `{vehicleId}`: precio, nº valets disponibles del acceso del vehículo; si no in_lane → explica; sugerir si `getEta` maxMinutes>15 o insufficient_data no sugiere; elegir valet → `valetHold`; paso pago con "Aprobar pago (simulado)" / "Rechazar pago (simulado)" + vence en X min; "Entregar auto al valet" → muestra ficho grande; seguimiento por etapas. Todos ocupados → "No hay valets disponibles en {acceso}; continúas en la fila normal".
- `ValetView.tsx` (default): 8+8 valets con estado texto+color (Disponible / Reservado (pago) / En servicio); servicios activos con acciones "Estacionar" (`park` si vehículo entering con celda) y "Depositar llaves"; historial servicio↔ingreso y total por valet.
- `src/features/office/OfficeView.tsx` (default): input ficho → `claimKeys`; llaves en custodia; registro `state.office`.
Tailwind, colores `king-ink`, `king-gold`; texto+símbolo, contraste AA.
## Pruebas: `src/features/valet/logic.test.ts` (vitest; puedes construir estado con `createInitialState` de engine o a mano). `npx vitest run src/features/valet`, `npx tsc --noEmit -p .`. **Al terminar:** `DONE|T3-VALET|...` (≤5 líneas).
