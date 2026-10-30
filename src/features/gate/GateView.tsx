import type { AccessId, Cell, Vehicle } from '../../contracts/types';
import { ACCESSES, ACCESS_NAME } from '../../contracts/types';
import { cellCounts, laneView, nextAccessToServe, POLICY_TEXT } from '../../domain/engine';
import { Badge } from '../../components/Badge';
import { CellMap } from '../../components/CellMap';
import { LaneView } from '../../components/LaneView';
import { useSim } from '../../state/store';

function admitText(first: Vehicle | undefined): string {
  if (!first) return 'Pasarela vacía: nadie espera portería.';
  return first.cellId ? `${first.plate} → celda ${first.cellId} reservada` : `${first.plate} → Esperando celda`;
}

export default function GateView() {
  const { state, dispatch } = useSim();
  const counts = cellCounts(state);
  const next: AccessId | null = nextAccessToServe(state);
  const entering = Object.values(state.vehicles).filter((v) => v.stage === 'entering');

  const simLabel = (cell: Cell): string | null => {
    if (cell.status === 'free') return 'Simular: ocupar';
    if (cell.status === 'occupied' && cell.vehicleId === null) return 'Simular: liberar';
    return null;
  };

  const simAction = (cell: Cell) => {
    if (cell.status === 'free') dispatch({ type: 'occupyCellExternally', cellId: cell.id });
    else if (cell.status === 'occupied' && cell.vehicleId === null) dispatch({ type: 'releaseCell', cellId: cell.id });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold text-king-ink">Portería</h1>
        <p className="mt-1 text-base text-slate-800">Dé paso a la pasarela y confirme las llegadas a sus celdas.</p>
      </header>

      <section aria-labelledby="policy-title" className="card space-y-2">
        <h2 id="policy-title" className="text-lg font-bold text-king-ink">
          Política de asignación
        </h2>
        <p className="text-base text-king-ink">
          Próximo acceso a atender: <span className="font-semibold">{next ? ACCESS_NAME[next] : 'ninguno en espera'}</span>
        </p>
        <p className="text-sm text-slate-800">{POLICY_TEXT}</p>
      </section>

      <section aria-labelledby="lanes-title" className="space-y-3">
        <h2 id="lanes-title" className="text-lg font-bold text-king-ink">
          Pasarelas
        </h2>
        <div className="grid gap-6 md:grid-cols-2 md:items-start">
          {ACCESSES.map((a) => {
            const view = laneView(state, a);
            const first = view.lane[0];
            return (
              <div key={a} className="space-y-3">
                <LaneView access={a} view={view} />
                <div className="card space-y-3">
                  <p role="status" className="text-base font-semibold text-king-ink">
                    {admitText(first)}
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary w-full"
                    disabled={!first}
                    onClick={() => dispatch({ type: 'gateAdmit', access: a })}
                  >
                    Dar paso en portería
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="route-title" className="card">
        <h2 id="route-title" className="text-lg font-bold text-king-ink">
          En camino a su celda
        </h2>
        {entering.length === 0 ? (
          <p className="mt-2 text-base text-slate-800">Nadie en camino a una celda.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {entering.map((v) => {
              const c = v.cellId ? state.cells.find((x) => x.id === v.cellId) : undefined;
              return (
                <li
                  key={v.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-300 p-3"
                >
                  <div>
                    <p className="font-bold text-king-ink">
                      {v.plate} <span className="font-normal">· {v.driver}</span>
                    </p>
                    <p className="text-sm text-slate-800">
                      Celda {v.cellId ?? 'sin asignar'}
                      {c ? ` · Zona ${c.zone}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => dispatch({ type: 'park', vehicleId: v.id })}
                  >
                    Confirmar estacionado
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="cells-title" className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="cells-title" className="text-lg font-bold text-king-ink">
            Celdas
          </h2>
          <div className="flex flex-wrap gap-2">
            <Badge tone="ok" symbol="○">
              Libres {counts.free}
            </Badge>
            <Badge tone="warn" symbol="◐">
              Reservadas {counts.reserved}
            </Badge>
            <Badge tone="error" symbol="●">
              Ocupadas {counts.occupied}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-slate-800">
          Las acciones «Simular» representan autos no registrados. No son acciones del conductor.
        </p>
        <CellMap
          cells={state.cells}
          vehicles={state.vehicles}
          onCellAction={simAction}
          actionLabel={simLabel}
        />
      </section>

    </div>
  );
}
