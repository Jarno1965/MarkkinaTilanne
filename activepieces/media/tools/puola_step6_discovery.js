// "Puola puhuu" – kartoitusvaiheen tiivistys LLM:lle.
//
// Syöte: kaksi Tavily-hakua (valtamedia + mielipide-, talous- ja aikakausmedia) sekä
// Firecrawl-haku (Wykop / Reddit / keskustelut). Tuloste: yksi luettava teksti, josta
// aiheidenpoimija näkee mistä Puolassa on kuluneen kuukauden aikana puhuttu.
//
// HUOM: tämä vaihe EI lukitse aiheita. Se vain siistii raakadatan ja merkitsee iät,
// jotta aiheidenpoimija (LLM) voi päätellä teemat datan perusteella.
export const code = async (inputs) => {
  const BLOCK_DOMAINS = [
    'youtube.com', 'facebook.com', 'instagram.com', 'tiktok.com', 'x.com', 'twitter.com',
    'linkedin.com', 'pinterest.com', 'google.com', 'google.pl', 'wikipedia.org',
    'tavily.com', 'firecrawl.dev', 'activepieces.com', 'github.com', 'bing.com'
  ];
  const BLOCK_EXT = /\.(pdf|docx?|xlsx?|pptx?|zip|mp4|mp3|svg|png|jpe?g|gif)(\?|$)/i;
  const JUNK_TEXT = /verifying your request|are you a robot|access denied|enable javascript|just a moment|404 not found|page not found/i;
  const ITEM_CAP = 320;
  const MAX_ITEMS = 45;

  const collapse = (text) => String(text === null || text === undefined ? '' : text)
    .replace(/\s+/g, ' ')
    .replace(/"/g, "'")
    .trim();

  const cut = (text, limit) => {
    const t = collapse(text);
    if (t.length <= limit) return t;
    const slice = t.slice(0, limit);
    const space = slice.lastIndexOf(' ');
    return (space > limit * 0.6 ? slice.slice(0, space) : slice) + ' ...';
  };

  const unwrap = (value) => {
    let v = value;
    if (typeof v === 'string') {
      const t = v.trim();
      if (!t) return null;
      try { v = JSON.parse(t); } catch (e) { return t; }
    }
    return v;
  };

  const canonical = (url) => String(url || '').split('?')[0].split('#')[0].replace(/\/+$/, '');

  const domainOf = (url) => {
    const m = canonical(url).match(/^https?:\/\/([^/]+)/i);
    return m ? m[1].replace(/^www\./i, '').toLowerCase() : '';
  };

  const isBlocked = (url) => {
    const d = domainOf(url);
    if (!d) return true;
    if (BLOCK_EXT.test(canonical(url))) return true;
    return BLOCK_DOMAINS.some((b) => d === b || d.endsWith('.' + b));
  };

  const toTime = (raw) => {
    const value = String(raw === null || raw === undefined ? '' : raw).trim();
    if (!value) return null;
    const direct = Date.parse(value);
    if (!isNaN(direct)) return direct;
    const rel = value.toLowerCase().match(/(\d+)\s*(minute|min|hour|h|day|d|week|wk)/);
    if (rel) {
      const amount = Number(rel[1]);
      const unit = rel[2];
      const hours = unit.startsWith('min') ? amount / 60
        : (unit === 'hour' || unit === 'h') ? amount
        : (unit === 'day' || unit === 'd') ? amount * 24
        : amount * 24 * 7;
      return Date.now() - hours * 3600000;
    }
    return null;
  };

  const fmtDate = (raw) => {
    const t = toTime(raw);
    if (t === null) return '';
    const d = new Date(t);
    const p = (n) => String(n).padStart(2, '0');
    return p(d.getUTCDate()) + '.' + p(d.getUTCMonth() + 1) + '.' + d.getUTCFullYear();
  };

  const ageLabel = (epoch) => {
    if (epoch === null) return '';
    const hours = (Date.now() - epoch) / 3600000;
    if (!isFinite(hours) || hours < 0) return '';
    if (hours <= 72) return hours < 1 ? 'TUORE, alle 1 h sitten' : 'TUORE, ' + Math.round(hours) + ' h sitten';
    return 'VANHEMPI, ' + Math.round(hours / 24) + ' vrk sitten';
  };

  const tavilyResults = (value) => {
    const v = unwrap(value);
    if (!v || typeof v !== 'object') return [];
    if (Array.isArray(v)) return v;
    if (v.body && typeof v.body === 'object') return tavilyResults(v.body);
    return Array.isArray(v.results) ? v.results : [];
  };

  const firecrawlItems = (value) => {
    const v = unwrap(value);
    if (!v || typeof v !== 'object') return [];
    const data = v.data && typeof v.data === 'object' ? v.data : v;
    const web = Array.isArray(data.web) ? data.web : [];
    const news = Array.isArray(data.news) ? data.news : [];
    return web.concat(news);
  };

  const seen = new Set();
  const lines = [];
  let junk = 0;

  const push = (title, url, date, snippet) => {
    const u = canonical(url);
    if (!u || isBlocked(u) || seen.has(u)) return;
    seen.add(u);
    const at = toTime(date);
    const meta = [domainOf(u), fmtDate(date), ageLabel(at)].filter(Boolean).join(', ');
    lines.push('- ' + cut(title, 170) + (meta ? ' [' + meta + ']' : '') + ' URL: ' + u + ' : ' + cut(snippet, ITEM_CAP));
  };

  for (const key of ['s1', 's2']) {
    for (const raw of tavilyResults(inputs[key])) {
      const i = raw || {};
      push(i.title, i.url || i.link, i.published_date || i.publishedDate, i.content || i.snippet || '');
    }
  }

  for (const raw of firecrawlItems(inputs.fc1)) {
    const i = raw || {};
    const body = String(i.markdown || i.description || i.snippet || '');
    if (!body || JUNK_TEXT.test(body.slice(0, 300))) { junk++; continue; }
    push(i.title, i.url, i.date || i.publishedDate, body);
  }

  const limited = lines.slice(0, MAX_ITEMS);
  const domains = new Set();
  for (const line of limited) {
    const m = line.match(/https?:\/\/([^/\s]+)/);
    if (m) domains.add(m[1].replace(/^www\./i, '').toLowerCase());
  }

  const warnings = [];
  if (limited.length < 10) warnings.push('kartoitusaineisto on ohut (' + limited.length + ' osumaa)');
  if (junk > 0) warnings.push('suodatettu ' + junk + ' roskalinkkia');

  return {
    discoveryText: limited.length ? limited.join('\n') : 'ei tuloksia',
    itemCount: limited.length,
    sourceCount: limited.length,
    domainCount: domains.size,
    period: String(inputs.start_date || '') + ' - ' + String(inputs.now || ''),
    warnings: warnings
  };
};
