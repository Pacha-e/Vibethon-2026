import { useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
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
type TabId = (typeof TABS)[number]['id'];

const spring = { type: 'spring', stiffness: 480, damping: 38 } as const;

function CountChip({ symbol, label, value, tone }: { symbol: string; label: string; value: number; tone: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold text-white ${tone}`}>
      <span aria-hidden>{symbol}</span>
      <motion.span key={value} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={spring} className="tabular-nums">
        {value}
      </motion.span>
      {label}
    </span>
  );
}

export default function App() {
  const [tab, setTab] = useState<TabId>('driver');
  const { state } = useSim();
  const counts = cellCounts(state);
  const Active = TABS.find((t) => t.id === tab)!.View;
  return (
    <MotionConfig reducedMotion="user">
      <div className="app-backdrop min-h-screen">
        <header className="sticky top-0 z-30 px-2 pt-2 sm:px-4">
          <div className="glass-dark mx-auto max-w-7xl px-3 pb-2 pt-3 sm:px-5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <h1 className="m-0 shrink-0">
                <img src="/brand/official/parking-logo-color.png" alt="parKING — Universidad EAFIT" className="h-10 w-auto sm:h-12" width={530} height={238} />
              </h1>
              <div className="ml-auto flex flex-wrap items-center gap-2" aria-label="Resumen de celdas" role="status">
                <CountChip symbol="○" label="libres" value={counts.free} tone="bg-state-free" />
                <CountChip symbol="◐" label="reservadas" value={counts.reserved} tone="bg-state-reserved" />
                <CountChip symbol="●" label="ocupadas" value={counts.occupied} tone="bg-state-occupied" />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                  <span aria-hidden>⏱</span> Reloj simulado <span className="tabular-nums font-semibold">{fmtMin(state.now)}</span>
                </span>
              </div>
            </div>
            <nav className="-mx-1 mt-3 flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Vistas por rol">
              {TABS.map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={active}
                    aria-controls="vista"
                    onClick={() => setTab(t.id)}
                    className={`relative min-h-[2.75rem] shrink-0 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-king-gold ${active ? 'text-king-ink' : 'text-white/85 hover:text-white'}`}
                  >
                    {active && <motion.span layoutId="tab-pill" transition={spring} className="absolute inset-0 rounded-full bg-king-gold shadow-md" aria-hidden />}
                    <span className="relative"><span aria-hidden>{t.icon}</span> {t.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </header>
        {!state.config.isOfficial && (
          <p className="mx-auto max-w-7xl px-4 pt-3 text-xs text-slate-600">
            Datos de simulación: <strong>{state.config.fixtureName}</strong> — fixture provisional del equipo (los mapas/eventos oficiales se cargan con el mismo formato).
          </p>
        )}
        <main id="vista" role="tabpanel" className="mx-auto max-w-7xl px-3 py-4 sm:px-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}>
              <Active />
            </motion.div>
          </AnimatePresence>
        </main>
        <Toast />
      </div>
    </MotionConfig>
  );
}
