# Rúbrica oficial y estrategia de puntaje — Vibethon 2026

**Fuente primaria:** https://universonext.com/vibethon (consultada el 30-10-2026).  
**Total:** 100 puntos; **20 ítems** de **5 puntos**, organizados en **5 categorías de 20 puntos**.

> Los criterios de esta tabla proceden de la página oficial. La columna «Evidencia prevista» es una propuesta de nuestro equipo y **no forma parte de la rúbrica oficial**.

| ID | Categoría | Criterio oficial (5 puntos cada uno) | Evidencia prevista |
|---|---|---|---|
| F1 | Funcionalidad | Cumple los requisitos obligatorios del reto. | Matriz de trazabilidad + escenarios oficiales. |
| F2 | Funcionalidad | Permite completar el flujo principal. | Demo llegada → registro → celda → salida y valet → llaves. |
| F3 | Funcionalidad | Los controles realizan las acciones que anuncian. | Inspección de cada control y pruebas de eventos. |
| F4 | Funcionalidad | La demostración termina sin errores que bloqueen su uso. | Ensayo en modo local y reinicio controlado. |
| U1 | Diseño UI/UX | Se identifica fácilmente cómo iniciar y continuar. | Navegación de roles y siguiente paso visible. |
| U2 | Diseño UI/UX | Los textos son legibles y tienen contraste suficiente. | Revisión de contraste, tamaños y estados textuales. |
| U3 | Diseño UI/UX | La navegación y los controles son consistentes. | Componentes y patrones comunes. |
| U4 | Diseño UI/UX | Informa el resultado de las acciones y los errores. | Confirmaciones, validación y mensajes de error. |
| P1 | Calidad del prompting | El prompt define el problema y el objetivo. | Prompt maestro guardado en bitácora. |
| P2 | Calidad del prompting | Incluye requisitos y restricciones del reto. | Prompt enlazado al enunciado y a invariantes. |
| P3 | Calidad del prompting | Presentan una corrección del prompt a partir de un fallo observado. | Registro real antes/después (sin inventar). |
| P4 | Calidad del prompting | Muestran cómo comprobaron el resultado después del ajuste. | Test reproducible y captura/log de resultado. |
| I1 | Impacto y pertinencia | Identifica al usuario beneficiado. | Conductor/portería/valet/oficina explícitos. |
| I2 | Impacto y pertinencia | Atiende una necesidad del escenario propuesto. | Espera visible, justicia y prevención de doble reserva. |
| I3 | Impacto y pertinencia | Demuestra un beneficio concreto mediante un ejemplo. | Ejemplo reproducible de fila y celda liberada. |
| I4 | Impacto y pertinencia | La solución es coherente con las condiciones del reto. | Ejecución local, simulación, capacidad 4/6 y 8/8. |
| E1 | Presentación y profesionalismo | Explican claramente el propósito del prototipo. | Pitch de 20–30 segundos. |
| E2 | Presentación y profesionalismo | Demuestran su funcionamiento con un caso concreto. | Guion de demo ensayado. |
| E3 | Presentación y profesionalismo | La interfaz contiene textos comprensibles y cuidados. | Revisión final de textos. |
| E4 | Presentación y profesionalismo | Explican qué funciona y cuáles son sus limitaciones. | Sección de alcance y límites verificables. |

## Cronograma oficial

- Evento: **30 de octubre de 2026**, Universidad EAFIT, Medellín.
- Revelación del reto: **12:30 p. m.**
- Ventana oficial de Vibe Coding: **3,5 horas**, de **12:30 a 4:00 p. m.**
- **4:00 p. m.: cierre.** No hay entrega documental obligatoria: el jurado califica **en el computador del equipo**.
- Cada juez evalúa 10 equipos; elige un finalista por grupo. Los **3 finalistas** presentan máximo **7 minutos** cada uno ante los jueces.
- El sitio oficial indica **equipos de 3 personas**, **un portátil por equipo**, y que se permite **cualquier IA** gratuita o paga.
- La dinámica declara dirigir herramientas de IA para construir software, **sin escribir código a mano**.

## Consecuencias para la estrategia

1. **No sacrificar UI/UX:** vale 20 puntos independientes de funcionalidad.
2. **Guardar trazabilidad real del prompting desde el inicio:** vale 20 puntos; no basta con mostrar código generado.
3. **Una demo terminada tiene valor:** controles sin funcionamiento o errores bloqueantes impactan directamente.
4. **No construir infraestructura innecesaria:** local es suficiente.
5. **No descuidar la exposición:** tener guion, caso concreto, impacto observable y limitaciones.

## Checklist previo a la evaluación

- [ ] Flujo principal completo visible en el computador.
- [ ] Los 9 escenarios oficiales tienen respuesta demostrable.
- [ ] Al menos una iteración de prompt documentada por un error **real**, con prueba antes/después.
- [ ] La interfaz muestra estados y errores legibles.
- [ ] El equipo puede explicar la política justa sin ambigüedad.
- [ ] Se pueden reiniciar datos y reproducir demo sin depender de internet/cloud.
- [ ] Se pueden explicar límites del prototipo sin afirmar funcionalidades inexistentes.
