import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'info' | 'ok' | 'warn' | 'error' | 'gold';

// Tinte de fondo + texto «ink» del mismo estado (≥ 6:1) + aro sutil. Todo desde tokens.
const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken text-fg-strong ring-line-strong/60',
  info: 'bg-surface-sunken text-king-royal ring-king-royal/30',
  ok: 'bg-state-free-tint text-state-free-ink ring-state-free/30',
  warn: 'bg-state-reserved-tint text-state-reserved-ink ring-state-reserved/30',
  error: 'bg-state-occupied-tint text-state-occupied-ink ring-state-occupied/30',
  gold: 'bg-king-goldtint text-king-ink ring-king-goldlogo/50',
};

/** Etiqueta con texto obligatorio; el símbolo es decorativo (no depende del color). */
export function Badge({ tone = 'neutral', symbol, children }: { tone?: BadgeTone; symbol?: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-semibold ring-1 ring-inset ${TONE[tone]}`}>
      {symbol && <span aria-hidden="true">{symbol}</span>}
      <span>{children}</span>
    </span>
  );
}
