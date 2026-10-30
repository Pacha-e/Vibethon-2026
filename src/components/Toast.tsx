import { useEffect, useRef } from 'react';
import { useSim } from '../state/store';

export function Toast() {
  const { feedback, clearFeedback } = useSim();
  // Ref: un re-render del store no reinicia el temporizador.
  const closeRef = useRef(clearFeedback);
  closeRef.current = clearFeedback;

  // Auto-cierre a los 6 s. Depende del objeto feedback (cada dispatch crea uno nuevo); id puede repetirse.
  useEffect(() => {
    if (!feedback) return;
    const t = window.setTimeout(() => closeRef.current(), 6000);
    return () => window.clearTimeout(t);
  }, [feedback]);

  const isError = feedback?.kind === 'error';

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-4 left-4 right-4 z-50 flex justify-center sm:bottom-6 sm:left-auto sm:right-6 sm:justify-end"
    >
      {feedback && (
        <div
          className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-xl px-4 py-3 text-white shadow-lg ${
            isError ? 'bg-red-700' : 'bg-emerald-700'
          }`}
        >
          <span aria-hidden="true" className="text-lg font-bold leading-6">
            {isError ? '✕' : '✓'}
          </span>
          <p className="text-sm font-medium leading-6">
            {isError ? 'Error: ' : ''}
            {feedback.text}
          </p>
          <button
            type="button"
            onClick={clearFeedback}
            className="shrink-0 rounded-md px-2 py-1 text-sm font-semibold underline underline-offset-2 hover:bg-white/10 focus-visible:outline-white"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
