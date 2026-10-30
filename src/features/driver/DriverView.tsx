import { useMemo, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ACCESSES, ACCESS_NAME, type AccessId, type Vehicle } from '../../contracts/types';
import { getEta } from '../../domain/engine';
import { Badge } from '../../components/Badge';
import { EtaCard } from '../../components/EtaCard';
import { STAGE_LABEL } from '../../components/format';
import { useSim } from '../../state/store';
import HireValetPanel from '../valet/HireValetPanel';

/** Frase accionable según la etapa real del vehículo; null cuando su turno ya terminó. */
function nextStep(v: Vehicle): string | null {
  if (v.exitWithoutParking && (v.stage === 'outside' || v.stage === 'in_lane')) {
    return 'Saldrás sin estacionar; conservas tu lugar hasta portería.';
  }
  switch (v.stage) {
    case 'outside':
      return 'Espera antes del registro: la pasarela está llena.';
    case 'in_lane':
      return v.cellId
        ? `Avanza a portería cuando seas el primero: tu celda ${v.cellId} está reservada.`
        : 'Espera en la pasarela; te avisaremos al reservar tu celda.';
    case 'entering':
      return v.cellId ? `Dirígete a ${v.cellId} y confirma «Ya estacioné».` : 'Dirígete a tu celda y confirma «Ya estacioné».';
    case 'parked':
      return v.cellId ? `Estacionado en ${v.cellId}.` : 'Estacionado.';
    case 'exiting':
      return 'Sal por la salida habilitada.';
    case 'exited':
      return null;
  }
}

export default function DriverView() {
  const { state, dispatch } = useSim();
  const [plate, setPlate] = useState('');
  const [driver, setDriver] = useState('');
  const [access, setAccess] = useState<AccessId>('LV');
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState('');

  // Vehículos activos. Se conserva el seleccionado aunque ya haya salido, para mostrar su cierre.
  const choices = useMemo<Vehicle[]>(
    () => Object.values(state.vehicles).filter((v) => v.stage !== 'exited' || v.id === selectedId),
    [state.vehicles, selectedId],
  );
  const me: Vehicle | null = selectedId ? (state.vehicles[selectedId] ?? null) : null;
  const cellId = me?.cellId ?? null;
  const cell = cellId ? state.cells.find((c) => c.id === cellId) : undefined;
  const showEta = me !== null && (me.stage === 'outside' || me.stage === 'in_lane');
  const eta = me && showEta ? getEta(state, me.id) : null;
  const step = me ? nextStep(me) : null;

  function onArrive(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const p = plate.trim().toUpperCase();
    const d = driver.trim();
    if (!p || !d) {
      setFormMsg('Falta información: escriba la placa y su nombre.');
      return;
    }
    setFormMsg(null);
    const before = state.vehicles;
    const r = dispatch({ type: 'arrive', plate: p, driver: d, access });
    if (!r.ok) return;
    // El vehículo nuevo es el primer evento que referencia un id inexistente antes del comando.
    const newId = r.events.find((ev) => ev.vehicleId && !before[ev.vehicleId])?.vehicleId;
    if (newId) setSelectedId(newId);
    setPlate('');
    setDriver('');
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold text-king-ink">Conductor</h1>
        <p className="mt-1 text-base text-slate-800">Regístrese en la fila y siga el estado de su turno.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        <div className="space-y-6">
          <section aria-labelledby="form-title" className="card">
            <h2 id="form-title" className="text-lg font-bold text-king-ink">
              Llegar a la fila
            </h2>
            <form onSubmit={onArrive} className="mt-4 space-y-4" noValidate>
              <div>
                <label htmlFor="plate" className="block text-sm font-semibold text-king-ink">
                  Placa
                </label>
                <input
                  id="plate"
                  name="plate"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  autoComplete="off"
                  placeholder="ABC123"
                  className="field uppercase"
                />
              </div>
              <div>
                <label htmlFor="driver" className="block text-sm font-semibold text-king-ink">
                  Nombre del conductor
                </label>
                <input
                  id="driver"
                  name="driver"
                  value={driver}
                  onChange={(e) => setDriver(e.target.value)}
                  autoComplete="off"
                  className="field"
                />
              </div>
              <fieldset>
                <legend className="text-sm font-semibold text-king-ink">Acceso</legend>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {ACCESSES.map((a) => (
                    <label
                      key={a}
                      className={`flex min-h-[2.75rem] cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 text-base font-semibold ${
                        access === a ? 'border-king-royal bg-blue-50 text-king-royal' : 'border-slate-400 text-king-ink'
                      }`}
                    >
                      <input
                        type="radio"
                        name="access"
                        value={a}
                        checked={access === a}
                        onChange={() => setAccess(a)}
                        className="h-5 w-5 accent-king-royal"
                      />
                      {ACCESS_NAME[a]} ({a})
                    </label>
                  ))}
                </div>
              </fieldset>
              {formMsg && (
                <p role="alert" className="text-sm font-semibold text-red-900">
                  {formMsg}
                </p>
              )}
              <button type="submit" className="btn btn-primary w-full">
                Llegar a la fila
              </button>
            </form>
          </section>

          <section aria-labelledby="pick-title" className="card">
            <h2 id="pick-title" className="text-lg font-bold text-king-ink">
              Mi vehículo
            </h2>
            <label htmlFor="me-select" className="mt-3 block text-sm font-semibold text-king-ink">
              Soy el conductor de
            </label>
            <select
              id="me-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="field"
            >
              <option value="">Seleccione su vehículo</option>
              {choices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} · {v.driver} · {ACCESS_NAME[v.access]}
                </option>
              ))}
            </select>
            {choices.length === 0 && (
              <p className="mt-2 text-sm text-slate-800">Aún no hay vehículos activos. Regístrese en la fila.</p>
            )}
          </section>
        </div>

        <section aria-labelledby="turn-title" className="card space-y-4">
          <h2 id="turn-title" className="text-lg font-bold text-king-ink">
            Mi turno
          </h2>
          {!me ? (
            <p className="text-base text-slate-800">Regístrese en la fila o seleccione su vehículo para ver su turno.</p>
          ) : (
            <>
              {step && (
                <div className="glass-dark rounded-glass p-4">
                  <p className="text-sm font-semibold uppercase tracking-wide text-king-gold">Siguiente paso</p>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={step}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-1 text-lg font-semibold text-white"
                    >
                      {step}
                    </motion.p>
                  </AnimatePresence>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="gold">{ACCESS_NAME[me.access]}</Badge>
                <Badge tone="neutral">Placa {me.plate}</Badge>
              </div>
              <p className="text-base text-king-ink">
                <span className="font-semibold">Conductor:</span> {me.driver}
              </p>
              <p className="rounded-lg bg-slate-100 px-3 py-2 text-base font-semibold text-king-ink">
                Etapa: {STAGE_LABEL[me.stage]}
              </p>

              {me.notice && (
                <p role="status" className="rounded-lg border-l-4 border-king-gold bg-amber-50 px-3 py-2 text-base text-amber-900">
                  <span className="font-bold">Aviso: </span>
                  {me.notice}
                </p>
              )}

              {eta && (eta.kind === 'estimate' || eta.kind === 'not_registered') && (
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-xl bg-slate-100 p-3">
                    <p className="text-sm font-semibold uppercase tracking-wide text-king-royal">Posición</p>
                    <p className="mt-1 text-4xl font-bold tabular-nums text-king-ink">{eta.position}</p>
                  </div>
                  <div className="rounded-xl bg-slate-100 p-3">
                    <p className="text-sm font-semibold uppercase tracking-wide text-king-royal">Vehículos delante</p>
                    <p className="mt-1 text-4xl font-bold tabular-nums text-king-ink">{eta.vehiclesAhead}</p>
                  </div>
                </div>
              )}
              {eta && <EtaCard eta={eta} />}

              {cell ? (
                <div className="rounded-xl border-2 border-king-royal bg-white p-4">
                  <p className="text-sm font-semibold uppercase tracking-wide text-king-royal">Su celda</p>
                  <p className="mt-1 text-2xl font-bold text-king-ink">{cell.id}</p>
                  <p className="text-base text-king-ink">Zona {cell.zone}</p>
                  <p className="mt-1 text-base text-king-ink">Recorrido desde portería: {cell.route}</p>
                </div>
              ) : (
                (me.stage === 'in_lane' || me.stage === 'entering') && (
                  <p className="text-base text-slate-800">Sin celda asignada todavía.</p>
                )
              )}

              <div className="grid gap-3">
                {me.stage === 'outside' && (
                  <p className="text-base text-slate-800">Espere su turno en la fila exterior.</p>
                )}
                {me.stage === 'in_lane' && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => dispatch({ type: 'requestExitWithoutParking', vehicleId: me.id })}
                  >
                    Salir sin estacionar
                  </button>
                )}
                {me.stage === 'entering' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => dispatch({ type: 'park', vehicleId: me.id })}
                    >
                      Ya estacioné
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => dispatch({ type: 'reportCellOccupied', vehicleId: me.id })}
                    >
                      Mi celda está ocupada
                    </button>
                  </>
                )}
                {me.stage === 'parked' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => dispatch({ type: 'leave', vehicleId: me.id })}
                  >
                    Salir del parqueadero
                  </button>
                )}
                {me.stage === 'exiting' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => dispatch({ type: 'completeExit', vehicleId: me.id })}
                  >
                    Completar salida
                  </button>
                )}
                {me.stage === 'exited' && (
                  <p className="text-base text-slate-800">Su turno terminó. Gracias por usar parKING.</p>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {me && (
        <section aria-labelledby="valet-title" className="space-y-3">
          <h2 id="valet-title" className="sr-only">
            Servicio de valet
          </h2>
          <HireValetPanel vehicleId={me.id} />
        </section>
      )}
    </div>
  );
}
