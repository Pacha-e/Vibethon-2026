// Vista de valets para operación (propiedad: valet-haiku).
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ACCESSES, ACCESS_NAME } from "../../contracts/types";
import type {
  Command,
  ServiceStage,
  SimState,
  Valet,
  ValetService,
} from "../../contracts/types";
import { useSim } from "../../state/store";
import { Badge } from "../../components/Badge";
import { Panel, ViewHeader } from "../../components/ui/Panel";
import { Plate } from "../../components/ui/Plate";
import { Icon } from "../../components/ui/Icon";
import { SPRING_SOFT } from "../../components/ui/motion";
import { EARNING_STAGES, fmtCOP, serviceSeq } from "./logic";
import { BTN_PRIMARY, SERVICE_STAGE_TEXT, VALET_STATUS_LABEL } from "./labels";

type Act = (cmd: Command) => void;

/** Servicios que el valet todavía atiende (pago pendiente, en curso o estacionado). */
const OPEN_STAGES: ServiceStage[] = [
  "payment_pending",
  "confirmed",
  "car_handed",
  "parked",
];

const WAITING_TEXT: Partial<Record<ServiceStage, string>> = {
  payment_pending: "Esperando pago del conductor.",
  confirmed: "Esperando que el conductor entregue el auto.",
  car_handed: "Esperando que el auto entre a su celda.",
};

function ValetChip({ valet }: { valet: Valet }) {
  const label = VALET_STATUS_LABEL[valet.status];
  return (
    <li className="flex items-center justify-between gap-2 rounded-control border border-line px-3 py-2 text-sm">
      <span className="font-medium text-fg-strong">{valet.name}</span>
      <motion.span
        key={valet.status}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`whitespace-nowrap font-semibold ${label.className}`}
      >
        <span aria-hidden="true">{label.symbol} </span>
        {label.text}
      </motion.span>
    </li>
  );
}

function ServiceCard({
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
  const canPark =
    svc.stage === "car_handed" &&
    vehicle.stage === "entering" &&
    vehicle.cellId !== null;
  const canDeposit =
    svc.stage === "parked" ||
    (svc.stage === "car_handed" && vehicle.stage === "parked");
  const waiting = canPark || canDeposit ? undefined : WAITING_TEXT[svc.stage];

  return (
    <li className="space-y-2 rounded-control border border-line bg-surface-sunken p-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-semibold text-fg-strong">
          {valet ? valet.name : svc.valetId}
        </span>
        <Plate>{vehicle.plate}</Plate>
        <span className="text-sm text-fg-body">{ACCESS_NAME[svc.access]}</span>
      </div>
      <p className="text-sm text-fg-body">
        {SERVICE_STAGE_TEXT[svc.stage]}
        {svc.ticketCode ? ` · Ficho ${svc.ticketCode}` : ""}
        {vehicle.cellId ? ` · Celda ${vehicle.cellId}` : ""}
      </p>
      {waiting && <p className="text-sm text-fg-muted">{waiting}</p>}
      {canPark && (
        <button
          type="button"
          className={BTN_PRIMARY}
          onClick={() => act({ type: "park", vehicleId: vehicle.id })}
        >
          Estacionar {vehicle.plate} en {vehicle.cellId}
        </button>
      )}
      {canDeposit && (
        <button
          type="button"
          className={BTN_PRIMARY}
          onClick={() => act({ type: "valetDeposit", serviceId: svc.id })}
        >
          Depositar llaves de {vehicle.plate}
        </button>
      )}
    </li>
  );
}

export default function ValetView() {
  const { state, dispatch } = useSim();
  const [notice, setNotice] = useState<string | null>(null);

  const act: Act = (cmd) => {
    const r = dispatch(cmd);
    setNotice(r.ok ? null : (r.error ?? "No se pudo completar la acción"));
  };

  const services = Object.values(state.services).sort(
    (a, b) => serviceSeq(a.id) - serviceSeq(b.id),
  );
  const open = services.filter((s) => OPEN_STAGES.includes(s.stage));

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Valets"
        lead="Atienda los servicios activos y siga el estado de los 16 valets."
      />

      {notice && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-tile bg-state-occupied-tint px-4 py-3 text-sm text-state-occupied-ink"
        >
          <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
          {notice}
        </p>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel
          id="valet-active-title"
          title={`Servicios activos (${open.length})`}
          description="Lo que requiere acción de un valet ahora."
        >
          {open.length === 0 ? (
            <p className="text-sm text-fg-muted">
              Sin servicios activos. Los nuevos aparecen aquí cuando un
              conductor contrata y paga.
            </p>
          ) : (
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {open.map((svc) => (
                  <motion.li
                    key={svc.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={SPRING_SOFT}
                  >
                    <ServiceCard state={state} svc={svc} act={act} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </Panel>

        <div className="space-y-5">
          {ACCESSES.map((access) => {
            const list = state.valets.filter((v) => v.access === access);
            const free = list.filter((v) => v.status === "available").length;
            return (
              <Panel
                key={access}
                id={`valet-group-${access}`}
                title={`${ACCESS_NAME[access]} (${access})`}
                actions={
                  <Badge tone="ok" symbol="○">
                    {free} de {list.length} disponibles
                  </Badge>
                }
              >
                <ul className="grid grid-cols-2 gap-2">
                  {list.map((v) => (
                    <ValetChip key={v.id} valet={v} />
                  ))}
                </ul>
              </Panel>
            );
          })}
        </div>
      </div>

      <details className="group card">
        <summary className="flex min-h-[2.75rem] cursor-pointer list-none items-center gap-2 font-semibold text-fg-strong [&::-webkit-details-marker]:hidden">
          <Icon
            name="chevron"
            className="h-4 w-4 transition-transform group-open:rotate-90"
          />
          Historial por valet (16 valets)
        </summary>
        <div className="mt-4 space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Historial por valet</caption>
              <thead>
                <tr className="text-fg-muted">
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    Valet
                  </th>
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    Acceso
                  </th>
                  <th
                    scope="col"
                    className="py-2 pr-3 text-right font-semibold"
                  >
                    Servicios
                  </th>
                  <th scope="col" className="py-2 text-right font-semibold">
                    Ingresos simulados
                  </th>
                </tr>
              </thead>
              <tbody>
                {state.valets.map((v) => {
                  const count = services.filter(
                    (s) => s.valetId === v.id,
                  ).length;
                  return (
                    <tr key={v.id} className="border-t border-line">
                      <td className="py-2 pr-3 text-fg-strong">{v.name}</td>
                      <td className="py-2 pr-3 text-fg-body">
                        {ACCESS_NAME[v.access]}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-fg-body">
                        {count}
                      </td>
                      <td className="py-2 text-right tabular-nums text-fg-body">
                        {fmtCOP(v.earnings)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-fg-strong">
              Servicios registrados
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Servicios registrados</caption>
                <thead>
                  <tr className="text-fg-muted">
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      Servicio
                    </th>
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      Placa
                    </th>
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      Valet
                    </th>
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      Etapa
                    </th>
                    <th scope="col" className="py-2 text-right font-semibold">
                      Ingreso
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.id} className="border-t border-line">
                      <td className="py-2 pr-3 text-fg-body">{s.id}</td>
                      <td className="py-2 pr-3 text-fg-body">
                        {state.vehicles[s.vehicleId]?.plate ?? s.vehicleId}
                      </td>
                      <td className="py-2 pr-3 text-fg-body">
                        {state.valets.find((v) => v.id === s.valetId)?.name ??
                          s.valetId}
                      </td>
                      <td className="py-2 pr-3 text-fg-body">
                        {SERVICE_STAGE_TEXT[s.stage]}
                      </td>
                      <td className="py-2 text-right tabular-nums text-fg-body">
                        {EARNING_STAGES.includes(s.stage)
                          ? fmtCOP(s.price)
                          : "sin ingreso"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
