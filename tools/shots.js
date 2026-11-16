// Screenshot chosen moments: node tools/shots.js out_dir t1 t2 ...  (add "guides" to show safe zones)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [out, ...rest] = process.argv.slice(2);
  const guides = rest.includes('guides');
  const times = rest.filter(x => x !== 'guides').map(Number);
  const b = await chromium.launch({ args: ['--allow-file-access-from-files', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('console', m => console.log('[page]', m.type(), m.text()));
  p.on('pageerror', e => console.log('[pageerror]', e.message));
  await p.goto('file://' + path.resolve(__dirname, '..', process.env.PAGE || 'index.html') + (guides ? '?guides' : ''));
  await p.waitForFunction(() => window.READY === true, null, { timeout: 20000 });
  require('fs').mkdirSync(out, { recursive: true });
  for (const t of times) {
    await p.evaluate(t => window.seek(t), t);
    await p.screenshot({ path: `${out}/t${t.toFixed(2).padStart(6, '0')}.png` });
  }
  console.log('duration', await p.evaluate(() => window.DURATION), 'sfx', await p.evaluate(() => window.SFX.length));
  await b.close();
})();
