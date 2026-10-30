import { useCallback, type ButtonHTMLAttributes, type HTMLAttributes, type PointerEvent } from 'react';

/** Reflejo que sigue al puntero: escribe --gx/--gy en el propio elemento (sin estado React, sin listeners globales). */
export function useGlassSheen() {
  return useCallback((e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--gx', `${e.clientX - r.left}px`);
    el.style.setProperty('--gy', `${e.clientY - r.top}px`);
  }, []);
}

type Tone = 'light' | 'dark';

/** Superficie Liquid Glass para capas flotantes. Nunca para mapa, tablas o formularios. */
export function GlassSurface({
  tone = 'light', sheen = false, className = '', onPointerMove, ...rest
}: { tone?: Tone; sheen?: boolean } & HTMLAttributes<HTMLDivElement>) {
  const move = useGlassSheen();
  return (
    <div
      {...rest}
      onPointerMove={sheen ? move : onPointerMove}
      className={`${tone === 'dark' ? 'glass-dark' : 'glass'} ${sheen ? 'glass-sheen' : ''} ${className}`}
    />
  );
}

/** Botón de vidrio para controles flotantes (simulación, diálogos). */
export function GlassButton({ tone = 'light', className = '', type = 'button', ...rest }: { tone?: Tone } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const move = useGlassSheen();
  return (
    <button
      type={type}
      {...rest}
      onPointerMove={move}
      className={`btn ${tone === 'dark' ? 'glass-dark' : 'glass'} glass-sheen !rounded-control ${className}`}
    />
  );
}
