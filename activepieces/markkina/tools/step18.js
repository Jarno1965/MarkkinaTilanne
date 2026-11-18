export const code = async (inputs) => {
  let v = inputs.tickers !== undefined && inputs.tickers !== null && inputs.tickers !== ''
    ? inputs.tickers
    : inputs.quotes_json;
  if (typeof v === 'string') {
    const t = v.trim();
    const s = t.indexOf('[');
    const e = t.lastIndexOf(']');
    if (s !== -1 && e > s) {
      try { v = JSON.parse(t.slice(s, e + 1)); } catch (err) { v = []; }
    } else { v = []; }
  }
  if (v && !Array.isArray(v) && Array.isArray(v.events)) { v = v.events; }
  if (!Array.isArray(v)) { v = []; }

  const clean = (x) => String(x === null || x === undefined ? '' : x).replace(/\s+/g, ' ').trim();

  const lines = [];
  for (const item of v) {
    if (!item || typeof item !== 'object') { continue; }
    const symbol = clean(item.symbol || item.ticker || item.symbols);
    if (!symbol) { continue; }
    const label = clean(item.label || item.name) || symbol;
    const url = 'https://finance.yahoo.com/quote/' + encodeURIComponent(symbol) + '/';
    try {
      const api = 'https://query2.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(symbol)
        + '?interval=1d&range=1d&includePrePost=true';
      const res = await fetch(api, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const data = await res.json();
      const meta = (data.chart && data.chart.result && data.chart.result[0] && data.chart.result[0].meta) || null;
      if (!meta || typeof meta.regularMarketPrice !== 'number') {
        lines.push(label + ' (' + symbol + '): kurssia ei saatavilla | Linkki: ' + url);
        continue;
      }
      const fmtTime = (epoch) => {
        if (!epoch || !isFinite(epoch)) { return ''; }
        const d = new Date(Number(epoch) * 1000);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return hh + ':' + mm;
      };
      const pieces = [];
      const post = typeof meta.postMarketPrice === 'number' ? meta.postMarketPrice : null;
      const pre = typeof meta.preMarketPrice === 'number' ? meta.preMarketPrice : null;
      const prevClose = meta.chartPreviousClose || meta.previousClose || null;
      const pct = (price, base) => {
        if (!base || !price) { return ''; }
        const p = ((price - base) / base) * 100;
        return (p > 0 ? '+' : '') + p.toFixed(2) + '%';
      };
      if (post !== null) {
        pieces.push('jälkimarkkina ' + post + ' (' + pct(post, prevClose) + ') klo ' + fmtTime(meta.postMarketTime));
      }
      if (pre !== null) {
        pieces.push('esimarkkina ' + pre + ' (' + pct(pre, prevClose) + ') klo ' + fmtTime(meta.preMarketTime));
      }
      pieces.push('päätös ' + meta.regularMarketPrice + ' (' + pct(meta.regularMarketPrice, prevClose) + ') klo ' + fmtTime(meta.regularMarketTime));
      lines.push(label + ' (' + symbol + '): ' + pieces.filter(Boolean).join(', ') + ' | Linkki: ' + url);
    } catch (err) {
      lines.push(label + ' (' + symbol + '): kurssia ei saatavilla | Linkki: ' + url);
    }
  }

  return { eventQuotes: lines.join('\n') };
};
