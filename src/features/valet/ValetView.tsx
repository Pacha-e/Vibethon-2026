// Vista de valets para operación (propiedad: valet-haiku).
import { useState } from 'react';
import { ACCESSES, ACCESS_NAME } from '../../contracts/types';
import type { Command, ServiceStage, SimState, Valet, ValetService } from '../../contracts/types';
import { useSim } from '../../state/store';
import { EARNING_STAGES, fmtCOP, serviceSeq } from './logic';
import { BTN_PRIMARY, SERVICE_STAGE_TEXT, VALET_STATUS_LABEL } from './labels';

type Act = (cmd: Command) => void;

/** Servicios que el valet todavía atiende (pago pendiente, en curso o estacionado). */
const OPEN_STAGES: ServiceStage[] = ['payment_pending', 'confirmed', 'car_handed', 'parked'];

const WAITING_TEXT: Partial<Record<ServiceStage, string>> = {
  payment_pending: 'Esperando pago del conductor.',
  confirmed: 'Esperando que el conductor entregue el auto.',
  car_handed: 'Esperando que el auto entre a su celda.',
};

function ValetRow({ valet }: { valet: Valet }) {
  const label = VALET_STATUS_LABEL[valet.status];
  return (
    <li className="flex items-center justify-between gap-2 rounded-lg border border-white/20 px-3 py-2">
      <span>{valet.name}</span>
      <span className={`text-sm font-semibold ${label.className}`}>
        <span aria-hidden="true">{label.symbol} </span>
        {label.text}
      </span>
    </li>
  );
}

function ServiceRow({ state, svc, act }: { state: SimState; svc: ValetService; act: Act }) {
  const vehicle = state.vehicles[svc.vehicleId];
  const valet = state.valets.find((v) => v.id === svc.valetId);
  const canPark = svc.stage === 'car_handed' && vehicle.stage === 'entering' && vehicle.cellId !== null;
  const canDeposit = svc.stage === 'parked' || (svc.stage === 'car_handed' && vehicle.stage === 'parked');
  const waiting = canPark || canDeposit ? undefined : WAITING_TEXT[svc.stage];

  return (
    <li className="space-y-2 rounded-lg border border-white/20 p-3">
      <p className="font-semibold">
        {valet ? valet.name : svc.valetId} · {vehicle.plate} · {ACCESS_NAME[svc.access]}
      </p>
      <p className="text-sm">
        {SERVICE_STAGE_TEXT[svc.stage]}
        {svc.ticketCode ? ` · Ficho ${svc.ticketCode}` : ''}
        {vehicle.cellId ? ` · Celda ${vehicle.cellId}` : ''}
      </p>
      {waiting && <p className="text-sm">{waiting}</p>}
      {canPark && (
        <button
          type="button"
          className={BTN_PRIMARY}
          onClick={() => act({ type: 'park', vehicleId: vehicle.id })}
        >
          Estacionar {vehicle.plate} en {vehicle.cellId}
        </button>
      )}
      {canDeposit && (
        <button
          type="button"
          className={BTN_PRIMARY}
          onClick={() => act({ type: 'valetDeposit', serviceId: svc.id })}
        >
          Depositar llaves de {vehicle.plate}
        </button>
      )}
    </li>
  );
}

function ValetHistory({ state, valet, services }: { state: SimState; valet: Valet; services: ValetService[] }) {
  return (
    <details className="rounded-lg border border-white/20 px-3 py-2">
      <summary className="flex min-h-[44px] cursor-pointer items-center font-semibold">
        {valet.name} · ingresos {fmtCOP(valet.earnings)} · servicios {services.length}
      </summary>
      {services.length === 0 ? (
        <p className="mt-2 text-sm">Sin servicios registrados.</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">
          {services.map((s) => (
            <li key={s.id}>
              {s.id} · {state.vehicles[s.vehicleId]?.plate ?? s.vehicleId} · {SERVICE_STAGE_TEXT[s.stage]} · ingreso{' '}
              {EARNING_STAGES.includes(s.stage) ? fmtCOP(s.price) : 'sin ingreso'}
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}

export default function ValetView() {
  const { state, dispatch } = useSim();
  const [notice, setNotice] = useState<string | null>(null);

  const act: Act = (cmd) => {
    const r = dispatch(cmd);
    setNotice(r.ok ? null : (r.error ?? 'No se pudo completar la acción'));
  };

  const services = Object.values(state.services).sort((a, b) => serviceSeq(a.id) - serviceSeq(b.id));
  const open = services.filter((s) => OPEN_STAGES.includes(s.stage));

  return (
    <section aria-labelledby="valet-view-title" className="space-y-6 rounded-xl bg-king-ink p-4 text-white">
      <h2 id="valet-view-title" className="text-xl font-bold text-king-gold">Valets</h2>

      {notice && (
        <p role="alert" className="rounded-lg border border-king-gold px-3 py-2 text-sm">
          <span aria-hidden="true">✕ </span>{notice}
        </p>
      )}

      {ACCESSES.map((access) => {
        const list = state.valets.filter((v) => v.access === access);
        const free = list.filter((v) => v.status === 'available').length;
        return (
          <section key={access} aria-labelledby={`valet-group-${access}`} className="space-y-2">
            <h3 id={`valet-group-${access}`} className="font-semibold">
              {ACCESS_NAME[access]} ({access}) · disponibles {free} de {list.length}
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {list.map((v) => <ValetRow key={v.id} valet={v} />)}
            </ul>
          </section>
        );
      })}

      <section aria-labelledby="valet-active-title" className="space-y-2">
        <h3 id="valet-active-title" className="font-semibold">Servicios activos ({open.length})</h3>
        {open.length === 0 ? (
          <p className="text-sm">Sin servicios activos.</p>
        ) : (
          <ul className="space-y-3">
            {open.map((svc) => <ServiceRow key={svc.id} state={state} svc={svc} act={act} />)}
          </ul>
        )}
      </section>

      <section aria-labelledby="valet-history-title" className="space-y-2">
        <h3 id="valet-history-title" className="font-semibold">Historial por valet</h3>
        {state.valets.map((v) => (
          <ValetHistory
            key={v.id}
            state={state}
            valet={v}
            services={services.filter((s) => s.valetId === v.id)}
          />
        ))}
      </section>
    </section>
  );
}
