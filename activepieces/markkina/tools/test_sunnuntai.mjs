import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const path = join(here, '..', 'Sunnuntai.json');
const raw = readFileSync(path, 'utf8');
const json = JSON.parse(raw.replace(/^\uFEFF/, ''));

const order = [];
const map = {};
let a = json.flows[0].trigger.nextAction;
while (a) { order.push(a.name); map[a.name] = a; a = a.nextAction; }

const sys = map.step_14.settings.input.body.data.messages[0].content;
const usr = map.step_14.settings.input.body.data.messages[1].content;
const ext6 = map.step_6.settings.input.body.data.messages[0].content;
const ext6u = map.step_6.settings.input.body.data.messages[1].content;
const c13 = map.step_13.settings.sourceCode.code;
const c17 = map.step_17.settings.sourceCode.code;

const checks = [
  ['nimi', json.name === 'Sunnuntai'],
  ['displayName', json.flows[0].displayName === 'Sunnuntai'],
  ['externalId', json.metadata.externalId === '6mF0HkP7AU5NIFE2FASfv'],
  ['trigger every_week', json.flows[0].trigger.settings.triggerName === 'every_week'],
  ['trigger day=0 (sunnuntai)', json.flows[0].trigger.settings.input.day_of_the_week === 0],
  ['trigger hour=8', json.flows[0].trigger.settings.input.hour_of_the_day === 8],
  ['trigger timezone', json.flows[0].trigger.settings.input.timezone === 'Europe/Helsinki'],
  ['17 askelta', order.length === 17],
  ['jarjestys step_1..step_10, step_17, step_11..step_16', order.join(',') === 'step_1,step_2,step_3,step_4,step_5,step_6,step_7,step_8,step_9,step_10,step_17,step_11,step_12,step_13,step_14,step_15,step_16'],

  ['otsikko sunnuntain viikkoennakko', sys.includes('sunnuntain viikkoennakko')],
  ['ei lauantain viikkokatsausta', !sys.includes('lauantain viikkokatsaus')],
  ['karki: Alkavan viikon tarkein ajuri', sys.includes('Alkavan viikon t\u00e4rkein ajuri ja maanantain avaus')],
  ['ei vanhaa Viikon tarkein markkina-ajuri', !sys.includes('Viikon t\u00e4rkein markkina-ajuri')],
  ['raportin luonne eteenpain', sys.includes('RAPORTIN LUONNE') && sys.includes('ETEENP\u00c4IN')],
  ['viikon rajaus ja paivamaaratarkistus', sys.includes('ALKAVAN VIIKON RAJAUS') && sys.includes('\u00c4l\u00e4 koskaan esit\u00e4 mennytt\u00e4 tapahtumaa tulevana')],
  ['rakenne a-h', sys.includes('a) Alkavan viikon t\u00e4rkein ajuri') && sys.includes('h) L\u00e4hteet')],
  ['Eurooppa-osion vaatimus', sys.includes('YHT\u00c4 HUOLELLINEN') && sys.includes('OMX Helsinki 25') && sys.includes('euroalueen')],

  ['spekulaatio pakollinen', sys.includes('SPEKULAATIO-OSIO (pakollinen)')],
  ['spekulaatio-laatikon tausta', sys.includes('background:#fffbeb') && sys.includes('border:2px dashed #f59e0b')],
  ['spekulaation varoitus', sys.includes('T\u00e4m\u00e4 osio on toimittajan spekulaatiota, ei sijoitusneuvontaa eik\u00e4 ennuste.')],
  ['kolme skenaariota', sys.includes('KOLME SKENAARIOTA') && sys.includes('perusskenaario') && sys.includes('myyntiaallon jatkuminen')],
  ['yllatyskortti', sys.includes('YLL\u00c4TYSKORTTI')],
  ['seurattavat kohteet', sys.includes('SEURATTAVAT KOHTEET')],

  ['lahtotaso-saanto', sys.includes('L\u00c4HT\u00d6TILANNE JA KURSSILUVUT') && sys.includes('viikon takaa')],
  ['tulevat tapahtumat -saanto', sys.includes('TULEVAN VIIKON TAPAHTUMAT JA ENNAKKO-ODOTUKSET') && sys.includes('konsensus')],
  ['linkit ja lahteet', sys.includes('LINKIT JA L\u00c4HTEET') && sys.includes('Yahoo Finance -kurssisivulle') && sys.includes('L\u00e4hteet')],
  ['ei vuotoja -saanto', sys.includes('EI VUOTOJA')],
  ['vastauksen muoto -saanto', sys.includes('VASTAUKSEN MUOTO')],

  ['user otsikko globaalit', usr.includes('GLOBAALIT MARKKINAT JA ALKAVAN VIIKON N\u00c4KYM\u00c4')],
  ['user otsikko eurooppa', usr.includes('EUROOPPA JA HELSINKI \u2013 ALKAVAN VIIKON N\u00c4KYM\u00c4')],
  ['user viikon rajaus', usr.includes('ALKAVAN VIIKON RAJAUS')],
  ['user viikonlopun uutiset', usr.includes("{{step_4['output']['answer']}}")],
  ['user lahtotaulukko', usr.includes("{{step_17['output']['weeklyTable']}}") && usr.includes("{{step_17['output']['weeklyData']}}")],
  ['user kokotekstit', usr.includes("{{step_12['output']['scrapedNews']}}")],
  ['user ei vanhaa otsikkoa', !usr.includes('KULUNUT VIIKKO JA GLOBAALIT MARKKINAT')],

  ['step_6 hakee tulevaa viikkoa', ext6.includes('TULEVAN VIIKON tapahtumaa')],
  ['step_6 query etsii ennakkoa', ext6.includes('ENNAKKO-ODOTUKSET ja konsensus')],
  ['step_6 user tulevat tapahtumat', ext6u.includes('ALKAVAN VIIKON TAPAHTUMAT JA ODOTUKSET')],
  ['step_7 varahaut eteenpain', map.step_7.settings.sourceCode.code.includes('stock market week ahead outlook key events to watch')],

  ['step_2 hakee week ahead', map.step_2.settings.input.query.includes('week ahead outlook')],
  ['step_3 hakee Eurooppaa', map.step_3.settings.input.query.includes('European') && map.step_3.settings.input.query.includes('week ahead')],
  ['step_4 hakee viikonloppua', map.step_4.settings.input.query.includes('weekend') && map.step_4.settings.input.days === '2'],
  ['step_5 hakee ensi viikkoa', map.step_5.settings.input.query.includes('next week')],
  ['step_8/9/10 time_range week', map.step_8.settings.input.time_range === 'week' && map.step_9.settings.input.time_range === 'week' && map.step_10.settings.input.time_range === 'week'],
  ['step_8/9/10 nimet', map.step_8.displayName === 'Search event 1 outlook' && map.step_10.displayName === 'Search event 3 outlook'],
  ['step_16 polku viikkoennakko', map.step_16.settings.input.url.url.includes('-viikkoennakko.html')],
  ['step_16 ei viikkokatsausta', !map.step_16.settings.input.url.url.includes('viikkokatsaus')],
  ['step_16 viesti', map.step_16.settings.input.body.data.message === 'Lis\u00e4tty sunnuntain viikkoennakko'],

  ['step_11 firecrawl search_web', map.step_11.settings.pieceName === '@activepieces/piece-firecrawl' && map.step_11.settings.actionName === 'search_web'],
  ['step_11 yhteys', map.step_11.settings.input.auth === "{{connections['Vdq5bftNVGbQ5xa1hEqxM']}}"],
  ['step_11 includePageContent', map.step_11.settings.input.includePageContent === true],
  ['step_11 timeFilter qdr:w', map.step_11.settings.input.timeFilter === 'qdr:w'],
  ['step_11 limit 5', map.step_11.settings.input.limit === 5],
  ['step_11 continueOnFailure', map.step_11.settings.errorHandlingOptions.continueOnFailure.value === true],
  ['step_11 hakee week ahead', map.step_11.settings.input.query.includes('week ahead')],
  ['step_12 syote', map.step_12.settings.input.scraped === "{{step_11['output']}}"],
  ['step_12 lukee Firecrawlin datan', map.step_12.settings.sourceCode.code.includes('root.data')],
  ['step_12 siivoaa navigaation', map.step_12.settings.sourceCode.code.includes('skip to')],
  ['step_12 sailyttaa artikkelin URLin', map.step_12.settings.sourceCode.code.includes("(url ? ' (' + url + ')' : '')")],

  ['step_13 label_asia', map.step_13.settings.input.label_asia === 'GLOBAALIT MARKKINAT JA ALKAVAN VIIKON N\u00c4KYM\u00c4'],
  ['step_13 label_europe', map.step_13.settings.input.label_europe === 'EUROOPPA JA HELSINKI \u2013 ALKAVAN VIIKON N\u00c4KYM\u00c4'],
  ['step_13 sailyttaa lahteiden URLit', c13.includes("(url ? ' (' + url + ')' : '')")],
  ['step_13 watchlist eteenpain', c13.includes('ALKAVAN VIIKON TAPAHTUMAT JA ENNAKKO-ODOTUKSET')],
  ['step_13 renderResults', c13.includes('renderResults') && c13.includes("return 'ei tuloksia'")],
  ['step_13 ei hautulos-sanaa', !c13.includes('hautulos')],

  ['step_17 on kurssit', c17.includes('weeklyTable') && c17.includes('weeklyData')],
  ['step_17 viikon vertailu', c17.includes('const WEEK = 7 * 86400') && c17.includes('last.at - WEEK')],
  ['step_17 kuvateksti lahtotaso', c17.includes('L\u00e4ht\u00f6tilanne alkavalle viikolle')],
  ['step_17 19 kohdetta', (c17.match(/ticker: '/g) || []).length === 19],
  ['step_17 linkit ja varit', c17.includes("['finance', 'yahoo', 'com'].join('.')") && c17.includes('#1a7f37') && c17.includes('#c62828')],

  ['step_14 max_tokens 32000', map.step_14.settings.input.body.data.max_tokens === 32000],
  ['step_14 reasoning_effort low', map.step_14.settings.input.body.data.reasoning_effort === 'low'],
  ['step_15 katkeamistarkistus', map.step_15.settings.sourceCode.code.includes('katkesi kesken')],
  ['jarjestys step_10 -> step_17 -> step_11', map.step_10.nextAction.name === 'step_17' && map.step_17.nextAction.name === 'step_11'],
  ['jarjestys step_17 -> step_11 -> step_12 -> step_13', map.step_11.nextAction.name === 'step_12' && map.step_12.nextAction.name === 'step_13'],
];

let pass = 0, fail = 0;
for (const [name, ok] of checks) {
  console.log((ok ? 'PASS  ' : 'FAIL  ') + name);
  if (ok) { pass++; } else { fail++; }
}
console.log(`\n${pass}/${checks.length} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
