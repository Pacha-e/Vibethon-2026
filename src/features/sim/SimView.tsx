import { useState } from 'react';
import type { Command } from '../../contracts/types';
import { SCENARIOS } from '../../fixtures/scenarios';
import { POLICY_TEXT } from '../../domain/engine';
import { clock } from '../../components/format';
import { useSim } from '../../state/store';

interface RunResult {
  ok: boolean;
  error?: string;
}

export default function SimView() {
  const { state, dispatch } = useSim();
  const [results, setResults] = useState<Record<number, RunResult>>({});

  function run(id: number, commands: Command[]) {
    dispatch({ type: 'reset' });
    const r = dispatch({ type: 'batch', commands });
    setResults((prev) => ({ ...prev, [id]: { ok: r.ok, error: r.error } }));
  }

  const recent = state.log.slice(-40).reverse();

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold text-king-ink">Simulación</h1>
        <p className="mt-1 text-base text-slate-800">Ejecute escenarios de prueba o avance el reloj simulado.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="demo-title" className="card space-y-3">
          <h2 id="demo-title" className="text-lg font-bold text-king-ink">
            Guion de demo (2 min)
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-base text-king-ink">
            <li>Conductor llega por Las Vegas y ve su turno y ETA.</li>
            <li>Portería da paso y confirma celda.</li>
            <li>Valet: contratar → pagar → entregar → estacionar → depositar.</li>
            <li>Oficina reclama con ficho.</li>
            <li>Ejecutar escenarios 1–9.</li>
          </ol>
        </section>
        <section aria-labelledby="benefit-title" className="card space-y-3">
          <h2 id="benefit-title" className="text-lg font-bold text-king-ink">
            Beneficio concreto
          </h2>
          <p className="text-base text-king-ink">
            Sin coordinación, dos accesos podían reservar la misma celda y el conductor no sabía cuánto esperar. Con
            parKING, cada celda liberada va a un único vehículo, alternando accesos (ver escenario 3), y la espera se
            muestra como rango o «datos insuficientes».
          </p>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section aria-labelledby="scenarios-title" className="card space-y-4">
          <h2 id="scenarios-title" className="text-lg font-bold text-king-ink">
            Escenarios
          </h2>
          {SCENARIOS.length === 0 && <p className="text-base text-slate-800">No hay escenarios cargados.</p>}
          <ul className="space-y-3">
            {SCENARIOS.map((s) => {
              const res = results[s.id];
              return (
                <li key={s.id} className="rounded-lg border border-slate-300 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-king-ink">
                        {s.id}. {s.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-800">Resultado esperado: {s.expected}</p>
                    </div>
                    <button type="button" className="btn btn-primary" onClick={() => run(s.id, s.commands)}>
                      Ejecutar
                    </button>
                  </div>
                  {res && (
                    <p className={`mt-3 text-sm font-semibold ${res.ok ? 'text-emerald-900' : 'text-red-900'}`}>
                      {res.ok ? 'Último resultado: aplicado sin errores' : `Último resultado: error. ${res.error ?? ''}`}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <div className="space-y-6">
          <section aria-labelledby="clock-title" className="card space-y-4">
            <h2 id="clock-title" className="text-lg font-bold text-king-ink">
              Reloj simulado
            </h2>
            <p className="text-3xl font-bold tabular-nums text-king-ink">{clock(state.now)}</p>
            <p className="text-sm text-slate-800">Minuto {state.now} desde el inicio</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => dispatch({ type: 'advanceTime', minutes: 1 })}
              >
                +1 min
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => dispatch({ type: 'advanceTime', minutes: 5 })}
              >
                +5 min
              </button>
              <button type="button" className="btn btn-danger" onClick={() => dispatch({ type: 'reset' })}>
                Reiniciar
              </button>
            </div>
          </section>

          <section aria-labelledby="policy-title" className="card space-y-2">
            <h2 id="policy-title" className="text-lg font-bold text-king-ink">
              Política de asignación
            </h2>
            <p className="text-base text-slate-900">{POLICY_TEXT}</p>
          </section>

          <section aria-labelledby="log-title" className="card space-y-3">
            <h2 id="log-title" className="text-lg font-bold text-king-ink">
              Bitácora
            </h2>
            {recent.length === 0 ? (
              <p className="text-base text-slate-800">Sin eventos todavía.</p>
            ) : (
              <div tabIndex={0} aria-label="Bitácora, desplazable" className="max-h-96 overflow-y-auto rounded-md">
                <ol className="divide-y divide-slate-200">
                  {recent.map((e) => (
                    <li key={e.seq} className="flex gap-3 py-2 text-sm">
                      <time className="w-14 shrink-0 font-mono font-semibold text-king-royal">{clock(e.at)}</time>
                      <span className="text-slate-900">{e.message}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
