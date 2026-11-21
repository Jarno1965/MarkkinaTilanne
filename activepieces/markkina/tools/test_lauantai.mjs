import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const path = join(here, '..', 'Lauantai.json');
const raw = readFileSync(path, 'utf8');
const json = JSON.parse(raw.replace(/^\uFEFF/, ''));

const order = [];
const map = {};
let a = json.flows[0].trigger.nextAction;
while (a) { order.push(a.name); map[a.name] = a; a = a.nextAction; }

const sys = map.step_14.settings.input.body.data.messages[0].content;
const usr = map.step_14.settings.input.body.data.messages[1].content;

const checks = [
  ['nimi', json.name === 'Lauantai'],
  ['trigger every_week', json.flows[0].trigger.settings.triggerName === 'every_week'],
  ['trigger day=6 (lauantai)', json.flows[0].trigger.settings.input.day_of_the_week === 6],
  ['trigger hour=9', json.flows[0].trigger.settings.input.hour_of_the_day === 9],
  ['trigger timezone', json.flows[0].trigger.settings.input.timezone === 'Europe/Helsinki'],
  ['17 askelta', order.length === 17],
  ['jarjestys: step_1..step_10, step_17, step_11..step_16', order.join(',') === 'step_1,step_2,step_3,step_4,step_5,step_6,step_7,step_8,step_9,step_10,step_17,step_11,step_12,step_13,step_14,step_15,step_16'],
  ['otsikko lauantain viikkokatsaus', sys.includes('lauantain viikkokatsaus')],
  ['karki: Viikon tarkein markkina-ajuri', sys.includes('Viikon t\u00e4rkein markkina-ajuri')],
  ['ei vanhaa Maanantain avauksen', !sys.includes('Maanantain avauksen')],
  ['jasentely uusi', sys.includes('viikon merkitt\u00e4vimm\u00e4t tapahtumat ja markkina-ajurit')],
  ['artikkelien kokotekstit mainittu', sys.includes('artikkelien kokoteksteiss\u00e4')],
  ['user otsikko uusi (Eurooppa)', usr.includes('EUROOPPA, VIIKON MARKKINA-AJURIT JA TULEVA VIIKKO')],
  ['user ei vanhaa otsikkoa', !usr.includes('TULEVA VIIKKO: TALOUSKALENTERI')],
  ['user step_12 viittaus', usr.includes("{{step_12['output']['scrapedNews']}}")],
  ['step_16 polku viikkokatsaus', map.step_16.settings.input.url.url.includes('-viikkokatsaus.html')],
  ['step_16 viesti', map.step_16.settings.input.body.data.message === 'Lis\u00e4tty lauantain viikkokatsaus'],
  ['step_11 firecrawl search_web', map.step_11.settings.pieceName === '@activepieces/piece-firecrawl' && map.step_11.settings.actionName === 'search_web'],
  ['step_11 yhteys', map.step_11.settings.input.auth === "{{connections['Vdq5bftNVGbQ5xa1hEqxM']}}"],
  ['step_11 includePageContent', map.step_11.settings.input.includePageContent === true],
  ['step_11 timeFilter qdr:w', map.step_11.settings.input.timeFilter === 'qdr:w'],
  ['step_11 limit 5', map.step_11.settings.input.limit === 5],
  ['step_11 continueOnFailure', map.step_11.settings.errorHandlingOptions.continueOnFailure.value === true],
  ['step_12 syote', map.step_12.settings.input.scraped === "{{step_11['output']}}"],
  ['step_12 koodi tuottaa scrapedNews', map.step_12.settings.sourceCode.code.includes('scrapedNews')],
  ['jarjestys step_17 -> step_11 -> step_12 -> step_13', map.step_17.nextAction.name === 'step_11' && map.step_11.nextAction.name === 'step_12' && map.step_12.nextAction.name === 'step_13'],
  ['step_13 label_asia', map.step_13.settings.input.label_asia === 'KULUNUT VIIKKO JA GLOBAALIT MARKKINAT'],
  ['step_13 label_europe', map.step_13.settings.input.label_europe === 'EUROOPPA, VIIKON MARKKINA-AJURIT JA TULEVA VIIKKO'],
  ['step_2 time_range week', map.step_2.settings.input.time_range === 'week'],
  ['step_3 hakee Eurooppaa', map.step_3.settings.input.query.includes('European')],
  ['step_11 hakee Eurooppaa', map.step_11.settings.input.query.includes('European')],
  ['step_14 max_tokens 32000', map.step_14.settings.input.body.data.max_tokens === 32000],
  ['step_14 reasoning_effort low', map.step_14.settings.input.body.data.reasoning_effort === 'low'],
  ['step_14 vaatii Eurooppa-osion', sys.includes('YHT\u00c4 HUOLELLINEN') && sys.includes('OMX Helsinki 25') && sys.includes('euroalueen')],
  ['step_15 katkeamistarkistus', map.step_15.settings.sourceCode.code.includes('katkesi kesken')],
  ['step_12 lukee Firecrawlin datan', map.step_12.settings.sourceCode.code.includes('root.data')],
  ['step_12 siivoaa navigaation', map.step_12.settings.sourceCode.code.includes('skip to')],
  ['step_17 on viikkokurssit', map.step_17 && map.step_17.settings.sourceCode.code.includes('weeklyTable')],
  ['step_10 -> step_17 -> step_11', map.step_10.nextAction.name === 'step_17' && map.step_17.nextAction.name === 'step_11'],
  ['step_14 sys viikkolukusaanto', sys.includes('VIIKON MARKKINALUVUT') && sys.includes('punaisella') && sys.includes('vihre')],
  ['step_14 sys lahteet ja linkit', sys.includes('LINKIT JA L\u00c4HTEET') && sys.includes('Yahoo Finance -kurssisivulle') && sys.includes('L\u00e4hteet')],
  ['step_13 sailyttaa lahteiden URLit', map.step_13.settings.sourceCode.code.includes("(url ? ' (' + url + ')' : '')")],
  ['step_13 renderResults (ei [object Object])', map.step_13.settings.sourceCode.code.includes('renderResults') && map.step_13.settings.sourceCode.code.includes("return 'ei tuloksia'")],
  ['step_12 sailyttaa artikkelin URLin', map.step_12.settings.sourceCode.code.includes("(url ? ' (' + url + ')' : '')")],
  ['step_14 user viikkotaulukko', usr.includes("{{step_17['output']['weeklyTable']}}") && usr.includes("{{step_17['output']['weeklyData']}}")],
  ['externalId', json.metadata.externalId === 'd7K78m0VXNgIYpZrQtu8Q'],
];

let pass = 0, fail = 0;
for (const [name, ok] of checks) {
  console.log((ok ? 'PASS  ' : 'FAIL  ') + name);
  if (ok) { pass++; } else { fail++; }
}
console.log(`\n${pass}/${checks.length} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
