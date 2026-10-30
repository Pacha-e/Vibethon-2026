# Auditoría UI/UX — parKING (30-10-2026)

**Método:** lectura del código y **revisión visual real** con Playwright + Chromium sobre `npm run dev`: las 5 vistas a 1366 px, Conductor y Portería a 1440/1366/768/390 px, escenario 3 en ejecución y `prefers-reduced-motion`. Las capturas están en `evidence/design/`. Los puntos que no se inspeccionaron visualmente se marcan como tales.

## Estado actual (antes de esta iteración)
- **Arquitectura:** SPA React 18 + Vite + TypeScript + Tailwind 3. Una sola fuente de verdad (`rootReduce`) y vistas por rol en pestañas.
- **Componentes compartidos:** `Badge`, `CellMap`, `LaneView`, `EtaCard` y `Toast` en `src/components/`. Clases `.card`, `.btn-*` y `.field` en `src/styles/index.css`.
- **Marca:** los colores en código (`#0B1F3A`, `#F2B705`, `#1E3A8A`) eran **provisionales**: no coincidían con el logo oficial que entregó el equipo. La cabecera usaba un ícono SVG generado por agentes, no el logo oficial.
- **Movimiento:** no había animaciones; solo transiciones CSS de color.

## Fortalezas que se conservan
1. Estados de celda con **texto + símbolo + color** (○ Libre, ◐ Reservada, ● Ocupada).
2. Jerarquía por rol clara: un título por vista, tarjetas por tarea y botones de acción con verbo («Dar paso en portería»).
3. Contraste AA en las tarjetas blancas, objetivos táctiles de 44 px o más y foco visible.
4. Bitácora y escenarios reproducibles en Simulación.

## Problemas y prioridad

| # | Problema | Evidencia | Impacto | Prioridad | Estado |
|---|---|---|---|---|---|
| 1 | Paleta y logo no oficiales en la cabecera | Comparación con las láminas del logo | Identidad incoherente ante el jurado | P0 | ✅ Tokens desde el logo, lockup oficial en la cabecera, favicon con el ícono oficial |
| 2 | Sin feedback de movimiento: la fila «salta» y la celda cambia sin transición | Capturas antes/después del escenario 3 | Cuesta percibir qué cambió | P0 | ✅ Layout animation en filas, pulso en celdas cuyo estado cambió, contadores animados |
| 3 | Dos sistemas de color compitiendo (azules Tailwind + king-*) | `hover:bg-blue-50`, `king-royal #1E3A8A` | Inconsistencia | P1 | ✅ `king-*` y `state-*` apuntan a variables de `tokens.css` |
| 4 | Navegación plana sin indicador de pestaña activa animado | Captura 1366 | Orientación | P1 | ✅ Navegación de vidrio fija con «pill» compartida (`layoutId`) |
| 5 | **Fallo de la primera versión de vidrio:** el borde con `mask-composite` pintaba el degradado sobre toda la barra y el texto blanco quedaba sin contraste | `evidence/design/glass-bug-1366.png` (vista Conductor, primera versión) | Contraste crítico | P0 | ✅ Borde translúcido + reflejos inset, sin máscaras; alfa 0.86 sobre fondo claro |
| 6 | **Toast con texto oscuro sobre vidrio oscuro** (tras la migración a vidrio) | `evidence/design/toast-bug.png` | Contraste crítico | P0 | ✅ Texto blanco e iconos de estado aclarados |
| 7 | En 390 px los chips de estado ocupan 2 líneas en la cabecera | `evidence/design/r-Conductor-390.png` | Menos espacio útil | P2 | Aceptado: sin scroll horizontal (overflow 0 px medido) |
| 8 | Conductor: falta un «siguiente paso» explícito | Revisión del flujo | Comprensión inmediata | P1 | ✅ Bloque «Siguiente paso» en vidrio, animado solo cuando cambia el estado (T7-VIEWS) |
| 9 | Variante blanca del logo: fondo con textura, no se puede extraer sin alterarla | Lámina 2 | Logo sobre fondos oscuros | P2 | Bloqueo registrado: se usa el lockup a color, que ya es claro sobre navy |

## Riesgos
- `backdrop-filter` encarece el render: solo hay **2 superficies de vidrio simultáneas** (navegación y toast; Simulación añade la de controles).
- Animaciones: solo `transform` y `opacity`; `MotionConfig reducedMotion="user"` y una regla CSS global para `prefers-reduced-motion`.
- No verificado visualmente: lectores de pantalla reales y navegadores distintos de Chromium.
