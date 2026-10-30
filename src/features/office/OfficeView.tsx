// Oficina de llaves: reclamo con ficho y registro (propiedad: valet-haiku).
import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ACCESS_NAME } from "../../contracts/types";
import type { OfficeRecord } from "../../contracts/types";
import { fmtMin } from "../../contracts/util";
import { useSim } from "../../state/store";
import { Panel, ViewHeader } from "../../components/ui/Panel";
import { Plate } from "../../components/ui/Plate";
import { Icon } from "../../components/ui/Icon";
import { SPRING_SOFT } from "../../components/ui/motion";
import { KeyTicket } from "../../components/KeyTicket";

import { serviceSeq } from "../valet/logic";

const KIND_TEXT: Record<OfficeRecord["kind"], string> = {
  keys_received: "↓ Recibidas",
  keys_delivered: "↑ Entregadas",
};

export default function OfficeView() {
  const { state, dispatch } = useSim();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{
    ok: boolean;
    text: string;
    serviceId?: string;
  } | null>(null);

  // Las llaves en custodia no muestran el ficho: el ficho es la credencial para reclamarlas.
  const custody = Object.values(state.services)
    .filter((s) => s.stage === "keys_deposited")
    .sort((a, b) => serviceSeq(a.id) - serviceSeq(b.id));
  const records = [...state.office].reverse();
  const claimed = result?.serviceId ? state.services[result.serviceId] : undefined;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const r = dispatch({ type: "claimKeys", ticketCode: code });
    if (r.ok) {
      setResult({
        ok: true,
        text: r.events.map((ev) => ev.message).join(" · "),
        serviceId: r.events.find((ev) => ev.serviceId)?.serviceId,
      });
      setCode("");
    } else {
      setResult({
        ok: false,
        text: r.error ?? "No se pudo reclamar las llaves",
      });
    }
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Oficina de llaves"
        lead="Reciba las llaves que dejan los valets y entréguelas solo con el ficho."
      />

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Panel
          id="office-claim-title"
          title="Entregar llaves"
          description="Pida el ficho al conductor. Cada ficho se entrega una sola vez."
        >
          <form onSubmit={onSubmit} className="space-y-2">
            <label
              htmlFor="office-ticket"
              className="block text-sm font-semibold text-fg-strong"
            >
              Ficho
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="office-ticket"
                name="ticket"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="LV-0007"
                aria-describedby="office-ticket-hint"
                className="field flex-1 font-display uppercase tracking-widest"
              />
              <button type="submit" className="btn btn-primary">
                Entregar llaves
              </button>
            </div>
            <p id="office-ticket-hint" className="text-sm text-fg-muted">
              Use el ficho que le entregó el valet (formato LV-0007 o RG-0007).
            </p>
          </form>

          {result && (
            <motion.p
              key={result.text}
              role={result.ok ? "status" : "alert"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING_SOFT}
              className={`mt-4 flex items-start gap-2 rounded-tile px-3 py-2 text-sm ${
                result.ok
                  ? "bg-state-free-tint text-state-free-ink"
                  : "bg-state-occupied-tint text-state-occupied-ink"
              }`}
            >
              <Icon
                name={result.ok ? "check" : "x"}
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              {result.text}
            </motion.p>
          )}
          {result?.ok && claimed?.ticketCode && (
            <div className="mt-4">
              <KeyTicket
                key={claimed.ticketCode}
                code={claimed.ticketCode}
                plate={state.vehicles[claimed.vehicleId]?.plate ?? claimed.vehicleId}
                accessName={ACCESS_NAME[claimed.access]}
                cellId={claimed.cellId}
                valetName={state.valets.find((v) => v.id === claimed.valetId)?.name ?? null}
                status="delivered"
                tear
              />
            </div>
          )}
        </Panel>

        <Panel
          id="office-custody-title"
          title={`Llaves en custodia (${custody.length})`}
          description="El ficho no se muestra: es la credencial del conductor."
        >
          {custody.length === 0 ? (
            <p className="text-sm text-fg-muted">No hay llaves en custodia.</p>
          ) : (
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {custody.map((s) => (
                  <motion.li
                    key={s.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={SPRING_SOFT}
                    className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-control border border-line bg-surface-sunken p-3"
                  >
                    <Plate>
                      {state.vehicles[s.vehicleId]?.plate ?? s.vehicleId}
                    </Plate>
                    <span className="text-sm text-fg-body">
                      {ACCESS_NAME[s.access]}
                    </span>
                    {s.cellId && (
                      <span className="text-sm font-semibold text-fg-strong">
                        Celda {s.cellId}
                      </span>
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </Panel>
      </div>

      <Panel id="office-log-title" title="Registro de oficina">
        {records.length === 0 ? (
          <p className="text-sm text-fg-muted">Sin movimientos.</p>
        ) : (
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {records.map((r) => (
                <motion.li
                  key={`${r.kind}-${r.serviceId}`}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={SPRING_SOFT}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm"
                >
                  <span className="w-14 font-semibold tabular-nums text-king-royal">
                    {fmtMin(r.at)}
                  </span>
                  <span className="text-fg-body">{KIND_TEXT[r.kind]}</span>
                  <Plate>{r.plate}</Plate>
                  {r.kind === "keys_delivered" && (
                    <span className="text-fg-body">ficho {r.ticketCode}</span>
                  )}
                  <span className="text-fg-muted">{r.note}</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Panel>
    </div>
  );
}
