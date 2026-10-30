const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  const out = [];
  await p.getByLabel('Placa').fill('KNG778'); await p.getByLabel(/Nombre/).fill('Juan');
  await p.getByRole('button', { name: 'Llegar a la fila' }).click(); await p.waitForTimeout(300);
  const toasts = await p.locator('[aria-live]').filter({ hasText: /KNG778/ }).count();
  out.push(`toasts visibles con el mensaje tras 'arrive' en Conductor: ${toasts}`);
  out.push(`vehículo autoseleccionado: ${await p.getByLabel('Soy el conductor de').inputValue() !== ''}`);
  for (const tab of ['Portería', 'Simulación']) {
    await p.getByRole('tab', { name: new RegExp(tab) }).click(); await p.waitForTimeout(200);
    out.push(`${tab}: toasts con mensaje = ${await p.locator('[aria-live]').filter({ hasText: /KNG778/ }).count()}`);
  }
  await p.waitForTimeout(6500);
  out.push(`tras 6.5 s: toasts con mensaje = ${await p.locator('[aria-live]').filter({ hasText: /KNG778/ }).count()}`);
  out.push(`errores de página: ${JSON.stringify(errs)}`);
  console.log(out.join('\n')); await b.close();
})();
