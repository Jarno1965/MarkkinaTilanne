// Testi step_5 (Kello 11 Eurooppa): reasoning-mallin content=null -tapaus ja normaalit tapaukset.
import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const build = path.dirname(fileURLToPath(import.meta.url));

async function loadCode(jsFile) {
  const src = fs.readFileSync(path.join(build, jsFile), 'utf8');
  const tmp = path.join(build, '_t_' + jsFile);
  fs.writeFileSync(tmp, src, 'utf8');
  const mod = await import(pathToFileURL(tmp).href);
  return { code: mod.code, tmp };
}

const s5 = await loadCode('step5_eurooppa.js');

const MAIN = [
  '<!DOCTYPE html>',
  '<html lang="fi"><head><meta charset="utf-8"><title>Katsaus</title></head>',
  '<body><div class="wrap"><header>Otsikko</header>',
  '<footer>Katsaus kokoaa Helsingin porssin aamupaivan tilanteen.</footer>',
  '</div></body></html>'
].join('\n');

const SECTION = [
  '<section style="background:#fffbeb;border:2px dashed #f59e0b;">',
  '<h2>Spekulaatio: miten Eurooppa kehittyy lahitusevaisuudessa</h2>',
  '<div>Tama osio on toimittajan spekulaatiota, ei sijoitusneuvontaa eika ennuste.</div>',
  '<p>Ensimmainen kappale.</p>',
  '<p>Toinen kappale.</p>',
  '</section>'
].join('');

function decode(res) {
  return Buffer.from(res.base64, 'base64').toString('utf-8');
}

function check(name, ok, detail) {
  const label = ok ? 'PASS' : 'FAIL';
  console.log(label + ' - ' + name + (ok || !detail ? '' : ' :: ' + detail));
  if (!ok) { process.exitCode = 1; }
}

const date = '2026-11-19 11:00:13';

// 1) Nykyinen virhetilanne: content null, vastaus reasoning-kentassa. Reasoningissa on myos
//    backtickissa mainittu `<section>` ennen oikeaa lohkoa -> pitää valita viimeinen ehja lohko.
const reasoning = [
  "Here's a thinking process to construct the required HTML fragment:",
  'Output: *ONLY* the HTML fragment (starting with `<section>` and ending with `</section>`).',
  'Draft: <section>lyhyt luonnos</section> ei kelpaa.',
  'Final:',
  SECTION
].join('\n');

const r1 = decode(await s5.code({
  date,
  html: MAIN,
  analysis: { role: 'assistant', content: null, refusal: null, reasoning }
}));
check('reasoning-fallback: section mukana', r1.includes('Spekulaatio: miten Eurooppa kehittyy'));
check('reasoning-fallback: ei JSON-roskia', !r1.includes('"role"') && !r1.includes('"reasoning"') && !r1.includes('content":null'));
check('reasoning-fallback: luonnosta ei oteta', !r1.includes('lyhyt luonnos'));
check('reasoning-fallback: dokumentti ehja', r1.trimEnd().endsWith('</html>') && r1.includes('</footer>'));
check('reasoning-fallback: section vain kerran', (r1.match(/<section/g) || []).length === 1);

// 2) Koko OpenRouter-vastaus, jonka choices[0].message.content on null.
const r2 = decode(await s5.code({
  date,
  html: MAIN,
  analysis: { id: 'gen-1', choices: [{ message: { role: 'assistant', content: null, reasoning: SECTION } }] }
}));
check('choices-rakenne: section mukana', r2.includes('Ensimmainen kappale.'));
check('choices-rakenne: ei JSON-roskia', !r2.includes('"choices"') && !r2.includes('"message"'));

// 3) Normaali content toimii edelleen.
const r3 = decode(await s5.code({
  date,
  html: MAIN,
  analysis: { role: 'assistant', content: SECTION }
}));
check('content: section mukana', r3.includes('Toinen kappale.'));
check('content: ei JSON-roskia', !r3.includes('"role"'));

// 4) JSON-merkkijonona annettu viesti (extractin JSON.parse-polut).
const r4 = decode(await s5.code({
  date,
  html: MAIN,
  analysis: JSON.stringify({ role: 'assistant', content: null, reasoning })
}));
check('json-string: section mukana', r4.includes('Spekulaatio: miten Eurooppa kehittyy'));
check('json-string: ei JSON-roskia', !r4.includes('"reasoning"'));

// 5) Reasoning ilman sectionia -> raportti julkaistaan ilman analyysia, ei roskaa.
const r5 = decode(await s5.code({
  date,
  html: MAIN,
  analysis: { role: 'assistant', content: '', reasoning: 'Pelkkaa pohdintaa ilman HTML-lohkoa.' }
}));
check('ei sectionia: ei roskaa', !r5.includes('Pelkkaa pohdintaa') && !r5.includes('"role"'));
check('ei sectionia: paaraportti tallessa', r5.includes('Katsaus kokoaa') && r5.trimEnd().endsWith('</html>'));

// 6) Katkennut paa-HTML torjutaan edelleen.
let threw = false;
try {
  await s5.code({ date, html: '<!DOCTYPE html><html><body><p>kesken', analysis: SECTION });
} catch (e) {
  threw = /katkesi kesken/.test(e.message);
}
check('katkennut paa-HTML: heittaa virheen', threw);

fs.unlinkSync(s5.tmp);
console.log(process.exitCode ? 'Testit epaonnistuivat.' : 'Kaikki testit menivat lapi.');