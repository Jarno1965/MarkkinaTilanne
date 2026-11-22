// Yksikkötesti "Puola puhuu" -työnkulun dynaamisille koodiaskeleille:
//   puola_step6_discovery.js  kartoituksen tiivistys
//   puola_step8_queries.js    aiheidenpoimijan JSON -> teemat ja täsmähaut
//   puola_step14_compact.js   aineiston yhdistäminen + tuoreussuodatus
//   puola_step15_guard.js     laadunvartija
//   puola_step17_markdown.js  Markdown -> HTML + Base64
//
//   node test_puola_dynamic.mjs
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const load = async (file) => {
  const dir = mkdtempSync(join(tmpdir(), 'puola-'));
  const tmp = join(dir, 'step.mjs');
  copyFileSync(join(here, file), tmp);
  const mod = await import('file:///' + tmp.replace(/\\/g, '/'));
  rmSync(dir, { recursive: true, force: true });
  return mod.code;
};

let pass = 0;
let fail = 0;
const check = (name, ok, extra) => {
  if (ok) { pass++; console.log('OK   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra ? '  -> ' + extra : '')); }
};

const now = new Date();
const daysAgo = (n) => new Date(now.getTime() - n * 86400000).toUTCString();
const throws = async (fn) => {
  try { await fn(); return false; } catch (e) { return true; }
};

// --- step_6: kartoituksen tiivistys -----------------------------------------
const step6 = await load('puola_step6_discovery.js');
const out6 = await step6({
  s1: {
    results: [
      { title: 'Kredyt 0% -kiista', url: 'https://www.money.pl/a?utm_source=x', content: 'Rządowy program...', published_date: daysAgo(2) },
      { title: 'Wideo o Kredyt 0%', url: 'https://www.youtube.com/watch?v=1', content: 'film' },
      { title: 'Sama juttu ilman parametria', url: 'https://www.money.pl/a', content: 'duplikaatti' }
    ]
  },
  s2: { results: [] },
  fc1: { data: { web: [{ title: 'Wykop: Kredyt 0%', url: 'https://www.wykop.pl/link/1', markdown: 'Długa dyskusja o Kredyt 0% '.repeat(12), date: daysAgo(1) }] } },
  now: '2026-11-22 17:50:05',
  start_date: '2026-10-23'
});
check('step_6: duplikaatit ja YouTube pois', out6.itemCount === 2, 'itemCount=' + out6.itemCount);
check('step_6: kaksi domainia', out6.domainCount === 2, 'domainCount=' + out6.domainCount);
check('step_6: teksti sisältää uutisen', out6.discoveryText.includes('money.pl'));
check('step_6: ei youtubea', !out6.discoveryText.includes('youtube.com'));
check('step_6: aikaväli', out6.period === '2026-10-23 - 2026-11-22 17:50:05', out6.period);

// --- step_8: JSON -> teemat ja haut ----------------------------------------
const step8 = await load('puola_step8_queries.js');
const llmJson = '```json\n' + JSON.stringify({
  themes: [
    { title_fi: 'Kredyt 0% -kiista', why_fi: 'Hallituksen ohjelma puhuttaa.', keywords_pl: ['Kredyt 0%', 'nieruchomości'], channels_fi: 'uutisportaalit' },
    { title_fi: 'Trybunał Konstytucyjny', why_fi: 'Perustuslaillinen kriisi.', keywords_pl: ['Trybunał Konstytucyjny'] },
    { title_fi: 'Viljantuonti', why_fi: 'Rajakiistat.', keywords_pl: ['zboże'] }
  ],
  queries: [{ query: 'Kredyt 0% ceny mieszkań' }, { query: 'Trybunał Konstytucyjny kryzys' }, { query: 'protesty rolników zboże' }, { query: 'ylimääräinen' }],
  urls: ['https://www.money.pl/a', 'https://www.money.pl/a', 'ei-urli', 'https://www.rp.pl/b']
}).trim() + '\n```';
const out8 = await step8({ llm: { choices: [{ message: { content: llmJson } }] } });
check('step_8: JSON tunnistettu', out8.parseOk === true);
check('step_8: kolme teemaa', out8.themeCount === 3, 'themeCount=' + out8.themeCount);
check('step_8: vain kolme hakua', [out8.query_1, out8.query_2, out8.query_3].join('|').split('|').length === 3);
check('step_8: urlit deduplikoitu ja validoidut', out8.urls.length === 2, JSON.stringify(out8.urls));
check('step_8: socialQuery sisältää avainsanan', out8.socialQuery.includes('Kredyt'));

const out8b = await step8({ llm: 'En valitettavasti voi palauttaa JSONia.' });
check('step_8: varahaut kun JSON puuttuu', out8b.parseOk === false && out8b.query_1.length > 10);
check('step_8: varoitus raportoitu', out8b.warnings.length > 0);

// --- step_14: yhdistäminen ja tuoreussuodatus ------------------------------
const step14 = await load('puola_step14_compact.js');
const out14 = await step14({
  themes_text: '1. Kredyt 0% -kiista — hallituksen ohjelma',
  d1: {
    answer: 'Kuukauden aikana keskusteltiin asuntolainoista.',
    results: [
      { title: 'Kredyt 0% etenee', url: 'https://www.money.pl/a', content: 'Sejm hyväksyi...', published_date: daysAgo(3) },
      { title: 'Vanha juttu', url: 'https://www.rp.pl/old', content: 'Vuoden takainen', published_date: daysAgo(60) }
    ]
  },
  d2: { results: [] },
  d3: { results: [] },
  ex: { results: [{ url: 'https://www.rp.pl/b', title: 'Analiza', raw_content: 'Trybunał Konstytucyjny...' }] },
  fc1: { data: { web: [{ title: 'Wykop-ketju', url: 'https://www.wykop.pl/link/1', markdown: 'Długa dyskusja '.repeat(20), date: daysAgo(1) }] } },
  fc2: { data: { web: [] } },
  now: '2026-11-22 17:50:05',
  start_date: '2026-10-23',
  theme_count: 1
});
check('step_14: vanha artikkeli pudotettu', out14.blocks.uutiset.includes('pudotettu 1'), out14.blocks.uutiset.slice(0, 80));
check('step_14: tuore artikkeli mukana', out14.blocks.uutiset.includes('money.pl/a'));
check('step_14: lähderekisteri koottu', out14.sourceCount >= 3, 'sourceCount=' + out14.sourceCount);
check('step_14: sourcesText numeroitu', out14.sourcesText.startsWith('1. '), out14.sourcesText.slice(0, 60));
check('step_14: artikkelit-lohko täytetty', !out14.blocks.artikkelit.includes('ei saatavilla'));
check('step_14: teemalohko mukana', out14.blocks.teemat.includes('Kredyt 0%'));
check('step_14: ei [object Object]', !JSON.stringify(out14.blocks).includes('[object Object]'));

// --- step_15: laadunvartija ------------------------------------------------
const step15 = await load('puola_step15_guard.js');
const good = await step15({ sourceCount: 12, domainCount: 8, themeCount: 5, nonEmptyBlocks: 4, totalChars: 20000, warnings: [] });
check('step_15: hyvä aineisto läpäisee', good.ok === true);
check('step_15: ohut aineisto hylätään', await throws(() => step15({
  sourceCount: 3, domainCount: 2, themeCount: 1, nonEmptyBlocks: 1, totalChars: 900, warnings: ['ohut']
})));

// --- step_17: Markdown -> HTML ---------------------------------------------
const step17 = await load('puola_step17_markdown.js');
const md = [
  '## Kuukauden polttavimmat puheenaiheet',
  '',
  '**Kredyt 0% -kiista** jatkui koko kuukauden. Lue lisää [täältä](https://www.money.pl/a).',
  '',
  '## Trybunał Konstytucyjny ja perustuslaillinen kriisi',
  '',
  'Trybunał ajautui avoimeen konfliktiin. Luvut: 3-2.',
  '',
  'Poliisi sulki rakennuksen sisäänkäynnin ja mielenosoittajat kerääntyivät portille. Oppositio kutsui tapahtumaa vallankaappaukseksi, hallitus puolestaan puolusti toimia laillisena.',
  '',
  '- ensimmäinen kohta',
  '- toinen kohta',
  '',
  '## Kansalaisten ääni: mitä palstoilla ja somessa sanotaan',
  '',
  'Wykopissa keskustelu kiihtyi yöhön asti. Käyttäjät jakoivat kuvia ja videoita paikan päältä ja vertasivat tapahtumia vuoden 2015 kriisiin. Redditin r/Polska -kanavalla sävy oli analyyttisempi.',
  '',
  '## Lähteet',
  '',
  '1. Kredyt 0% etenee — Sejm hyväksyi (money.pl, 19.11.2026) https://www.money.pl/a'
].join('\n');
const out17 = await step17({
  md: { choices: [{ message: { content: md } }] },
  date: '2026-11-22 17:50:05',
  period: '2026-10-23 - 2026-11-22 17:50:05',
  sources: [{ title: 'Kredyt 0% etenee', url: 'https://www.money.pl/a', domain: 'money.pl', date: '19.11.2026' }],
  sourceCount: 1,
  domainCount: 1
});
const html = Buffer.from(out17.base64, 'base64').toString('utf-8');
check('step_17: dynaaminen otsikko säilyy', html.includes('<h2>Trybunał Konstytucyjny ja perustuslaillinen kriisi</h2>'));
check('step_17: linkki muodostuu', html.includes('<a href="https://www.money.pl/a"'));
check('step_17: lihavointi muodostuu', html.includes('<strong>Kredyt 0% -kiista</strong>'));
check('step_17: lista muodostuu', html.includes('<ul>') && html.includes('<li>toinen kohta</li>'));
check('step_17: ei tuplalähdeluetteloa', !html.includes('Käytetyt lähteet'));
check('step_17: dokumentti ehjä', html.trimEnd().endsWith('</html>') && !html.includes('<script'));
check('step_17: aikaleima tiedostonimeen', out17.timestamp === '2026-11-22-1750', out17.timestamp);
check('step_17: liian lyhyt hylätään', await throws(() => step17({ md: 'lyhyt', date: '2026-11-22 17:50:05' })));

console.log('\n' + pass + '/' + (pass + fail) + ' OK');
if (fail > 0) process.exit(1);

