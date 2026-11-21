// step_7 (Sunnuntai): tapahtumien JSON -> hakulauseet ja seurantalista. Kopio jaetusta
// step14.js:sta sillä erotuksella, että varahakulauseet (FALLBACK) katsovat eteenpäin
// alkavaan viikkoon eivätkä viime yön tuloksiin.
export const code = async (inputs) => {
  const FALLBACK = [
    'stock market week ahead outlook key events to watch',
    'economic calendar next week central bank decisions earnings preview'
  ];

  const clean = (value) => String(value === null || value === undefined ? '' : value)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/"/g, '')
    .trim();

  const clip = (value, limit) => {
    const t = clean(value);
    return t.length > limit ? t.slice(0, limit) : t;
  };

  // Etsi poimijan tekstisisalto milla tahansa vastausrakenteella.
  const deepText = (value, depth) => {
    const d = depth || 0;
    if (d > 6 || value === null || value === undefined) { return ''; }
    if (typeof value === 'string') { return value; }
    if (typeof value !== 'object') { return ''; }
    if (Array.isArray(value)) {
      for (const item of value) {
        const t = deepText(item, d + 1);
        if (t) { return t; }
      }
      return '';
    }
    if (Array.isArray(value.choices) && value.choices.length) {
      const c = value.choices[0] || {};
      const t = deepText(c.message !== undefined ? c.message : c.text, d + 1);
      if (t) { return t; }
    }
    for (const key of ['content', 'body', 'response', 'text', 'output', 'result', 'message', 'data']) {
      if (value[key] !== undefined && value[key] !== null) {
        const t = deepText(value[key], d + 1);
        if (t) { return t; }
      }
    }
    return '';
  };

  const collect = (value) => {
    let v = value;
    if (typeof v === 'string') {
      const t = v.trim();
      if (!t) { return []; }
      try { v = JSON.parse(t); } catch (e) { return []; }
    }
    if (Array.isArray(v)) { return v; }
    if (v && typeof v === 'object') {
      if (Array.isArray(v.events)) { return v.events; }
      return [v];
    }
    return [];
  };

  const rawText = deepText(inputs.raw !== undefined && inputs.raw !== null && inputs.raw !== '' ? inputs.raw : inputs.events_json, 0);
  const rawPreview = clip(rawText, 300);

  let jsonText = rawText.trim();
  const start = jsonText.indexOf('[');
  const end = jsonText.lastIndexOf(']');
  if (start !== -1 && end > start) {
    jsonText = jsonText.slice(start, end + 1);
  } else {
    const oStart = jsonText.indexOf('{');
    const oEnd = jsonText.lastIndexOf('}');
    if (oStart !== -1 && oEnd > oStart) { jsonText = jsonText.slice(oStart, oEnd + 1); }
  }

  const events = collect(jsonText);
  const queries = [];
  const quoteItems = [];

  const symbolClean = (value) => clean(value)
    .split(/[,;\s]+/).filter(Boolean)[0] || '';

  for (const item of events) {
    if (!item || typeof item !== 'object') { continue; }
    const name = clip(item.name || item.event || item.title || '', 90);
    const query = clip(item.query || item.search_query || '', 160) || clip(name + ' preview expectations what to watch', 160);
    if (query && !queries.some((q) => q.toLowerCase() === query.toLowerCase()) && queries.length < 3) {
      queries.push(query);
    }
    const symbol = symbolClean(item.symbols || item.symbol || item.ticker || '');
    if (symbol && /^[A-Za-z0-9.\-=^]{1,15}$/.test(symbol)) {
      if (!quoteItems.some((q) => q.symbol === symbol)) {
        quoteItems.push({ symbol: symbol, label: name || symbol });
      }
    }
  }

  let fi = 0;
  while (queries.length < 3) {
    const fb = FALLBACK[fi % FALLBACK.length];
    fi += 1;
    if (!queries.some((q) => q.toLowerCase() === fb.toLowerCase())) { queries.push(fb); }
    if (fi > 4) { break; }
  }

  return {
    q1: queries[0] || FALLBACK[0],
    q2: queries[1] || FALLBACK[1],
    q3: queries[2] || 'weekly market outlook upcoming events',
    tickers: JSON.stringify(quoteItems.slice(0, 6)),
    parsed_count: events.length,
    raw_preview: rawPreview,
    watchlist: events.length
      ? events.slice(0, 3).map((item, i) => {
        const name = clip(item.name || item.event || item.title || '', 90) || ('tapahtuma ' + (i + 1));
        const timing = clip(item.timing || item.expected_timing || item.when || '', 80);
        const why = clip(item.why || item.reason || '', 220);
        return '- ' + name + (timing ? ' (ajankohta: ' + timing + ')' : '') + (why ? ' : ' + why : '');
      }).join(' ;; ')
      : 'ei tunnistettuja tulevia tapahtumia'
  };
};
