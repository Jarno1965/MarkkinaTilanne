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

const s9 = await loadCode('step9.js');
const s14 = await loadCode('step14.js');
const s18 = await loadCode('step18.js');

const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();

const r9 = await s9.code({
  label_asia: 'EUROOPPA',
  label_europe: 'HELSINKI JA SUOMI',
  fresh_hours: 3,
  step_7_results: JSON.stringify([
    { title: 'Nvidia beats estimates', content: 'Nvidia reported Q3 revenue of 35.1 billion.', url: 'https://www.reuters.com/x', published_date: hoursAgo(7) },
    { title: 'Asian markets rise', content: 'Nikkei closed up 0.6 percent.', url: 'https://www.cnbc.com/y', published_date: hoursAgo(2) }
  ]),
  step_7_answer: 'Asian shares were mixed.',
  step_8_results: JSON.stringify([{ title: 'Helsinki opens flat', content: 'OMXH25 flat.', url: 'https://www.kauppalehti.fi/q', published_at: '30 minutes ago' }]),
  step_8_answer: 'European futures lower.',
  step_15_results: '[]', step_15_answer: '',
  step_16_results: '', step_16_answer: '',
  step_17_results: '', step_17_answer: '',
  watchlist: '- Nvidian tulosjulkistus (ajankohta: eilen)',
  market_data: 'OMX Helsinki 25: 10234.5 (+0.35%) [kurssi klo 11:02] | Linkki: https://finance.yahoo.com/quote/^OMXH25/',
  step_18_quotes: 'Nvidian tulosjulkistus (NVDA): jälkimarkkina 185.2 (+3.10%) klo 01:45'
});

console.log('=== step_9 ===');
console.log('asia-otsikko OK:', r9.newsAsia.startsWith('EUROOPPA'));
console.log('europe-otsikko OK:', r9.newsEurope.startsWith('HELSINKI JA SUOMI'));
console.log('TUORE-merkinta OK:', r9.newsEurope.includes('TUORE'));
console.log('VANHEMPI-merkinta OK:', r9.newsAsia.includes('VANHEMPI'));
console.log('tuorein ensin OK:', r9.newsAsia.indexOf('Asian markets rise') < r9.newsAsia.indexOf('Nvidia beats estimates'));
console.log('market data aikaleima OK:', r9.marketData.includes('klo 11:02'));
console.log('kurssireaktio OK:', r9.eventQuotes.includes('jälkimarkkina'));

const r14 = await s14.code({
  events_json: JSON.stringify([
    { name: 'Nvidian tulosjulkistus', symbols: 'NVDA', query: 'Nvidia Q3 earnings reaction' },
    { name: 'Anthropicin listautuminen', symbols: '', query: 'Anthropic IPO first day trading' }
  ])
});
console.log('\n=== step_14 ===');
console.log('q1:', r14.q1);
console.log('tickers:', r14.tickers);
const t = JSON.parse(r14.tickers);
console.log('vain NVDA hyvaksyttiin:', t.length === 1 && t[0].symbol === 'NVDA');

const r18 = await s18.code({ tickers: JSON.stringify([{ symbol: 'NVDA', label: 'Nvidia' }, { symbol: 'EI.OLE', label: 'Virheellinen' }]) });
console.log('\n=== step_18 (verkkokutsu) ===');
console.log(r18.eventQuotes);
console.log('NVDA-kurssi saatiin:', /NVDA.*\d/.test(r18.eventQuotes));
console.log('virheellinen tikkeri kasiteltiin:', r18.eventQuotes.includes('ei saatavilla') || r18.eventQuotes.includes('Virheellinen'));

for (const x of [s9, s14, s18]) { try { fs.unlinkSync(x.tmp); } catch (e) {} }
