const { chromium } = require('playwright');
(async () => {
  const dir = process.argv[2]; const views = (process.argv[3] || 'Portería').split(',');
  const b = await chromium.launch(); const errs = [];
  for (const w of [1440, 1366, 768, 390]) {
    const p = await b.newPage({ viewport: { width: w, height: 860 } }); p.on('pageerror', e => errs.push(`${w}: ${e}`));
    await p.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
    for (const v of views) {
      await p.getByRole('tab', { name: new RegExp(v) }).click(); await p.waitForTimeout(450);
      const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      await p.screenshot({ path: `${dir}/r-${v}-${w}.png` });
      console.log(`${w}px ${v}: horizontal overflow ${overflow}px`);
    }
    await p.close();
  }
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
