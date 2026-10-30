import type { ReactNode } from 'react';

/** Encabezado de vista: un título y una frase que dice qué se hace aquí. */
export function ViewHeader({ title, lead, aside }: { title: string; lead: string; aside?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="mt-1 text-base text-fg-muted">{lead}</p>
      </div>
      {aside}
    </header>
  );
}

/** Tarjeta opaca con título. Superficie por defecto para contenido denso (sin vidrio). */
export function Panel({
  id, title, description, actions, children, className = '',
}: {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={`card ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={id} className="text-lg font-bold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
