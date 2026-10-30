import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { GlassSurface } from '../../components/ui/Glass';
import { Icon } from '../../components/ui/Icon';
import { SPRING } from '../../components/ui/motion';
import { isEafitEmail, normalizeEmail } from './session';

/** Puerta de acceso: solo correos institucionales @eafit.edu.co. */
export default function LoginView({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = normalizeEmail(email);
    if (!value) return setError('Escriba su correo institucional.');
    if (!isEafitEmail(value)) return setError('Use su correo institucional terminado en @eafit.edu.co.');
    setError(null);
    onLogin(value);
  }

  return (
    <main className="app-backdrop grid min-h-screen place-items-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="w-full max-w-md"
      >
        <GlassSurface tone="dark" sheen className="on-dark px-6 pb-7 pt-8 sm:px-8">
          <img
            src="/brand/official/parking-logo-color.png"
            alt="parKING — Universidad EAFIT"
            width={530}
            height={238}
            className="mx-auto h-14 w-auto"
          />
          <h1 className="mt-6 text-center text-xl font-bold text-white">Ingrese con su correo EAFIT</h1>
          <p className="mt-1 text-center text-sm text-white/80">
            Acceso para estudiantes, portería, valets y oficina de llaves.
          </p>

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold text-white">
                Correo institucional
              </label>
              <input
                id="login-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoFocus
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@eafit.edu.co"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'login-error' : 'login-hint'}
                className="field"
              />
              {!error && (
                <p id="login-hint" className="mt-1.5 text-sm text-white/80">
                  Solo se aceptan cuentas @eafit.edu.co.
                </p>
              )}
              <AnimatePresence>
                {error && (
                  <motion.p
                    key={error}
                    id="login-error"
                    role="alert"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-2 flex items-start gap-2 rounded-control bg-state-occupied-tint px-3 py-2 text-sm text-state-occupied-ink"
                  >
                    <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <button type="submit" className="btn btn-gold w-full">
              Ingresar
            </button>
          </form>
        </GlassSurface>
        <div className="mt-4 rounded-tile border border-line bg-surface-card/80 px-4 py-3 text-sm text-fg-body shadow-e1">
          <p className="font-semibold text-fg-strong">Cuentas de la demo</p>
          <ul className="mt-1 space-y-0.5">
            <li>Conductor: cualquier correo @eafit.edu.co (ve solo sus vehículos)</li>
            <li>Portería: porteria@eafit.edu.co</li>
            <li>Valet: valet@eafit.edu.co</li>
            <li>Oficina: oficina@eafit.edu.co</li>
          </ul>
        </div>
        <p className="mt-3 text-center text-xs text-fg-muted">
          Demo local: el correo solo identifica la sesión en este navegador; no se envía a ningún servidor.
        </p>
      </motion.div>
    </main>
  );
}
