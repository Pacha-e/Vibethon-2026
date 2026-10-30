# Auditoría UI/UX — parKING

> Iteración 2 (30-10-2026, tarde) arriba; la iteración 1 se conserva debajo como historial.

# Iteración 2 — del piloto de vidrio a un sistema coherente

**Método:** lectura de todo `src/` y **revisión visual real** en Chromium (Playwright MCP) sobre `npm run dev`, con el escenario 3 cargado para que haya datos: las 5 vistas a 1440 px y 390 px, página completa. Capturas en `evidence/design/v2-before/`. Lo que no se inspeccionó visualmente se indica.

## Estado encontrado
| Área | Implementación real |
|---|---|
| Framework | React 18 + Vite 5 + TS estricto + Tailwind 3 + Motion 11. SPA con pestañas por rol en `App.tsx`. |
| Estado | `useSim()` sobre `rootReduce` (única fuente de verdad). Las vistas solo leen `state` y llaman `dispatch`. |
| Estilos | `tokens.css` (marca + estados + vidrio), `index.css` (`.card`, `.btn-*`, `.field`, `.glass*`), `tailwind.config.js` mapea `king-*` y `state-*`. |
| Marca | Lockups oficiales en `public/brand/official/` (color, navy, negro, ícono, favicon). Paleta muestreada del logo: navy `#212D3D`, oro `#A98E4C`. |
| Tipografía | Inter declarada pero **no cargada** (no hay `@font-face` ni paquete): en la práctica se ve Segoe UI / system-ui. |
| Componentes | `Badge`, `CellMap`, `LaneView`, `EtaCard`, `Toast`; las vistas de valet usan constantes propias `BTN_PRIMARY`/`BTN_SECONDARY`. |
| Movimiento | `layout` en filas, pulso en celdas, contadores, pill de pestaña, toast, cambio de vista. |
| Responsive | Breakpoints `sm`/`md`/`lg` de Tailwind; navegación con scroll horizontal en móvil. |

## Fortalezas que se conservan
1. Logo oficial y paleta muestreada: no se tocan, solo se integran mejor.
2. Estados con **texto + símbolo + color** (○ ◐ ●) en celdas, valets y pasarelas.
3. Animación solo tras confirmar el `dispatch` (regla ya escrita en DESIGN.md).
4. Vocabulario por rol con verbos claros («Dar paso en portería», «Ya estacioné», «Reclamar llaves»).
5. Contraste AA en tarjetas blancas, objetivos táctiles ≥ 44 px, foco visible.

## Problemas detectados (iteración 2)
| # | Problema | Evidencia | Impacto | Prioridad |
|---|---|---|---|---|
| 1 | **Dos lenguajes visuales:** Valet y Oficina son una losa navy a pantalla completa; Conductor, Portería y Simulación son tarjetas blancas | `Valet-1440.png` vs `Portería-1440.png` | La app parece hecha por equipos distintos | P0 |
| 2 | **Móvil:** la cabecera fija ocupa ~24 % de la altura a 390 px; las pestañas requieren scroll horizontal con barra visible y la activa puede quedar fuera; en Portería la cabecera tapa el título | `Portería-390.png`, `Oficina-390.png` | Navegación difícil en el dispositivo del conductor | P0 |
| 3 | **Portería sin jerarquía operativa:** la política (párrafo largo) va primero; «Dar paso» está en otra tarjeta, lejos de su pasarela; el mapa repite 16 botones «Simular: liberar» con el mismo peso que la acción principal | `Portería-1440.png` | El portero tarda en encontrar al próximo vehículo | P0 |
| 4 | Anchos inconsistentes: cabecera `max-w-7xl`, vistas `max-w-5xl/6xl` con padding duplicado; bordes izquierdos desalineados | Todas las capturas a 1440 | Composición descuidada | P1 |
| 5 | Valet: el historial por valet (16 filas) siempre a la vista ocupa más que los servicios activos | `Valet-1440.png` | Acciones pendientes enterradas | P1 |
| 6 | Toast fijo tapa contenido y usa franja lateral gruesa (`border-l-4`) | `Portería-1440.png`, `Oficina-390.png` | Lectura interrumpida; patrón genérico | P1 |
| 7 | Colores de estado con literales de Tailwind (`emerald-50`, `amber-100`, `red-50`, `blue-50`, `sky-300`) en vez de tokens | `CellMap.tsx`, `Badge.tsx`, `labels.ts` | Deriva del sistema | P1 |
| 8 | Tipografía: Inter declarada sin cargar; jerarquía plana (títulos 18–24 px casi iguales) y etiquetas en MAYÚSCULAS repetidas | Todas | Poca personalidad y jerarquía débil | P1 |
| 9 | Conductor vacío: la columna «Mi turno» queda casi en blanco sin explicar qué hacer | `Conductor-1440.png` | Primer uso confuso | P1 |
| 10 | «Reiniciar» la simulación no pide confirmación (acción destructiva junto a «+5 min») | `SimView.tsx` | Riesgo en la demo | P1 |
| 11 | Íconos emoji en navegación: render distinto por sistema | Capturas | Inconsistencia | P2 |
| 12 | Valet/Oficina: aviso de la sección con franja izquierda y texto sobre navy sin estructura de tarjeta | `Oficina-390.png` | Lectura | P2 |

## Resultado (cerrado en esta iteración)
| # | Estado |
|---|---|
| 1 | ✅ Valet y Oficina con tarjetas claras, mismas primitivas (`Panel`, `ViewHeader`, `Plate`) |
| 2 | ✅ Móvil: barra superior compacta no fija + dock inferior de vidrio; 0 px de overflow a 390 |
| 3 | ✅ «Dar paso» pegado a su pasarela, deshabilitado con motivo; política plegable; acciones de simulación como enlaces secundarios |
| 4 | ✅ Contenedor único `max-w-7xl` |
| 5 | ✅ Servicios activos primero; historial plegado en tablas |
| 6 | ✅ Toast sin franja lateral, encima del dock en móvil |
| 7 | ✅ Estados desde tokens (tinte + ink), sin literales de Tailwind |
| 8 | ✅ Red Hat Display/Text cargadas; escala 1.25; etiquetas en minúscula de oración |
| 9 | ✅ Estado vacío del conductor con los 3 pasos; «Mi turno» sube arriba en móvil al registrarse |
| 10 | ✅ Diálogo de confirmación nativo (`GlassDialog`) |
| 11 | ✅ Set de íconos SVG propio |
| 12 | ✅ Avisos con tinte + ícono |
Verificación: `evidence/test-results/ui-v2-qa.txt`, capturas en `evidence/design/v2-after/`.

## Plan priorizado
1. **Formalizar** tokens (superficies, texto, estados con tinte, elevación, movimiento) y tipografía cargada localmente.
2. **Shell:** barra de vidrio en escritorio; en móvil, barra superior compacta + dock inferior de vidrio con las 5 vistas.
3. **Piloto Portería:** pasarela como carril físico con la barrera de portería y la acción «Dar paso» pegada a ella; política plegable; mapa compacto con acciones de simulación secundarias.
4. **Extensión:** Valet y Oficina migran al mismo lenguaje de tarjetas claras; Conductor con estado vacío guiado; Simulación con diálogo de confirmación para reiniciar.
5. **QA final:** 1440/1366/768/390, teclado, `prefers-reduced-motion`, `prefers-reduced-transparency`, overflow horizontal.

## Riesgos de implementación
- `backdrop-filter` simultáneo: el sistema limita el vidrio a capas flotantes (máximo 3 a la vez: barra, dock/toast, diálogo).
- Las vistas de valet/oficina están cubiertas por pruebas de lógica, no de UI: el riesgo de regresión visual se cubre con revisión en navegador.
- Nueva dependencia de fuentes (paquetes `@fontsource-variable`, sin red en tiempo de ejecución).

---

# Iteración 1 — auditoría inicial (30-10-2026)

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
