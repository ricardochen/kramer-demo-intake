import { chromium } from '/home/ricardo/.openclaw/node_modules/playwright/index.mjs';

const BASE = process.env.BASE || 'http://localhost:8899/index.html';
const browser = await chromium.launch();
const errors = [];

// A: el CTA abre el formulario y NO manda nada al agente del despacho
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));

const netCalls = [];
page.on('request', r => {
  const u = r.url();
  if (u.includes('/functions/v1/')) netCalls.push(u.split('/functions/v1/')[1]);
});

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

const bubblesBefore = await page.$$eval('#log .bubble-user', e => e.length);
await page.click('#cta-start');
await page.waitForTimeout(900);

const formVisible = await page.isVisible('#diag-form');
const bubblesAfterCta = await page.$$eval('#log .bubble-user', e => e.length);

console.log('=== A: comportamiento del CTA ===');
console.log('formulario visible:', formVisible);
console.log('mensajes de usuario en el chat del demo (antes/despues):', bubblesBefore, '/', bubblesAfterCta);
console.log('llamadas a edges al abrir CTA:', JSON.stringify(netCalls));

// B: validacion - solo nombre
await page.fill('#diag-form [name="nombre"]', 'Prueba Coddy');
await page.click('#diag-submit');
await page.waitForTimeout(400);
console.log('\n=== B: validacion sin contacto ===');
console.log('error mostrado:', await page.isVisible('#diag-err'), '|', (await page.textContent('#diag-err')).trim());

// C: email invalido
await page.fill('#diag-form [name="contacto"]', 'esto-no-es-email');
await page.click('#diag-submit');
await page.waitForTimeout(400);
console.log('\n=== C: contacto invalido ===');
console.log('error:', (await page.textContent('#diag-err')).trim());

// D: envio real
await page.fill('#diag-form [name="contacto"]', 'prueba.coddy@example.com');
await page.fill('#diag-form [name="proceso"]', 'responder consultas de clientes');
netCalls.length = 0;
await page.click('#diag-submit');
await page.waitForTimeout(4000);

const okVisible = await page.isVisible('#diag-ok');
const formHidden = !(await page.isVisible('#diag-form'));
console.log('\n=== D: envio real ===');
console.log('confirmacion visible:', okVisible, '| formulario oculto:', formHidden);
console.log('edges llamadas:', JSON.stringify(netCalls));
console.log('chat del demo intacto (0 mensajes de usuario):', (await page.$$eval('#log .bubble-user', e => e.length)) === 0);

await page.screenshot({ path: '/tmp/kramer/shots/D_diag_ok.png', fullPage: false });
await page.close();

// E: el chat del demo sigue funcionando por separado
const p2 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
p2.on('pageerror', e => errors.push('PAGEERROR2 ' + e.message));
await p2.goto(BASE, { waitUntil: 'networkidle' });
await p2.click('#chips .chip-demo:nth-child(3)');
await p2.waitForFunction(() => !document.querySelector('#log .typing'), null, { timeout: 60000 }).catch(() => {});
await p2.waitForTimeout(1500);
const guards = await p2.$$eval('#log .guard', e => e.map(x => x.innerText));
console.log('\n=== E: agente del despacho sigue negandose en la trampa ===');
console.log('guards:', JSON.stringify(guards));
await p2.close();

console.log('\n=== ERRORS ===', JSON.stringify(errors));
await browser.close();
