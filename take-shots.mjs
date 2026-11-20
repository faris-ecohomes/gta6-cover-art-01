// Takes this entry's screenshots: serves app/ with serve.ts, opens each
// scene from shots.json in the Chrome headless shell, waits for the app
// itself to flag the scene ready (window.__shotReady), and saves a JPEG
// per scene into screenshots/. If a JPEG lands over the kit's 256 KiB
// per-screenshot cap it is retaken at a lower quality until it fits.
//
//   node take-shots.mjs
//
// playwright-core is borrowed from the workspace tools install; the
// browser is the locally cached Chrome Headless Shell.
import { spawn } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire('/home/hatch/workspace/tools/pw-shots/package.json');
const { chromium } = require('playwright-core');

const PORT = 8931;
const BASE = `http://localhost:${PORT}`;
const SHELL = '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell';
const MAX_BYTES = 262144;

const server = spawn('node', [join(here, 'serve.ts'), '--port', String(PORT)], { stdio: 'ignore' });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(BASE + '/');
      if (res.ok) return;
    } catch { /* not up yet */ }
    await wait(200);
  }
  throw new Error('serve.ts did not come up');
}

async function shoot(browser, shot) {
  const context = await browser.newContext({ viewport: { width: shot.w, height: shot.h } });
  const page = await context.newPage();
  await page.goto(BASE + '/' + shot.query, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 30000 });
  await wait(150);
  const target = join(here, 'screenshots', shot.name);
  let quality = 85;
  for (;;) {
    await page.screenshot({ path: target, type: 'jpeg', quality });
    const size = statSync(target).size;
    console.log(`${shot.name}: ${size} bytes at quality ${quality}`);
    if (size <= MAX_BYTES || quality <= 45) break;
    quality -= 12;
  }
  await context.close();
}

try {
  await waitForServer();
  const shots = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));
  const browser = await chromium.launch({ executablePath: SHELL });
  for (const shot of shots) await shoot(browser, shot);
  await browser.close();
  console.log('all screenshots taken');
} finally {
  server.kill();
}
