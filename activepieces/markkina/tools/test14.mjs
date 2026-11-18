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

const s14 = await loadCode('step14.js');

const events = [
  { name: 'Nvidian tulosjulkistus', symbols: 'NVDA', timing: 'eilen illalla', why: 'markkinajohtaja', query: 'Nvidia Q3 earnings results reaction' },
  { name: 'Anthropicin listautuminen', symbols: '', timing: 'talla viikolla', why: 'suuri listautuminen', query: 'Anthropic IPO pricing first day trading' }
];
const content = '```json\n' + JSON.stringify(events) + '\n```';

// Rakenne 1: suoraan content
const r1 = await s14.code({ raw: content });
// Rakenne 2: output.body.choices[0].message.content (Custom API Call)
const r2 = await s14.code({ raw: { body: { choices: [{ message: { content: content } }] } } });
// Rakenne 3: output.choices[0].message.content
const r3 = await s14.code({ raw: { choices: [{ message: { content: content } }] } });
// Rakenne 4: vanha kenttanimi events_json
const r4 = await s14.code({ events_json: content });
// Rakenne 5: rikkinainen
const r5 = await s14.code({ raw: 'ei jsonia' });
// Rakenne 6: kokonaan tyhja
const r6 = await s14.code({});

const check = (name, r) => {
  const ok = r.parsed_count === 2 && r.q1 === 'Nvidia Q3 earnings results reaction' && JSON.parse(r.tickers).length === 1;
  console.log(name + ': parsed=' + r.parsed_count + ' q1=' + r.q1.slice(0, 30) + ' tickers=' + r.tickers.length + ' -> ' + (ok ? 'OK' : 'VIRHE'));
  return ok;
};

let allOk = true;
allOk = check('body.choices (Custom API)', r2) && allOk;
allOk = check('choices', r3) && allOk;
allOk = check('pelkka teksti', r1) && allOk;
allOk = check('events_json (vanha nimi)', r4) && allOk;
console.log('rikkinainen syote: parsed=' + r5.parsed_count + ' q1=' + r5.q1 + ' (varahaku OK: ' + (r5.q1.includes('overnight') || r5.q1.includes('movers')) + ')');
console.log('tyhja syote: parsed=' + r6.parsed_count + ' raw_preview=[' + r6.raw_preview + ']');
console.log('');
console.log(allOk ? 'KAIKKI RAKENTEET OK' : 'VIRHEITA');

for (const x of [s14]) { try { fs.unlinkSync(x.tmp); } catch (e) {} }
