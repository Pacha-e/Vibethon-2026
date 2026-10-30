# Design system — parKING

**Fuente de verdad:** logo oficial (láminas en `public/brand/official/source-*.jpg`). Los tokens están en `src/styles/tokens.css`, los mapeos de Tailwind en `tailwind.config.js` y los materiales en `src/styles/index.css`. No hay otro sistema de estilos.

## Marca y logo
| Recurso | Archivo | Uso |
|---|---|---|
| Lockup a color (fondo transparente) | `public/brand/official/parking-logo-color.png` | Cabecera sobre vidrio azul tinta (altura 40 px en móvil, 48 px en escritorio) |
| Lockup sobre panel azul | `parking-logo-navy.png` | Presentaciones y portada |
| Lockup negro | `parking-logo-black.png` | Fondos claros e impresión monocroma |
| Ícono (K + corona) | `parking-icon.png`, `favicon-64.png` | Favicon, app icon, espacios menores de 48 px |

- Los recursos se obtienen con `scripts/extract_brand_assets.py`: solo **recorte + color a alfa**, sin redibujar, deformar ni recolorear.
- **Área de protección:** como mínimo la altura de la «K» alrededor del lockup.
- **No permitido:** estirar el logo, aplicarle sombras o filtros, colocarlo sobre fondos de bajo contraste o recolorear «KING».
- Los SVG de `public/brand/*.svg` son exploraciones anteriores de agentes y **no son la marca oficial**.

## Color
| Token | Valor | Origen | Uso |
|---|---|---|---|
| `--brand-navy` (`king-ink`) | #212D3D | Muestreado del logo | Superficies de marca, texto fuerte |
| `--brand-navy-900` (`king-deep`) | #161E29 | Derivado | Sombras y profundidad |
| `--brand-navy-700` (`king-royal`) | #34455E | Derivado | Botón primario (texto blanco 9,7:1) |
| `--brand-gold` (`king-goldlogo`) | #A98E4C | Muestreado del logo | Acentos decorativos; nunca texto sobre blanco (2,6:1) |
| `--brand-gold-300` (`king-gold`) | #C9AF6E | Derivado (mismo matiz) | Pestaña activa, foco y rellenos con texto navy (6,2:1) |
| `state-free / reserved / occupied` | emerald-700 / amber-700 / rose-700 | Extensión semántica | Estados de celda; siempre con símbolo y texto |

## Tipografía y escalas
- **Familia:** Inter → system-ui (el logo usa una sans geométrica similar).
- **Tamaños:** 12 px (metadatos), 14 px (secundario), 16 px (cuerpo y controles), 20–24 px (títulos de tarjeta), 30 px (título de vista).
- **Pesos:** 400 / 600 / 800. Los números usan `tabular-nums`.
- **Espaciado:** escala de Tailwind de 4 px (gap 8/12/16/24).
- **Radios:** `--radius-sm` 8, `--radius-md` 14, `--radius-lg` 20 (vidrio y tarjetas destacadas).

## Materiales — Liquid Glass
| Clase | Dónde | Composición |
|---|---|---|
| `.glass-dark` | Navegación fija | Azul tinta con alfa 0.86 + `blur(18px) saturate(160%)` + borde blanco al 22 % + reflejo superior y sombra inferior (inset) + brillo especular en degradado + sombra física |
| `.glass-toast` | Confirmaciones | Igual que `.glass-dark`, con borde de estado a la izquierda |
| `.glass` | Controles de simulación y tarjetas destacadas | Blanco con alfa 0.66, el mismo blur y brillo superior |

- **No llevan vidrio:** mapa de celdas, pasarelas, formularios ni tablas. Su legibilidad manda.
- **Alternativas:** sin soporte de `backdrop-filter` se usa una superficie opaca; con `prefers-reduced-transparency` se quita el blur y se usa fondo sólido.
- **Fondo `.app-backdrop`:** degradados radiales muy tenues de navy y oro, para que el vidrio tenga algo que refractar.

## Movimiento (Motion for React)
- **Principio:** solo se anima un cambio **ya confirmado** por `rootReduce`; nunca antes del `dispatch`.
- **Spring estándar:** `stiffness` 420–480, `damping` 34–38. Las transiciones de vista usan `ease [0.22, 1, 0.36, 1]` durante 180 ms.
- **Navegación:** pill compartida (`layoutId="tab-pill"`) y fundido con desplazamiento entre vistas.
- **Contadores:** cada cambio de valor entra desde arriba.
- **Filas:** `layout` en cada vehículo; las entradas suben y las salidas (cruzar portería) desaparecen hacia arriba.
- **Celdas:** un anillo hace un pulso cuando cambian el estado o el dueño (reserva, ocupación, liberación, reasignación).
- **Toast:** entra deslizando y escalando, y sale con un fundido.
- **Reglas:** solo `transform` y `opacity`; `MotionConfig reducedMotion="user"` y una regla CSS global para `prefers-reduced-motion`.

## Accesibilidad y responsive
- **Contraste:** AA verificado con los valores de la tabla de color.
- **Foco:** contorno oro de 3 px.
- **Pestañas:** `role="tablist"`, `tab` y `tabpanel`; el resumen de celdas usa `role="status"` y los toasts `aria-live`.
- **Responsive:** verificado a 1440, 1366, 768 y 390 px con scroll horizontal de 0 px. En móvil la navegación se desplaza horizontalmente y los chips de estado bajan a otra línea.
- **Objetivos táctiles:** 44 px o más.

## Componentes
- **Primitivas existentes:** `Badge`, `CellMap`, `LaneView`, `EtaCard`, `Toast`, y las clases `.card`, `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger` y `.field`.
- **Equivalentes de vidrio:**
  - `GlassNavigation` → la cabecera de `App.tsx`.
  - `GlassSurface` y `GlassPanel` → las clases `.glass` y `.glass-dark`.
  - `GlassToast` → `Toast`.
- **Decisión:** usar clases y no componentes envoltorio, porque no hay lógica que encapsular y así se evita duplicar props.
