#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to the evidence directory}"

/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
/usr/bin/time -p node --input-type=module <<'NODE'
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const runtime = join(process.env.HOME, '.local/share/omgithub-playwright');
const require = createRequire(join(runtime, 'package.json'));
const { chromium } = require('playwright');
const config = JSON.parse(await (await import('node:fs/promises')).readFile(join(runtime, process.platform === 'darwin' ? 'metal.json' : 'linux.json'), 'utf8'));
if (process.platform === 'linux') {
  const { readFileSync } = await import('node:fs');
  process.env.DISPLAY ||= `:${readFileSync(join(runtime, 'display'), 'utf8').trim()}`;
}
const url = process.env.CAPTURE_URL;
const output = process.env.CAPTURE_DIR;
mkdirSync(output, { recursive: true });
const temporary = error => Object.assign(error instanceof Error ? error : new Error(String(error)), { exitCode: 75 });
let browser;
let exitCode = 0;
try {
  browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 30000 }).catch(temporary);
  for (const [name, width, height, isMobile] of [
    ['desktop', 1280, 900, false],
    ['mobile', 390, 844, true],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
      isMobile,
      hasTouch: isMobile,
    }).catch(temporary);
    page.setDefaultTimeout(30000);
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400 && new URL(response.url()).origin === new URL(url).origin) {
        pageErrors.push(`HTTP ${response.status()}: ${response.url()}`);
      }
    });

    let response;
    try {
      response = await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    } catch (error) {
      await page.close().catch(() => {});
      throw temporary(error);
    }
    if (!response?.ok()) {
      await page.close().catch(() => {});
      const status = response?.status();
      if (!response || [408, 429, 500, 502, 503, 504].includes(status)) {
        throw temporary(new Error(`Temporary navigation failure (HTTP ${status ?? 'unavailable'}) at ${url}`));
      }
      throw new Error(`Preview returned HTTP ${status} at ${url}`);
    }

    try {
      await page.locator('#startScreen').waitFor({ state: 'visible', timeout: 30000 });
      await page.locator('#startButton').waitFor({ state: 'visible', timeout: 30000 });
      await page.waitForFunction(() => {
        const canvas = document.querySelector('#game');
        return canvas && canvas.width > 0 && canvas.height > 0 && document.fonts.status !== 'loading';
      }, null, { timeout: 30000 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.screenshot({ path: join(output, `final-${name}.png`), timeout: 30000 });
      console.log(`Captured ${name} at ${width}x${height}: ${url}`);
    } catch (error) {
      if (error.name === 'TimeoutError' || !browser.isConnected()) throw temporary(error);
      throw error;
    } finally {
      await page.close().catch(error => { throw temporary(error); });
    }
    if (pageErrors.length) throw new Error(`${name} rendering errors: ${pageErrors.join('; ')}`);
  }
} catch (error) {
  console.error(error);
  exitCode = error.exitCode || 1;
} finally {
  try {
    await browser?.close();
  } catch (error) {
    console.error(error);
    exitCode ||= 75;
  }
}
process.exitCode = exitCode;
NODE
