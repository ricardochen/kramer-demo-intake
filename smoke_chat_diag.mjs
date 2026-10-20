import { chromium } from '/home/ricardo/.openclaw/node_modules/playwright/index.mjs';

const BASE = process.env.BASE || 'http://localhost:8899/index.html';
const browser = await chromium.launch();
const errors = [];

const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));

const edges = [];
page.on('request', r => {
  const u = r.url();
  if (u.includes('/functions/v1/')) edges.push(u.split('/functions/v1/')[1].split('?')[0]);
});

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

// A: no hay inputs de formulario de diagnostico
const formInputs = await page.$$eval('#diag-wrap input', e => e.length);
console.log('=== A: no hay formulario ===');
console.log('inputs type=text dentro del bloque de diagnostico:', formInputs, '(esperado 0)');

// B: abrir CTA y ver el saludo
await page.click('#cta-start');
await page.waitForTimeout(1200);
const openOk = await page.isVisible('#diag-wrap');
const firstBubbles = await page.$$eval('#diag-log > div', e => e.length);
console.log('\n=== B: abrir CTA ===');
console.log('bloque visible:', openOk, '| burbujas iniciales:', firstBubbles);

// C: conversacion completa
async function say(text) {
  const before = await page.$$eval('#diag-log > div', e => e.length);
  await page.fill('#diag-input', text);
  await page.click('#diag-form button[type="submit"]');
  await page.waitForTimeout(450);
  return before;
}

await say('Prueba Conversacional');
await page.waitForTimeout(500);
await say('OTRO-ERROR-99');           // contacto invalido a proposito
await page.waitForTimeout(600);
const errShown = await page.isVisible('#diag-err');
console.log('\n=== C: validacion conversacional ===');
console.log('rechazo contacto invalido:', errShown, '|', (await page.textContent('#diag-err')).trim());

await say('prueba.chat@example.com');
await page.waitForTimeout(500);
edges.length = 0;
await say('responder consultas de clientes');
await page.waitForTimeout(4000);

const log = await page.$$eval('#diag-log > div', e => e.map(x => x.innerText));
console.log('\n=== D: transcripcion ===');
log.forEach((b, i) => console.log(`  [${i}] ${b.replace(/\n/g, ' | ')}`));
console.log('\nedges llamadas:', JSON.stringify(edges));
console.log('input deshabilitado al terminar:', await page.$eval('#diag-input', e => e.disabled));

// E: el chat del demo sigue intacto
const demoUserMsgs = await page.$$eval('#log .bubble-user', e => e.length);
console.log('\n=== E ===');
console.log('mensajes inyectados al chat del despacho:', demoUserMsgs, '(esperado 0)');

await page.screenshot({ path: '/tmp/kramer/shots/E_diag_chat.png', fullPage: false });
await page.close();

// F: movil
const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
m.on('pageerror', e => errors.push('M ' + e.message));
await m.goto(BASE, { waitUntil: 'networkidle' });
await m.click('#cta-start');
await m.waitForTimeout(1200);
const ov = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
console.log('\n=== F: movil ===');
console.log('overflow px:', ov);
await m.screenshot({ path: '/tmp/kramer/shots/F_mobile_diag.png', fullPage: false });
await m.close();

console.log('\n=== ERRORS ===', JSON.stringify(errors));
await browser.close();
