// Yksikkötesti molempien viikonlopputyönkulkujen tiivistyskoodille:
//   tools/step13_compact.js            (Lauantai, taaksepäin katsova sanamuoto)
//   tools/step13_compact_sunnuntai.js  (Sunnuntai, eteenpäin katsova sanamuoto)
//
// Varmistaa erityisesti, että tapahtumahakujen tulokset (valmis lista objekteja tai
// JSON-merkkijono) muuttuvat luettavaksi tekstiksi eivätkä [object Object] -roskaksi.
//
//   node test_step13_compact.mjs
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const CASES = [
  {
    file: 'step13_compact.js',
    nimi: 'Lauantai',
    watchHeader: 'ODOTETUT TAPAHTUMAT JA NIIDEN TULOKSET',
    eventLabel: 'hautulos',
    labelAsia: 'KULUNUT VIIKKO JA GLOBAALIT MARKKINAT',
    labelEurope: 'EUROOPPA, VIIKON MARKKINA-AJURIT JA TULEVA VIIKKO'
  },
  {
    file: 'step13_compact_sunnuntai.js',
    nimi: 'Sunnuntai',
    watchHeader: 'ALKAVAN VIIKON TAPAHTUMAT JA ENNAKKO-ODOTUKSET',
    eventLabel: 'ennakkotiedot ja odotukset',
    labelAsia: 'GLOBAALIT MARKKINAT JA ALKAVAN VIIKON NÄKYMÄ',
    labelEurope: 'EUROOPPA JA HELSINKI – ALKAVAN VIIKON NÄKYMÄ'
  }
];

let pass = 0, fail = 0;
function check(name, ok, extra) {
  if (ok) { pass++; console.log('OK   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra ? '  -> ' + extra : '')); }
}

for (const c of CASES) {
  console.log('\n=== ' + c.nimi + ' (' + c.file + ') ===');

  const dir = mkdtempSync(join(tmpdir(), 'step13-'));
  const tmp = join(dir, 'step13.mjs');
  copyFileSync(join(here, c.file), tmp);
  const { code } = await import('file:///' + tmp.replace(/\\/g, '/'));
  rmSync(dir, { recursive: true, force: true });

  // Tapaus 1: tapahtumahaut palauttavat valmiin listan objekteja (Activepiecesin array-viittaus).
  const out1 = await code({
    fresh_hours: 3,
    label_asia: c.labelAsia,
    label_europe: c.labelEurope,
    step_7_answer: 'Tiivistelmä globaalista näkymästä.',
    step_7_results: [{ title: 'Fed preview', url: 'https://example.com/fed', content: 'Markkina odottaa...', published_date: 'Fri, 20 Nov 2026 10:00:00 GMT' }],
    step_8_answer: 'Tiivistelmä Euroopasta.',
    step_8_results: JSON.stringify([{ title: 'ECB preview', url: 'https://example.com/ecb', content: 'EKP:n viestintä...', published_date: 'Sat, 21 Nov 2026 08:00:00 GMT' }]),
    step_15_answer: 'PMI-luvut maanantaina.',
    step_15_results: [{ title: 'Flash PMI', url: 'https://example.com/pmi', content: 'Odotukset...' }],
    step_16_answer: 'Kiitospäivä torstaina.',
    step_16_results: [],
    step_17_answer: null,
    step_17_results: 'raakateksti',
    watchlist: '- Saksan flash-PMI (ajankohta: ma 23.11.) : viikon tärkein makroluku'
  });

  // Tapaus 2: kaikki kentät puuttuvat.
  const out2 = await code({});

  const ev = 'TAPAHTUMA 1 - ' + c.eventLabel + ': ';
  const ev2 = 'TAPAHTUMA 2 - ' + c.eventLabel + ': ';
  const ev3 = 'TAPAHTUMA 3 - ' + c.eventLabel + ': ';

  check(c.nimi + ': watchlist-otsikko', out1.watchlist.includes(c.watchHeader));
  check(c.nimi + ': ei [object Object]', !out1.watchlist.includes('[object Object]'));
  check(c.nimi + ': lista -> luettava rivi',
    out1.watchlist.includes(ev + 'PMI-luvut maanantaina.  ;;  - Flash PMI [example.com] (https://example.com/pmi) : Odotukset...'));
  check(c.nimi + ': tyhja lista -> ei tuloksia',
    out1.watchlist.includes(ev2 + 'Kiitospäivä torstaina.  ;;  ei tuloksia'));
  check(c.nimi + ': null-vastaus -> ei tiivistelmaa',
    out1.watchlist.includes(ev3 + 'ei tiivistelmaa'));
  check(c.nimi + ': merkkijono sailyy', out1.watchlist.includes('raakateksti'));
  check(c.nimi + ': newsAsia sisaltaa lahteen URLin', out1.newsAsia.includes('(https://example.com/fed)'));
  check(c.nimi + ': newsEurope purkaa JSON-merkkijonon', out1.newsEurope.includes('(https://example.com/ecb)'));
  check(c.nimi + ': newsAsia label', out1.newsAsia.startsWith(c.labelAsia + ' - tiivistelma:'));
  check(c.nimi + ': tyhja syote ei kaadu',
    typeof out2.watchlist === 'string' && out2.watchlist.includes('seurantalista'));
  check(c.nimi + ': tyhja syote -> newsAsia', out2.newsAsia.includes('ei uutisia'));

  if (fail && out1.watchlist.includes('[object Object]')) {
    console.log('  watchlist: ' + out1.watchlist.slice(0, 600));
  }
}

console.log('\n' + pass + '/' + (pass + fail) + ' OK, ' + fail + ' FAIL');
process.exit(fail ? 1 : 0);
