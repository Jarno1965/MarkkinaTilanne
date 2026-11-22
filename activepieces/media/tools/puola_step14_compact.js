// "Puola puhuu" – yhdistää kartoituksen, täsmähaut, koko tekstit ja keskustelut
// yhdeksi aineistoksi raportin kirjoittajalle.
//
// Tuoreussuodatus: tunnettu julkaisupäivä yli 32 vrk vanha -> pudotetaan.
// Ilman päivämäärää olevat säilytetään, mutta merkitään "ei päivämäärää", jotta
// kirjoittaja osaa kohdella niitä taustana.
export const code = async (inputs) => {
  const SEP = '  ;;  ';
  const BLOCK_CAP = 7000;
  const EXTRACT_CAP = 12000;
  const SOCIAL_CAP = 9000;
  const MAX_AGE_DAYS = 32;
  const BLOCK_DOMAINS = [
    'youtube.com', 'google.com', 'google.pl', 'facebook.com', 'wikipedia.org', 'tiktok.com',
    'instagram.com', 'linkedin.com', 'x.com', 'twitter.com', 'pinterest.com', 'bing.com',
    'tavily.com', 'firecrawl.dev', 'activepieces.com', 'github.com'
  ];
  const BLOCK_EXT = /\.(pdf|docx?|xlsx?|pptx?|zip|mp4|mp3|svg|png|jpe?g|gif)(\?|$)/i;
  const JUNK_TEXT = /verifying your request|are you a robot|access denied|enable javascript|just a moment/i;

  let junkFiltered = 0;

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

  const ageLabel = (epoch) => {
    if (epoch === null) return 'ei päivämäärää';
    const hours = (Date.now() - epoch) / 3600000;
    if (!isFinite(hours) || hours < 0) return '';
    if (hours <= 72) return hours < 1 ? 'TUORE, alle 1 h sitten' : 'TUORE, ' + Math.round(hours) + ' h sitten';
    return 'VANHEMPI, ' + Math.round(hours / 24) + ' vrk sitten';
  };

  const fmtDate = (raw) => {
    const t = toTime(raw);
    if (t === null) return '';
    const d = new Date(t);
    const p = (n) => String(n).padStart(2, '0');
    return p(d.getUTCDate()) + '.' + p(d.getUTCMonth() + 1) + '.' + d.getUTCFullYear();
  };

  const registry = new Map();
  const addSource = (title, url, date) => {
    const u = canonical(url);
    if (!u || isBlocked(u) || registry.has(u)) return;
    registry.set(u, {
      title: cut(title, 180) || '(nimetön lähde)',
      url: u,
      domain: domainOf(u),
      date: date ? fmtDate(date) : ''
    });
  };

  const tavilyResults = (value) => {
    const v = unwrap(value);
    if (!v || typeof v !== 'object') return [];
    if (Array.isArray(v)) return v;
    if (v.body && typeof v.body === 'object') return tavilyResults(v.body);
    return Array.isArray(v.results) ? v.results : [];
  };

  const tavilyAnswer = (value) => {
    const v = unwrap(value);
    if (!v || typeof v !== 'object') return '';
    if (typeof v.answer === 'string') return v.answer;
    if (v.body && typeof v.body === 'object' && typeof v.body.answer === 'string') return v.body.answer;
    return '';
  };

  const themeBlock = (label, values) => {
    const lines = [];
    let dropped = 0;
    for (const value of values) {
      const answer = tavilyAnswer(value);
      if (answer) lines.push('Yhteenveto: ' + cut(answer, 700));
      for (const raw of tavilyResults(value)) {
        const i = raw || {};
        const url = canonical(i.url || i.link);
        if (!url || isBlocked(url)) continue;
        const at = toTime(i.published_date || i.publishedDate);
        if (at !== null && (Date.now() - at) / 86400000 > MAX_AGE_DAYS) { dropped++; continue; }
        addSource(i.title, url, i.published_date || i.publishedDate);
        const meta = [fmtDate(i.published_date || i.publishedDate), ageLabel(at), domainOf(url)].filter(Boolean).join(', ');
        lines.push('- ' + cut(i.title, 160) + (meta ? ' [' + meta + ']' : '') + ' URL: ' + url + ' : ' + cut(i.content || i.snippet || '', 1200));
      }
    }
    let out = label + ': ' + (lines.length ? lines.join(SEP) : 'ei tuloksia');
    if (dropped > 0) out += SEP + '(pudotettu ' + dropped + ' yli ' + MAX_AGE_DAYS + ' vrk vanhaa osumaa)';
    if (out.length > BLOCK_CAP) out = out.slice(0, BLOCK_CAP) + ' ... (lyhennetty)';
    return out;
  };

  const extractBlock = (value) => {
    const v = unwrap(value);
    const data = v && typeof v === 'object' && v.data ? v.data : v;
    const results = v && Array.isArray(v.results) ? v.results
      : (data && Array.isArray(data.results) ? data.results : []);
    const lines = [];
    for (const raw of results.slice(0, 8)) {
      const r = raw || {};
      const url = canonical(r.url);
      if (!url || isBlocked(url)) continue;
      addSource(r.title, url, r.published_date || r.publishedDate);
      lines.push('- ' + cut(r.title, 150) + ' [' + domainOf(url) + '] URL: ' + url + ' : ' + cut(r.raw_content || r.content || '', 2200));
    }
    let out = 'ARTIKKELIT KOKO TEKSTINÄ: ' + (lines.length ? lines.join(SEP) : 'ei saatavilla');
    if (out.length > EXTRACT_CAP) out = out.slice(0, EXTRACT_CAP) + ' ... (lyhennetty)';
    return out;
  };

  const firecrawlBlock = (label, value) => {
    const v = unwrap(value);
    const data = v && typeof v === 'object' && v.data ? v.data : {};
    const web = Array.isArray(data.web) ? data.web : [];
    const news = Array.isArray(data.news) ? data.news : [];
    const seen = new Set();
    const kept = [];
    for (const raw of web.concat(news)) {
      const i = raw || {};
      const url = canonical(i.url);
      if (!url || isBlocked(url) || seen.has(url)) continue;
      const md = String(i.markdown || '');
      const body = (!md || JUNK_TEXT.test(md.slice(0, 400))) ? String(i.description || i.snippet || '') : md;
      if (!body || body.length < 80 || JUNK_TEXT.test(body.slice(0, 300))) { junkFiltered++; continue; }
      seen.add(url);
      kept.push({ i: i, url: url, body: body, at: toTime(i.date) });
      if (kept.length >= 8) break;
    }
    const lines = kept.map((e) => {
      addSource(e.i.title, e.url, e.i.date);
      const meta = [fmtDate(e.i.date), ageLabel(e.at), domainOf(e.url)].filter(Boolean).join(', ');
      return '- ' + cut(e.i.title, 150) + (meta ? ' [' + meta + ']' : '') + ' URL: ' + e.url + ' : ' + cut(e.body, 1500);
    });
    let out = label + ': ' + (lines.length ? lines.join(SEP) : 'ei tuloksia');
    if (out.length > SOCIAL_CAP) out = out.slice(0, SOCIAL_CAP) + ' ... (lyhennetty)';
    return out;
  };

  const blocks = {
    teemat: 'KUUKAUDEN PUHETTUAIHEET (kartoitusvaiheessa tunnistetut, tarkista aineistosta):\n' + String(inputs.themes_text || 'ei tunnistettuja teemoja'),
    uutiset: themeBlock('TÄSMÄHAUT: UUTISET JA TAUSTAT', [inputs.d1, inputs.d2, inputs.d3]),
    artikkelit: extractBlock(inputs.ex),
    some: firecrawlBlock('KESKUSTELUT JA SOME', inputs.fc1) + SEP + firecrawlBlock('KESKUSTELUT TEEMOISTA', inputs.fc2)
  };

  const sources = Array.from(registry.values()).slice(0, 30);
  const domains = new Set(sources.map((s) => s.domain));
  const nonEmptyBlocks = Object.keys(blocks).filter((k) => {
    const b = blocks[k];
    return b.indexOf('ei tuloksia') < 0 && b.indexOf('ei saatavilla') < 0 && b.indexOf('ei tunnistettuja teemoja') < 0;
  }).length;

  const warnings = [];
  if (blocks.some.indexOf('KESKUSTELUT TEEMOISTA: ei tuloksia') >= 0) {
    warnings.push('keskusteluaineisto puuttui');
  }
  if (blocks.artikkelit.indexOf('ei saatavilla') >= 0) warnings.push('koko tekstien poiminta ei palauttanut sisältöä');
  if (junkFiltered > 0) warnings.push('suodatettu ' + junkFiltered + ' roskalinkkia');
  for (const key of ['d1', 'd2', 'd3']) {
    const v = unwrap(inputs[key]);
    if (v && typeof v === 'object' && v.response && v.response.status >= 400) {
      warnings.push('Tavily-haku ' + key + ' epäonnistui (HTTP ' + v.response.status + ')');
    }
  }

  return {
    period: String(inputs.start_date || '') + ' - ' + String(inputs.now || ''),
    blocks: blocks,
    sources: sources,
    sourcesText: sources.map((s, idx) => (idx + 1) + '. ' + s.title
      + (s.domain || s.date ? ' (' + [s.domain, s.date].filter(Boolean).join(', ') + ')' : '')
      + ' ' + s.url).join('\n'),
    sourceCount: sources.length,
    domainCount: domains.size,
    nonEmptyBlocks: nonEmptyBlocks,
    themeCount: Number(inputs.theme_count) || 0,
    junkFiltered: junkFiltered,
    warnings: warnings,
    totalChars: Object.keys(blocks).reduce((sum, k) => sum + blocks[k].length, 0)
  };
};
