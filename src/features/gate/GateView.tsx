import { AnimatePresence, motion } from "motion/react";
import type { AccessId, Cell, Vehicle } from "../../contracts/types";
import { ACCESSES, ACCESS_NAME } from "../../contracts/types";
import {
  cellCounts,
  laneView,
  nextAccessToServe,
  POLICY_TEXT,
} from "../../domain/engine";
import { Badge } from "../../components/Badge";
import { CellMap } from "../../components/CellMap";
import { LaneView } from "../../components/LaneView";
import { Panel, ViewHeader } from "../../components/ui/Panel";
import { Plate } from "../../components/ui/Plate";
import { Icon } from "../../components/ui/Icon";
import { SPRING_SOFT } from "../../components/ui/motion";
import { useSim } from "../../state/store";

/**
 * Motivo por el que el primero no puede cruzar todavía (refleja la regla de gateAdmit del motor;
 * el motor sigue siendo quien decide). null = puede cruzar.
 */
function blockReason(first: Vehicle | undefined): string | null {
  if (!first) return "Nadie junto a portería.";
  if (first.exitWithoutParking || first.cellId) return null;
  return "Aún no tiene celda; nadie puede adelantarlo.";
}

function GateAction({
  access,
  first,
}: {
  access: AccessId;
  first: Vehicle | undefined;
}) {
  const { dispatch } = useSim();
  const reason = blockReason(first);
  const hintId = `gate-hint-${access}`;
  return (
    <div className="space-y-2">
      <button
        type="button"
        className="btn btn-primary w-full"
        disabled={reason !== null}
        aria-describedby={reason ? hintId : undefined}
        onClick={() => dispatch({ type: "gateAdmit", access })}
      >
        <Icon name="gate" className="h-5 w-5" />
        {first ? `Dar paso a ${first.plate}` : "Dar paso en portería"}
      </button>
      {reason && first && (
        <p id={hintId} className="text-sm text-fg-muted">
          {reason}
        </p>
      )}
    </div>
  );
}

export default function GateView() {
  const { state, dispatch } = useSim();
  const counts = cellCounts(state);
  const next: AccessId | null = nextAccessToServe(state);
  const entering = Object.values(state.vehicles).filter(
    (v) => v.stage === "entering",
  );

  const simLabel = (cell: Cell): string | null => {
    if (cell.status === "free") return "Simular ocupación";
    if (cell.status === "occupied" && cell.vehicleId === null)
      return "Simular salida";
    return null;
  };

  const simAction = (cell: Cell) => {
    if (cell.status === "free")
      dispatch({ type: "occupyCellExternally", cellId: cell.id });
    else if (cell.status === "occupied" && cell.vehicleId === null)
      dispatch({ type: "releaseCell", cellId: cell.id });
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Portería"
        lead="Dé paso al primero de cada pasarela y confirme las llegadas a celda."
        aside={
          <p
            role="status"
            className="inline-flex items-center gap-2 rounded-full bg-surface-card px-3 py-1.5 text-sm shadow-e1 ring-1 ring-line"
          >
            <span className="text-fg-muted">Próxima celda libre para</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.strong
                key={next ?? "none"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={SPRING_SOFT}
                className="font-semibold text-fg-strong"
              >
                {next ? ACCESS_NAME[next] : "nadie: no hay demanda"}
              </motion.strong>
            </AnimatePresence>
          </p>
        }
      />

      <details className="group rounded-tile border border-line bg-surface-card/70 px-4 py-1 text-sm shadow-e1 open:bg-surface-card">
        <summary className="flex min-h-[2.75rem] cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden gap-2 font-semibold text-fg-strong">
          <Icon
            name="chevron"
            className="h-4 w-4 transition-transform duration-200 group-open:rotate-90"
          />
          Cómo se asignan las celdas
        </summary>
        <p className="max-w-[75ch] pb-3 pl-6 text-fg-body">{POLICY_TEXT}</p>
      </details>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        {ACCESSES.map((a) => {
          const view = laneView(state, a);
          return (
            <LaneView
              key={a}
              access={a}
              view={view}
              gateAction={<GateAction access={a} first={view.lane[0]} />}
            />
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
        <Panel
          id="route-title"
          title="En camino a su celda"
          description="Cruzaron portería. Confirme cuando estacionen."
        >
          {entering.length === 0 ? (
            <p className="text-base text-fg-muted">
              Nadie en camino a una celda.
            </p>
          ) : (
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {entering.map((v) => {
                  const c = v.cellId
                    ? state.cells.find((x) => x.id === v.cellId)
                    : undefined;
                  return (
                    <motion.li
                      key={v.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 24 }}
                      transition={SPRING_SOFT}
                      className="space-y-2 rounded-control border border-line bg-surface-sunken p-3"
                    >
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Plate>{v.plate}</Plate>
                        <span className="text-sm text-fg-body">{v.driver}</span>
                      </div>
                      <p className="text-sm font-semibold text-fg-strong">
                        {v.cellId ? `Celda ${v.cellId}` : "Sin celda asignada"}
                        {c && (
                          <span className="font-normal text-fg-muted">
                            {" "}
                            · Zona {c.zone}
                          </span>
                        )}
                      </p>
                      {v.reassignments > 0 && (
                        <p className="flex gap-1.5 rounded-control bg-state-reserved-tint px-2 py-1.5 text-sm text-state-reserved-ink">
                          <Icon
                            name="alert"
                            className="mt-0.5 h-4 w-4 shrink-0"
                          />
                          {v.notice ??
                            `Reasignado ${v.reassignments} ${v.reassignments === 1 ? "vez" : "veces"}.`}
                        </p>
                      )}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm w-full"
                        onClick={() =>
                          dispatch({ type: "park", vehicleId: v.id })
                        }
                      >
                        <Icon name="check" className="h-4 w-4" />
                        Confirmar {v.plate} estacionado
                      </button>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </Panel>

        <Panel
          id="cells-title"
          title="Celdas"
          description="«Simular» representa autos no registrados; no son acciones del conductor."
          actions={
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="ok" symbol="○">
                {counts.free} libres
              </Badge>
              <Badge tone="warn" symbol="◐">
                {counts.reserved} reservadas
              </Badge>
              <Badge tone="error" symbol="●">
                {counts.occupied} ocupadas
              </Badge>
            </div>
          }
        >
          <CellMap
            cells={state.cells}
            vehicles={state.vehicles}
            onCellAction={simAction}
            actionLabel={simLabel}
          />
        </Panel>
      </div>
    </div>
  );
}
