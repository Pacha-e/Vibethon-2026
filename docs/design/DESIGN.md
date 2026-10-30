# Design system — parKING (v2)

**Fuente de verdad:** el logo oficial (`public/brand/official/`). Los valores viven en `src/styles/tokens.css`; Tailwind solo los referencia (`tailwind.config.js`); los materiales y clases base están en `src/styles/index.css`; las primitivas React en `src/components/ui/`. No existe otro sistema de estilos.

**Contexto de uso:** app operacional local para el parqueadero de EAFIT. La usan cinco roles en momentos de presión (conductor en la fila, portero con dos pasarelas, valets, oficina de llaves y jurado en la demo). La interfaz debe sentirse **ordenada, regia y serena**: la marca habla en la cabecera y en las placas; el resto de la pantalla trabaja.

## 1. Marca y logo
| Recurso | Archivo | Uso |
|---|---|---|
| Lockup a color, fondo transparente | `parking-logo-color.png` | Barra superior sobre vidrio navy: 36 px (móvil), 40 px (≥ 640), 44 px (≥ 1280) |
| Lockup sobre panel navy | `parking-logo-navy.png` | Presentaciones y portada |
| Lockup negro | `parking-logo-black.png` | Fondos claros, impresión monocroma |
| Ícono (K + corona) | `parking-icon.png`, `favicon-64.png` | Favicon, app icon, espacios < 48 px |

- Solo **recorte y color a alfa** (`scripts/extract_brand_assets.py`); nunca redibujar, deformar, recolorear ni aplicar sombras o filtros.
- **Área de protección:** como mínimo la altura de la «K» alrededor del lockup; en la barra se garantiza con `pr-1` y `gap-x-4`.
- Siempre sobre navy (vidrio oscuro o panel), donde «par» blanco y «KING» oro conservan su contraste. No se usa sobre el lienzo claro salvo la versión negra.
- Los SVG de `public/brand/*.svg` son exploraciones antiguas de agentes: **no son la marca**.
- Variante blanca: bloqueada (la lámina tiene fondo con textura y no se puede extraer sin alterarla). No se inventa.

## 2. Color
### Marca (muestreada del logo)
| Token | Valor | Tailwind | Uso |
|---|---|---|---|
| `--brand-navy` | #212D3D | `king-ink` | Vidrio oscuro, barrera de portería, texto fuerte |
| `--brand-navy-900` | #161E29 | `king-deep` | Sombras, scrim del diálogo |
| `--brand-navy-700` | #34455E | `king-royal` | Botón primario (blanco 9.7:1), foco sobre claro (8.6:1) |
| `--brand-gold` | #A98E4C | `king-goldlogo` | Bordes de realce; **nunca texto sobre claro** |
| `--brand-gold-300` | #C9AF6E | `king-gold` | Pestaña activa, botón oro (navy encima 6.5:1), foco sobre vidrio oscuro |
| `--brand-gold-100` | #F5EFDF | `king-goldtint` | Placas, celda del conductor (navy encima 12.1:1) |

### Neutros (teñidos hacia el matiz navy ≈ 214°)
`--surface-app` lienzo · `--surface-card` tarjetas (sin blanco puro) · `--surface-sunken` bloques internos · `--line` bordes suaves · `--line-strong` bordes de control (3.4:1, WCAG 1.4.11) · `--text-strong` 16.5:1 · `--text-body` 11.5:1 · `--text-muted` 7.4:1.

### Estados (extensión semántica; el logo no define estados)
| Estado | Sólido (texto blanco) | Tinte | Texto sobre tinte |
|---|---|---|---|
| Libre ○ | `--state-free` #047857 (5.5:1) | `--state-free-tint` | `--state-free-ink` (6.8:1) |
| Reservada ◐ | `--state-reserved` #B45309 (5.0:1) | `--state-reserved-tint` | `--state-reserved-ink` (6.4:1) |
| Ocupada ● | `--state-occupied` #BE123C (6.3:1) | `--state-occupied-tint` | `--state-occupied-ink` (7.0:1) |

Contrastes medidos con la fórmula WCAG 2.x (script en el historial de la sesión; valores en esta tabla). Regla: **ningún estado se comunica solo con color**: símbolo + palabra siempre.

## 3. Tipografía
- **Red Hat Display** (títulos, números grandes, placas, reloj) + **Red Hat Text** (cuerpo y controles). Geométricas como el lockup, legibles en tamaños pequeños, con cifras tabulares. Autoalojadas con `@fontsource-variable` (sin red en ejecución).
- **Escala fija de producto, razón ≈ 1.25:** 12 · 14 · 16 · 20 · 25 · 31 · 39 · 49 px (`xs`…`4xl`).
- **Pesos:** 400 cuerpo · 600 etiquetas y botones · 700 títulos y cifras.
- **Reglas:** etiquetas en minúscula de oración (sin MAYÚSCULAS espaciadas); `tabular-nums` en contadores, horas y placas; líneas de lectura ≤ 75 ch; títulos con `text-wrap: balance`.

## 4. Espacio, forma y elevación
- **Espaciado:** escala de 4 px; ritmo por jerarquía: 24 px entre bloques de vista, 20 px entre tarjetas, 8–12 px dentro de grupos.
- **Radios:** `rounded-control` 8 px (botones, campos, filas) · `rounded-tile` 14 px (tarjetas) · `rounded-glass` 20 px (vidrio).
- **Elevación (sombras teñidas de navy, dos capas):** `shadow-e1` tarjetas · `shadow-e2` elementos activos (pill de pestaña, tarjetas flotantes) · `shadow-e3` vidrio oscuro y diálogos.
- **Contenedor único:** `max-w-7xl` en barra y contenido; las vistas no añaden anchos propios.

## 5. Materiales — Liquid Glass
Material en cuatro capas, no un simple `blur()`:
1. **Base tintada translúcida** (navy α 0.82 o superficie clara α 0.62) con `backdrop-filter: blur(18px) saturate(165%)`.
2. **Brillo especular**: degradado superior blanco y un halo oro tenue en una esquina (`background-image`).
3. **Aro de luz**: sombras `inset` arriba (luz) y abajo (sombra) — el borde iluminado sin máscaras (la v1 con `mask-composite` falló en contraste).
4. **Sombra física** de dos capas (`--shadow-2/3`).
5. **Respuesta al movimiento** (`.glass-sheen` + `useGlassSheen`): un reflejo radial sigue al puntero escribiendo `--gx/--gy` en el propio elemento; sin estado React ni listeners globales; solo con puntero fino.

| Primitiva | Dónde |
|---|---|
| `.glass-dark` / `GlassSurface tone="dark"` | Barra superior, dock móvil, toast, «Siguiente paso» del conductor, ficho del valet |
| `.glass` / `GlassSurface` | Reloj y controles de simulación, diálogo de confirmación |
| `GlassButton` | Controles flotantes de simulación |
| `GlassDialog` | Confirmación de acciones destructivas (reiniciar la simulación) |
| `AppNav` | `GlassNavigation`: segmentado en la barra (≥ 768 px) y dock inferior (< 768 px) |

- **Sin vidrio:** mapa de celdas, pasarelas, tablas, formularios, bitácora. Su legibilidad manda.
- **Presupuesto de desenfoque:** solo desenfocan las capas que flotan sobre el lienzo (barra o dock, toast, diálogo). Un vidrio dentro de una tarjeta opaca u otro vidrio conserva tinte, brillo, aro y sombra, pero sin `backdrop-filter` (no hay nada nuevo que refractar). Medido en Chromium: **2 superficies con desenfoque en pantalla** en las 5 vistas a 1440/1366/768 px y 2–3 a 390 px (`evidence/test-results/ui-v2-qa.txt`).
- **`GlassTooltip`:** no se implementa: ninguna acción depende de un ícono sin texto; todos los controles tienen etiqueta visible.
- **Alternativas:** sin soporte de `backdrop-filter` → superficie casi opaca; `prefers-reduced-transparency` o `prefers-contrast: more` → sin desenfoque ni brillos, fondo sólido.

## 6. Movimiento (Motion for React)
- **Principio:** solo se anima un cambio **ya confirmado** por `rootReduce`. Ninguna animación anticipa el resultado de un `dispatch`.
- **Solo `transform` y `opacity`.** `MotionConfig reducedMotion="user"` + regla CSS global para `prefers-reduced-motion`.
- **Constantes** (`src/components/ui/motion.ts`): `SPRING` (480/38, respuesta firme: pestañas, contadores, diálogos) · `SPRING_SOFT` (320/32, objetos físicos: vehículos, celdas, listas) · `EASE_OUT` cubic-bezier(0.22, 1, 0.36, 1).

| Momento | Animación |
|---|---|
| Cambio de vista | Fundido + 8 px, 180 ms |
| Pestaña activa | Pill compartida (`layoutId`) |
| Contadores (inventario, reloj, posición, vehículos delante) | `AnimatedNumber`: el valor nuevo entra desde arriba |
| Vehículo llega a la fila exterior / entra a la pasarela | Entra desde abajo; la placa conserva su identidad entre listas (`layoutId` por vehículo) |
| La fila avanza | Reacomodo con `SPRING_SOFT` (el puesto 2 sube al puesto 1) |
| Cruza portería | Sale hacia arriba |
| Recibe celda | La línea de estado del puesto cambia de «Esperando celda» a «Celda X reservada» |
| Celda libre → reservada → ocupada → libre / reasignación | Anillo del color del nuevo estado que se expande y desvanece; texto de estado cruzado |
| Llegada a celda confirmada | La tarjeta sale de «En camino» hacia la derecha |
| Toast | Entra con escala y sube; sale con fundido |
| Ficho emitido | Aparece escalando sobre vidrio oscuro |
| Seguimiento del valet | El anillo del paso actual se desplaza al siguiente |

## 7. Interacción y estados
- Botones: `btn-primary` (acción principal, una por grupo) · `btn-gold` (acción de marca en flujo del conductor) · `btn-secondary` · `btn-ghost` (acciones de simulación dentro de celdas) · `btn-danger` (destructivas, con confirmación).
- Presión: `scale(0.97)`. Deshabilitado: 50 % y **motivo en texto** enlazado con `aria-describedby` (p. ej. «Aún no tiene celda; nadie puede adelantarlo.», mismo texto que el motor).
- Mensajes: éxito `role="status"`, error `role="alert"`, toast `aria-live="polite"`. Sin franjas laterales: tinte + ícono.
- Textos a **usted**, en voz activa, el botón dice exactamente qué pasa («Dar paso a LVC301», «Confirmar LVC301 estacionado»).

## 8. Accesibilidad
- Contraste AA verificado (tablas de §2). Foco: contorno navy 3 px sobre claro; oro sobre vidrio oscuro (`.on-dark`).
- Pestañas WAI-ARIA con flechas, Inicio y Fin; enlace «Saltar al contenido».
- Objetivos táctiles ≥ 44 px (incluido el dock y el cierre del toast).
- `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast: more` atendidos.

## 9. Responsive
| Ancho | Navegación | Distribución |
|---|---|---|
| ≥ 1280 | Barra de vidrio en una fila: logo · pestañas · inventario · reloj | Portería: 2 pasarelas; abajo «En camino» (1/3) + celdas (2/3) |
| 768–1279 | Barra fija en dos filas (pestañas debajo) | 2 columnas desde 1024; una columna antes |
| < 768 | Barra superior **no fija** (logo, reloj, inventario) + **dock inferior de vidrio** con las 5 vistas | Una columna; el toast aparece encima del dock |

## 10. Componentes
`src/components/ui/`: `Panel`, `ViewHeader`, `GlassSurface`, `GlassButton`, `GlassDialog`, `AnimatedNumber`, `Icon` (set lineal propio, no emoji), `Plate`, `motion`.
`src/components/`: `AppNav`, `Badge`, `CellMap`, `LaneView`, `EtaCard`, `Toast`.
Clases: `card`, `label`, `btn*`, `field`, `plate`, `glass`, `glass-dark`, `glass-sheen`, `on-dark`.
