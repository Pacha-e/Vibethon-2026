/** Placa del vehículo: el objeto común a todas las vistas. */
export function Plate({ children, className = '' }: { children: string; className?: string }) {
  return <span className={`plate ${className}`}>{children}</span>;
}
