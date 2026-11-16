// Render every frame at 30 fps with Playwright and encode H.264 (yuv420p).
// Usage: node tools/render.js [fps] [workers]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const { spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const FPS = +(process.argv[2] || 30), WORKERS = +(process.argv[3] || 4);
const FR = path.join(ROOT, 'build', 'frames');

(async () => {
  fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR, { recursive: true });
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const open = async () => {
    const p = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    p.on('pageerror', e => { console.error('[pageerror]', e.message); process.exit(1); });
    await p.goto('file://' + path.join(ROOT, 'index.html'));
    await p.waitForFunction(() => window.READY === true, null, { timeout: 30000 });
    return p;
  };
  const first = await open();
  const dur = await first.evaluate(() => window.DURATION);
  fs.writeFileSync(path.join(ROOT, 'build', 'sfx.json'), JSON.stringify(
    { duration: dur, sfx: await first.evaluate(() => window.SFX), music: await first.evaluate(() => window.CONFIG.music) }, null, 1));
  const N = Math.round(dur * FPS);
  console.log(`duration ${dur}s -> ${N} frames, ${WORKERS} workers`);
  const pages = [first]; for (let i = 1; i < WORKERS; i++) pages.push(await open());
  let done = 0; const t0 = Date.now();
  await Promise.all(pages.map(async (p, w) => {
    for (let f = w; f < N; f += WORKERS) {
      await p.evaluate(t => window.seek(t), f / FPS);
      await p.screenshot({ path: path.join(FR, `f${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 95 });
      if (++done % 100 === 0) console.log(`  ${done}/${N}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
  }));
  await browser.close();
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', path.join(FR, 'f%05d.jpg'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    path.join(ROOT, 'build', 'video.mp4')], { stdio: 'inherit' });
  if (r.status) process.exit(r.status);
  console.log('video -> build/video.mp4');
})();
