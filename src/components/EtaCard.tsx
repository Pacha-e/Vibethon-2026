import type { Eta } from '../contracts/types';

function headline(eta: Eta): { symbol: string; text: string } {
  switch (eta.kind) {
    case 'estimate':
      return {
        symbol: '◷',
        text: `Posición ${eta.position} · ${eta.vehiclesAhead} delante · ${eta.minMinutes ?? '?'}–${eta.maxMinutes ?? '?'} min (estimado, no garantizado)`,
      };
    case 'insufficient_data':
      return { symbol: '!', text: `Datos insuficientes: ${eta.basis}` };
    case 'assigned':
      return { symbol: '✓', text: 'Ya tiene celda asignada' };
    case 'no_cell_needed':
      return { symbol: '–', text: 'No necesita celda: sale sin estacionar' };
    case 'not_registered':
      return {
        symbol: '…',
        text: `Fila exterior · posición ${eta.position} · ${eta.vehiclesAhead} delante · sin estimado todavía`,
      };
  }
}

export function EtaCard({ eta }: { eta: Eta }) {
  const { symbol, text } = headline(eta);
  return (
    <div className="rounded-xl border border-slate-300 bg-slate-50 p-4">
      <p className="text-sm font-semibold uppercase tracking-wide text-king-royal">Tiempo estimado</p>
      <p className="mt-2 text-base font-semibold text-king-ink">
        <span aria-hidden="true">{symbol} </span>
        {text}
      </p>
      {eta.kind !== 'insufficient_data' && <p className="mt-2 text-sm text-slate-800">Cálculo: {eta.basis}</p>}
      {eta.kind === 'estimate' && (
        <p className="mt-1 text-sm text-slate-800">Celdas que se asignan antes: {eta.demandAhead}.</p>
      )}
    </div>
  );
}
