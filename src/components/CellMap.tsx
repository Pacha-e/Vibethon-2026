import type { Cell, CellStatus, Vehicle } from '../contracts/types';

const LOOK: Record<CellStatus, string> = {
  free: 'border-emerald-700 bg-emerald-50',
  reserved: 'border-amber-600 bg-amber-100',
  occupied: 'border-red-700 bg-red-50',
};

/** Texto + símbolo de la celda (nunca solo color). */
export function cellText(cell: Cell, vehicles: Record<string, Vehicle>): string {
  if (cell.status === 'free') return '○ Libre';
  const plate = cell.vehicleId ? vehicles[cell.vehicleId]?.plate : undefined;
  if (cell.status === 'reserved') return plate ? `◐ Reservada · ${plate}` : '◐ Reservada';
  if (cell.vehicleId === null) return '● Ocupada (no registrado)';
  return plate ? `● Ocupada · ${plate}` : '● Ocupada';
}

function groupByZone(cells: Cell[]): [string, Cell[]][] {
  const map = new Map<string, Cell[]>();
  for (const c of cells) {
    const list = map.get(c.zone);
    if (list) list.push(c);
    else map.set(c.zone, [c]);
  }
  return Array.from(map.entries());
}

export interface CellMapProps {
  cells: Cell[];
  vehicles: Record<string, Vehicle>;
  highlightId?: string | null;
  onCellAction?: (cell: Cell) => void;
  /** Texto del botón de acción de cada celda; null = esa celda no tiene acción. */
  actionLabel?: (cell: Cell) => string | null;
}

export function CellMap({ cells, vehicles, highlightId, onCellAction, actionLabel }: CellMapProps) {
  const zones = groupByZone(cells);
  if (zones.length === 0) return <p className="text-base text-slate-800">No hay celdas configuradas.</p>;

  return (
    <div className="space-y-6">
      {zones.map(([zone, list]) => (
        <section key={zone} aria-label={`Zona ${zone}`}>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-king-royal">Zona {zone}</h3>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((cell) => {
              const mine = cell.id === highlightId;
              const label = onCellAction ? (actionLabel ? actionLabel(cell) : 'Acción') : null;
              return (
                <li
                  key={cell.id}
                  aria-current={mine ? 'true' : undefined}
                  className={`flex flex-col rounded-lg border-2 p-3 text-king-ink ${LOOK[cell.status]} ${
                    mine ? 'ring-4 ring-king-gold ring-offset-2' : ''
                  }`}
                >
                  <p className="text-base font-bold">{cell.id}</p>
                  <p className="text-sm font-semibold">{cellText(cell, vehicles)}</p>
                  {mine && <p className="mt-1 text-sm font-bold">★ Su celda</p>}
                  {onCellAction && label && (
                    <button
                      type="button"
                      onClick={() => onCellAction(cell)}
                      className="btn btn-secondary mt-3 w-full text-sm"
                    >
                      {label}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
