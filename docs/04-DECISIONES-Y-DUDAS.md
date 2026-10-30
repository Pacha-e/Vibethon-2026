# Decisiones, fuentes de verdad y dudas abiertas

**Propósito:** separar lo que **exige** la organización de lo que **proponemos**, para evitar implementar supuestos como reglas oficiales.

## A. Confirmado por el documento físico (obligatorio)

| ID | Confirmación |
|---|---|
| OF-01 | Dos accesos, Las Vegas y Regional; un inventario de celdas compartido. |
| OF-02 | Capacidad física entre registro y portería: 4 en Las Vegas, 6 en Regional. |
| OF-03 | 8 valets asignados a cada acceso, contratables dentro de su pasarela. |
| OF-04 | Registrar placa, conductor, acceso y hora al cruzar registro. |
| OF-05 | Mantener orden físico de cada fila; no retroceder ni desaparecer al salir sin estacionar. |
| OF-06 | Política justa entre accesos, declarada y explicable; reserva inmediata y única. |
| OF-07 | Estados de celda libre/reservada/ocupada, confirmación en portería y reasignación ante ocupación inesperada. |
| OF-08 | ETA con posición, disponibilidad, historial reciente, reparto entre accesos e incertidumbre declarada. |
| OF-09 | Valet: selección, bloqueo temporal, pago simulado, entrega, ficho único, estacionamiento, depósito y reclamación de llaves. |
| OF-10 | Valet solo vuelve a disponible al depositar llaves; no gana prioridad ni libera pasarela. |
| OF-11 | Nueve situaciones oficiales observables; demo completa vehículo + valet. |
| OF-12 | Funcionamiento local, sin requerir DB/cloud; simulaciones determinadas por organización. |

## B. Decisiones propuestas — modificables

| ID | Propuesta | Motivo | Estado |
|---|---|---|---|
| DEC-01 | SPA React/Vite/TypeScript, roles en una única aplicación local | Minimizar complejidad y errores de integración | Propuesta |
| DEC-02 | Motor puro + un único store con transiciones atómicas | Evitar duplicaciones y facilitar pruebas | Propuesta |
| DEC-03 | Round Robin **entre accesos elegibles**, FIFO **dentro** de cada acceso | Justicia explicable y verificable | Propuesta |
| DEC-04 | Escenarios reproducibles y botón de reset | Evaluación directa ante jurado | Propuesta |
| DEC-05 | ETA basada en historial reciente y rangos; «sin datos» cuando no exista muestra | Honestidad y precisión | Propuesta |
| DEC-06 | Bitácora de eventos con causa de cada reserva y cambio | Auditabilidad, demo y debugging | Propuesta |
| DEC-07 | Sin back-end separado ni sincronización entre dispositivos en el MVP | No requerido; acorta ruta crítica | Propuesta |
| DEC-08 | Precio de valet configurable, sin asumir $8.000 como tarifa oficial | Figura 3 es ilustrativa | Propuesta |

## C. Información oficial pendiente o ambigua

| ID | Pregunta | Riesgo si se supone incorrectamente | Acción |
|---|---|---|---|
| OPEN-01 | ¿Dónde están los **dos mapas** suministrados por la organización? | Inventario y recorrido equivocados | Importarlos como fixtures, sin hardcodear figura 1 |
| OPEN-02 | ¿Dónde están las **condiciones iniciales** y **eventos de simulación**? | Demo no coincide con evaluación común | Incorporar fixtures, adaptadores y test de reproducción |
| OPEN-03 | ¿Hay restricciones adicionales de la política entre accesos? | Política justa que no encaje con casos ocultos | Declarar Round Robin y comprobar escenarios oficiales |
| OPEN-04 | ¿Se exige una duración exacta del hold de valet durante pago? | Reserva sin vencimiento o vencimiento arbitrario | Configurable y visible; documentar valor de prueba |
| OPEN-05 | ¿Hay tarifa de valet oficial en el paquete de datos? | Confundir $8.000 ilustrativo con real | Usar parámetro configurable; identificar como simulado |
| OPEN-06 | ¿Los eventos proporcionan timestamps suficientes para el ETA? | Estimaciones numéricas inventadas | Fallback «datos insuficientes» |
| OPEN-07 | ¿El proceso de portería precisa un evento separado de entrada al parqueadero? | Estados físicos inconsistentes | Definir claramente eventos de confirmar/avanzar/salir |
| OPEN-08 | ¿Los mapas contienen reglas de recorrido o solo destinos/zona? | Indicar rutas falsas | Mostrar zona/celda y trayecto conceptual si faltan coordenadas |
| OPEN-09 | ¿Se esperan varias terminales simultáneas o una sola aplicación local con vistas? | Sobreingeniería o falta de sincronización | Enunciado admite misma aplicación local; MVP en una instancia |

## D. Hechos ilustrativos que NO deben hardcodearse como oficiales

- 12 celdas en la figura 1: solo ejemplo.
- Zona A y B con la disposición dibujada: croquis conceptual, no geometría vinculante.
- Tarifa $8.000 COP, matrícula ABC123, ficho LV-0027 y ETA 18–24 min en ejemplos: solo ilustrativos.
- Capturas de UI: orientativas, diseño libre mientras se respete la información y las reglas.

## E. Orden de validación

1. Recuperar archivos oficiales de mapas, estado inicial y eventos.
2. Definir formato adaptable de configuración, con validación al cargar.
3. Congelar estados/comandos y política elegida para no bloquear agentes paralelos.
4. Hacer correr los nueve escenarios sobre fixtures reales si se dispone de ellos.
5. Documentar explícitamente cualquier simplificación del prototipo para la presentación.

> **Regla de gobierno:** toda nueva decisión se registra aquí con motivo, estado, impacto y evidencia; ningún agente puede convertir por sí solo un ejemplo ilustrativo en requisito.
