# Reto Parqueadero inteligente universitario — Enunciado

**Fuente:** enunciado de **4 páginas**, NEXT × EAFIT, Vibethon — Maratón de Vibe Coding, entregado el 30-10-2026.

> **Alcance de este documento:** especificación estructurada a partir del enunciado del reto. Los croquis y ejemplos de pantallas se describen en texto; este archivo no reemplaza los materiales oficiales. Las cifras y nombres usados como ejemplos visuales no sustituyen los archivos de simulación de la organización. Para resolver discrepancias, prevalece el documento y los datos oficiales.

## Página 1 — Planteamiento y alcance

### El problema

En horas pico, los conductores que llegan a EAFIT por **Las Vegas** y **Regional** hacen fila sin saber cuánto esperarán ni si habrá celda. Se supone que ambos accesos comparten un mismo parqueadero sin coordinación; esto genera asignaciones injustas o duplicadas, y estudiantes que llegan tarde a clase.

**Reto:** dar visibilidad de la espera, asignar celdas justamente entre accesos y permitir delegar el automóvil a un valet para no perder clase.

**Producto requerido:** una aplicación que coordine el ingreso por Las Vegas y Regional, estime la espera para recibir una celda y permita contratar un valet desde la pasarela de registro.

### Alcance del prototipo

- Ejecución **local**. No se requiere base de datos ni despliegue en la nube. Estado en memoria o archivos locales (JSON, TXT, logs).
- Las cámaras, el registro automático, las llegadas y salidas de vehículos y los pagos serán **simulados**.
- La organización suministra **dos mapas, condiciones iniciales y eventos de simulación comunes** para todos los equipos.

### Condiciones fijas

| Condición | Las Vegas | Regional |
|---|---:|---:|
| Vehículos entre registro y portería | 4 | 6 |
| Valets asignados al acceso | 8 | 8 |
| Lugar para solicitar valet | Dentro de la pasarela | Dentro de la pasarela |

Los accesos comparten un **inventario único de celdas**. El croquis incluye zonas A y B, oficina de valets, una salida habilitada y 12 celdas de **ejemplo**. **El croquis es conceptual; no fija el número definitivo de celdas de la simulación ni la geometría real de EAFIT.**

### Usuarios del producto

| Rol | Operaciones |
|---|---|
| Conductor | Consultar espera, recibir celda, contratar valet y seguir el vehículo. |
| Portería | Supervisar filas, disponibilidad e ingresos. |
| Valet | Aceptar y actualizar servicios, consultar ingresos simulados. |
| Oficina | Registrar recepción y entrega de llaves mediante un ficho. |

## Página 2 — Registro y asignación de celdas

### Ingreso y permanencia en la fila

- Antes del registro, el conductor consulta filas y disponibilidad.
- Al **cruzar la línea de registro**, se asocian placa y conductor y se registran el acceso y la hora de llegada.
- La aplicación muestra cuántos vehículos esperan **antes y después del registro**.
- Si la pasarela está llena, el siguiente conductor **espera fuera**.
- Dentro de la pasarela **no se puede retroceder ni abandonar físicamente la fila**.
- Si alguien decide salir sin estacionar, **no requiere celda**, pero **conserva su posición** hasta avanzar, ingresar y circular hacia una salida.

### Estimación de espera

- Mostrar **posición, vehículos delante y tiempo estimado** para recibir una celda.
- Actualizar la estimación según **disponibilidad, ritmo reciente de liberación y asignación** y **reparto de cupos entre accesos**.
- Se permite usar un promedio reciente.
- Distinguir **estimación** de **garantía**; avisar cuando falten datos.
- Se admite un **rango de minutos**.

### Asignación y confirmación

- Respetar el **orden de cada fila** y **explicar** la política de reparto entre Las Vegas y Regional.
- **Reservar la celda al asignarla** y compartir la reserva de inmediato para evitar duplicados.
- Mostrar **zona, número de celda y recorrido**.
- Confirmar en portería el **vehículo y su reserva**.
- La celda se marca **ocupada** al estacionar y **libre** al salir.
- Si una celda asignada aparece ocupada, **resolver la reasignación**, informar al conductor y conservar el vínculo con su vehículo.
- Estados de celda: **libre, reservada, ocupada**.
- La UI debe acompañar los colores con **texto o símbolos**, sin depender únicamente del color.

**Figura 2:** en ambos accesos, el primer automóvil espera junto a la portería y el último junto al registro. Cuando hay espacio, entra el siguiente desde la fila exterior. Entregar el auto al valet **no** libera espacio en la pasarela.

## Página 3 — Servicio de valet y entrega de llaves

### Condición para contratar

- El conductor solo puede contratar un valet **después de ingresar a la pasarela** y si hay uno disponible **en su acceso**.
- Mostrar **disponibilidad y precio**.
- **Sugerir** el servicio cuando la espera estimada supere **15 minutos**.
- **Permitir** contratarlo incluso con una espera menor.

### Recorrido del servicio

1. **Selección y pago.** Reservar brevemente el valet elegido para impedir una contratación simultánea. Si el pago se aprueba, confirmar servicio y asociar el **ingreso simulado** al valet. Si el pago falla o vence la reserva, **liberar el valet**; el conductor conserva su turno.
2. **Entrega del vehículo.** El valet recibe el automóvil y entrega un **ficho con código único** vinculado al servicio. Confirmar la entrega antes de que el estudiante se vaya a clase. El vehículo conserva su posición y el valet espera la celda.
3. **Estacionamiento y llaves.** El valet ingresa, estaciona, informa la ubicación y deposita las llaves en la oficina. **Solo entonces** vuelve a estar disponible. El conductor reclama con el ficho y la oficina registra la entrega.

**Reglas adicionales:**

- Contratar valet **no concede prioridad** ni libera espacio en la pasarela.
- El servicio se sigue desde la **entrega del vehículo hasta el depósito de las llaves**.
- El valet puede continuar ocupado incluso después de que el vehículo abandone la pasarela.

### Información que debe quedar clara

- **Antes de asignar:** acceso, placa, turno, vehículos delante y espera estimada.
- **Al contratar:** valet disponible, precio, resultado del pago y confirmación de la entrega del automóvil.
- **Después:** celda y recorrido, o seguimiento del valet.
- **Al finalizar:** ubicación, código del ficho y estado de las llaves.

**Figura 3:** pantallas orientativas del conductor (Mi turno, Contratar valet, Mi vehículo). Tarifa de **$8.000 COP**, placas, tiempos y códigos mostrados son **ejemplos ilustrativos**. Diseño libre, reglas e información obligatorias.

## Página 4 — Operación y demostración

### Vistas operativas

- Vistas orientativas de **portería**, **valet** y **oficina**.
- La aplicación debe distinguir al valet **disponible**, **reservado durante el pago** y **en servicio**.
- El historial del valet vincula cada **ingreso simulado** con el servicio correspondiente.
- Las vistas pueden estar dentro de una **misma aplicación local**.

### Demostración del producto

Demostrar un recorrido completo: **llegada → registro → espera → asignación → estacionamiento → salida**. Incluir un recorrido completo de valet **desde la contratación hasta la entrega de las llaves**.

### Situaciones comunes de prueba (lista oficial)

| # | Situación | Resultado observable exigido |
|---:|---|---|
| 1 | Pasarela llena | El siguiente espera antes del registro; no se superan 4 vehículos en Las Vegas ni 6 en Regional. |
| 2 | Parqueadero lleno | Se conserva la fila y se actualiza la espera sin inventar cupos. |
| 3 | Se libera una celda | Se asigna según la política declarada y se reserva a un único vehículo. |
| 4 | Solicitudes simultáneas | No se duplica una celda ni se contrata dos veces al mismo valet. |
| 5 | Pago rechazado | No se confirma el servicio; el conductor conserva su posición. |
| 6 | Todos los valets ocupados | Se informa la falta de disponibilidad y continúa la espera normal. |
| 7 | Salida sin estacionar | El vehículo avanza por el recorrido sin desaparecer de la fila. |
| 8 | Celda asignada ocupada | Se informa y resuelve la reasignación sin perder el vínculo con el vehículo. |
| 9 | Reclamación de llaves | El ficho identifica el servicio y la oficina registra la entrega. |

**Rúbrica oficial:** https://universonext.com/vibethon

## Separación entre obligaciones y ejemplos

**Obligatorio:** límites 4/6, valets 8/8 por acceso, inventario común, estados de celda, reglas de fila, estimación, política justa y declarada, servicio de valet completo y nueve escenarios observables.

**Ilustrativo/no vinculante por sí solo:** las 12 celdas dibujadas, coordenadas y geometría del croquis, placas como ABC123, fichos como LV-0027, tarifa de $8.000 COP y tiempos mostrados en los mockups.

**Pendiente de recibir:** los dos mapas, las condiciones iniciales y los eventos de simulación oficiales. Ver [decisiones y dudas](04-DECISIONES-Y-DUDAS.md).
