import { useRef, type KeyboardEvent } from "react";
import { motion } from "motion/react";
import { Icon, type IconName } from "./ui/Icon";
import { useGlassSheen } from "./ui/Glass";
import { SPRING } from "./ui/motion";

export interface NavTab<T extends string> {
  id: T;
  label: string;
  icon: IconName;
}

interface Props<T extends string> {
  tabs: readonly NavTab<T>[];
  active: T;
  onChange: (id: T) => void;
  /** bar: segmentado dentro de la barra de escritorio · dock: barra inferior en móvil. */
  variant: "bar" | "dock";
}

export const tabId = (variant: string, id: string) => `tab-${variant}-${id}`;

/**
 * Lista de pestañas WAI-ARIA con activación automática (flechas, Inicio, Fin).
 * Se monta dos veces (bar y dock) y CSS oculta una con display:none, así solo una existe en el árbol accesible.
 */
export function AppNav<T extends string>({
  tabs,
  active,
  onChange,
  variant,
}: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const sheen = useGlassSheen();
  const dock = variant === "dock";

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const i = tabs.findIndex((t) => t.id === active);
    const last = tabs.length - 1;
    const to = {
      ArrowRight: i === last ? 0 : i + 1,
      ArrowLeft: i === 0 ? last : i - 1,
      Home: 0,
      End: last,
    }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    onChange(tabs[to].id);
    refs.current[to]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label="Vistas por rol"
      onKeyDown={onKeyDown}
      className={
        dock
          ? "grid grid-cols-5 gap-1"
          : "flex gap-1 rounded-full bg-white/[0.06] p-1 ring-1 ring-inset ring-white/10"
      }
    >
      {tabs.map((t, i) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={tabId(variant, t.id)}
            role="tab"
            type="button"
            aria-selected={on}
            aria-controls="vista"
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
            onPointerMove={sheen}
            className={`glass-sheen relative transition-colors duration-200 ${
              dock
                ? `flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-tile text-[0.6875rem] font-semibold ${on ? "text-king-ink" : "text-white/80"}`
                : `flex min-h-[2.75rem] items-center gap-2 rounded-full px-3.5 text-sm font-semibold lg:px-4 ${on ? "text-king-ink" : "text-white/80 hover:text-white"}`
            }`}
          >
            {on && (
              <motion.span
                layoutId={`nav-pill-${variant}`}
                transition={SPRING}
                aria-hidden="true"
                className={`absolute inset-0 bg-king-gold shadow-e2 ${dock ? "rounded-tile" : "rounded-full"}`}
              />
            )}
            <Icon
              name={t.icon}
              className={`relative ${dock ? "h-[1.35rem] w-[1.35rem]" : "h-[1.1rem] w-[1.1rem]"}`}
            />
            <span className="relative">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
