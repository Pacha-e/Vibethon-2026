# parKING — reglas esenciales
App local React+Vite+TS+Tailwind para el parqueadero EAFIT (Las Vegas 4 / Regional 6, inventario único de celdas, 8 valets por acceso).
- Brief: `docs/agents/PROJECT-BRIEF.md` · Contratos: `docs/agents/CONTRACTS.md` + `src/contracts/types.ts` · Estado: `docs/agents/STATUS.md` · Tareas: `docs/agents/TASKS/`.
- Única fuente de verdad: `rootReduce` (`src/state/reducer.ts`). La UI solo lee `useSim().state` y llama `dispatch(Command)`. Nada de segundo motor ni estado paralelo.
- Determinista: tiempo simulado `state.now` (min). Prohibido `Date.now()`/`Math.random()` en dominio.
- Propiedad de archivos: ver CONTRACTS.md §Propiedad. No editar archivos ajenos; pedir con `CONTRACT|`/`BLOCKER|`.
- Trabajadores: no instalar dependencias, no tocar config. Comandos: `npm test`, `npx tsc --noEmit -p .`.
- No inventar datos oficiales: fixture `src/fixtures/provisional.ts` es PROVISIONAL.
- Prompts: hooks en `.claude/settings.json` → `scripts/prompt_logger.py` → `evidence/prompts/`.
