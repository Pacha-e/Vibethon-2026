# T4-QA — Invariantes y 9 escenarios oficiales
**Owner:** qa-haiku · **Modelo:** haiku, effort xhigh · **Deps:** T1-ENGINE, T3-VALET listos.
**Permitido:** `tests/**`, `evidence/test-results/**`. Si encuentras bug en módulo ajeno: NO lo corrijas; reporta `REVIEW|T4-QA|problema|evidencia (test+salida)|propuesta`.
**Entradas:** `rootReduce`, `bootState` de `src/state/reducer.ts`; `SCENARIOS`, `vid` de `src/fixtures/scenarios.ts`; `PROVISIONAL_CONFIG`; selectores de `src/domain/engine`.
## Pruebas
1. `tests/invariants.ts`: `checkInvariants(state): string[]` → LV lane ≤4, RG ≤6; ninguna celda con 2 dueños ni vehículo con 2 celdas; reserved/occupied coherentes con vehicle.cellId; valet con ≤1 servicio activo; valet available ⇒ sin servicio activo; fichos únicos; vehículo outside/in_lane presente en su cola exactamente una vez.
2. `tests/scenarios.test.ts`: por cada escenario 1–9: reset (`bootState`) → aplicar `commands` con `rootReduce` uno a uno, `checkInvariants` vacío tras CADA paso, y aserciones del resultado observable (ver `expected` de cada escenario). Ej.: #1 lane LV = 4 y 2 outside; #3 primera liberación → LVC301, segunda → RGC303; #4 solo 1 reserva y segundo valetHold con error; #5 servicio payment_rejected, LV-V2 available, LVE502 sigue índice 1 en lane; #6 valetHold de LVF699 con error y 8 valets LV in_service; #7 LVG702 stage exiting y nunca sin cola antes de gateAdmit; #8 reassignments=1 y celda distinta; #9 claimKeys(ficho) ok → keys_delivered + office registro; ficho inválido → error.
3. `tests/flows.test.ts`: recorrido completo conductor (arrive→asignación→gateAdmit→park→leave) y valet (hold→pay→handover→gateAdmit→park→deposit→claim); vencimiento de hold con `advanceTime` > holdMinutes conserva turno.
Ejecutar `npx vitest run tests --reporter=verbose 2>&1 | tee evidence/test-results/vitest-<hhmm>.txt`.
**Al terminar:** `DONE|T4-QA|n pass/fail|archivo de evidencia|REVIEWs enviados` (≤6 líneas).
