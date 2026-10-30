// Sesión local de la demo: solo correos institucionales de EAFIT.
// No es autenticación real (no hay servidor ni verificación del buzón): es una puerta de acceso a la app local.
const KEY = 'parking.session.email';
const EAFIT = /^[a-z0-9._%+-]+@eafit\.edu\.co$/;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isEafitEmail(raw: string): boolean {
  return EAFIT.test(normalizeEmail(raw));
}

export function loadSession(): string | null {
  const v = window.localStorage.getItem(KEY);
  return v && isEafitEmail(v) ? v : null;
}

export function saveSession(email: string): void {
  window.localStorage.setItem(KEY, normalizeEmail(email));
}

export function clearSession(): void {
  window.localStorage.removeItem(KEY);
}
