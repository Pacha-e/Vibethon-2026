// Panel "Contratar valet" para el conductor (propiedad: valet-haiku).
import { useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { getEta } from "../../domain/engine";
import { ACCESS_NAME } from "../../contracts/types";
import type { Command, SimState, ValetService } from "../../contracts/types";
import { useSim } from "../../state/store";
import { GlassSurface } from "../../components/ui/Glass";
import { Icon } from "../../components/ui/Icon";
import { SPRING } from "../../components/ui/motion";
import { fmtCOP, serviceSeq } from "./logic";
import { SERVICE_STAGE_TEXT, TRACK_ORDER, VEHICLE_STAGE_TEXT } from "./labels";

type Act = (cmd: Command) => void;

const FAILED_STAGES = ["payment_rejected", "payment_expired"];

const TRACK_DETAIL: Partial<Record<ValetService["stage"], string>> = {
  confirmed: "Pago aprobado. Entregue su auto al valet para recibir el ficho.",
  car_handed: "El valet estacionará su auto cuando tenga celda disponible.",
  parked: "El valet dejará las llaves en la oficina.",
  keys_deposited: "Llaves en oficina. Reclámelas con su ficho.",
  keys_delivered: "Servicio completado. Llaves entregadas.",
};

function OfferBlock({
  state,
  vehicleId,
  act,
}: {
  state: SimState;
  vehicleId: string;
  act: Act;
}) {
  const vehicle = state.vehicles[vehicleId];
  const valetsOfAccess = state.valets.filter(
    (v) => v.access === vehicle.access,
  );
  const free = valetsOfAccess.filter((v) => v.status === "available");
  const eta = getEta(state, vehicleId);
  // Sugerir solo con estimación clara y espera mayor al umbral; insufficient_data no sugiere.
  const suggest =
    eta.kind === "estimate" &&
    (eta.maxMinutes ?? 0) > state.config.valetSuggestMinutes;

  return (
    <div className="space-y-3">
      {suggest && (
        <p className="rounded-control bg-king-goldtint px-3 py-2 text-sm text-king-ink">
          <span aria-hidden="true">★ </span>
          Sugerencia: su espera estimada es de {eta.minMinutes}–{eta.maxMinutes}{" "}
          min. Un valet puede ahorrarle tiempo.
        </p>
      )}
      <p className="text-sm text-fg-body">
        Valets disponibles en {ACCESS_NAME[vehicle.access]}: {free.length} de{" "}
        {valetsOfAccess.length}
      </p>
      {free.length === 0 ? (
        <p className="text-sm text-fg-muted">
          No hay valets disponibles en {ACCESS_NAME[vehicle.access]}; continúa
          en la fila normal.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {free.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                className="btn btn-secondary w-full justify-start"
                onClick={() =>
                  act({ type: "valetHold", vehicleId, valetId: v.id })
                }
              >
                <Icon name="key" className="h-4 w-4" />
                Contratar a {v.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TrackBlock({
  state,
  svc,
  act,
}: {
  state: SimState;
  svc: ValetService;
  act: Act;
}) {
  const vehicle = state.vehicles[svc.vehicleId];
  const valet = state.valets.find((v) => v.id === svc.valetId);
  const idx = TRACK_ORDER.indexOf(svc.stage);
  const minsLeft =
    valet && valet.holdExpiresAt !== null
      ? Math.max(0, Math.ceil(valet.holdExpiresAt - state.now))
      : 0;
  const cell = svc.cellId ?? vehicle.cellId;

  return (
    <div className="space-y-3">
      {svc.stage === "payment_pending" && (
        <div className="space-y-2 rounded-control border border-line bg-surface-sunken p-3">
          <p className="font-semibold text-fg-strong">
            Pago pendiente: {fmtCOP(svc.price)} · vence en {minsLeft} min
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                act({ type: "valetPay", serviceId: svc.id, approved: true })
              }
            >
              Aprobar pago (simulado)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                act({ type: "valetPay", serviceId: svc.id, approved: false })
              }
            >
              Rechazar pago (simulado)
            </button>
          </div>
        </div>
      )}

      {svc.stage === "confirmed" && (
        <button
          type="button"
          className="btn btn-gold w-full"
          onClick={() => act({ type: "valetHandover", serviceId: svc.id })}
        >
          Entregar auto al valet
        </button>
      )}

      {svc.ticketCode && (
        <motion.div
          key={svc.ticketCode}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={SPRING}
        >
          <GlassSurface tone="dark" className="on-dark p-5 text-center">
            <p className="text-sm text-white/80">
              Ficho para reclamar sus llaves
            </p>
            <p className="mt-1 flex items-center justify-center gap-2 font-display text-3xl font-bold tracking-[0.2em] text-king-gold">
              <Icon name="ticket" className="h-6 w-6" />
              {svc.ticketCode}
            </p>
          </GlassSurface>
        </motion.div>
      )}

      {TRACK_DETAIL[svc.stage] && (
        <p className="text-sm text-fg-body">{TRACK_DETAIL[svc.stage]}</p>
      )}
      {svc.stage === "parked" && cell && (
        <p className="text-sm text-fg-body">Su auto está en la celda {cell}.</p>
      )}

      <ol aria-label="Seguimiento del servicio" className="space-y-2">
        {TRACK_ORDER.map((stage, i) => {
          const done = i < idx;
          const current = i === idx;
          const note = done ? " (listo)" : current ? " (ahora)" : "";
          const mark = done ? "✓" : current ? "●" : "○";
          const circle = done
            ? "bg-state-free text-white"
            : current
              ? "relative bg-king-royal text-white"
              : "border-2 border-line-strong text-fg-muted";
          return (
            <li key={stage} className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${circle}`}
              >
                <span aria-hidden="true">{mark}</span>
                {current && (
                  <motion.span
                    layoutId={`track-${svc.id}`}
                    transition={SPRING}
                    className="absolute inset-[-4px] rounded-full ring-2 ring-king-gold"
                  />
                )}
              </span>
              <span
                className={
                  current ? "font-semibold text-fg-strong" : "text-fg-muted"
                }
              >
                {SERVICE_STAGE_TEXT[stage]}
                <span className="sr-only">{note}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function HireValetPanel({ vehicleId }: { vehicleId: string }) {
  const { state, dispatch } = useSim();
  const [notice, setNotice] = useState<string | null>(null);
  const vehicle = state.vehicles[vehicleId];
  if (!vehicle)
    return <p className="text-sm text-fg-muted">Vehículo no encontrado.</p>;

  const act: Act = (cmd) => {
    const r = dispatch(cmd);
    setNotice(r.ok ? null : (r.error ?? "No se pudo completar la acción"));
  };

  const svc = vehicle.valetServiceId
    ? state.services[vehicle.valetServiceId]
    : undefined;
  const last = Object.values(state.services)
    .filter((s) => s.vehicleId === vehicleId)
    .sort((a, b) => serviceSeq(b.id) - serviceSeq(a.id))[0];
  const lastFailed =
    !svc && last && FAILED_STAGES.includes(last.stage) ? last : undefined;

  let body: ReactNode;
  if (svc) {
    body = <TrackBlock state={state} svc={svc} act={act} />;
  } else if (vehicle.stage !== "in_lane") {
    body = (
      <p className="text-sm text-fg-body">
        Solo puede contratar valet dentro de la pasarela. Su vehículo está{" "}
        {VEHICLE_STAGE_TEXT[vehicle.stage]}.
      </p>
    );
  } else if (vehicle.exitWithoutParking) {
    body = (
      <p className="text-sm text-fg-body">
        Este vehículo sale sin estacionar; no puede contratar valet.
      </p>
    );
  } else {
    body = <OfferBlock state={state} vehicleId={vehicleId} act={act} />;
  }

  return (
    <section
      aria-labelledby={`valet-hire-${vehicleId}`}
      className="card space-y-4"
    >
      <header className="space-y-1">
        <h3 id={`valet-hire-${vehicleId}`} className="text-lg font-bold">
          Valet en {ACCESS_NAME[vehicle.access]}
        </h3>
        <p className="text-sm text-fg-muted">
          Precio del servicio: {fmtCOP(state.config.valetPrice)} · no da
          prioridad en la fila.
        </p>
      </header>

      {notice && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-tile bg-state-occupied-tint px-3 py-2 text-sm text-state-occupied-ink"
        >
          <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
          {notice}
        </p>
      )}
      {lastFailed && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-tile bg-state-reserved-tint px-3 py-2 text-sm text-state-reserved-ink"
        >
          <Icon name="x" className="mt-0.5 h-4 w-4 shrink-0" />
          {SERVICE_STAGE_TEXT[lastFailed.stage]}. Su turno en la pasarela se
          conserva; puede contratar otro valet.
        </p>
      )}

      {body}
    </section>
  );
}
