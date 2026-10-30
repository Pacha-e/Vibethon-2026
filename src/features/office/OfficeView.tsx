// Oficina de llaves: reclamo con ficho y registro (propiedad: valet-haiku).
import { useState, type FormEvent } from 'react';
import { ACCESS_NAME } from '../../contracts/types';
import type { OfficeRecord } from '../../contracts/types';
import { fmtMin } from '../../contracts/util';
import { useSim } from '../../state/store';
import { BTN_PRIMARY } from '../valet/labels';
import { serviceSeq } from '../valet/logic';

const KIND_TEXT: Record<OfficeRecord['kind'], string> = {
  keys_received: '↓ Recibidas',
  keys_delivered: '↑ Entregadas',
};

export default function OfficeView() {
  const { state, dispatch } = useSim();
  const [code, setCode] = useState('');
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  // Las llaves en custodia no muestran el ficho: el ficho es la credencial para reclamarlas.
  const custody = Object.values(state.services)
    .filter((s) => s.stage === 'keys_deposited')
    .sort((a, b) => serviceSeq(a.id) - serviceSeq(b.id));
  const records = [...state.office].reverse();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const r = dispatch({ type: 'claimKeys', ticketCode: code });
    if (r.ok) {
      setResult({ ok: true, text: r.events.map((ev) => ev.message).join(' · ') });
      setCode('');
    } else {
      setResult({ ok: false, text: r.error ?? 'No se pudo reclamar las llaves' });
    }
  }

  return (
    <section aria-labelledby="office-title" className="space-y-6 rounded-xl bg-king-ink p-4 text-white">
      <h2 id="office-title" className="text-xl font-bold text-king-gold">Oficina de llaves</h2>

      <form onSubmit={onSubmit} className="space-y-2">
        <label htmlFor="office-ticket" className="block font-semibold">Ficho</label>
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
            placeholder="Ej. LV-0007"
            aria-describedby="office-ticket-hint"
            className="min-h-[44px] flex-1 rounded-lg border border-white/40 bg-white px-3 py-2 text-base text-king-ink placeholder:text-slate-600"
          />
          <button type="submit" className={`${BTN_PRIMARY} sm:w-auto`}>Reclamar llaves</button>
        </div>
        <p id="office-ticket-hint" className="text-sm">
          Usa el ficho que te entregó el valet (formato LV-0007 o RG-0007).
        </p>
      </form>

      {result && (
        <p role={result.ok ? 'status' : 'alert'} className="rounded-lg border border-king-gold px-3 py-2 text-sm">
          <span aria-hidden="true">{result.ok ? '✓ ' : '✕ '}</span>{result.text}
        </p>
      )}

      <section aria-labelledby="office-custody-title" className="space-y-2">
        <h3 id="office-custody-title" className="font-semibold">Llaves en custodia ({custody.length})</h3>
        {custody.length === 0 ? (
          <p className="text-sm">No hay llaves en custodia.</p>
        ) : (
          <ul className="space-y-2">
            {custody.map((s) => (
              <li key={s.id} className="rounded-lg border border-white/20 px-3 py-2 text-sm">
                <span aria-hidden="true">● </span>
                {state.vehicles[s.vehicleId]?.plate ?? s.vehicleId} · {ACCESS_NAME[s.access]}
                {s.cellId ? ` · Celda ${s.cellId}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="office-log-title" className="space-y-2">
        <h3 id="office-log-title" className="font-semibold">Registro de oficina</h3>
        {records.length === 0 ? (
          <p className="text-sm">Sin movimientos.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {records.map((r) => (
              <li key={`${r.kind}-${r.serviceId}`}>
                {fmtMin(r.at)} · {KIND_TEXT[r.kind]} · {r.plate}
                {r.kind === 'keys_delivered' ? ` · ficho ${r.ticketCode}` : ''} · {r.note}
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
