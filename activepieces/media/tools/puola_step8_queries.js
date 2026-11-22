// "Puola puhuu" – aiheidenpoimijan JSON -> täsmähaut ja teemalista.
//
// Aiheidenpoimija palauttaa JSONin muodossa:
//   { themes:[{title_fi, why_fi, keywords_pl:[], channels_fi}],
//     queries:[{query, focus_fi}], urls:["https://..."] }
//
// Tämä vaihe purkaa vastauksen, poistaa duplikaatit ja varmistaa, että ketju jatkuu
// aina kolmella puolankielisellä hakulauseella, vaikka LLM epäonnistuisi.
export const code = async (inputs) => {
  const FALLBACK_QUERIES = [
    'Polska najważniejsze tematy spory debata publiczna ostatni miesiąc',
    'Polska ceny pensje podatki świadczenia rodzina koszty życia',
    'Polska polityka samorząd sądy edukacja zdrowie protesty'
  ];

  const pickText = (v, depth = 0) => {
    if (v === null || v === undefined || depth > 6) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (Array.isArray(v)) return v.map((x) => pickText(x, depth + 1)).join('\n');
    if (typeof v === 'object') {
      if (Array.isArray(v.choices) && v.choices.length) {
        const c = v.choices[0] || {};
        const msg = c.message || {};
        if (typeof msg.content === 'string' && msg.content.trim()) return msg.content;
        const r = pickText(c.message !== undefined ? c.message : c.text, depth + 1);
        if (r) return r;
      }
      for (const k of ['body', 'response', 'text', 'content', 'output', 'result', 'message']) {
        if (v[k] !== undefined && v[k] !== null) {
          const r = pickText(v[k], depth + 1);
          if (r) return r;
        }
      }
    }
    return '';
  };

  const raw = String(pickText(inputs.llm, 0) || '').trim();
  const cleaned = raw
    .replace(/^```[a-zA-Z]*[ \t]*\r?\n?/, '')
    .replace(/\r?\n?```[ \t]*$/, '')
    .trim();

  let parsed = null;
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { parsed = JSON.parse(cleaned.slice(start, end + 1)); } catch (e) { parsed = null; }
  }

  const themes = parsed && Array.isArray(parsed.themes) ? parsed.themes : [];
  const themeLines = [];
  for (const t of themes.slice(0, 8)) {
    const i = t || {};
    const title = String(i.title_fi || i.title || '').replace(/\s+/g, ' ').trim();
    const why = String(i.why_fi || i.why || '').replace(/\s+/g, ' ').trim();
    const kw = Array.isArray(i.keywords_pl) ? i.keywords_pl.map(String).join(', ') : '';
    const ch = String(i.channels_fi || '').replace(/\s+/g, ' ').trim();
    if (!title) continue;
    const meta = [kw ? 'avainsanat: ' + kw : '', ch ? 'kanavat: ' + ch : ''].filter(Boolean).join(' | ');
    themeLines.push((themeLines.length + 1) + '. ' + title + (why ? ' — ' + why : '') + (meta ? ' [' + meta + ']' : ''));
  }

  const queries = [];
  const pushQuery = (q) => {
    const s = String(q || '').replace(/\s+/g, ' ').trim();
    if (!s || s.length < 8) return;
    if (queries.some((x) => x.toLowerCase() === s.toLowerCase())) return;
    if (queries.length < 3) queries.push(s);
  };
  if (parsed && Array.isArray(parsed.queries)) {
    for (const q of parsed.queries) {
      if (typeof q === 'string') pushQuery(q);
      else if (q && typeof q === 'object') pushQuery(q.query || q.q);
    }
  }
  for (const f of FALLBACK_QUERIES) {
    if (queries.length < 3) pushQuery(f);
  }

  const urls = [];
  if (parsed && Array.isArray(parsed.urls)) {
    for (const u of parsed.urls) {
      const s = String(u || '').trim();
      if (!/^https?:\/\//i.test(s)) continue;
      if (urls.includes(s)) continue;
      if (urls.length < 6) urls.push(s);
    }
  }

  const keywordParts = [];
  for (const t of themes.slice(0, 3)) {
    if (t && Array.isArray(t.keywords_pl)) {
      for (const k of t.keywords_pl.slice(0, 2)) keywordParts.push(String(k));
    }
  }
  const socialQuery = ('wykop reddit forum dyskusja opinie komentarze ' + keywordParts.join(' '))
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);

  const warnings = [];
  if (!parsed) warnings.push('aiheidenpoimijan vastausta ei saatu JSONina, käytettiin varahakuja');
  if (!themeLines.length) warnings.push('teemoja ei tunnistettu');
  if (!urls.length) warnings.push('ei url-ehdotuksia koko tekstin poimintaan');

  return {
    query_1: queries[0] || FALLBACK_QUERIES[0],
    query_2: queries[1] || FALLBACK_QUERIES[1],
    query_3: queries[2] || FALLBACK_QUERIES[2],
    themesText: themeLines.length ? themeLines.join('\n') : 'ei tunnistettuja teemoja',
    themeCount: themeLines.length,
    urls: urls,
    urlCount: urls.length,
    socialQuery: socialQuery,
    parseOk: !!parsed,
    warnings: warnings
  };
};
