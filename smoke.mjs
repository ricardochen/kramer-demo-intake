import { chromium } from '/home/ricardo/.openclaw/node_modules/playwright/index.mjs';
import { mkdirSync } from 'fs';

const BASE = process.env.BASE || 'http://localhost:8899/index.html';
const shots = '/tmp/kramer/shots';
mkdirSync(shots, { recursive: true });

const browser = await chromium.launch();
const errors = [];
const failed = [];

async function convo(turns, label, viewport = { width: 1280, height: 900 }) {
  const page = await browser.newPage({ viewport });
  page.on('console', m => { if (m.type() === 'error') errors.push(`[${label}] ${m.text()}`); });
  page.on('pageerror', e => errors.push(`[${label}] PAGEERROR ${e.message}`));
  page.on('requestfailed', r => failed.push(`[${label}] ${r.url()} :: ${r.failure()?.errorText}`));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const results = [];
  for (const t of turns) {
    const before = await page.$$eval('#log .bubble-bot', els => els.length);
    if (t.startsWith('CHIP:')) {
      await page.click(`#chips .chip-demo:nth-child(${t.split(':')[1]})`);
    } else {
      await page.fill('#input', t);
      await page.click('#form button[type="submit"]');
    }
    await page.waitForFunction(
      (n) => document.querySelectorAll('#log .bubble-bot').length > n &&
             !document.querySelector('#log .typing'),
      before, { timeout: 60000 }
    ).catch(() => {});
    await page.waitForTimeout(800);
  }
  const bubbles = await page.$$eval('#log .bubble-bot', els => els.map(e => e.innerText));
  const guards = await page.$$eval('#log .guard', els => els.length);
  await page.screenshot({ path: `${shots}/${label}.png`, fullPage: false });
  await page.close();
  return { bubbles, guards };
}

// A: chip EN
const A = await convo(['CHIP:1', 'My name is Test Lead. I am Canadian, currently in Canada. My email is test@example.com'], 'A_chip_en');
console.log('=== A (chip EN) ===', A.guards, 'guards');
A.bubbles.forEach((b, i) => console.log(`[${i}] ${b.replace(/\n/g, ' | ').slice(0, 400)}`));

// B: trampa guardrail
const B = await convo(['CHIP:3'], 'B_guardrail');
console.log('=== B (trampa) ===', B.guards, 'guards');
B.bubbles.forEach((b, i) => console.log(`[${i}] ${b.replace(/\n/g, ' | ').slice(0, 400)}`));

// C: chip ES
const C = await convo(['CHIP:2'], 'C_chip_es');
console.log('=== C (chip ES) ===', C.guards, 'guards');
C.bubbles.forEach((b, i) => console.log(`[${i}] ${b.replace(/\n/g, ' | ').slice(0, 400)}`));

// D: alemán
const D = await convo(['Guten Tag, ich interessiere mich für eine Aufenthaltsgenehmigung in Panama.'], 'D_german');
console.log('=== D (DE) ===', D.guards, 'guards');
D.bubbles.forEach((b, i) => console.log(`[${i}] ${b.replace(/\n/g, ' | ').slice(0, 400)}`));

// E: móvil 390px, overflow + inmersivo
const pageM = await browser.newPage({ viewport: { width: 390, height: 844 } });
pageM.on('console', m => { if (m.type() === 'error') errors.push(`[M] ${m.text()}`); });
pageM.on('pageerror', e => errors.push(`[M] PAGEERROR ${e.message}`));
await pageM.goto(BASE, { waitUntil: 'networkidle' });
await pageM.waitForTimeout(800);
const overflow = await pageM.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
console.log('MOBILE overflow px =', overflow);
await pageM.screenshot({ path: `${shots}/M_mobile.png`, fullPage: false });
await pageM.click('#input');
await pageM.waitForTimeout(600);
const immersive = await pageM.evaluate(() => document.body.classList.contains('chat-immersive'));
console.log('MOBILE immersive activo =', immersive);
await pageM.screenshot({ path: `${shots}/M_immersive.png`, fullPage: false });
await pageM.close();

// L: landing full desktop
const pageL = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await pageL.goto(BASE, { waitUntil: 'networkidle' });
await pageL.waitForTimeout(800);
await pageL.screenshot({ path: `${shots}/L_landing.png`, fullPage: true });
await pageL.close();

console.log('=== CONSOLE ERRORS ===', JSON.stringify(errors, null, 0));
console.log('=== FAILED REQUESTS ===', JSON.stringify(failed, null, 0));
await browser.close();
