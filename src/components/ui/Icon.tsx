import type { SVGProps } from 'react';

// Íconos lineales propios (24×24, trazo 1.75) para no depender del render de emoji de cada sistema.
const PATHS = {
  car: 'M5 16.5V12l1.6-4.3A2 2 0 0 1 8.5 6.4h7a2 2 0 0 1 1.9 1.3L19 12v4.5M5 16.5h14M5 16.5V18a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.5m8 0V18a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.5M5 12h14M8 14h.01M16 14h.01',
  gate: 'M4 20V9m0 0h16M4 9l3-3m13 3-2 0M8 9l2.5-3M13 9l2.5-3M4 20h3M20 20V9',
  key: 'M11 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm0 0h10m-3 0v3m-3-3v2',
  office: 'M4 20h16M6 20V6a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14M9 9h1m4 0h1M9 13h1m4 0h1m-5 7v-3h4v3',
  flask: 'M9.5 3.5h5M10 3.5v6L5 18a1.6 1.6 0 0 0 1.4 2.5h11.2A1.6 1.6 0 0 0 19 18l-5-8.5v-6M7.5 14.5h9',
  clock: 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6 6 18',
  alert: 'M12 8.5v4.5m0 3h.01M10.3 4.2 3 17a2 2 0 0 0 1.7 3h14.6a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z',
  route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 17h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16',
  ticket: 'M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4V8Zm10-2v12',
  chevron: 'm9 6 6 6-6 6',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = 'h-5 w-5', ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" focusable="false" className={className} {...rest}>
      <path d={PATHS[name]} />
    </svg>
  );
}
