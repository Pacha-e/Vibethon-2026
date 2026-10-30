import { useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ACCESSES,
  ACCESS_NAME,
  type AccessId,
  type Vehicle,
} from "../../contracts/types";
import { getEta } from "../../domain/engine";
import { Badge } from "../../components/Badge";
import { EtaCard } from "../../components/EtaCard";
import { STAGE_LABEL } from "../../components/format";
import { AnimatedNumber } from "../../components/ui/AnimatedNumber";
import { GlassSurface } from "../../components/ui/Glass";
import { Icon } from "../../components/ui/Icon";
import { Panel, ViewHeader } from "../../components/ui/Panel";
import { Plate } from "../../components/ui/Plate";
import { SPRING } from "../../components/ui/motion";
import { useSim } from "../../state/store";
import HireValetPanel from "../valet/HireValetPanel";

const TRIP_STEPS: { stage: Vehicle["stage"]; label: string }[] = [
  { stage: "outside", label: "Fila exterior" },
  { stage: "in_lane", label: "Pasarela" },
  { stage: "entering", label: "Hacia su celda" },
  { stage: "parked", label: "Estacionado" },
];

const ARRIVE_STEPS = [
  "Regístrese con su placa y acceso.",
  "Vea su posición y la espera estimada.",
  "Reciba su celda y el recorrido desde portería.",
];

/** Frase accionable según la etapa real del vehículo; null cuando su turno ya terminó. */
function nextStep(v: Vehicle): string | null {
  if (
    v.exitWithoutParking &&
    (v.stage === "outside" || v.stage === "in_lane")
  ) {
    return "Saldrá sin estacionar; conserva su lugar hasta portería.";
  }
  switch (v.stage) {
    case "outside":
      return "Espere antes del registro: la pasarela está llena.";
    case "in_lane":
      return v.cellId
        ? `Avance a portería cuando sea el primero: su celda ${v.cellId} está reservada.`
        : "Espere en la pasarela; le avisaremos al reservar su celda.";
    case "entering":
      return v.cellId
        ? `Diríjase a ${v.cellId} y confirme «Ya estacioné».`
        : "Diríjase a su celda y confirme «Ya estacioné».";
    case "parked":
      return v.cellId ? `Estacionado en ${v.cellId}.` : "Estacionado.";
    case "exiting":
      return "Salga por la salida habilitada.";
    case "exited":
      return null;
  }
}

export default function DriverView() {
  const { state, dispatch } = useSim();
  const [plate, setPlate] = useState("");
  const [driver, setDriver] = useState("");
  const [access, setAccess] = useState<AccessId>("LV");
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");

  // Vehículos activos. Se conserva el seleccionado aunque ya haya salido, para mostrar su cierre.
  const choices = useMemo<Vehicle[]>(
    () =>
      Object.values(state.vehicles).filter(
        (v) => v.stage !== "exited" || v.id === selectedId,
      ),
    [state.vehicles, selectedId],
  );
  const me: Vehicle | null = selectedId
    ? (state.vehicles[selectedId] ?? null)
    : null;
  const cellId = me?.cellId ?? null;
  const cell = cellId ? state.cells.find((c) => c.id === cellId) : undefined;
  const showEta =
    me !== null && (me.stage === "outside" || me.stage === "in_lane");
  const eta = me && showEta ? getEta(state, me.id) : null;
  const step = me ? nextStep(me) : null;
  const tripIndex = me ? TRIP_STEPS.findIndex((s) => s.stage === me.stage) : -1;

  function onArrive(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const p = plate.trim().toUpperCase();
    const d = driver.trim();
    if (!p || !d) {
      setFormMsg("Falta información: escriba la placa y su nombre.");
      return;
    }
    setFormMsg(null);
    const before = state.vehicles;
    const r = dispatch({ type: "arrive", plate: p, driver: d, access });
    if (!r.ok) return;
    // El vehículo nuevo es el primer evento que referencia un id inexistente antes del comando.
    const newId = r.events.find(
      (ev) => ev.vehicleId && !before[ev.vehicleId],
    )?.vehicleId;
    if (newId) setSelectedId(newId);
    setPlate("");
    setDriver("");
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Conductor"
        lead="Regístrese en la fila y siga su turno hasta su celda."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start">
        <div className="space-y-5">
          <Panel id="arrive-title" title="Llegar a la fila">
            <form onSubmit={onArrive} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="plate"
                  className="block text-sm font-semibold text-fg-strong"
                >
                  Placa
                </label>
                <input
                  id="plate"
                  name="plate"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  autoComplete="off"
                  placeholder="ABC123"
                  className="field font-display uppercase tracking-[0.06em]"
                />
              </div>
              <div>
                <label
                  htmlFor="driver"
                  className="block text-sm font-semibold text-fg-strong"
                >
                  Nombre del conductor
                </label>
                <input
                  id="driver"
                  name="driver"
                  value={driver}
                  onChange={(e) => setDriver(e.target.value)}
                  autoComplete="off"
                  className="field"
                />
              </div>
              <fieldset>
                <legend className="text-sm font-semibold text-fg-strong">
                  Acceso
                </legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {ACCESSES.map((a) => (
                    <label
                      key={a}
                      className={`flex min-h-[2.75rem] cursor-pointer items-center gap-2 rounded-control border px-3 py-2 font-semibold transition-colors ${
                        access === a
                          ? "border-king-royal bg-surface-sunken ring-2 ring-king-royal/20 text-fg-strong"
                          : "border-line-strong text-fg-body"
                      }`}
                    >
                      <input
                        type="radio"
                        name="access"
                        value={a}
                        checked={access === a}
                        onChange={() => setAccess(a)}
                        className="h-5 w-5 accent-king-royal"
                      />
                      {ACCESS_NAME[a]} ({a})
                    </label>
                  ))}
                </div>
              </fieldset>
              {formMsg && (
                <p
                  role="alert"
                  className="flex gap-2 text-sm font-semibold text-state-occupied-ink"
                >
                  <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                  {formMsg}
                </p>
              )}
              <button type="submit" className="btn btn-primary w-full">
                Llegar a la fila
              </button>
            </form>
          </Panel>

          <Panel id="pick-title" title="Mi vehículo">
            <label
              htmlFor="me-select"
              className="block text-sm font-semibold text-fg-strong"
            >
              Soy el conductor de
            </label>
            <select
              id="me-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="field mt-2"
            >
              <option value="">Seleccione su vehículo</option>
              {choices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} · {v.driver} · {ACCESS_NAME[v.access]}
                </option>
              ))}
            </select>
            {choices.length === 0 && (
              <p className="mt-2 text-sm text-fg-muted">
                Aún no hay vehículos activos. Regístrese en la fila.
              </p>
            )}
          </Panel>
        </div>

        <Panel id="turn-title" title="Mi turno" className={me ? "order-first lg:order-none" : undefined}>
          {!me ? (
            <ol className="space-y-3">
              {ARRIVE_STEPS.map((text, i) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-sunken font-display font-bold text-king-royal">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-base text-fg-body">{text}</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <Plate>{me.plate}</Plate>
                <Badge tone="gold">{ACCESS_NAME[me.access]}</Badge>
                <span className="text-sm text-fg-body">{me.driver}</span>
              </div>

              {step && (
                <GlassSurface tone="dark" className="on-dark p-5">
                  <p className="text-sm font-semibold text-king-gold">
                    Siguiente paso
                  </p>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={step}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-1 text-lg font-semibold text-white"
                    >
                      {step}
                    </motion.p>
                  </AnimatePresence>
                </GlassSurface>
              )}

              {tripIndex >= 0 ? (
                <ol
                  aria-label="Etapa del turno"
                  className="grid grid-cols-4 gap-1"
                >
                  {TRIP_STEPS.map((s, i) => {
                    const done = i < tripIndex;
                    const current = i === tripIndex;
                    return (
                      <li key={s.stage} className="flex flex-col gap-1.5">
                        <span
                          aria-hidden="true"
                          className={`block h-1.5 rounded-full ${
                            done
                              ? "bg-state-free"
                              : current
                                ? "bg-king-royal"
                                : "bg-line"
                          }`}
                        />
                        <span
                          className={`text-xs ${current ? "font-semibold text-fg-strong" : "text-fg-muted"}`}
                        >
                          {s.label}
                          <span className="sr-only">
                            {done ? " (listo)" : current ? " (ahora)" : ""}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="label">Etapa: {STAGE_LABEL[me.stage]}</p>
              )}
              <p className="text-sm text-fg-muted">{STAGE_LABEL[me.stage]}</p>

              {me.notice && (
                <p
                  role="status"
                  className={`flex gap-2 rounded-control px-3 py-2 text-sm ${
                    me.reassignments > 0
                      ? "bg-state-reserved-tint text-state-reserved-ink"
                      : "bg-surface-sunken text-fg-body"
                  }`}
                >
                  <Icon name={me.reassignments > 0 ? "alert" : "check"} className="mt-0.5 h-4 w-4 shrink-0" />
                  {me.notice}
                </p>
              )}

              {eta &&
                (eta.kind === "estimate" || eta.kind === "not_registered") && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-tile bg-surface-sunken p-4">
                      <p className="text-sm font-semibold text-fg-muted">
                        Posición
                      </p>
                      <AnimatedNumber
                        value={eta.position}
                        className="font-display text-4xl font-bold text-fg-strong"
                      />
                    </div>
                    <div className="rounded-tile bg-surface-sunken p-4">
                      <p className="text-sm font-semibold text-fg-muted">
                        Vehículos delante
                      </p>
                      <AnimatedNumber
                        value={eta.vehiclesAhead}
                        className="font-display text-4xl font-bold text-fg-strong"
                      />
                    </div>
                  </div>
                )}
              {eta && <EtaCard eta={eta} />}

              {cell ? (
                <motion.div
                  key={cell.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={SPRING}
                  className="rounded-tile border-2 border-king-goldlogo bg-king-goldtint p-4"
                >
                  <p className="text-sm font-semibold text-fg-muted">
                    Su celda
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold text-fg-strong">
                    {cell.id}
                  </p>
                  <p className="text-sm text-fg-body">Zona {cell.zone}</p>
                  <p className="mt-2 flex items-start gap-2 text-sm text-fg-body">
                    <Icon name="route" className="mt-0.5 h-4 w-4 shrink-0" />
                    Recorrido desde portería: {cell.route}
                  </p>
                </motion.div>
              ) : (
                (me.stage === "in_lane" || me.stage === "entering") && (
                  <p className="text-sm text-fg-muted">
                    Sin celda asignada todavía.
                  </p>
                )
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                {me.stage === "outside" && (
                  <p className="text-sm text-fg-muted sm:col-span-2">
                    Espere su turno en la fila exterior.
                  </p>
                )}
                {me.stage === "in_lane" && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                      dispatch({
                        type: "requestExitWithoutParking",
                        vehicleId: me.id,
                      })
                    }
                  >
                    Salir sin estacionar
                  </button>
                )}
                {me.stage === "entering" && (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        dispatch({ type: "park", vehicleId: me.id })
                      }
                    >
                      Ya estacioné
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        dispatch({
                          type: "reportCellOccupied",
                          vehicleId: me.id,
                        })
                      }
                    >
                      Mi celda está ocupada
                    </button>
                  </>
                )}
                {me.stage === "parked" && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() =>
                      dispatch({ type: "leave", vehicleId: me.id })
                    }
                  >
                    Salir del parqueadero
                  </button>
                )}
                {me.stage === "exiting" && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() =>
                      dispatch({ type: "completeExit", vehicleId: me.id })
                    }
                  >
                    Completar salida
                  </button>
                )}
                {me.stage === "exited" && (
                  <p className="text-base text-fg-body sm:col-span-2">
                    Su turno terminó. Gracias por usar parKING.
                  </p>
                )}
              </div>
            </div>
          )}
        </Panel>
      </div>

      {me && (
        <section aria-labelledby="valet-title" className="space-y-3">
          <h2 id="valet-title" className="sr-only">
            Servicio de valet
          </h2>
          <HireValetPanel vehicleId={me.id} />
        </section>
      )}
    </div>
  );
}
