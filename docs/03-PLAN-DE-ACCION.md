# Plan de acción ejecutable — Vibethon

**Estado:** PLAN PROPUESTO, aún no significa funcionalidad implementada.  
**Fecha:** 30-10-2026. **Cierre oficial:** 4:00 p. m. (America/Bogota).  
**Enunciado rector:** [01-ENUNCIADO.md](01-ENUNCIADO.md). **Puntaje:** [02-RUBRICA.md](02-RUBRICA.md).

## 1. Objetivo del MVP

Demostrar una aplicación **local** donde Las Vegas y Regional mantienen sus colas físicas (capacidad 4 y 6), comparten celdas reservables sin duplicados, aplican una política justa verificable, estiman la espera sin inventar datos y completan un flujo de valet desde la contratación hasta la entrega de llaves.

**Definición de éxito:** funcionan el recorrido conductor y el recorrido valet, se ejecutan las 9 pruebas oficiales, no hay errores bloqueantes y existe evidencia auténtica de prompting corregido.

## 2. Estrategia técnica proporcional al tiempo

**Recomendación inicial (no exigencia oficial):**
- **React + Vite + TypeScript** para una sola SPA local con navegación entre vistas **Conductor, Portería, Valet, Oficina y Simulación**.
- **Motor de dominio puro** en TypeScript: estado + comando → nuevo estado + eventos + errores. Todas las mutaciones críticas suceden **de manera atómica en un único store/reducer**, sin `await` en el momento de verificar/reservar.
- **Fixture de configuración** (JSON/TS) para mapas, capacidad, celdas, vehículos, valets, condiciones iniciales y eventos. Los datos oficiales deben poder sustituirse sin modificar el motor.
- **Vitest** para invariantes y pruebas de escenarios. Log de eventos y reinicio determinista de la simulación.
- **Una sola pestaña / un solo proceso de simulación** como fuente de verdad para la demo; vistas por rol dentro de la aplicación. Si se exige concurrencia entre varias pestañas o procesos, se necesitará un coordinador compartido; no fingir que `localStorage` resuelve transacciones distribuidas.
- Sin backend, autenticación real, base de datos ni nube **en el MVP**, salvo que haya una necesidad demostrada.

**Por qué:** el jurado evalúa el computador local, no la escalabilidad de una aplicación real. En una ventana corta, un backend separado añade integración y puntos de fallo que el enunciado no exige.

**Entorno:** usar **un solo entorno de trabajo estable** (Windows o WSL, sin rutas mixtas ni copias divergentes); no ejecutar nodos en Windows y WSL alternadamente. Dependencias y pruebas reproducibles con un único comando.

## 3. Reglas e invariantes del motor (P0)

- **INV-01:** `0 <= pasarela(LasVegas) <= 4`.
- **INV-02:** `0 <= pasarela(Regional) <= 6`.
- **INV-03:** una celda tiene a lo sumo un vehículo dueño, sea `reserved` u `occupied`.
- **INV-04:** una celda reservada **no** cuenta como libre.
- **INV-05:** cada acceso respeta el orden de su propia fila; el valet no adelanta turnos.
- **INV-06:** salir sin estacionar **no** elimina físicamente el vehículo hasta recorrer el proceso de salida.
- **INV-07:** cada valet pertenece a un acceso y tiene máximo un servicio activo/reservado.
- **INV-08:** reserva de valet expirada o pago rechazado no elimina turno ni confirma servicio.
- **INV-09:** valet solo retorna a disponible después del **depósito de llaves**.
- **INV-10:** un ficho único referencia exactamente un servicio y la entrega de llaves queda registrada.
- **INV-11:** el registro y la asignación son operaciones coherentes: ninguna doble reserva incluso ante comandos concurrentes simulados.
- **INV-12:** no se inventan celdas ni tiempos; si faltan datos, se informa explícitamente.

## 4. Estados y comandos (contrato provisional)

**Celda:** `free | reserved | occupied`.  
**Valet:** `available | held_for_payment | in_service`.  
**Vehículo (para modelo):** `outside | in_lane | assigned | parked | departing | exited`; posibles flags separados `wants_exit_without_parking` y `handed_to_valet` para conservar la ubicación física.  
**Llaves:** `with_valet | deposited_office | handed_to_driver` (solo para servicio de valet).  
**Pago simulado:** `pending | approved | rejected | expired`.

**Comandos iniciales:** `vehicleArrives`, `vehicleRegisters`, `cellBecomesFree`, `assignCell`, `confirmGate`, `parkVehicle`, `beginExit`, `completeExit`, `requestExitWithoutParking`, `holdValet`, `resolvePayment`, `expireValetHold`, `handoverToValet`, `depositKeys`, `claimKeys`, `reportAssignedCellOccupied`, `resetSimulation`.

**Estado derivado para UI:** fila externa, pasarela, vehículos delante, celdas libres/reservadas/ocupadas, ETA por acceso/vehículo, disponibilidad de valets y bitácora.

## 5. Política de asignación a proponer (no oficial)

**Round Robin entre accesos elegibles + FIFO dentro de cada acceso**, manteniendo el último acceso atendido. Si solo un acceso tiene demandantes elegibles, ese acceso puede continuar. Cuando ambos tienen demanda, alternar en el reparto de **nuevas asignaciones**. Nunca romper el orden físico de una fila.

Es **propuesta del equipo**: el enunciado pide **declarar y explicar una política**, pero **no prescribe Round Robin**. Se validará contra los eventos oficiales al recibirlos.

Al reservar una celda, registrar la causa y su dueño en **una única transición**. Al reportar una celda ocupada inesperadamente, no se debe devolver esa celda al inventario libre; recalcular asignación para el mismo vehículo y mostrar un aviso.

## 6. Estimación de espera

- Usar celdas actualmente libres, posición elegible del vehículo y liberaciones/asignaciones recientes.
- Si el parqueadero está lleno, proyectar turnos a partir de la tasa reciente y la política de reparto.
- Mostrar preferentemente **rango**, fecha de actualización e indicación «estimado, no garantizado».
- Sin historial útil, mostrar **datos insuficientes**, no inventar minutos.
- El umbral de **más de 15 minutos** activa la **sugerencia**, no la obligación, de contratar valet.

## 7. Orden de trabajo y puertas de calidad

| Fase | Entregable verificable | Dependencia | Prioridad |
|---|---|---|---|
| 0. Enunciado + rúbrica | Reglas, métricas y asuntos abiertos documentados | Enunciado + sitio oficial | Hecho documental |
| 1. Fixture + contrato | Configuración, estados y comandos definidos; mapa/eventos oficiales integrados si existen | Fase 0 | P0 |
| 2. Motor + pruebas | Invariantes de pasarela, celdas, FIFO, política justa y excepciones | Fase 1 | P0 |
| 3. UI conductor/portería | Registro, fila, estimación, asignación, mapa y confirmaciones | Fases 1–2 | P0 |
| 4. Servicio valet/oficina | Disponibilidad, bloqueo para pago, ficho, depósito y reclamación | Fases 1–2 | P0 |
| 5. Simulación y QA | 9 escenarios oficiales ejecutables, reset y log, control de regresiones | Fases 2–4 | P0 |
| 6. Pulido y pitch | Contraste, textos, mensaje de error, demo y bitácora de prompting | Fases 3–5 | P1 |

**La prioridad se impone al tiempo:** no dedicar el cierre a instalar backend o servicios externos mientras falte alguna de las nueve pruebas.

## 8. Paralelismo recomendado

**Supervisor/integrador:** mantiene contratos, prioriza, resuelve conflictos, exige test y prepara la demo.

**Agente A — Motor:** implementa modelos, comandos, asignador, estimador e invariantes. **Solo este agente** modifica el núcleo de reglas.

**Agente B — UI/UX:** construye shell, navegación, conductor, portería y accesibilidad sobre el contrato establecido; usa datos simulados temporalmente si el motor aún no está listo, luego integra.

**Agente C — Valet y oficina:** construye servicio y vistas del valet/oficina según el contrato compartido, sin implementar por su cuenta otro store.

**Agente D — QA y demostración:** implementa 9 pruebas reproducibles, fixtures y guion; revisa todos los controles y registra evidencia del prompting.

En el portátil, ejecutar en paralelo solo las tareas que **no editan los mismos archivos**. Cada agente recibe una tarea autocontenida, rutas permitidas y criterios de aceptación. El integrador conserva el control de los cambios en el store común. No exceder la capacidad real de herramientas/contexto por perseguir más paralelismo.

## 9. Mapa de pruebas obligatorias

| ID | Caso | Prueba mínima |
|---|---|---|
| T01 | Pasarela llena | Entrada 5.º Las Vegas y 7.º Regional bloqueada antes del registro. |
| T02 | Parqueadero lleno | Filas persisten; nuevas asignaciones no crean celdas inexistentes. |
| T03 | Se libera una celda | Una única reserva según la política declarada. |
| T04 | Solicitudes simultáneas | Dos intentos de la misma celda/valet: como máximo uno exitoso. |
| T05 | Pago rechazado | Valet liberado, servicio no confirmado, turno intacto. |
| T06 | Valets ocupados | Contratación bloqueada e información clara; espera normal. |
| T07 | Salida sin estacionar | El vehículo no desaparece antes de recorrer la pasarela. |
| T08 | Celda ocupada inesperadamente | Reasignación al mismo vehículo + aviso y estados coherentes. |
| T09 | Reclamación de llaves | Ficho identifica servicio; oficina registra y evita doble entrega. |

**Pruebas extra aconsejadas:** reservas múltiples entre accesos, vencimiento de pago, valet aún ocupado tras estacionar sin depositar llaves, llegada sin historial para ETA, reload/reset y accesibilidad de estados.

## 10. Guion de demostración (orientativo)

1. **30 s:** problema, beneficiarios y arquitectura local.
2. **60 s:** llegada y registro en Las Vegas y Regional; capacidad 4/6, turno visible y ETA.
3. **60 s:** parqueadero lleno y liberación de celda; explicar por qué recibe reserva un acceso; probar no duplicación.
4. **90 s:** contratar valet en el acceso correcto, simular pago, entregar vehículo y ficho; estacionar, depositar llaves y reclamarlas.
5. **30 s:** mostrar pago rechazado/celda ocupada y una recuperación sin bloqueo.
6. **30 s:** impacto observable, limitaciones y prueba de iteración del prompting.

Adaptar a la duración de la interacción del juez; para finalistas, límite oficial **7 minutos**.

## 11. Qué NO haremos antes de completar el MVP

- Backend separado, autenticación, pagos reales, cámaras reales o infraestructura cloud.
- Modelos predictivos de IA en tiempo de ejecución para el ETA sin datos suficientes.
- Animación compleja del parqueadero que no mejore una prueba.
- Prometer sincronización real entre procesos o dispositivos si no existe.
- Añadir celdas fijas basadas en la figura ilustrativa del enunciado.

## 12. Gate final de entrega

- [ ] La aplicación se inicia localmente sin dependencias externas esenciales.
- [ ] Toda acción principal de cada rol tiene resultado o error explícito.
- [ ] Las 9 pruebas oficiales pasan en la versión final y son reproducibles.
- [ ] Reservas únicas, FIFO, capacidades y valets se validan automáticamente.
- [ ] Se ve el recorrido completo de vehículo y valet.
- [ ] Hay un fallo de prompt **real** corregido y verificado con evidencia.
- [ ] El equipo conoce limitaciones y puede explicarlas en menos de 30 segundos.
- [ ] Reinicio/reset y presentación ensayados antes del cierre de las **4:00 p. m.**.
