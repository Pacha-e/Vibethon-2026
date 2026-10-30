const { chromium } = require('playwright');
(async () => {
  const dir = process.argv[2];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  const tab = (n) => p.getByRole('tab', { name: new RegExp(n) }).click();
  // Driver flow: arrive + hire valet
  await tab('Conductor');
  await p.getByLabel('Placa').fill('KNG777'); await p.getByLabel(/Nombre/).fill('Sofía');
  await p.getByRole('button', { name: 'Llegar a la fila' }).click(); await p.waitForTimeout(200);
  const sel = p.getByLabel('Soy el conductor de'); const opts = await sel.locator('option').allTextContents();
  console.log('options', opts);
  await sel.selectOption({ index: 1 }); await p.waitForTimeout(200);
  await p.screenshot({ path: `${dir}/e2e-driver1.png`, fullPage: true });
  const btns = await p.locator('button').allTextContents(); console.log('buttons', btns.map(s=>s.trim()).filter(Boolean).slice(0,40).join(' | '));
  // Scenario 9 then office claim
  await tab('Simulación');
  await p.getByRole('button', { name: 'Ejecutar' }).nth(8).click(); await p.waitForTimeout(300);
  await tab('Oficina');
  await p.getByPlaceholder('Ej. LV-0007').fill('LV-9999'); await p.getByRole('button', { name: 'Reclamar llaves' }).click(); await p.waitForTimeout(200);
  const t1 = await p.locator('[aria-live]').allTextContents(); console.log('invalid ticket toast:', t1.join(' / ').slice(0,200));
  await p.getByPlaceholder('Ej. LV-0007').fill('LV-0008'); await p.getByRole('button', { name: 'Reclamar llaves' }).click(); await p.waitForTimeout(200);
  const t2 = await p.locator('[aria-live]').allTextContents(); console.log('valid ticket toast:', t2.join(' / ').slice(0,200));
  await p.screenshot({ path: `${dir}/e2e-office.png`, fullPage: true });
  console.log('errors:', JSON.stringify(errs));
  await b.close();
})();
