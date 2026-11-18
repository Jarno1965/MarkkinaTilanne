import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const build = path.dirname(fileURLToPath(import.meta.url));

async function loadCode(jsFile) {
  let src = fs.readFileSync(path.join(build, jsFile), 'utf8');
  src = src.replace(/export\s+const\s+code\s*=/, 'export const code =');
  const tmp = path.join(build, '_tmp_' + jsFile);
  fs.writeFileSync(tmp, src, 'utf8');
  const mod = await import(pathToFileURL(tmp).href);
  return mod.code;
}

const step9 = await loadCode('step9.js');
const step14 = await loadCode('step14.js');

// --- step_9 test ---
const now = Date.now();
const hoursAgo = (h) => new Date(now - h * 3600000).toISOString();

const res = await step9({
  step_7_results: JSON.stringify([
    { title: 'Nvidia beats estimates', content: 'Nvidia reported Q3 revenue of 35.1 billion dollars.', url: 'https://www.reuters.com/x', published_date: hoursAgo(7) },
    { title: 'Asian markets rise', content: 'Nikkei closed up 0.6 percent.', url: 'https://www.cnbc.com/y', published_date: hoursAgo(2) },
    { title: 'Old preview', content: 'Nvidia earnings ahead tonight.', url: 'https://www.bloomberg.com/z', published_date: hoursAgo(20) }
  ]),
  step_7_answer: 'Asian shares were mixed overnight.',
  step_8_results: JSON.stringify([
    { title: 'Helsinki opens flat', content: 'OMXH25 futures point slightly down.', url: 'https://www.kauppalehti.fi/q', published_at: '3 hours ago' }
  ]),
  step_8_answer: 'European futures point lower.',
  step_15_results: JSON.stringify([{ title: 'Nvidia reaction', content: 'Shares rose 4 percent after hours.', url: 'https://www.reuters.com/r', published_date: hoursAgo(6) }]),
  step_15_answer: 'Nvidia stock rose after the beat.',
  step_16_results: '',
  step_16_answer: '',
  step_17_results: '',
  step_17_answer: '',
  watchlist: '- Nvidian tulosjulkistus (ajankohta: eilen illalla) : odotukset korkealla ;; - Anthropicin listautuminen (ajankohta: lahella)',
  market_data: 'S&P 500 Futures: 5100 (+0.30%) | Linkki: https://finance.yahoo.com/quote/ES=F/'
});

console.log('=== step_9 output ===');
console.log('newsAsia:', res.newsAsia.slice(0, 260));
console.log('newsEurope:', res.newsEurope.slice(0, 160));
console.log('watchlist:', res.watchlist.slice(0, 210));

// verify sorting: "2 h sitten" article must come before the 20h one
const asia = res.newsAsia;
const idx2 = asia.indexOf('Asian markets rise');
const idx20 = asia.indexOf('Old preview');
console.log('lajittelu ok:', idx2 !== -1 && idx20 !== -1 && idx2 < idx20);

// --- step_14 test ---
const good = JSON.stringify([
  { name: 'Nvidian tulosjulkistus', type: 'tulos', timing: 'eilen illalla', why: 'markkinajohtaja', query: 'Nvidia Q3 earnings results reaction' },
  { name: 'Anthropicin listautuminen', type: 'listautuminen', timing: 'talla viikolla', why: 'suuri listautuminen', query: 'Anthropic IPO pricing first day trading' }
]);

const p1 = await step14({ events_json: good });
console.log('\n=== step_14 (2 tapahtumaa) ===');
console.log(JSON.stringify(p1, null, 2));

const p2 = await step14({ events_json: '```json\n' + good + '\n```' });
console.log('koodilohko siivottu:', p2.q1 === 'Nvidia Q3 earnings results reaction');

const p3 = await step14({ events_json: '[]' });
console.log('tyhja lista -> varahaut:', p3.q1, '|', p3.q2, '|', p3.q3);

const p4 = await step14({ events_json: 'ei jsonia' });
console.log('rikkinainen syote -> varahaut:', p4.q1, '|', p4.q2);

const p5 = await step14({ events_json: JSON.stringify([{ name: 'X', query: '' }, { name: 'Y', query: '' }]) });
console.log('tyhja query -> johdettu nimesta:', p5.q1, '|', p5.q2);
