# VIBETHON 2026 — Parqueadero inteligente universitario

**Repositorio oficial de trabajo:** https://github.com/Pacha-e/Vibethon-2026

Proyecto de la maratón de Vibe Coding **NEXT × EAFIT (30 de octubre de 2026)**.

> **Estado:** Fase 0 — requisitos, planificación y preparación de la demostración. Este repositorio todavía **no contiene una aplicación**.

## Documento rector

1. [Enunciado del reto (transcripción estructurada de las 4 páginas)](docs/01-ENUNCIADO.md)
2. [Rúbrica oficial de evaluación (100 puntos)](docs/02-RUBRICA.md)
3. [Plan de acción y entregables](docs/03-PLAN-DE-ACCION.md)
4. [Decisiones, supuestos y dudas](docs/04-DECISIONES-Y-DUDAS.md)
5. [Bitácora de prompting y pruebas](docs/05-PROMPTING-Y-EVIDENCIAS.md)

**Fuentes:** enunciado entregado por la organización (4 páginas) y [sitio oficial del evento](https://universonext.com/vibethon).

## Restricciones oficiales importantes

- Prototipo **local**. Sin obligación de base de datos, nube o despliegue.
- Cámaras, registro automático, llegadas, salidas y pagos: **simulados**.
- Dos accesos: Las Vegas (**4 vehículos** en pasarela) y Regional (**6**).
- **8 valets asignados por acceso**; ambos comparten **un inventario de celdas**.
- Los mapas, estados iniciales y eventos entregados por la organización son la fuente de verdad para la simulación.
- El croquis con 12 celdas y la tarifa de $8.000 son **ilustrativos**, no configuraciones obligatorias.
- Cada parte funcional debe ser demostrable y verificable mediante los casos del enunciado.

## Orden de trabajo

**Primero:** verificar insumos oficiales y fijar contratos de estados e invariantes.  
**Después:** motor de simulación y pruebas, interfaces por rol y valet.  
**Finalmente:** integración, demo de punta a punta y evidencia de corrección de prompts.

No confundir propuestas técnicas o de algoritmo con requisitos oficiales; se distinguen en los documentos.

## Normas mínimas para colaboradores y agentes

- No inventar reglas, celdas, tiempos ni resultados de pruebas.
- No sustituir los mapas/eventos oficiales por supuestos silenciosos.
- No modificar el motor de asignación desde componentes UI.
- Toda funcionalidad crítica debe tener escenario reproducible y prueba verificable.
- Registrar un fallo real de prompting, el prompt corregido y la verificación posterior para la rúbrica.
