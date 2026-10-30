import { useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useSim } from "./state/store";
import { cellCounts } from "./domain/engine";
import { clock } from "./components/format";
import DriverView from "./features/driver/DriverView";
import GateView from "./features/gate/GateView";
import ValetView from "./features/valet/ValetView";
import OfficeView from "./features/office/OfficeView";
import SimView from "./features/sim/SimView";
import { Toast } from "./components/Toast";
import { AppNav, tabId, type NavTab } from "./components/AppNav";
import { AnimatedNumber } from "./components/ui/AnimatedNumber";
import { Icon } from "./components/ui/Icon";
import { EASE_OUT } from "./components/ui/motion";
import LoginView from "./features/auth/LoginView";
import { clearSession, loadSession, saveSession } from "./features/auth/session";

type TabId = "driver" | "gate" | "valet" | "office" | "sim";

const TABS: readonly NavTab<TabId>[] = [
  { id: "driver", label: "Conductor", icon: "car" },
  { id: "gate", label: "Portería", icon: "gate" },
  { id: "valet", label: "Valet", icon: "key" },
  { id: "office", label: "Oficina", icon: "office" },
  { id: "sim", label: "Simulación", icon: "flask" },
];

const VIEWS: Record<TabId, () => JSX.Element> = {
  driver: DriverView,
  gate: GateView,
  valet: ValetView,
  office: OfficeView,
  sim: SimView,
};

/** Inventario global: símbolo + número + palabra (nunca solo color). */
function Inventory() {
  const { state } = useSim();
  const c = cellCounts(state);
  const items = [
    { symbol: "○", value: c.free, label: "libres", dot: "bg-state-free" },
    {
      symbol: "◐",
      value: c.reserved,
      label: "reservadas",
      dot: "bg-state-reserved",
    },
    {
      symbol: "●",
      value: c.occupied,
      label: "ocupadas",
      dot: "bg-state-occupied",
    },
  ];
  return (
    <div
      role="status"
      aria-label="Inventario de celdas"
      className="flex items-center gap-1.5"
    >
      {items.map((i) => (
        <span
          key={i.label}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] py-1 pl-1.5 pr-2.5 text-sm text-white ring-1 ring-inset ring-white/10"
        >
          <span
            aria-hidden="true"
            className={`grid h-5 w-5 place-items-center rounded-full text-[0.7rem] text-white ${i.dot}`}
          >
            {i.symbol}
          </span>
          <AnimatedNumber value={i.value} className="font-display font-bold" />
          <span className="text-white/80">{i.label}</span>
        </span>
      ))}
    </div>
  );
}

function SimClock() {
  const { state } = useSim();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-2.5 py-1 text-sm text-white ring-1 ring-inset ring-white/10">
      <Icon name="clock" className="h-4 w-4 text-king-gold" />
      <span className="sr-only">Reloj simulado</span>
      <AnimatedNumber
        value={clock(state.now)}
        className="font-display font-bold"
      />
    </span>
  );
}

/** Sesión activa: inicial del usuario + salir. El correo completo queda en el nombre accesible y el title. */
function UserChip({ email, onLogout }: { email: string; onLogout: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.08] py-0.5 pl-0.5 pr-1 text-sm text-white ring-1 ring-inset ring-white/10">
      <span
        aria-hidden="true"
        title={email}
        className="grid h-7 w-7 place-items-center rounded-full bg-king-gold font-display text-sm font-bold uppercase text-king-ink"
      >
        {email[0]}
      </span>
      <span className="sr-only">Sesión: {email}</span>
      <button
        type="button"
        onClick={onLogout}
        className="min-h-[2.75rem] rounded-full px-2 font-semibold text-white/85 transition-colors hover:text-white"
      >
        Salir
      </button>
    </span>
  );
}

export default function App() {
  const [email, setEmail] = useState<string | null>(loadSession);

  return (
    <MotionConfig reducedMotion="user">
      {email ? (
        <Workspace
          email={email}
          onLogout={() => {
            clearSession();
            setEmail(null);
          }}
        />
      ) : (
        <LoginView
          onLogin={(value) => {
            saveSession(value);
            setEmail(value);
          }}
        />
      )}
    </MotionConfig>
  );
}

function Workspace({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [tab, setTab] = useState<TabId>("driver");
  const { state } = useSim();
  const Active = VIEWS[tab];

  return (
    <>
      <div className="app-backdrop min-h-screen pb-[calc(var(--dock-h)+env(safe-area-inset-bottom)+1.5rem)] md:pb-10">
        <a
          href="#vista"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-control focus:bg-surface-card focus:px-4 focus:py-2 focus:font-semibold focus:shadow-e2"
        >
          Saltar al contenido
        </a>

        {/* Barra superior. En móvil no es fija: la navegación vive en el dock inferior. */}
        <header className="z-30 px-2 pt-2 sm:px-4 md:sticky md:top-0">
          <div className="glass-dark on-dark mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2.5 2xl:gap-x-4 px-3 py-2.5 sm:px-4">
            <h1 className="m-0 shrink-0 pr-1">
              <img
                src="/brand/official/parking-logo-color.png"
                alt="parKING — Universidad EAFIT"
                width={530}
                height={238}
                className="h-9 w-auto sm:h-10 xl:h-11"
              />
            </h1>
            <nav
              aria-label="Principal"
              className="order-last hidden w-full md:block xl:order-none xl:w-auto"
            >
              <AppNav
                tabs={TABS}
                active={tab}
                onChange={setTab}
                variant="bar"
              />
            </nav>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
              <div className="hidden sm:block">
                <Inventory />
              </div>
              <SimClock />
              <UserChip email={email} onLogout={onLogout} />
            </div>
            <div className="w-full sm:hidden">
              <Inventory />
            </div>
          </div>
        </header>

        <main
          id="vista"
          role="tabpanel"
          aria-labelledby={tabId("bar", tab)}
          tabIndex={-1}
          className="mx-auto max-w-7xl px-3 pt-5 focus:outline-none sm:px-6 sm:pt-8"
        >
          {!state.config.isOfficial && (
            <p className="mb-4 text-xs text-fg-muted">
              Datos de simulación:{" "}
              <strong className="font-semibold text-fg-body">
                {state.config.fixtureName}
              </strong>
              , fixture provisional del equipo. Los mapas y eventos oficiales se
              cargan con el mismo formato.
            </p>
          )}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
            >
              <Active />
            </motion.div>
          </AnimatePresence>
        </main>

        <nav
          aria-label="Principal"
          className="glass-dark on-dark fixed inset-x-2 bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-30 p-1.5 md:hidden"
        >
          <AppNav tabs={TABS} active={tab} onChange={setTab} variant="dock" />
        </nav>

        <Toast />
      </div>
    </>
  );
}
