# Brief operativo — parKING (Vibethon EAFIT, cierre 16:00 COL)
**Problema:** en hora pico, conductores en Las Vegas (LV) y Regional (RG) hacen fila sin saber la espera ni si habrá celda; ambos accesos comparten celdas sin coordinación → asignaciones injustas/duplicadas.
**Producto:** app local (sin cloud) con vistas Conductor, Portería, Valet, Oficina y Simulación.

**Reglas obligatorias**
- Pasarela (entre registro y portería): LV máx 4, RG máx 6. Si está llena, el siguiente espera FUERA (antes del registro).
- Registro = cruzar línea: se asocia placa, conductor, acceso, hora. Dentro de la pasarela no se retrocede ni se abandona; orden FIFO físico.
- Celdas compartidas: libre / reservada / ocupada. Reservar al asignar, a un único vehículo. Mostrar zona, celda y recorrido. Ocupada al estacionar, libre al salir. Colores SIEMPRE con texto/símbolo.
- Celda asignada aparece ocupada → reasignar al mismo vehículo e informarle.
- Salida sin estacionar: no requiere celda pero conserva posición hasta cruzar portería y salir.
- ETA: posición, vehículos delante, rango de minutos según ritmo reciente de liberación y reparto entre accesos. "Estimado, no garantizado"; si faltan datos decir "datos insuficientes".
- Valet: solo dentro de la pasarela, valet del mismo acceso, ver disponibilidad y precio (configurable). Sugerir si ETA > 15 min; permitir siempre. Flujo: bloqueo temporal del valet durante pago → pago simulado (aprobado/rechazado/vencido; si falla, valet liberado y el conductor conserva turno) → entrega del auto y ficho único → valet espera celda en la fila (sin prioridad, no libera pasarela) → estaciona e informa ubicación → deposita llaves en oficina → SOLO entonces valet disponible → conductor reclama con ficho, oficina registra entrega.
- Estados valet: disponible / reservado durante pago / en servicio. Historial liga ingreso simulado ↔ servicio.

**Política justa declarada:** Round Robin entre accesos con demanda + FIFO dentro de cada acceso. Cada celda libre se asigna al primer vehículo sin celda del acceso al que le toca; si solo un acceso tiene demanda, se le asigna a ese.

**9 escenarios oficiales:** 1 pasarela llena · 2 parqueadero lleno · 3 se libera celda · 4 solicitudes simultáneas · 5 pago rechazado · 6 todos los valets ocupados · 7 salida sin estacionar · 8 celda asignada ocupada · 9 reclamación de llaves.
**Fixture:** provisional (16 celdas A/B, 13 ocupadas al inicio). Los datos oficiales no llegaron; sustituibles por `SimConfig`.
