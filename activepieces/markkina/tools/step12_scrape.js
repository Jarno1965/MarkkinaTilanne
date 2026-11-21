export const code = async (inputs) => {
  const SEP = '  ;;  ';

  const cut = (text, limit) => {
    const t = String(text === null || text === undefined ? '' : text)
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/[ ]{2,}/g, ' ')
      .trim();
    if (t.length <= limit) { return t; }
    const slice = t.slice(0, limit);
    const space = slice.lastIndexOf(' ');
    return (space > limit * 0.6 ? slice.slice(0, space) : slice) + ' ...';
  };

  const domain = (url) => {
    const m = String(url || '').match(/^https?:\/\/([^\/]+)/i);
    return m ? m[1].replace(/^www\./i, '') : '';
  };

  // Artikkelin julkaisuajan tulkinta. Firecrawl antaa ajan usein muodossa
  // "5 days ago", "2026-11-16" tai ISO-aikaleimana.
  const publishedTime = (raw) => {
    const value = String(raw === null || raw === undefined ? '' : raw).trim();
    if (!value) { return null; }
    const direct = Date.parse(value);
    if (!isNaN(direct)) { return direct; }
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
    if (epoch === null) { return ''; }
    const hours = (Date.now() - epoch) / 3600000;
    if (!isFinite(hours) || hours < 0) { return ''; }
    if (hours < 1) { return 'TUORE, alle 1 h sitten'; }
    if (hours < 48) { return 'TUORE, ' + Math.round(hours) + ' h sitten'; }
    return 'VANHEMPI, ' + Math.round(hours / 24) + ' vrk sitten';
  };

  const parse = (value) => {
    let v = value;
    if (typeof v === 'string') {
      const t = v.trim();
      if (!t) { return {}; }
      try { v = JSON.parse(t); } catch (e) { return {}; }
    }
    if (!v || typeof v !== 'object' || Array.isArray(v)) { return {}; }
    return v;
  };

  // Firecrawl kaaraa tuloksen muotoon { success, data: { news, web } }.
  // Tuetaan myos suoraa { news, web } -rakennetta.
  const root = parse(inputs.scraped);
  const data = (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) ? root.data : root;
  const news = Array.isArray(data.news) ? data.news : [];
  const web = Array.isArray(data.web) ? data.web : [];

  // Siivoa markdown: poista linkki- ja kuvasyntaksi seka navigaatiorivit,
  // jotta mukaan jaavat vain oikeat leipatekstikappaleet.
  const cleanBody = (raw) => {
    let t = String(raw || '');
    t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
    t = t.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
    t = t.replace(/[`*_>#]+/g, ' ');
    const lines = t.split(/\r?\n/).map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const keep = [];
    for (const line of lines) {
      const words = line.split(' ').length;
      const sentences = (line.match(/[.!?](\s|$)/g) || []).length;
      if (sentences === 0 && (words < 8 || line.length < 80)) { continue; }
      if (/^(skip to|sign in|log in|menu|search|close|share|read more|cookie|leave the|accept|subscribe|advertisement|most popular)/i.test(line)) { continue; }
      keep.push(line);
    }
    let out = keep.join(' ').replace(/\s{2,}/g, ' ').trim();
    const m = out.match(/[A-Za-z\u00c4\u00d6\u00c5\u00e4\u00f6\u00e5][^.!?]{60,}[.!?]/);
    if (m && m.index > 0 && m.index < 800) { out = out.slice(m.index); }
    return out;
  };

  const seen = {};
  const lines = [];
  const items = news.concat(web)
    .filter((x) => x && (x.markdown || x.snippet || x.description))
    .map((x) => {
      const md = x.metadata || {};
      return {
        it: x,
        at: publishedTime(x.date || md.publishedTime || md.published_time || md.ogPublishedTime || x.publishedDate || '')
      };
    })
    // Uusin ensin; ilman aikaleimaa olevat viimeiseksi.
    .sort((a, b) => {
      if (a.at === null && b.at === null) { return 0; }
      if (a.at === null) { return 1; }
      if (b.at === null) { return -1; }
      return b.at - a.at;
    });

  // Aikasensuuri: viikkokatsaus kattaa kuluneen viikon. Tata vanhemmat artikkelit
  // ovat edellisen viikon katsauksia - esimerkiksi maanantaina julkaistu
  // "Weekly Market Recap" kertoo viikosta, joka paattyi edellisena perjantaina,
  // ja sen tulosluvut ovat siksi vanhentuneita. Jos sensuuri tyhjentaisi koko
  // listan, pidaan kuitenkin uusimmat, jotta raportti ei jaa tyhjaksi.
  const maxAge = Number(inputs.max_age_hours);
  const maxAgeHours = isFinite(maxAge) && maxAge > 0 ? maxAge : 120;
  const fresh = items.filter((entry) => entry.at === null || (Date.now() - entry.at) / 3600000 <= maxAgeHours);
  const use = fresh.length ? fresh : items;
  const dropped = items.length - use.length;

  for (let i = 0; i < use.length && lines.length < 6; i++) {
    const entry = use[i];
    const it = entry.it;
    const url = it.url || (it.metadata && it.metadata.sourceURL) || '';
    if (url && seen[url]) { continue; }
    if (url) { seen[url] = true; }
    const title = cut(it.title || '', 180);
    const src = domain(url);
    const date = cut(it.date || '', 40);
    const age = ageLabel(entry.at);
    let body = cleanBody(it.markdown || '');
    if (body.length < 200) {
      const md = it.metadata || {};
      body = cut(md.pageSummary || md.description || it.description || it.snippet || '', 2000);
    } else {
      body = cut(body, 2000);
    }
    const meta = [date, age, src].filter(Boolean).join(', ');
    lines.push('- ' + (title || '(ei otsikkoa)') + (meta ? ' [' + meta + ']' : '') + (url ? ' (' + url + ')' : '') + (body ? ' : ' + body : ''));
  }

  let out = lines.length ? lines.join(SEP) : 'ei artikkeleita';
  if (out.length > 16000) { out = out.slice(0, 16000) + ' ... (lyhennetty)'; }

  return {
    scrapedNews: 'VIIKON ARTIKKELIEN KOKOTEKSTIT (uusin ensin, vain ' + Math.round(maxAgeHours / 24) +
      ' vrk sisalla julkaistut' + (dropped > 0 ? '; ' + dropped + ' vanhempaa artikkelia jai pois' : '') + '): ' + out,
    scrapedCount: lines.length
  };
};
