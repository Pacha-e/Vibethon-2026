# Vibethon — Línea de tiempo de planificación y prompting

**Proyecto:** Parqueadero inteligente universitario — NEXT × EAFIT, Vibethon 2026  
**Fecha de trabajo:** 30 de octubre de 2026  
**Repositorio:** https://github.com/Pacha-e/Vibethon-2026  
**Herramienta utilizada en esta etapa:** ChatGPT, dentro de un proyecto específico dedicado a Vibethon.  
**Alcance del registro:** desde la configuración del proyecto hasta la solicitud de preparar el prompt maestro para Claude Code. No se incluyen interacciones posteriores ni se afirma que Claude haya ejecutado tareas en este período.

## Criterio de documentación

Esta bitácora organiza las instrucciones, decisiones y entregables de planificación. Distingue los mensajes citados literalmente de las especificaciones técnicas redactadas para trabajar con las herramientas. **Los textos de especificación no se atribuyen a un mensaje literal ni a ejecuciones que no estén verificadas.**

---

## Etapa 1 — Configuración del proyecto en ChatGPT

**Herramienta:** ChatGPT, proyecto dedicado a la hackathon Vibethon.  
**Propósito:** usar ChatGPT como apoyo de coordinación, análisis, aterrizaje de ideas, priorización y supervisión, antes de delegar la implementación a otra herramienta de IA.

### Instrucción del proyecto

Texto de la instrucción configurada para el proyecto:

> Tu trabajo es de supervisor, lider y enrutador y aterrizador de ideas, para la hackathon "Vibethon", mira el enunciado y analisalo al completo, y dame ideas de accion

### Resultado esperado

- Comprender el reto en su totalidad.
- Separar reglas obligatorias, propuestas y ejemplos orientativos.
- Identificar decisiones importantes y escenarios límite.
- Diseñar una estrategia de implementación acorde con el tiempo disponible.
- Preparar el trabajo de los agentes de programación sin duplicar tareas.

**Estado:** instrucción de proyecto proporcionada. No constituye una ejecución de código.

---

## Etapa 2 — Presentación y descomposición del enunciado

**Interacción inicial registrada en la conversación:**

> este es el enunciado de la hackathon

El enunciado se organizó en la siguiente **especificación operativa en texto**, pensada para consulta, análisis y diseño técnico. Este bloque desarrolla los requisitos del reto como material de trabajo y no se presenta como una cita literal del mensaje inicial.

### Especificación del reto para planificación y prompting

~~~text
Este es el enunciado completo del reto de Vibethon, de NEXT EAFIT. Quiero que lo analices todo, no te saltes nada. Necesito que tengas claras las reglas, los casos especiales y todo lo que hay que demostrar, y que me propongas un plan realista para construirlo con IA.

El reto se llama Parqueadero inteligente universitario.

1. PROBLEMA Y OBJETIVO

En EAFIT, en horas pico, los conductores entran por Las Vegas y por Regional y hacen fila sin saber cuánto van a tener que esperar o si van a alcanzar una celda. Ambos accesos usan el mismo parqueadero, pero si no están coordinados se pueden producir asignaciones injustas, reservas duplicadas y estudiantes que llegan tarde a clase.

Tenemos que construir una aplicación que coordine ambos accesos, muestre la espera estimada para recibir una celda, asigne las celdas de manera justa y permita que el conductor contrate un valet desde la pasarela de registro para dejar el carro y poder irse a clase.

2. ALCANCE DEL PROTOTIPO

La solución se ejecuta localmente. No nos están pidiendo base de datos ni desplegar la aplicación en la nube. Podemos utilizar memoria o archivos locales, por ejemplo JSON, TXT o logs.

Las cámaras, el registro automático, los vehículos que llegan o salen y los pagos se van a simular. La organización va a proporcionar dos mapas, condiciones iniciales y eventos de simulación iguales para todos los equipos.

Hay dos entradas, pero la disponibilidad de celdas es compartida.

Las condiciones fijas son:
- Las Vegas: máximo 4 vehículos entre registro y portería.
- Regional: máximo 6 vehículos entre registro y portería.
- Las Vegas tiene 8 valets asignados a ese acceso.
- Regional tiene otros 8 valets asignados a ese acceso.
- El valet solo puede contratarse estando dentro de la pasarela del acceso correspondiente.

El croquis muestra ambos accesos, la circulación hacia un parqueadero común, zonas de celdas, salida y oficina de valets. Las 12 celdas que aparecen son ilustrativas, no es una capacidad definitiva que se pueda asumir. Tampoco podemos tomar el croquis como si fuera la geometría exacta del parqueadero real.

3. USUARIOS QUE DEBE TENER EL PRODUCTO

Conductor: consulta la espera, ve su turno, recibe una celda, puede contratar valet y seguir el estado del carro.

Portería: supervisa las filas de ambos accesos, la disponibilidad y los ingresos, y confirma la asignación del vehículo al llegar a portería.

Valet: acepta y actualiza los servicios y puede consultar los ingresos simulados asociados a sus contrataciones.

Oficina de valets: registra la recepción y devolución de las llaves mediante un ficho asociado al servicio.

4. REGISTRO, FILAS Y MOVIMIENTO DE VEHÍCULOS

Antes de registrarse el conductor puede consultar el estado de las filas y si hay disponibilidad.

Cuando cruza la línea de registro tenemos que asociar su placa y conductor, además del acceso y la hora de llegada. La aplicación debe mostrar cuántos vehículos están esperando antes y después del registro.

Si una pasarela está llena, el siguiente vehículo no puede registrarse allí y tiene que quedarse esperando afuera. Nunca se puede superar la capacidad fija del acceso.

Hay que respetar el orden físico de la fila. Dentro de la pasarela los carros no pueden retroceder ni simplemente desaparecer del sistema. Si un conductor decide salir sin estacionar, no necesita una celda, pero conserva su posición hasta que pueda avanzar, ingresar y circular a la salida.

En ambos accesos, el primer vehículo de la pasarela espera junto a la portería y el último junto al registro. Si avanza un vehículo y queda capacidad, el siguiente de la fila exterior puede entrar.

Entregar el carro a un valet no elimina al vehículo de su posición física y tampoco libera un cupo de la pasarela.

5. ESTIMACIÓN DE ESPERA

La aplicación tiene que mostrar la posición del conductor, cuántos vehículos están delante y cuánto se estima que va a esperar para recibir una celda.

Esta estimación debe actualizarse usando:
- Las celdas disponibles.
- El ritmo reciente de liberación de celdas.
- Las asignaciones recientes.
- La política de reparto de cupos entre Las Vegas y Regional.

Se puede utilizar un promedio reciente y mostrar un rango en minutos. Pero hay que diferenciar claramente entre una estimación y una garantía. Si no hay datos suficientes, debemos avisarlo en vez de inventar una cifra.

6. ASIGNACIÓN JUSTA DE CELDAS

Las dos entradas comparten un único inventario de celdas. Hay que conservar el orden de cada fila y explicar la política que decidamos usar para repartir las celdas entre ambos accesos. El enunciado no impone un algoritmo único, así que debemos elegir uno y poder justificarlo.

En el instante en que se asigna una celda se debe reservar y la reserva debe quedar compartida inmediatamente. No se puede asignar una misma celda a dos vehículos ni permitir reservas duplicadas.

El conductor tiene que poder ver la zona, número de celda y recorrido para llegar a ella. En portería se confirma cuál es el vehículo y qué celda tiene reservada.

Los estados de las celdas son:
- Libre.
- Reservada.
- Ocupada.

La celda se marca ocupada cuando el vehículo se estaciona y vuelve a libre al salir.

Si al llegar una celda asignada resulta estar ocupada, el sistema debe informar el problema y resolver una reasignación sin perder el vínculo entre el conductor, el vehículo y su turno.

Los estados no pueden depender solamente de colores: deben verse también en texto o símbolos.

7. CONTRATACIÓN DEL VALET

El conductor solo puede contratar a un valet después de ingresar a la pasarela, y únicamente si hay uno disponible en su acceso.

La interfaz debe mostrar disponibilidad y precio. Si la espera estimada supera 15 minutos, la aplicación debe sugerir contratar valet, pero el conductor puede contratarlo aunque la espera sea menor.

El servicio tiene tres momentos principales:

A. Selección y pago:
- El conductor selecciona un valet.
- Hay que reservarlo temporalmente para que otro conductor no pueda contratarlo al mismo tiempo.
- Se simula el pago.
- Si se aprueba, se confirma la contratación y el ingreso simulado queda vinculado a ese valet.
- Si se rechaza el pago o vence la reserva temporal, se libera el valet.
- Un pago fallido no cambia ni elimina el turno del conductor.

B. Entrega del vehículo:
- El valet recibe el carro.
- Entrega un ficho con un código único asociado a ese servicio.
- Debe quedar confirmada la entrega antes de que el estudiante se vaya a clase.
- El vehículo mantiene su posición en la fila.
- El valet espera a que se le asigne celda según las reglas normales.

C. Estacionamiento y llaves:
- El valet ingresa con el vehículo.
- Lo estaciona y registra dónde quedó.
- Deposita las llaves en la oficina.
- Solo cuando deposita las llaves vuelve a estar disponible.
- El conductor reclama el carro o las llaves presentando su ficho, y la oficina registra la entrega.

El valet no tiene prioridad sobre los demás conductores, no libera espacio en la pasarela al recibir el carro y puede continuar ocupado incluso después de que el vehículo haya abandonado la pasarela.

8. INFORMACIÓN QUE SE DEBE MOSTRAR

Antes de asignar la celda: acceso, placa, turno, vehículos delante y espera estimada.

Al contratar valet: disponibilidad, precio, resultado del pago y confirmación de la entrega del carro.

Después: celda asignada y recorrido, o seguimiento del servicio de valet.

Al finalizar: ubicación del vehículo, código de ficho y estado de las llaves.

Las pantallas sugeridas incluyen:
- Mi turno.
- Contratar valet.
- Mi vehículo.
- Portería y estado de accesos.
- Panel de valet.
- Oficina de llaves.

Son pantallas orientativas. Podemos elegir el diseño, pero no podemos quitar la información ni las reglas. La tarifa de $8.000 COP, las placas, códigos y tiempos de los ejemplos no son datos obligatorios.

El valet debe distinguir claramente sus estados:
- Disponible.
- Reservado mientras se realiza el pago.
- En servicio.

También se debe poder consultar un historial que vincule cada ingreso simulado con su servicio. Todas las vistas pueden estar dentro de una misma aplicación local.

9. DEMOSTRACIÓN DEL PRODUCTO

Tenemos que demostrar un flujo completo del vehículo:
llegada -> registro -> espera -> asignación -> estacionamiento -> salida.

Y también un recorrido completo del servicio valet:
contratación -> pago -> entrega del vehículo -> ficho -> asignación y estacionamiento -> depósito de llaves -> reclamación de llaves.

10. LOS NUEVE CASOS DE PRUEBA

1) Pasarela llena:
El siguiente vehículo espera afuera. No pueden superarse 4 en Las Vegas ni 6 en Regional.

2) Parqueadero lleno:
La fila se conserva y la espera se actualiza. No se pueden inventar cupos.

3) Se libera una celda:
Debe asignarse conforme a nuestra política de reparto y quedar reservada para un único vehículo.

4) Solicitudes simultáneas:
No se puede duplicar una celda ni contratar dos veces al mismo valet.

5) Pago rechazado:
El servicio no se confirma; el valet se libera y el conductor conserva su posición.

6) Todos los valets ocupados:
Se informa que no hay disponibilidad, pero la espera normal del parqueadero continúa.

7) Salida sin estacionar:
El vehículo avanza por el recorrido; no desaparece inmediatamente de la fila.

8) Celda asignada ocupada:
Se informa el incidente y se resuelve la reasignación sin perder el vínculo con el vehículo.

9) Reclamación de llaves:
El ficho permite identificar el servicio y la oficina registra que entregó las llaves.

11. LO QUE NECESITO QUE HAGAS

Quiero que analices el enunciado completo y lo descompongas en requisitos técnicos, reglas de negocio, estados, casos límite y pruebas verificables.

No quiero que empecemos directamente a programar sin una estrategia. Primero identifica qué es obligatorio, qué ejemplos son solo ilustrativos, qué información oficial todavía falta, qué algoritmo conviene para asignar de manera justa las celdas y cómo convendría implementar la simulación.

Propón una arquitectura simple para una hackathon corta, prioriza el MVP, organiza el trabajo entre agentes de IA y plantea un recorrido de demostración que muestre los puntos importantes de forma verificable.

Quiero que seas supervisor del desarrollo y que priorices funcionalidad real, coherencia de estados, integración y evidencia antes que características adicionales. Si algún dato no está definido por el enunciado, márcalo como supuesto o decisión pendiente.
~~~

### Uso de la especificación

El texto anterior organiza el reto como instrucción reutilizable para la etapa de planificación. Mantiene la distinción entre **requisito oficial**, **ejemplo visual** y **propuesta técnica**. El enunciado organizado y consultable quedó recogido en [01-ENUNCIADO.md](01-ENUNCIADO.md).

---

## Etapa 3 — Análisis inicial realizado con ChatGPT

**Herramienta:** ChatGPT.  
**Entrada:** petición inicial de análisis y enunciado de Vibethon.  
**Resultado:** propuesta de solución, riesgos y estrategia de trabajo.

### Hallazgos principales

1. El reto exige principalmente un **motor confiable de coordinación**, no solo pantallas: hay que mantener capacidad, FIFO físico, celdas únicas, reservas y estados correctos.
2. Los accesos tienen filas distintas y **celdas compartidas**: la justicia entre entradas debe declararse, justificarse y comprobarse.
3. Se propuso inicialmente **Round Robin entre accesos elegibles con FIFO dentro de cada acceso**; se identificó expresamente como propuesta, no como regla impuesta.
4. El ETA debe usar datos de disponibilidad y liberación. Sin datos suficientes, se muestra incertidumbre en lugar de una cifra inventada.
5. El valet debe modelarse por separado de la posición física del vehículo. La contratación no modifica prioridad ni espacio en pasarela.
6. Se identificó una arquitectura inicialmente posible con frontend y backend, que después se simplificó a una SPA local con un único motor de estados para reducir puntos de fallo.
7. Se preparó la idea de distribuir implementación entre motor, UI, valet/oficina, pruebas e integración bajo supervisión.

### Resultado verificable de la etapa

Quedaron definidos los criterios de planificación: requisitos, restricciones, estados, invariantes, nueve situaciones de prueba, política propuesta, prioridad del MVP y recorrido para el jurado. **En esta etapa no se afirmó tener una aplicación implementada ni pruebas ejecutadas.**

---

## Etapa 4 — Creación y planificación del repositorio

### Instrucción de trabajo (resumen)

Se pidió establecer primero el enunciado y el plan de acción en el repositorio del proyecto, antes de desarrollar código. Esta sección resume el objetivo de la petición, sin presentarlo como cita literal.

**Objetivo:** disponer de un repositorio documentado y organizado antes de escribir el código.

### Trabajo realizado con asistencia de ChatGPT y herramientas de GitHub

El repositorio `Pacha-e/Vibethon-2026` se verificó inicialmente vacío. Se creó el README y se organizaron cinco documentos de trabajo:

| Archivo | Contenido |
|---|---|
| [README.md](../README.md) | Descripción, alcance, fuentes y secuencia de trabajo. |
| [01-ENUNCIADO.md](01-ENUNCIADO.md) | Cuatro páginas del reto estructuradas en requisitos funcionales y casos oficiales. |
| [02-RUBRICA.md](02-RUBRICA.md) | Cinco categorías de evaluación, 20 criterios y evidencia prevista. |
| [03-PLAN-DE-ACCION.md](03-PLAN-DE-ACCION.md) | MVP, arquitectura propuesta, estados, invariantes, fases, QA y demo. |
| [04-DECISIONES-Y-DUDAS.md](04-DECISIONES-Y-DUDAS.md) | Confirmaciones oficiales, decisiones propuestas e insumos pendientes. |
| [05-PROMPTING-Y-EVIDENCIAS.md](05-PROMPTING-Y-EVIDENCIAS.md) | Bitácora de planificación y prompting; este documento. |

También se abrieron seis tareas en GitHub:

- [#1 — Mapas, condiciones iniciales y eventos oficiales](https://github.com/Pacha-e/Vibethon-2026/issues/1).
- [#2 — Motor de colas, celdas y asignación justa](https://github.com/Pacha-e/Vibethon-2026/issues/2).
- [#3 — Interfaces de conductor y portería](https://github.com/Pacha-e/Vibethon-2026/issues/3).
- [#4 — Valet y oficina de llaves](https://github.com/Pacha-e/Vibethon-2026/issues/4).
- [#5 — Nueve situaciones de prueba oficiales](https://github.com/Pacha-e/Vibethon-2026/issues/5).
- [#6 — Demostración, UI/UX y evidencia de prompting](https://github.com/Pacha-e/Vibethon-2026/issues/6).

### Ajustes de enfoque documentados

- El prototipo debe ser **local y demostrable**: no se necesitan pagos reales, cámaras, base de datos ni despliegue.
- Para una hackathon de corta duración, la propuesta se concretó en **React + Vite + TypeScript**, motor determinista centralizado y pruebas con Vitest, sujeto a validación técnica.
- Se priorizaron operaciones atómicas y pruebas reproducibles por encima de microservicios o animaciones costosas.
- Se reservaron tareas independientes para que varias IAs pudieran colaborar sin editar los mismos archivos.
- Se identificó como dependencia pendiente la incorporación de **dos mapas, condiciones iniciales y eventos** que debe suministrar la organización.

**Evidencia disponible:** archivos y seis issues creados en el repositorio. El historial de commits permite verificar su incorporación; todavía no certifica el funcionamiento de un MVP.

---

## Etapa 5 — Solicitud de orquestación con Claude y agentes Haiku

### Prompt registrado — fragmento pertinente de la solicitud

> dame el prompt completo para claude para iniciar el plan delegando a modelos haiku, tiene que ser de manera que los subajentes n tengan que leer el contexto cada vez, que trabajen en equipo, puedan hablarse entre si y no se superpongan en su trabajo, tambien hay que ir construyendo un log de prompts en el repositorio de cada prompt con la herramienta

### Objetivos solicitados

- Preparar un **prompt maestro de inicio** para Claude Code.
- Usar Claude como coordinador y Haiku para el trabajo de implementación delegable.
- Dar a cada subagente **contexto mínimo, específico y reutilizable**, evitando lecturas completas y repetidas del enunciado.
- Permitir **comunicación directa entre agentes** y compartir información sobre contratos, bloqueos y entregables.
- Establecer **propiedad de archivos** para evitar superposiciones de trabajo.
- Conservar un **registro de los prompts** por medio de las herramientas de ejecución, con trazabilidad de iteraciones y correcciones.

**Estado al cierre de esta línea de tiempo:** petición del prompt maestro realizada. El registro termina en esta solicitud deliberadamente; **no incluye la respuesta posterior con el prompt maestro, interacciones siguientes, ejecución de Claude Code ni resultados de la aplicación**.

---

## Etapa 6 — Ejecución con Claude Code: Team Lead + agentes Haiku (30-10-2026, 14:44–16:00 COL)

### Prompt maestro

El prompt de arranque está guardado **textualmente** en [evidence/prompts/BOOTSTRAP-PROMPT.md](../evidence/prompts/BOOTSTRAP-PROMPT.md). Se copió del transcript JSONL de la sesión líder (incluye su SHA-256) y se identifica como **registro inicial incorporado manualmente**: los hooks se instalaron después de recibir ese mensaje.

### Orquestación real

| Agente | Modelo solicitado | Tarea (cápsula) | Resultado verificado |
|---|---|---|---|
| Team Lead | Claude (principal) | Contratos, store, config, escenarios, integración | `src/contracts`, `src/state`, `src/fixtures`; build y E2E |
| engine-haiku | `haiku`, effort `xhigh` | [T1-ENGINE](agents/TASKS/T1-ENGINE.md) | 29 tests del motor en verde |
| valet-haiku | `haiku`, effort `xhigh` | [T3-VALET](agents/TASKS/T3-VALET.md) | 19 tests de valet en verde |
| ui-haiku | `haiku`, effort `xhigh` | [T2-UI](agents/TASKS/T2-UI.md) | 5 vistas sin errores de consola (Playwright) |
| qa-haiku | `haiku`, effort `xhigh` | [T4-QA](agents/TASKS/T4-QA.md) | 22 pruebas propias (invariantes, 9 escenarios, flujos); suite total 70/70 |
| logo-haiku | `haiku`, effort `xhigh` | Skill `kaankiziltug/logo-design-skill` | ver `public/brand/` |

**Sustitución declarada:** esta sesión de Claude Code no ofrecía *Agent Teams* (no existía la herramienta de creación de equipos). Se usaron subagentes en segundo plano (`Agent` con `model: haiku`), la lista compartida de tareas (`TaskCreate`/`TaskUpdate`, con T4 bloqueada por T1 y T3) y `SendMessage` para continuar a un agente con su contexto. Cada agente recibió solo su cápsula, los contratos y las rutas que podía editar.

### Registro de prompts — estado real

- **Hooks** (`.claude/settings.json` → `scripts/prompt_logger.py`): UserPromptSubmit, PreToolUse/PostToolUse (Agent, SendMessage, TaskCreate, TaskUpdate), SubagentStart/SubagentStop. Escriben JSONL append-only por sesión en `evidence/prompts/<fecha>/<sesión>.jsonl`, con hash SHA-256 y secretos enmascarados. La autoprueba con un evento simulado escribió una línea correcta (token enmascarado como `token=***`).
- **Limitación observada:** en esta sesión los hooks **no se dispararon** (ningún archivo se creó tras un `TaskCreate` real). La sesión se inició en `/home/user`, no en el repositorio, y copiar los hooks a la configuración de ese directorio fue **denegado por el control de permisos**. No se forzó. Los hooks quedan activos para quien abra Claude Code dentro del repositorio.
- **Respaldo verificable:** `scripts/export_transcript_prompts.py` extrae del **transcript real** de Claude Code (sesión líder + subagentes) los turnos de usuario, cada instrucción `Agent`/`SendMessage`/`TaskCreate`/`TaskUpdate` y los prompts recibidos por cada subagente. Salida: `evidence/prompts/2026-10-30/<sesión>.transcript-export.jsonl` (`capture: "transcript-export"`). No reconstruye mensajes: solo exporta lo que figura en el transcript.

### Ciclo real de corrección de prompt (fallo → corrección → nueva ejecución → prueba)

1. **Prompt utilizado:** la cápsula T2-UI pedía un componente `Toast` que mostrara `useSim().feedback`, sin decir dónde debía montarse. El Team Lead ya lo montaba en `App.tsx`.
2. **Resultado esperado:** un único aviso global por acción.
3. **Fallo observado:** ui-haiku renderizó `<Toast />` dentro de `DriverView`, `GateView` y `SimView`, y lo reportó en su `DONE` («no duplicar Toast en App (cada vista lo renderiza)»). Con el montaje de `App.tsx`, cada acción mostraba **dos** avisos. El fallo se detectó al revisar el reporte y con `grep -n "Toast" src/features/*/*.tsx` (3 coincidencias). La causa fue una instrucción ambigua del Team Lead, no un error del modelo.
4. **Corrección:** el Lead integró (quitó los montajes por vista) y reenvió a ui-haiku la tarea T2-UI-POLISH con la **regla corregida**: «Toast se monta UNA sola vez en App.tsx; ninguna vista lo importa ni renderiza», más el autocierre a 6 s y la autoselección del vehículo. La regla quedó también en la cápsula T2-UI.
5. **Nueva ejecución:** ui-haiku completó T2-UI-POLISH sin volver a introducir `<Toast />` en las vistas (`tsc` limpio).
6. **Prueba posterior:** [evidence/test-results/toast-single-mount.txt](../evidence/test-results/toast-single-mount.txt), con Playwright sobre la app real. Resultado: exactamente 1 aviso visible en Conductor, Portería y Simulación, 0 tras 6,5 s, autoselección del vehículo correcta y sin errores de página. Script: `evidence/test-results/toast-check.playwright.cjs`.

### Segundo ciclo real: QA detecta una contradicción de contrato

1. **Instrucción/contrato:** `src/contracts/types.ts` decía «si `error` existe, `state` es el de entrada». La cápsula T4-QA pedía verificar los contratos y `batch` (solicitudes simultáneas).
2. **Esperado por QA:** un `batch` con un subcomando rechazado no cambia nada.
3. **Fallo observado:** `tests/flows.test.ts` falló (21 pass / 1 fail; [vitest-qa.txt](../evidence/test-results/vitest-qa.txt)). `rootReduce` aplicaba el primer `valetHold` y rechazaba el segundo. qa-haiku lo reportó como `REVIEW` sin tocar código ajeno.
4. **Corrección (decisión del Lead):** para el escenario 4, el comportamiento deseado es que **cada subcomando sea atómico**: el primero reserva el valet y el segundo recibe «no disponible». El contrato estaba mal redactado, no el motor. Se documentó la excepción en `types.ts` y `CONTRACTS.md`, y se reenvió a qa-haiku una instrucción precisa: renombrar la prueba y verificar que el aceptado se aplica, el rechazado no deja efecto, se crea exactamente 1 servicio y las invariantes se mantienen.
5. **Nueva ejecución:** qa-haiku actualizó la prueba.
6. **Prueba posterior:** suite completa **70 pass / 0 fail** ([vitest-final.txt](../evidence/test-results/vitest-final.txt)). El Team Lead la reejecutó por su cuenta con el mismo resultado y `tsc` limpio.

### Incidencias de agentes registradas

- engine-haiku informó una llamada accidental a una herramienta de creación de sesiones remotas, ajena a su tarea. El control de permisos la denegó y no creó nada. Queda anotada como riesgo de herramientas excesivas en subagentes: conviene limitar sus herramientas en la próxima iteración.
- ui-haiku se desvió de una instrucción con un motivo: detecta el vehículo nuevo comparando con el estado previo en lugar de buscarlo en los eventos. El cambio fue aceptado.

### Índice de evidencias

| Evidencia | Ruta |
|---|---|
| Prompt de arranque (manual, textual) | `evidence/prompts/BOOTSTRAP-PROMPT.md` |
| Prompts observados (transcript) | `evidence/prompts/2026-10-30/*.transcript-export.jsonl` |
| Logger + hooks | `scripts/prompt_logger.py`, `.claude/settings.json` |
| Exportador de transcript | `scripts/export_transcript_prompts.py` |
| Contexto compacto y cápsulas | `CLAUDE.md`, `docs/agents/` |
| Resultados de pruebas | `evidence/test-results/` |
