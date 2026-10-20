import { chromium } from '/home/ricardo/.openclaw/node_modules/playwright/index.mjs';
import { mkdirSync } from 'fs';

const BASE = process.env.BASE || 'http://localhost:8899/index.html';
const shots = '/tmp/kramer/shots';
mkdirSync(shots, { recursive: true });

const browser = await chromium.launch();
const errors = [];

async function run(turns, label, opts = {}) {
  const page = await browser.newPage({ viewport: opts.vp || { width: 1280, height: 900 } });
  page.on('console', m => { if (m.type() === 'error') errors.push(`[${label}] ${m.text()}`); });
  page.on('pageerror', e => errors.push(`[${label}] PAGEERROR ${e.message}`));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  for (const t of turns) {
    const before = await page.$$eval('#log .bubble-bot', els => els.length);
    if (t === 'CTA') {
      await page.click('#cta-start');
    } else if (t.startsWith('CHIP:')) {
      await page.click(`#chips .chip-demo:nth-child(${t.split(':')[1]})`);
    } else {
      await page.fill('#input', t);
      await page.click('#form button[type="submit"]');
    }
    await page.waitForFunction(
      (n) => (document.querySelectorAll('#log .bubble-bot').length > n ||
              document.querySelectorAll('#log .bubble-user').length > 0) &&
             !document.querySelector('#log .typing'),
      before, { timeout: 60000 }
    ).catch(() => {});
    await page.waitForTimeout(900);
  }

  const users = await page.$$eval('#log .bubble-user', els => els.map(e => e.innerText));
  const bots = await page.$$eval('#log .bubble-bot', els => els.map(e => e.innerText));
  const guards = await page.$$eval('#log .guard', els => els.map(e => e.innerText));
  await page.screenshot({ path: `${shots}/${label}.png`, fullPage: false });
  await page.close();
  return { users, bots, guards };
}

// A: CTA solo, sin conversacion previa -> debe arrancar la captura
const A = await run(['CTA'], 'A_cta_solo');
console.log('=== A (CTA en frio) ===');
console.log('mensajes del usuario:', JSON.stringify(A.users));
console.log('ultima respuesta:', (A.bots[A.bots.length - 1] || '').replace(/\n/g, ' | ').slice(0, 380));

// B: conversacion previa + CTA -> no debe duplicar ni reiniciar
const B = await run(['Hola, necesito ayuda con la residencia en Panamá.', 'CTA', 'CTA'], 'B_cta_con_contexto');
console.log('\n=== B (CTA dos veces tras conversar) ===');
console.log('mensajes del usuario:', JSON.stringify(B.users));

// C: chip trampa sigue negandose
const C = await run(['CHIP:3'], 'C_trampa');
console.log('\n=== C (trampa) ===');
console.log('guards:', JSON.stringify(C.guards));

// D: movil, overflow
const pageM = await browser.newPage({ viewport: { width: 390, height: 844 } });
pageM.on('pageerror', e => errors.push(`[M] ${e.message}`));
await pageM.goto(BASE, { waitUntil: 'networkidle' });
await pageM.waitForTimeout(800);
const overflow = await pageM.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
console.log('\nMOBILE overflow px =', overflow);
await pageM.screenshot({ path: `${shots}/M_mobile.png`, fullPage: false });
await pageM.close();

const pageL = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await pageL.goto(BASE, { waitUntil: 'networkidle' });
await pageL.waitForTimeout(600);
await pageL.screenshot({ path: `${shots}/L_landing.png`, fullPage: true });
await pageL.close();

console.log('\n=== ERRORS ===', JSON.stringify(errors));
await browser.close();
