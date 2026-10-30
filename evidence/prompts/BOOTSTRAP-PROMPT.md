# BOOTSTRAP PROMPT — registro inicial incorporado manualmente

> **Origen:** primer turno de usuario de la sesión líder, copiado textualmente desde el transcript JSONL de Claude Code (`19dcf275-3217-5128-aa54-84818585c575.jsonl`, 2026-10-30T19:44:24.868Z). **No** es una captura del hook: los hooks se instalaron después de recibir este mensaje.
> SHA-256 del texto: `e5eeb7937b045772ae3891f91c2512c5deec069b19bded4865a3b374b4a1f108`

---

# VIBETHON — ORQUESTACIÓN MULTIAGENTE Y EJECUCIÓN DEL MVP DE NOMBRE parKING

## 1. Tu rol

Actúa como **Team Lead, arquitecto principal, supervisor técnico e integrador** del proyecto Vibethon.

Repositorio: `https://github.com/Pacha-e/Vibethon-2026`

Tu responsabilidad no es escribir toda la aplicación. Debes organizar el trabajo, establecer contratos, delegar a agentes Haiku, supervisar sus resultados, detectar errores de integración y mantener una aplicación funcional y demostrable.

Queremos utilizar **Claude Code Agent Teams**, con comunicación directa entre compañeros, lista de tareas compartida, dependencias explícitas y sesiones persistentes.

**No sustituyas Agent Teams por varias invocaciones independientes de subagentes si la funcionalidad de equipos está disponible.**

Trabaja con autonomía en decisiones técnicas reversibles. Escala únicamente bloqueos reales o decisiones que comprometan significativamente el cumplimiento del reto.

## 2. Objetivo del proyecto

Desarrollar una aplicación local para gestionar el parqueadero universitario de EAFIT, compartido por los accesos Las Vegas y Regional.

Requisitos fundamentales:

- Las Vegas: capacidad máxima de 4 vehículos dentro de la pasarela.
- Regional: capacidad máxima de 6 vehículos dentro de la pasarela.
- Ambos accesos utilizan un inventario único de celdas.
- Cada acceso dispone de 8 valets.
- Las filas deben conservar su orden físico.
- Las celdas tienen estados libre, reservada y ocupada.
- Debe existir asignación justa, con política explicable.
- **No se permiten asignaciones duplicadas.**
- Deben mostrarse posiciones, vehículos delante y estimaciones de espera basadas en información disponible.
- El conductor puede contratar valet únicamente desde su pasarela y con un valet de su acceso.
- La contratación incluye reserva temporal, pago simulado, entrega del vehículo, ficho único, estacionamiento y depósito de llaves.
- El valet solo queda disponible tras depositar las llaves.
- La oficina registra la reclamación y entrega de llaves.
- Deben resolverse los nueve escenarios de prueba oficiales.
- El prototipo funciona localmente, sin necesidad de servicios cloud.

La evaluación considera cinco categorías de 20 puntos: funcionalidad, diseño UI/UX, calidad del prompting, impacto y presentación.

Tenemos que producir una solución funcional, visualmente cuidada, confiable y fácil de demostrar.

## 3. Fuentes de verdad

En el repositorio ya existe documentación inicial:

- `docs/01-ENUNCIADO.md`
- `docs/02-RUBRICA.md`
- `docs/03-PLAN-DE-ACCION.md`
- `docs/04-DECISIONES-Y-DUDAS.md`
- `docs/05-PROMPTING-Y-EVIDENCIAS.md`

**Como Team Lead, lee estos cinco archivos una vez al comenzar.**

Contrasta requisitos y propuestas técnicas. Revisa el estado real de Git, la rama, el entorno y los archivos existentes.

Los dos mapas, las condiciones iniciales y los eventos oficiales de simulación pueden no estar todavía disponibles. Verifica su presencia antes de implementar. Si faltan, utiliza fixtures provisionales claramente identificados y una arquitectura que permita sustituirlos.

No asumas que existen exactamente 12 celdas ni que la tarifa ilustrativa de $8.000 COP es obligatoria.

No envíes estos cinco documentos completos a todos los agentes.

## 4. Política de modelos y consumo de contexto

El Team Lead permanece en el modelo principal de Claude.

Los trabajadores deben ejecutarse explícitamente con **modelo Haiku-5.5/effort:xhight** cuando esté disponible. Confirma el modelo seleccionado al crearlos. Si la configuración impide utilizarlo, informa la sustitución; no supongas que se aplicó.

La regla general es:

**El modelo principal piensa, coordina y verifica; Haiku implementa tareas pequeñas y delimitadas.**

Minimiza el consumo mediante estas prácticas:

1. Crea una única fuente resumida de contexto para el proyecto.
2. Mantén el archivo raíz `CLAUDE.md` corto, orientado a contratos, rutas y reglas esenciales.
3. No dupliques todo el enunciado en `CLAUDE.md`.
4. Cada compañero recibe solo su tarea, interfaces, restricciones y criterios de aceptación.
5. Mantén las sesiones de los compañeros existentes mientras aporten valor. No crees un agente nuevo para cada subtarea.
6. No hagas que los agentes recorran todo el repositorio en cada asignación.
7. Limita las respuestas rutinarias a resultados, bloqueos, archivos modificados y pruebas.
8. Devuelve al Team Lead únicamente información nueva o materialmente relevante.
9. No actives múltiples agentes para discutir problemas triviales que pueda resolver un único trabajador.
10. Evita lecturas repetidas de configuración global y documentación extensa.

No modifiques el setup global de las CLI ni las configuraciones personales del usuario sin autorización.

## 5. Preparar contexto compacto y persistente

Antes de lanzar los trabajadores, crea:

- `CLAUDE.md`: reglas esenciales, con contenido mínimo.
- `docs/agents/PROJECT-BRIEF.md`: resumen operativo del reto.
- `docs/agents/CONTRACTS.md`: estados, comandos, interfaces y responsabilidades.
- `docs/agents/STATUS.md`: progreso, bloqueos, decisiones recientes y siguientes pasos.
- `docs/agents/TASKS/`: cápsulas de tareas independientes.

El brief deberá explicar el proyecto sin necesidad de consultar el enunciado completo.

Cada cápsula debe contener:

- ID de tarea y objetivo.
- Agente propietario.
- Modelo requerido.
- Archivos y directorios permitidos.
- Interfaces de entrada y salida.
- Dependencias.
- Restricciones relevantes.
- Criterios de aceptación.
- Pruebas concretas.
- Qué debe comunicar al terminar.

Objetivo: aproximadamente 300–700 tokens por cápsula siempre que la tarea lo permita.

Cuando un trabajador necesite más información, debe solicitar únicamente el fragmento específico al Team Lead o al compañero responsable.

No repitas el contexto completo por defecto.

## 6. Organización del equipo

Crea un Agent Team con estos compañeros, utilizando nombres estables.

### A. engine-haiku

Modelo: Haiku.

Responsabilidad:

- Motor de simulación.
- Filas y capacidades.
- Registro de vehículos.
- Asignación justa entre accesos.
- Reservas y ocupación de celdas.
- Manejo de concurrencia lógica.
- Estimaciones de espera.
- Reasignación cuando una celda aparezca ocupada.

Propiedad exclusiva:

- `src/domain/engine/**`
- Pruebas unitarias propias del motor.

No puede editar las interfaces, los contratos centrales ni los archivos de configuración del proyecto.

### B. ui-haiku

Modelo: Haiku.

Responsabilidad:

- Diseño visual y experiencia de usuario.
- Vista del conductor.
- Vista de portería.
- Mapa y estados de celdas.
- Turnos, estimaciones, confirmaciones y notificaciones.
- Componentes reutilizables y accesibilidad.

Propiedad exclusiva:

- `src/features/driver/**`
- `src/features/gate/**`
- `src/components/**`
- `src/styles/**`

No debe crear un segundo motor de simulación.

Puede usar adaptadores temporales para desarrollar interfaces antes de completar la integración.

### C. valet-haiku

Modelo: Haiku.

Responsabilidad:

- Disponibilidad de valets por acceso.
- Bloqueo temporal durante pago.
- Aprobación y rechazo de pagos simulados.
- Creación de fichos únicos.
- Entrega y seguimiento del vehículo.
- Registro de estacionamiento.
- Depósito y reclamación de llaves.
- Historial de servicios e ingresos simulados.

Propiedad exclusiva:

- `src/features/valet/**`
- `src/features/office/**`

Debe consumir los contratos compartidos sin crear estados paralelos incompatibles.

### D. qa-haiku

Modelo: Haiku.

Responsabilidad:

- Pruebas de invariantes.
- Los nueve escenarios del enunciado.
- Reproducción de errores.
- Revisión de flujos completos.
- Validación de que las correcciones realmente solucionan el fallo.
- Preparación de evidencia verificable de pruebas.

Propiedad exclusiva:

- `tests/**`
- `evidence/test-results/**`

Este agente se incorpora cuando los contratos estén establecidos y exista trabajo verificable. Puede revisar contratos antes, pero no debe permanecer consumiendo contexto mientras espera código.

### E. Team Lead

Responsabilidad exclusiva:

- Arquitectura y contratos compartidos.
- `src/contracts/**`
- `src/state/**`
- `src/App.tsx`
- `src/main.tsx`
- Configuración de Vite, TypeScript y pruebas.
- `package.json`, lockfile y dependencias.
- `CLAUDE.md`, `.claude/**` y scripts de automatización.
- Integración de módulos.
- Documentación.
- Commits, coordinación Git y cierre de entregables.
- Control de calidad y priorización final.

Puedes modificar otras zonas únicamente cuando el agente propietario haya entregado el trabajo o autorizado explícitamente el cambio.

## 7. Comunicación entre agentes

Utiliza la lista compartida de tareas de Agent Teams y las herramientas de mensajería disponibles en esta versión de Claude Code.

Los compañeros deben poder enviarse mensajes directamente.

Establece este protocolo:

**BLOCKER**

Un agente necesita información o tiene una dependencia que impide continuar.

Formato:

`BLOCKER | tarea | destinatario | dato necesario | impacto`

**CONTRACT**

Un agente solicita un cambio en una interfaz compartida.

Formato:

`CONTRACT | tarea | cambio solicitado | motivo | módulos afectados`

El cambio debe aprobarlo el Team Lead antes de aplicarse.

**READY**

Un agente finalizó un componente reutilizable.

Formato:

`READY | tarea | archivos | interfaz disponible | pruebas`

**REVIEW**

Un agente detectó un posible error en el módulo de otro.

Formato:

`REVIEW | tarea | problema | evidencia | propuesta`

**DONE**

Un agente completó su tarea.

Formato:

`DONE | tarea | resultado | pruebas ejecutadas | riesgos restantes`

Reglas:

- Los mensajes deben ser breves y orientados a decisiones.
- Los agentes pueden hablar directamente entre ellos sobre contratos y dependencias.
- El Team Lead recibe las decisiones que afecten arquitectura, prioridades o integración.
- Ningún agente puede alterar archivos de otro sin coordinación.
- No dupliques el trabajo porque otro agente tarde en responder.
- Las tareas bloqueadas deben permanecer bloqueadas en el tablero.
- Las tareas completadas deben respaldarse con entregables verificables.
- Evita reuniones constantes entre todos los agentes.

## 8. Registro automático de todos los prompts observables

Esta es una exigencia prioritaria del proyecto.

Queremos mantener un registro reproducible de las instrucciones utilizadas para dirigir la IA, incluida la delegación y las correcciones.

**Implementa el registro mediante Claude Code Hooks.**

Crea:

- `scripts/prompt_logger.py`
- `.claude/settings.json`, respetando configuraciones existentes.
- `evidence/prompts/`
- Un índice dentro de `docs/05-PROMPTING-Y-EVIDENCIAS.md`.

Utiliza Python estándar, sin dependencias adicionales.

Configura los siguientes eventos cuando la versión instalada los soporte:

**UserPromptSubmit**

Registrar las instrucciones que envíen los miembros humanos del equipo a Claude.

**PreToolUse**

Capturar las instrucciones entregadas mediante la herramienta `Agent` y los mensajes dirigidos mediante `SendMessage`, o los nombres equivalentes que exponga la versión instalada.

**PostToolUse**

Registrar el resultado o estado de las operaciones relevantes, cuando el evento proporcione información verificable.

**SubagentStart, SubagentStop y eventos de equipo disponibles**

Relacionar el ciclo de vida del agente con su sesión y tarea, sin afirmar que esos eventos contienen el texto completo de todos los prompts.

No necesitas registrar cada lectura o edición de archivos como si fuese un prompt.

### Formato del registro

Cada entrada debe conservar, cuando los datos estén disponibles:

- Fecha y hora UTC.
- ID de sesión.
- Agente emisor.
- Agente receptor, si existe.
- Modelo, si está disponible.
- ID de tarea.
- Tipo de evento.
- Texto del prompt o mensaje observable.
- Origen de la captura.
- Hash SHA-256 del contenido registrado.
- Referencia al resultado o prueba, cuando exista.

Utiliza archivos JSONL append-only separados por sesión, por ejemplo:

`evidence/prompts/2026-10-30/<session-id>.jsonl`

Esto evita que varios compañeros modifiquen simultáneamente el mismo archivo de registro.

El sistema debe:

1. Escribir mediante operaciones de anexado seguras.
2. No sobrescribir eventos anteriores.
3. No depender de un LLM para guardar cada prompt.
4. No imprimir los prompts completos en la conversación del Team Lead.
5. No guardar secretos, tokens, contraseñas o datos sensibles sin enmascarar.
6. Registrar de forma diferenciada los eventos que no se hayan podido capturar.
7. No atribuir automáticamente a un humano instrucciones redactadas por un agente.
8. Evitar generar commits por cada evento.
9. Permitir consolidar y versionar la bitácora al finalizar cada fase.
10. Verificar su funcionamiento con un evento real antes de considerarlo activo.

Los logs deben reflejar las instrucciones efectivamente observadas; no se deben reconstruir mensajes internos desconocidos.

### Caso especial: este prompt de arranque

La instalación de los hooks sucede después de recibir este primer mensaje.

Guarda una copia fiel del prompt inicial en:

`evidence/prompts/BOOTSTRAP-PROMPT.md`

Identifícala como registro inicial incorporado manualmente, no como captura automática del hook.

A partir de que el logger esté activo, utiliza los eventos reales.

Si Claude Code necesita reiniciarse para cargar los hooks, guarda primero el estado de la sesión, comprueba la configuración y continúa desde el checkpoint.

### Evidencia para la rúbrica

Además del log automático, documenta al menos un ciclo real de:

1. Prompt utilizado.
2. Resultado esperado.
3. Fallo observado.
4. Corrección de la instrucción.
5. Nueva ejecución.
6. Resultado de la prueba posterior.

No fabriques fallos, ejecuciones, capturas ni resultados.

Cuando exista un fallo real, aprovéchalo como una oportunidad para demostrar la metodología de prompting.

## 9. Arquitectura de la aplicación

La propuesta inicial es una SPA local con:

- React.
- Vite.
- TypeScript.
- Tailwind CSS.
- Motor de dominio determinista.
- Un único estado compartido.
- Vitest.
- Simulación reproducible y reiniciable.
- Registro de eventos de simulación.

No implementes microservicios, autenticación real, infraestructura en la nube ni integraciones externas si no son necesarias para el reto.

Un backend separado requiere justificación. La aplicación será evaluada en el computador del equipo, por lo que la simplicidad y confiabilidad de la demostración tienen prioridad.

Utiliza una única instancia como fuente de verdad para el MVP. No prometas sincronización transaccional entre pestañas, procesos o dispositivos si no está implementada.

Establece contratos de datos antes de desarrollar componentes en paralelo.

## 10. Invariantes obligatorias

El motor debe verificar:

1. Las Vegas nunca supera cuatro vehículos dentro de la pasarela.
2. Regional nunca supera seis vehículos dentro de la pasarela.
3. Una celda no puede reservarse para dos vehículos.
4. Una celda reservada no se considera disponible.
5. El orden FIFO dentro de cada acceso se mantiene.
6. La contratación de valet no concede prioridad.
7. La contratación de valet no libera espacio físico de la pasarela.
8. Un valet no puede tener dos servicios activos o reservas simultáneas.
9. El rechazo o vencimiento de un pago conserva el turno del conductor.
10. El valet vuelve a disponible únicamente después del depósito de llaves.
11. La reclamación de llaves requiere un ficho válido, vinculado al servicio.
12. La salida sin estacionar no elimina prematuramente al vehículo de la fila.
13. Las reasignaciones conservan la asociación con el vehículo.
14. Las estimaciones no inventan datos cuando no existe información suficiente.

La política inicial propuesta es Round Robin entre accesos elegibles y FIFO dentro de cada acceso, pero debe revisarse frente a los datos oficiales antes de congelarla.

## 11. Secuencia de ejecución

### Fase A — Preparación

Tareas exclusivas del Team Lead:

- Inspeccionar el repositorio.
- Verificar el entorno de ejecución.
- Mantener Windows y WSL separados para evitar rutas y dependencias inconsistentes.
- Elegir un único entorno de desarrollo.
- Preparar `CLAUDE.md` compacto.
- Establecer contratos mínimos.
- Implementar el logger de prompts y verificarlo.
- Crear cápsulas de tareas.
- Organizar el tablero compartido.
- Crear una rama de implementación sin sobrescribir trabajos existentes.

No gastes tiempo en reestructurar el setup global.

### Fase B — Ejecución paralela

Activa tres compañeros Haiku:

- `engine-haiku`
- `ui-haiku`
- `valet-haiku`

Entrégales sus cápsulas de tarea y límites de archivos.

Deben empezar a implementar en paralelo una vez disponibles los contratos.

El Team Lead supervisa y coordina. No reimplementa el trabajo que ya fue delegado.

### Fase C — Pruebas

Incorpora `qa-haiku`.

Debe cubrir las nueve situaciones oficiales:

1. Pasarela llena.
2. Parqueadero lleno.
3. Liberación de una celda.
4. Solicitudes simultáneas.
5. Pago rechazado.
6. Todos los valets ocupados.
7. Salida sin estacionar.
8. Celda asignada ocupada.
9. Reclamación de llaves.

Cada escenario debe poder ejecutarse y demostrar el resultado esperado.

### Fase D — Integración

El Team Lead:

- Integra los módulos.
- Comprueba los contratos compartidos.
- Corrige errores de integración.
- Ejecuta pruebas.
- Revisa que la interfaz refleje el estado real.
- Verifica los controles.
- Valida los mensajes de error.
- Comprueba el recorrido completo.

No declares ninguna prueba aprobada sin ejecutarla.

### Fase E — Preparación de demostración

Preparar:

- Recorrido completo del conductor.
- Recorrido completo del valet.
- Panel de simulación.
- Visualización de filas, celdas y estados.
- Explicación de la política justa.
- Un ejemplo concreto de beneficio.
- Una iteración real de prompting con fallo y corrección.
- Limitaciones conocidas del prototipo.

El evento tiene cierre oficial a las 4:00 p. m. del 30 de octubre de 2026, hora de Colombia. Comprueba la hora local al iniciar y prioriza conforme al tiempo efectivo disponible.

**La funcionalidad demostrable tiene prioridad sobre las características adicionales.**

## 12. Disciplina de Git y archivos

Trabaja sobre una rama de implementación.

- No hagas force-push.
- No borres documentación anterior.
- No modifiques el historial de Git para reconstruir evidencia.
- Evita cambios de rama mientras los compañeros utilizan el mismo directorio de trabajo.
- Solo el Team Lead realiza operaciones Git que afecten a todo el equipo.
- Los trabajadores no deben hacer commits, merges ni cambios de rama por cuenta propia.
- Haz checkpoints de código, resultados y prompts al cerrar cada fase.
- No incluyas archivos con credenciales ni información sensible.

Antes de integrar, comprueba que ningún agente continúa modificando los archivos afectados.

## 13. Protocolo de progreso

Mantén actualizado `docs/agents/STATUS.md` con:

- Fase actual.
- Tareas completas.
- Tareas en progreso.
- Tareas bloqueadas.
- Agente responsable.
- Archivos modificados.
- Resultado de las pruebas.
- Decisiones pendientes.
- Próxima acción prioritaria.

Este archivo debe ser breve. No copies historiales completos de conversaciones ni salidas extensas de herramientas.

Los compañeros deben poder obtener su estado leyendo únicamente su cápsula de tarea, los contratos que utilizan y el último resumen relevante.

Al finalizar cada fase, actualiza un checkpoint que permita continuar después de una compactación de contexto o reinicio.

## 14. Gestión de errores y escalamiento

No permitas que un trabajador consuma grandes cantidades de tokens intentando repetidamente la misma solución.

Cuando una tarea falle:

1. Obtener un caso reproducible.
2. Clasificar el fallo.
3. Comprobar si pertenece al módulo del agente.
4. Permitir una corrección dirigida.
5. Ejecutar nuevamente la prueba.
6. Si sigue fallando, escalar al Team Lead.
7. Registrar las instrucciones de corrección y la evidencia disponible.

Si Haiku no logra resolver una tarea compleja, el Team Lead puede asumir la decisión técnica o asignar una intervención más capaz, manteniendo el resto del trabajo en Haiku.

Evita reiniciar todo el proyecto por errores localizados.

## 15. Primera ejecución que debes realizar ahora

Comienza inmediatamente.

**Paso 1.** Inspecciona el repositorio y valida los cinco documentos existentes. No repitas análisis extensos del enunciado en tu respuesta.

**Paso 2.** Comprueba la disponibilidad de Agent Teams, las herramientas de comunicación, los modelos Haiku y las dependencias necesarias.

**Paso 3.** Prepara el logger automático de prompts. Instala y verifica sus hooks. Conserva este mensaje como prompt de arranque identificado correctamente.

**Paso 4.** Define los contratos mínimos, crea el contexto compacto y prepara las cápsulas.

**Paso 5.** Crea el Agent Team real, genera las tareas compartidas y asigna los primeros trabajos a los tres compañeros Haiku.

**Paso 6.** Ejecuta el desarrollo en paralelo con supervisión continua. Cuando exista código verificable, incorpora QA.

**Paso 7.** Integra, prueba y prepara la demostración.

No te detengas después de generar un plan. La planificación ya existe: debes ejecutarla, corregir lo que sea necesario y producir software funcional.

No pidas confirmación para decisiones técnicas menores. Si encuentras un bloqueo real que no pueda resolverse con los datos disponibles, infórmalo claramente y continúa con las tareas independientes.

### Formato de respuesta inicial

Tu primera comunicación debe ser breve e incluir:

- Estado del repositorio y entorno.
- Estrategia de implementación confirmada.
- Disponibilidad de Agent Teams y Haiku.
- Estado del logger.
- Agentes que vas a crear.
- Primera distribución de tareas.
- Bloqueos existentes.

Después, comienza la ejecución usando las herramientas.

**La prioridad es tener una aplicación que funcione, un equipo de agentes coordinado y evidencia verificable de cómo la construimos.**

Para toda la ejecución de este plan y de los subagentes utilza las mejores skills que encuentres en el setup o con find-skills para tener el mejor resultado posible, todos los subagentes ejecutalos con caveman al maximo

Utiliza la skill https://github.com/kaankiziltug/logo-design-skill.git para hacer 3 opciones de logo con el nombre parKING 1 minimalista, 1 divertida y 1 formal, enfatizando la palabra KING o el concepto KING.
