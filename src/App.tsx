import { useState } from 'react';
import { ACCESS_NAME } from './contracts/types';
import { useSim } from './state/store';
import { cellCounts } from './domain/engine';
import { fmtMin } from './contracts/util';
import DriverView from './features/driver/DriverView';
import GateView from './features/gate/GateView';
import ValetView from './features/valet/ValetView';
import OfficeView from './features/office/OfficeView';
import SimView from './features/sim/SimView';
import { Toast } from './components/Toast';

const TABS = [
  { id: 'driver', label: 'Conductor', icon: '🚗', View: DriverView },
  { id: 'gate', label: 'Portería', icon: '🚧', View: GateView },
  { id: 'valet', label: 'Valet', icon: '🔑', View: ValetView },
  { id: 'office', label: 'Oficina', icon: '🏢', View: OfficeView },
  { id: 'sim', label: 'Simulación', icon: '🧪', View: SimView },
] as const;

export default function App() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('driver');
  const { state } = useSim();
  const counts = cellCounts(state);
  const Active = TABS.find((t) => t.id === tab)!.View;
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-king-ink text-white shadow-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/brand/parking-icon.svg" alt="" className="h-10 w-10" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
            <div>
              <p className="text-2xl font-black tracking-tight">par<span className="text-king-gold">KING</span></p>
              <p className="text-xs text-slate-300">Parqueadero inteligente EAFIT · {ACCESS_NAME.LV} + {ACCESS_NAME.RG}</p>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap gap-2 text-sm" aria-label="Resumen de celdas">
            <span className="rounded bg-emerald-600 px-2 py-1">○ {counts.free} libres</span>
            <span className="rounded bg-amber-500 px-2 py-1 text-king-ink">◐ {counts.reserved} reservadas</span>
            <span className="rounded bg-rose-600 px-2 py-1">● {counts.occupied} ocupadas</span>
            <span className="rounded bg-white/10 px-2 py-1">⏱ Reloj simulado {fmtMin(state.now)}</span>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4" role="tablist" aria-label="Vistas por rol">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
              className={`rounded-t-lg px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-king-gold ${tab === t.id ? 'bg-slate-50 text-king-ink' : 'text-slate-200 hover:bg-white/10'}`}>
              <span aria-hidden>{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>
      </header>
      {!state.config.isOfficial && (
        <p className="mx-auto max-w-7xl px-4 pt-2 text-xs text-slate-600">
          Datos de simulación: <strong>{state.config.fixtureName}</strong> — fixture provisional del equipo (los mapas/eventos oficiales se cargan con el mismo formato).
        </p>
      )}
      <main className="mx-auto max-w-7xl px-4 py-4"><Active /></main>
      <Toast />
    </div>
  );
}
