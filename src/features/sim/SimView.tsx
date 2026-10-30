import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Command } from "../../contracts/types";
import { SCENARIOS } from "../../fixtures/scenarios";
import { POLICY_TEXT } from "../../domain/engine";
import { clock } from "../../components/format";
import { AnimatedNumber } from "../../components/ui/AnimatedNumber";
import { GlassButton, GlassSurface } from "../../components/ui/Glass";
import { GlassDialog } from "../../components/ui/GlassDialog";
import { Icon } from "../../components/ui/Icon";
import { Panel, ViewHeader } from "../../components/ui/Panel";
import { useSim } from "../../state/store";

interface RunResult {
  ok: boolean;
  error?: string;
}

export default function SimView() {
  const { state, dispatch } = useSim();
  const [results, setResults] = useState<Record<number, RunResult>>({});
  const [lastRunId, setLastRunId] = useState<number | null>(null);
  const [confirm, setConfirm] = useState(false);

  function run(id: number, commands: Command[]) {
    dispatch({ type: "reset" });
    const r = dispatch({ type: "batch", commands });
    setResults((prev) => ({ ...prev, [id]: { ok: r.ok, error: r.error } }));
    setLastRunId(id);
  }

  const recent = state.log.slice(-40).reverse();
  const cerrar = () => setConfirm(false);

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Simulación"
        lead="Ejecute los escenarios oficiales o avance el reloj simulado."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-start">
        <Panel id="scenarios-title" title="Escenarios">
          {SCENARIOS.length === 0 && (
            <p className="text-base text-fg-muted">
              No hay escenarios cargados.
            </p>
          )}
          <ul className="space-y-3">
            {SCENARIOS.map((s) => {
              const res = results[s.id];
              return (
                <li
                  key={s.id}
                  className={`rounded-control border p-4 ${
                    lastRunId === s.id
                      ? "border-king-goldlogo bg-king-goldtint/40"
                      : "border-line"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-sunken font-display font-bold text-king-royal">
                        {s.id}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-fg-strong">
                          {s.title}
                        </p>
                        <p className="mt-1 text-sm text-fg-muted">
                          Resultado esperado: {s.expected}
                        </p>
                        {lastRunId === s.id && (
                          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-fg-strong">
                            <Icon name="check" className="h-4 w-4" />
                            Ejecutado
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      aria-label={`Ejecutar escenario ${s.id}`}
                      onClick={() => run(s.id, s.commands)}
                    >
                      Ejecutar
                    </button>
                  </div>
                  {res &&
                    (res.ok ? (
                      <p
                        role="status"
                        className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-state-free-ink"
                      >
                        <Icon name="check" className="h-4 w-4" />
                        Aplicado sin errores
                      </p>
                    ) : (
                      <p
                        role="alert"
                        className="mt-3 flex gap-1.5 text-sm font-semibold text-state-occupied-ink"
                      >
                        <Icon
                          name="alert"
                          className="mt-0.5 h-4 w-4 shrink-0"
                        />
                        Error. {res.error ?? ""}
                      </p>
                    ))}
                </li>
              );
            })}
          </ul>
        </Panel>

        <div className="space-y-5">
          <GlassSurface
            sheen
            className="space-y-4 p-5"
            role="region"
            aria-labelledby="clock-title"
          >
            <h2 id="clock-title" className="text-lg font-bold">
              Reloj simulado
            </h2>
            <AnimatedNumber
              value={clock(state.now)}
              className="font-display text-4xl font-bold text-fg-strong"
            />
            <p className="text-sm text-fg-muted">
              Minuto {state.now} desde el inicio
            </p>
            <div className="flex flex-wrap gap-3">
              <GlassButton
                onClick={() => dispatch({ type: "advanceTime", minutes: 1 })}
              >
                +1 min
              </GlassButton>
              <GlassButton
                onClick={() => dispatch({ type: "advanceTime", minutes: 5 })}
              >
                +5 min
              </GlassButton>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setConfirm(true)}
              >
                Reiniciar
              </button>
            </div>
          </GlassSurface>

          <GlassDialog
            open={confirm}
            title="¿Reiniciar la simulación?"
            onClose={cerrar}
            actions={
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cerrar}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    dispatch({ type: "reset" });
                    setConfirm(false);
                  }}
                >
                  Reiniciar
                </button>
              </>
            }
          >
            Se borran vehículos, servicios y bitácora. Puede volver a ejecutar
            cualquier escenario.
          </GlassDialog>

          <Panel
            id="log-title"
            title="Bitácora"
            description="Últimos 40 eventos, el más reciente arriba."
          >
            {recent.length === 0 ? (
              <p className="text-base text-fg-muted">Sin eventos todavía.</p>
            ) : (
              <div
                tabIndex={0}
                aria-label="Bitácora, desplazable"
                className="max-h-96 overflow-y-auto rounded-control"
              >
                <ol className="divide-y divide-line">
                  <AnimatePresence initial={false}>
                    {recent.map((e) => (
                      <motion.li
                        key={e.seq}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3 py-2 text-sm"
                      >
                        <time className="w-14 shrink-0 font-display font-semibold tabular-nums text-king-royal">
                          {clock(e.at)}
                        </time>
                        <span className="text-fg-body">{e.message}</span>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ol>
              </div>
            )}
          </Panel>

          <details className="group card">
            <summary className="flex min-h-[2.75rem] cursor-pointer list-none items-center gap-2 font-semibold text-fg-strong [&::-webkit-details-marker]:hidden">
              <Icon
                name="chevron"
                className="h-4 w-4 transition-transform duration-200 group-open:rotate-90"
              />
              Guion de demo y política
            </summary>
            <div className="mt-4 space-y-4">
              <ol className="list-decimal space-y-2 pl-5 text-base text-fg-body">
                <li>Conductor llega por Las Vegas y ve su turno y ETA.</li>
                <li>Portería da paso y confirma celda.</li>
                <li>
                  Valet: contratar → pagar → entregar → estacionar → depositar.
                </li>
                <li>Oficina reclama con ficho.</li>
                <li>Ejecutar escenarios 1–9.</li>
              </ol>
              <div>
                <p className="text-sm font-semibold text-fg-strong">
                  Beneficio concreto
                </p>
                <p className="mt-1 text-base text-fg-body">
                  Sin coordinación, dos accesos podían reservar la misma celda y
                  el conductor no sabía cuánto esperar. Con parKING, cada celda
                  liberada va a un único vehículo, alternando accesos (ver
                  escenario 3), y la espera se muestra como rango o «datos
                  insuficientes».
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-fg-strong">
                  Política de asignación
                </p>
                <p className="mt-1 text-base text-fg-body">{POLICY_TEXT}</p>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
