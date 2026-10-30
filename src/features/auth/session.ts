// Sesión de la demo: solo correos institucionales de EAFIT, una sesión por pestaña (sessionStorage),
// así se pueden abrir a la vez las cuentas de conductor, portería, valet y oficina.
// No es autenticación real: no hay servidor ni verificación del buzón.
const KEY = 'parking.session.email';
const EAFIT = /^[a-z0-9._%+-]+@eafit\.edu\.co$/;

export type Role = 'driver' | 'gate' | 'valet' | 'office';

/** Cuentas de operación. Cualquier otro correo @eafit.edu.co entra como conductor. */
export const STAFF_ACCOUNTS: Record<string, Exclude<Role, 'driver'>> = {
  'porteria@eafit.edu.co': 'gate',
  'valet@eafit.edu.co': 'valet',
  'oficina@eafit.edu.co': 'office',
};

export const ROLE_LABEL: Record<Role, string> = {
  driver: 'Conductor',
  gate: 'Portería',
  valet: 'Valet',
  office: 'Oficina',
};

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isEafitEmail(raw: string): boolean {
  return EAFIT.test(normalizeEmail(raw));
}

export function roleOf(email: string): Role {
  return STAFF_ACCOUNTS[normalizeEmail(email)] ?? 'driver';
}

export function loadSession(): string | null {
  const v = window.sessionStorage.getItem(KEY);
  return v && isEafitEmail(v) ? v : null;
}

export function saveSession(email: string): void {
  window.sessionStorage.setItem(KEY, normalizeEmail(email));
}

export function clearSession(): void {
  window.sessionStorage.removeItem(KEY);
}

/**
 * Atajo de demo: `?correo=porteria@eafit.edu.co` abre la pestaña con esa cuenta (misma regla del formulario).
 * El parámetro se borra de la URL después de leerlo.
 */
export function consumeUrlLogin(): string | null {
  const url = new URL(window.location.href);
  const raw = url.searchParams.get('correo');
  if (raw === null) return null;
  url.searchParams.delete('correo');
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  if (!isEafitEmail(raw)) return null;
  saveSession(raw);
  return normalizeEmail(raw);
}
