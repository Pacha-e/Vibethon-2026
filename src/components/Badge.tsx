import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'info' | 'ok' | 'warn' | 'error' | 'gold';

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-900 ring-slate-300',
  info: 'bg-blue-50 text-king-royal ring-blue-300',
  ok: 'bg-emerald-50 text-emerald-900 ring-emerald-600',
  warn: 'bg-amber-100 text-amber-900 ring-amber-500',
  error: 'bg-red-50 text-red-900 ring-red-600',
  gold: 'bg-king-gold text-king-ink ring-king-gold',
};

/** Etiqueta con texto obligatorio; el símbolo es decorativo (no depende del color). */
export function Badge({ tone = 'neutral', symbol, children }: { tone?: BadgeTone; symbol?: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${TONE[tone]}`}>
      {symbol && <span aria-hidden="true">{symbol}</span>}
      <span>{children}</span>
    </span>
  );
}
