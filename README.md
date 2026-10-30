# parKING — Parqueadero inteligente universitario (Vibethon EAFIT 2026)

**Repositorio:** https://github.com/Pacha-e/Vibethon-2026 · Maratón de Vibe Coding NEXT × EAFIT, 30-10-2026.

parKING coordina los accesos **Las Vegas** (pasarela de 4 vehículos) y **Regional** (6) sobre **un único inventario de celdas**, muestra a cada conductor su turno y una espera estimada honesta, asigna las celdas con una política justa y declarada, y permite contratar uno de los **8 valets de su acceso** desde la pasarela. Funciona en local, sin nube ni base de datos.

## Ejecutar

```bash
npm install
```

```bash
npm run dev
```

Abrir http://127.0.0.1:5173. Pruebas: `npm test`. Build: `npm run build`.

## Vistas (una sola app local, una sola fuente de verdad)

| Vista | Usuario | Qué hace |
|---|---|---|
| 🚗 Conductor | Estudiante | Llegar a la fila, ver posición, vehículos delante, espera estimada, celda + recorrido, contratar valet, seguir el servicio |
| 🚧 Portería | Portero | Pasarelas LV 4 / RG 6 y filas exteriores, «Dar paso» al primero (solo si tiene celda o sale sin estacionar), mapa de celdas libre/reservada/ocupada |
| 🔑 Valet | Valets | 8 + 8 valets: Disponible / Reservado (pago) / En servicio; estacionar, depositar llaves, historial ingreso ↔ servicio |
| 🏢 Oficina | Oficina | Reclamación de llaves con ficho único y registro de entregas |
| 🧪 Simulación | Jurado / demo | Los 9 escenarios oficiales con un clic, reloj simulado, reinicio y bitácora de eventos |

## Política justa declarada

**Round Robin entre accesos + FIFO dentro de cada acceso.** Cada celda que se libera se reserva, en una sola transición, al primer vehículo sin celda del acceso al que le toca; si los dos accesos tienen demanda, recibe el acceso distinto al último servido; si solo uno tiene demanda, recibe ese. Los vehículos que ya cruzaron portería y encontraron su celda ocupada tienen prioridad para la reasignación. Contratar valet **no** da prioridad ni libera espacio en la pasarela.

**Ejemplo de beneficio (escenario 3):** con el parqueadero lleno esperan LVC301 y LVC302 (Las Vegas) y RGC303 (Regional). La 1.ª celda liberada va a LVC301; la 2.ª va a RGC303, aunque Las Vegas siga teniendo demanda. Ningún acceso acapara las celdas y cada celda tiene un único dueño.

## Espera estimada (sin inventar datos)

Se calcula la demanda que va delante según la política (FIFO propio + alternancia con el otro acceso) y el ritmo de liberación de celdas en los últimos 30 min simulados. Se muestra un **rango** etiquetado «estimado, no garantizado». Con menos de 2 liberaciones recientes se muestra **«datos insuficientes»**. Si la estimación supera 15 min se **sugiere** el valet, que se puede contratar igual con una espera menor.

## Arquitectura

React 18 + Vite + TypeScript + Tailwind. Motor puro y determinista (tiempo simulado, sin `Date.now()` ni aleatoriedad):

- `src/contracts/` — tipos y comandos compartidos.
- `src/domain/engine/` — filas, capacidades, asignación, reasignación, ETA.
- `src/features/valet/logic.ts` — valet, pago simulado, ficho, llaves.
- `src/state/reducer.ts` — `rootReduce`: **única** transición atómica, en la que se verifica y se reserva sin `await`. `batch` modela solicitudes simultáneas.
- `src/fixtures/` — fixture provisional y los 9 escenarios.

## Limitaciones conocidas

- **Datos provisionales:** los mapas, condiciones iniciales y eventos oficiales no llegaron al repositorio. Se usa un fixture del equipo (16 celdas en zonas A/B, 13 ocupadas al inicio, tarifa configurable de 8.000 COP, bloqueo de pago de 2 min). Se reemplaza con otro `SimConfig` sin tocar el motor.
- Una sola pestaña es la fuente de verdad: no hay sincronización entre pestañas ni dispositivos.
- Pagos, cámaras y llegadas son simulados (botones). El recorrido a la celda es un texto conceptual, no una ruta sobre un mapa real.
- El estado vive en memoria: al recargar la página se reinicia la simulación.

## Cómo lo construimos (prompting)

Un Team Lead (Claude) definió los contratos y delegó en agentes Haiku: motor, UI, valet/oficina, QA y logo. Ver [docs/05-PROMPTING-Y-EVIDENCIAS.md](docs/05-PROMPTING-Y-EVIDENCIAS.md), [docs/agents/](docs/agents/) y [evidence/](evidence/).

## Documentos

1. [Enunciado](docs/01-ENUNCIADO.md) · 2. [Rúbrica](docs/02-RUBRICA.md) · 3. [Plan](docs/03-PLAN-DE-ACCION.md) · 4. [Decisiones](docs/04-DECISIONES-Y-DUDAS.md) · 5. [Prompting y evidencias](docs/05-PROMPTING-Y-EVIDENCIAS.md)

## Normas mínimas para colaboradores y agentes (Fase 0, vigentes)

- No inventar reglas, celdas, tiempos ni resultados de pruebas.
- No sustituir los mapas/eventos oficiales por supuestos silenciosos.
- No modificar el motor de asignación desde componentes UI.
- Toda funcionalidad crítica debe tener escenario reproducible y prueba verificable.
- Registrar un fallo real de prompting, el prompt corregido y la verificación posterior para la rúbrica.

## Identidad visual — 3 propuestas de logo (skill `kaankiziltug/logo-design-skill`)

| Minimalista (recomendado) | Divertida | Formal |
|---|---|---|
| ![minimal](public/brand/renders/parking-minimal.png) | ![fun](public/brand/renders/parking-fun.png) | ![formal](public/brand/renders/parking-formal.png) |
| Corona oro sobre tile azul tinta; «par» ligera, **KING** bold | Corona inclinada y **KING** dentro de una píldora con letras oro | Escudo con anillo oro y corona; wordmark con serifas slab, tono institucional |

SVG en `public/brand/` (letras construidas como trazos, sin texto vivo). El favicon y la cabecera usan `parking-icon.svg`. Nota de contraste: el oro solo va sobre azul tinta, nunca sobre blanco.
