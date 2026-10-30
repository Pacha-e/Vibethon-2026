// Panel "Contratar valet" para el conductor (propiedad: valet-haiku).
import { useState, type ReactNode } from 'react';
import { getEta } from '../../domain/engine';
import { ACCESS_NAME } from '../../contracts/types';
import type { Command, SimState, ValetService } from '../../contracts/types';
import { useSim } from '../../state/store';
import { fmtCOP, serviceSeq } from './logic';
import {
  BTN_PRIMARY, BTN_SECONDARY, SERVICE_STAGE_TEXT, TRACK_ORDER, VEHICLE_STAGE_TEXT,
} from './labels';

type Act = (cmd: Command) => void;

const FAILED_STAGES = ['payment_rejected', 'payment_expired'];

const TRACK_DETAIL: Partial<Record<ValetService['stage'], string>> = {
  confirmed: 'Pago aprobado. Entrega tu auto al valet para recibir el ficho.',
  car_handed: 'El valet estacionará tu auto cuando tenga celda disponible.',
  parked: 'El valet dejará las llaves en oficina.',
  keys_deposited: 'Llaves en oficina. Reclámalas con tu ficho.',
  keys_delivered: 'Servicio completado. Llaves entregadas.',
};

function OfferBlock({ state, vehicleId, act }: { state: SimState; vehicleId: string; act: Act }) {
  const vehicle = state.vehicles[vehicleId];
  const valetsOfAccess = state.valets.filter((v) => v.access === vehicle.access);
  const free = valetsOfAccess.filter((v) => v.status === 'available');
  const eta = getEta(state, vehicleId);
  // Sugerir solo con estimación clara y espera mayor al umbral; insufficient_data no sugiere.
  const suggest = eta.kind === 'estimate' && (eta.maxMinutes ?? 0) > state.config.valetSuggestMinutes;

  return (
    <div className="space-y-3">
      {suggest && (
        <p className="rounded-lg border border-king-gold px-3 py-2 text-sm">
          <span aria-hidden="true">★ </span>
          Sugerencia: tu espera estimada es de {eta.minMinutes}–{eta.maxMinutes} min. Un valet puede ahorrarte tiempo.
        </p>
      )}
      <p className="text-sm">
        Valets disponibles en {ACCESS_NAME[vehicle.access]}: {free.length} de {valetsOfAccess.length}
      </p>
      {free.length === 0 ? (
        <p className="text-sm">No hay valets disponibles en {ACCESS_NAME[vehicle.access]}; continúas en la fila normal.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {free.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                className={BTN_PRIMARY}
                onClick={() => act({ type: 'valetHold', vehicleId, valetId: v.id })}
              >
                Contratar {v.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TrackBlock({ state, svc, act }: { state: SimState; svc: ValetService; act: Act }) {
  const vehicle = state.vehicles[svc.vehicleId];
  const valet = state.valets.find((v) => v.id === svc.valetId);
  const idx = TRACK_ORDER.indexOf(svc.stage);
  const minsLeft = valet && valet.holdExpiresAt !== null
    ? Math.max(0, Math.ceil(valet.holdExpiresAt - state.now))
    : 0;
  const cell = svc.cellId ?? vehicle.cellId;

  return (
    <div className="space-y-3">
      {svc.stage === 'payment_pending' && (
        <div className="space-y-2 rounded-lg border border-king-gold p-3">
          <p className="font-semibold">
            Pago pendiente: {fmtCOP(svc.price)} · vence en {minsLeft} min
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`${BTN_PRIMARY} sm:w-auto`}
              onClick={() => act({ type: 'valetPay', serviceId: svc.id, approved: true })}
            >
              Aprobar pago (simulado)
            </button>
            <button
              type="button"
              className={`${BTN_SECONDARY} sm:w-auto`}
              onClick={() => act({ type: 'valetPay', serviceId: svc.id, approved: false })}
            >
              Rechazar pago (simulado)
            </button>
          </div>
        </div>
      )}

      {svc.stage === 'confirmed' && (
        <button
          type="button"
          className={BTN_PRIMARY}
          onClick={() => act({ type: 'valetHandover', serviceId: svc.id })}
        >
          Entregar auto al valet
        </button>
      )}

      {svc.ticketCode && (
        <div className="rounded-xl border-2 border-king-gold p-4 text-center">
          <p className="text-sm">Ficho para reclamar tus llaves</p>
          <p className="text-4xl font-bold tracking-widest text-king-gold">{svc.ticketCode}</p>
        </div>
      )}

      {TRACK_DETAIL[svc.stage] && <p className="text-sm">{TRACK_DETAIL[svc.stage]}</p>}
      {svc.stage === 'parked' && cell && <p className="text-sm">Tu auto está en la celda {cell}.</p>}

      <ol className="space-y-1 text-sm" aria-label="Seguimiento del servicio">
        {TRACK_ORDER.map((stage, i) => {
          const mark = i < idx ? '✓' : i === idx ? '●' : '○';
          const note = i < idx ? ' (listo)' : i === idx ? ' (ahora)' : '';
          return (
            <li key={stage} className={i === idx ? 'font-bold text-king-gold' : undefined}>
              <span aria-hidden="true">{mark} </span>
              {SERVICE_STAGE_TEXT[stage]}
              {note}
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
  if (!vehicle) return <p className="text-sm">Vehículo no encontrado.</p>;

  const act: Act = (cmd) => {
    const r = dispatch(cmd);
    setNotice(r.ok ? null : (r.error ?? 'No se pudo completar la acción'));
  };

  const svc = vehicle.valetServiceId ? state.services[vehicle.valetServiceId] : undefined;
  const last = Object.values(state.services)
    .filter((s) => s.vehicleId === vehicleId)
    .sort((a, b) => serviceSeq(b.id) - serviceSeq(a.id))[0];
  const lastFailed = !svc && last && FAILED_STAGES.includes(last.stage) ? last : undefined;

  let body: ReactNode;
  if (svc) {
    body = <TrackBlock state={state} svc={svc} act={act} />;
  } else if (vehicle.stage !== 'in_lane') {
    body = (
      <p className="text-sm">
        Solo puedes contratar valet dentro de la pasarela. Tu vehículo está {VEHICLE_STAGE_TEXT[vehicle.stage]}.
      </p>
    );
  } else if (vehicle.exitWithoutParking) {
    body = <p className="text-sm">Este vehículo sale sin estacionar; no puede contratar valet.</p>;
  } else {
    body = <OfferBlock state={state} vehicleId={vehicleId} act={act} />;
  }

  return (
    <section aria-labelledby={`valet-hire-${vehicleId}`} className="space-y-4 rounded-xl bg-king-ink p-4 text-white">
      <header className="space-y-1">
        <h3 id={`valet-hire-${vehicleId}`} className="text-lg font-bold text-king-gold">
          Valet · acceso {ACCESS_NAME[vehicle.access]}
        </h3>
        <p className="text-sm">Precio del servicio: {fmtCOP(state.config.valetPrice)}</p>
      </header>

      {notice && (
        <p role="alert" className="rounded-lg border border-king-gold px-3 py-2 text-sm">
          <span aria-hidden="true">✕ </span>{notice}
        </p>
      )}
      {lastFailed && (
        <p role="status" className="rounded-lg border border-white/40 px-3 py-2 text-sm">
          <span aria-hidden="true">✕ </span>
          {SERVICE_STAGE_TEXT[lastFailed.stage]}. Tu turno en la pasarela se conserva; puedes contratar otro valet.
        </p>
      )}

      {body}
    </section>
  );
}
