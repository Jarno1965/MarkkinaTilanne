// Väliaikainen testiskripti: ajaa docs/app.js:n stubatussa ympäristössä.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const docsDir = path.join(root, 'docs');

let pass = 0;
let fail = 0;
function check(name, ok, extra) {
  if (ok) { pass++; console.log('OK   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra ? '  -> ' + extra : '')); }
}

function makeEl(id) {
  const el = {
    id,
    innerHTML: '',
    className: '',
    hidden: false,
    disabled: false,
    srcdoc: '',
    attrs: {},
    children: [],
    appendChild(c) { el.children.push(c); return c; },
    setAttribute(k, v) { el.attrs[k] = String(v); },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(el.attrs, k) ? el.attrs[k] : null; },
    addEventListener() {},
    classList: { add() {}, remove() {}, contains() { return false; } },
    closest() { return null; },
    focus() {},
    contentWindow: { focus() {}, print() {} }
  };
  Object.defineProperty(el, 'textContent', {
    get() { return el._text || ''; },
    set(v) { el._text = String(v); if (v === '') el.children = []; }
  });
  return el;
}

const elements = {};
const documentStub = {
  title: '',
  body: { classList: { add() {}, remove() {}, contains() { return false; } } },
  handlers: {},
  getElementById(id) {
    if (!elements[id]) elements[id] = makeEl(id);
    return elements[id];
  },
  createElement(tag) { return makeEl('<' + tag + '>'); },
  addEventListener(type, fn) { documentStub.handlers[type] = fn; }
};

const storage = new Map();
const sessionStorageStub = {
  getItem: k => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: k => storage.delete(k)
};

const urls = [];
const fileFor = url => {
  if (url === 'feeds.json') return path.join(docsDir, 'feeds.json');
  if (url.startsWith('../')) return path.resolve(docsDir, url);
  return null;
};

function response(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(JSON.parse(body)),
    text: () => Promise.resolve(body)
  };
}

const fetchStub = url => {
  urls.push(String(url));
  const file = fileFor(url);
  if (file && fs.existsSync(file)) return Promise.resolve(response(fs.readFileSync(file, 'utf8')));
  if (String(url).startsWith('https://api.github.com/')) return Promise.resolve(response('[]'));
  return Promise.resolve(response('', 404));
};

const location = { hostname: 'localhost', pathname: '/docs/', protocol: 'http:', hash: '' };
const windowStub = { location, addEventListener() {}, open() {} };

const sandbox = {
  console,
  fetch: fetchStub,
  document: documentStub,
  window: windowStub,
  history: { replaceState(a, b, url) { location.hash = url; } },
  sessionStorage: sessionStorageStub,
  URL: { createObjectURL: () => 'blob:fake', revokeObjectURL() {} },
  Blob: class { constructor(parts) { this.parts = parts; } },
  setTimeout,
  Intl
};
sandbox.globalThis = sandbox;

const code = fs.readFileSync(path.join(docsDir, 'app.js'), 'utf8');
vm.createContext(sandbox);
vm.runInContext(code, sandbox);


await sandbox.start();

check('feeds.json luetaan', urls.includes('feeds.json'), urls.join(' | '));
check('kaksi syötettä rekisteristä', sandbox.state.feeds.length === 2, String(sandbox.state.feeds.length));
check('oletussyöte markkina', sandbox.state.activeFeed === 'markkina', sandbox.state.activeFeed);
check('paikallinen manifesti valittu', urls.includes('../data/markkina/index.json'), urls.join(' | '));
// Odotettu sisältö luetaan data/markkina/index.json-tiedostosta, jotta testi ei
// riipu yksittäisistä raporteista (raportteja tulee ja poistetaan jatkuvasti).
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data', 'markkina', 'index.json'), 'utf8'));
const expectedFiles = manifest.files.slice().sort().reverse();
const newest = expectedFiles[0];

check('raportit luettu manifestista', sandbox.state.reports.length === expectedFiles.length,
  sandbox.state.reports.length + ' / ' + expectedFiles.length);
check('manifestin tiedostot löytyvät levyltä',
  expectedFiles.every(f => fs.existsSync(path.join(root, 'data', 'markkina', f))));
check('uusin ensin', sandbox.state.reports[0].file === newest,
  sandbox.state.reports[0] && sandbox.state.reports[0].file);
check('uusin valittu', sandbox.state.selectedId === newest, sandbox.state.selectedId);
check('hash sisältää syötteen', location.hash === '#markkina/' + newest, location.hash);
check('raportin runko haettu', urls.includes('../data/markkina/' + newest));

// Raportin runko haetaan erikseen, joten odotetaan hetki ennen sen tarkistusta.
await new Promise(resolve => setTimeout(resolve, 50));

check('iframe ei piilossa', elements['report-frame'].hidden === false);
check('srcdoc sisältää raportin', /<html/i.test(elements['report-frame'].srcdoc));
check('srcdoc kieli fi', /lang="fi"/i.test(elements['report-frame'].srcdoc));
// Tarkistus poistettu: valikko ei ole piilossa kahdella syötteellä
check('raportin otsikko asetettu', elements['report-title'].textContent.length > 0,
  elements['report-title'].textContent);
check('aikaleima päivitetty', /Lista päivitetty klo/.test(elements['last-updated'].textContent),
  elements['last-updated'].textContent);

// Yksinkertainen valikko: syoterekisteri on tyhja (groups: []), joten applyFeeds
// kayttaa kovakoodattuja oletussyotteita markkina ja media. Vanha dynaaminen
// feed-list-valikko on poistettu, joten renderFeeds ei enaa rakenna sita.
sandbox.applyFeeds([], 'markkina');
check('kaksi oletussyotetta', sandbox.state.feeds.length === 2,
  String(sandbox.state.feeds.length));
check('oletussyote markkina sailyy', sandbox.state.defaultFeed === 'markkina', sandbox.state.defaultFeed);

// Viikonloppuslugit saavat oman nimen ja kuvakkeen.
const slotWk = sandbox.slotInfo('viikkokatsaus');
const slotWe = sandbox.slotInfo('viikkoennakko');
check('viikkokatsaus-nimike', slotWk.label === 'Viikkokatsaus' && slotWk.icon === '📅', JSON.stringify(slotWk));
check('viikkoennakko-nimike', slotWe.label === 'Viikkoennakko' && slotWe.icon === '🔮', JSON.stringify(slotWe));
check('tuntematon slug muotoillaan', sandbox.slotInfo('joku-uusi').label === 'Joku uusi',
  sandbox.slotInfo('joku-uusi').label);

// Paikallinen kehitys lukee juuren data/-kansiota (../data) eika vanhentunutta
// docs/data-kopiota. Tuotannossa kaytetaan aina GitHubin download_url-osoitetta.
check('paikallinen raporttipolku ../data',
  sandbox.reportSourceUrl({ file: 'x.html', downloadUrl: null }) === '../data/markkina/x.html',
  sandbox.reportSourceUrl({ file: 'x.html', downloadUrl: null }));
check('download_url voittaa paikallisen polun',
  sandbox.reportSourceUrl({ file: 'x.html', downloadUrl: 'https://example.com/x.html' }) === 'https://example.com/x.html');

// Yksinkertainen valikko on index.html:ssa (kaksi paakategoriaa).
const indexHtml = fs.readFileSync(path.join(docsDir, 'index.html'), 'utf8');
check('valikossa markkina-nappi', indexHtml.includes('id="markkina-btn"'));
check('valikossa media-nappi', indexHtml.includes('id="media-btn"'));

// VALIMUISTIPOLKU (sivun uudelleenlataus): toinen haku luetaan sessionStorage-
// valimuistista, jossa Date-oliot ovat muuttuneet merkkijonoiksi, koska
// JSON.stringify ei sailyta tyyppia. Tama kaatoi aiemmin sivun virheeseen
// "date.getTime is not a function" ja naytti "Raporttilistaa ei voitu hakea".
elements['viewer-placeholder'].innerHTML = '';
elements['list-status'].textContent = '';
sandbox.state.selectedId = null;
await sandbox.selectFeed('markkina', { force: false });

const cachedReports = sandbox.state.reports;
check('valimuistista luettu lista', cachedReports.length > 0, String(cachedReports.length));
check('valimuistin date kelpaa Date-oliona',
  cachedReports.length > 0 && typeof cachedReports[0].date.getTime === 'function',
  cachedReports.length ? Object.prototype.toString.call(cachedReports[0].date) : '(tyhja)');
check('raportti valittiin valimuistista', !!sandbox.state.selectedId, String(sandbox.state.selectedId));

let fmtResult = '';
let fmtError = '';
try {
  fmtResult = sandbox.formatDateLong(cachedReports[0].date);
} catch (e) {
  fmtError = e.message;
}
check('formatDateLong toimii valimuistin datalla',
  fmtError === '' && fmtResult !== 'Virheellinen päivämäärä', fmtError || fmtResult);
let fmtStrResult = '';
let fmtStrError = '';
try {
  fmtStrResult = sandbox.formatDateLong(String(cachedReports[0].date));
} catch (e) {
  fmtStrError = e.message;
}
check('formatDateLong sietaa myos merkkijonon',
  fmtStrError === '' && fmtStrResult !== 'Virheellinen päivämäärä', fmtStrError || fmtStrResult);
check('list-status ei sisalla virhetta',
  String(elements['list-status'].textContent).indexOf('date.getTime') === -1,
  String(elements['list-status'].textContent));
check('placeholder ei sisalla virhetta',
  String(elements['viewer-placeholder'].innerHTML).indexOf('date.getTime') === -1,
  String(elements['viewer-placeholder'].innerHTML).slice(0, 160));

// Hash-muodot.
location.hash = '#2026-11-13-0600-aamukatsaus.html';
const parsedLegacy = sandbox.parseHash();
check('vanha hash tulkitaan oletussyötteeksi',
  parsedLegacy.feed === '' && parsedLegacy.file === '2026-11-13-0600-aamukatsaus.html', JSON.stringify(parsedLegacy));

location.hash = '#media-pl/2026-11-13-0800-viikkokatsaus.html';
const parsedNew = sandbox.parseHash();
check('uusi hash jäsennetään',
  parsedNew.feed === 'media-pl' && parsedNew.file === '2026-11-13-0800-viikkokatsaus.html', JSON.stringify(parsedNew));

// Tuotantotila: Contents API -polun pitää sisältää syöte.
location.hostname = 'jarno1965.github.io';
location.pathname = '/MarkkinaTilanne/';
location.protocol = 'https:';
urls.length = 0;
await sandbox.fetchGithubListing('media-se');
check('Contents API polku sisältää syötteen',
  urls[0] === 'https://api.github.com/repos/jarno1965/MarkkinaTilanne/contents/data/media-se?ref=main', urls[0]);

console.log('\n' + pass + '/' + (pass + fail) + ' tarkistusta läpi');
process.exit(fail === 0 ? 0 : 1);
