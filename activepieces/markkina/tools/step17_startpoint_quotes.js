// step_17 (Sunnuntai): lahtotason markkinaluvut Yahoo Financesta.
// Ero Lauantain step17_weekly_quotes.js:aan: vertailukohta on tasan viikon takainen paatos
// (aikaleiman perusteella), jolloin myos ymparivuorokautiset kohteet kuten Bitcoin antavat
// oikean viikon muutoksen. Tuottaa tekstin LLM:lle ja valmiin HTML-taulukon linkkeineen.
export const code = async (inputs) => {
  const symbols = [
    { id: 'OMX Helsinki 25', ticker: '^OMXH25' },
    { id: 'OMX Stockholm 30', ticker: '^OMX' },
    { id: 'STOXX Europe 600', ticker: '^STOXX' },
    { id: 'DAX (Saksa)', ticker: '^GDAXI' },
    { id: 'FTSE 100 (UK)', ticker: '^FTSE' },
    { id: 'CAC 40 (Ranska)', ticker: '^FCHI' },
    { id: 'S&P 500 (USA)', ticker: '^GSPC' },
    { id: 'Nasdaq Composite', ticker: '^IXIC' },
    { id: 'Dow Jones', ticker: '^DJI' },
    { id: 'Nikkei 225', ticker: '^N225' },
    { id: 'Hang Seng', ticker: '^HSI' },
    { id: 'KOSPI', ticker: '^KS11' },
    { id: 'US 10Y Treasury Yield', ticker: '^TNX' },
    { id: 'Brent Crude Oil', ticker: 'BZ=F' },
    { id: 'Gold Futures', ticker: 'GC=F' },
    { id: 'Copper Futures', ticker: 'HG=F' },
    { id: 'EUR/USD', ticker: 'EURUSD=X' },
    { id: 'USD/JPY', ticker: 'USDJPY=X' },
    { id: 'Bitcoin USD', ticker: 'BTC-USD' }
  ];

  const host = ['query2', 'finance', 'yahoo', 'com'].join('.');
  const baseUrl = 'https://' + host + '/v8/finance/chart/';
  const webHost = ['finance', 'yahoo', 'com'].join('.');
  const MINUS = '\u2212';
  const NBSP = '\u00a0';
  const WEEK = 7 * 86400;

  const fiNum = (n, dec) => {
    const s = Number(n).toFixed(dec);
    const parts = s.split('.');
    const grouped = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
    return parts[1] ? grouped + ',' + parts[1] : grouped;
  };

  const lines = [];
  const rows = [];

  for (const item of symbols) {
    const quoteUrl = 'https://' + webHost + '/quote/' + encodeURIComponent(item.ticker) + '/';
    let price = null;
    let changePct = null;
    let asOf = '';
    try {
      const url = baseUrl + encodeURIComponent(item.ticker) + '?interval=1d&range=1mo';
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const data = await res.json();
      const r = (data && data.chart && data.chart.result && data.chart.result[0]) || null;
      const meta = (r && r.meta) || {};
      const q = (((r || {}).indicators || {}).quote || [])[0] || {};
      const closes = q.close || [];
      const stamps = (r && r.timestamp) || [];

      // Kerää aikaleiman ja paatoksen parit, jotta vertailu osuu tasan viikon taakse.
      const pairs = [];
      for (let i = 0; i < closes.length; i++) {
        const c = closes[i];
        if (typeof c === 'number' && isFinite(c)) {
          pairs.push({ at: typeof stamps[i] === 'number' ? stamps[i] : null, close: c });
        }
      }

      if (pairs.length) {
        const last = pairs[pairs.length - 1];
        price = last.close;
        let base = null;
        if (last.at !== null) {
          const limit = last.at - WEEK;
          for (let i = pairs.length - 1; i >= 0; i--) {
            if (pairs[i].at !== null && pairs[i].at <= limit) { base = pairs[i].close; break; }
          }
        }
        if (base === null) {
          // Varakeino, jos aikaleimoja ei ole: noin viisi kaupankayntipaivaa taaksepain.
          base = pairs.length > 5 ? pairs[pairs.length - 6].close : pairs[0].close;
        }
        if (typeof base === 'number' && base !== 0) {
          changePct = ((price - base) / base) * 100;
        }
      } else if (typeof meta.regularMarketPrice === 'number') {
        price = meta.regularMarketPrice;
      }

      if (meta.regularMarketTime) {
        asOf = new Date(meta.regularMarketTime * 1000).toISOString().slice(0, 10);
      }
    } catch (e) { }

    if (typeof price !== 'number' || typeof changePct !== 'number') {
      lines.push(item.id + ': ei saatavilla | Link: ' + quoteUrl);
      continue;
    }

    const sign = changePct > 0 ? '+' : (changePct < 0 ? MINUS : '');
    const pctText = sign + fiNum(Math.abs(changePct), 2) + NBSP + '%';
    const color = changePct > 0 ? '#1a7f37' : (changePct < 0 ? '#c62828' : '#5b6675');
    lines.push(item.id + ': ' + fiNum(price, 2) + ' (' + pctText + ' muutos viikon takaa' + (asOf ? ', ' + asOf : '') + ') | Link: ' + quoteUrl);
    rows.push('<tr><td><a href="' + quoteUrl + '" target="_blank" rel="noopener noreferrer">' + item.id + '</a></td>'
      + '<td style="text-align:right;white-space:nowrap;">' + fiNum(price, 2) + '</td>'
      + '<td style="text-align:right;white-space:nowrap;color:' + color + ';font-weight:600;">' + pctText + '</td></tr>');
  }

  const table = '<table style="width:100%;border-collapse:collapse;">'
    + '<caption style="caption-side:top;text-align:left;font-size:0.85rem;color:#5b6675;padding-bottom:8px;">Lähtötilanne alkavalle viikolle: viimeisin päätös ja muutos noin viikon takaa. Ei reaaliaikainen; kryptot käyvät kauppaa myös viikonloppuisin.</caption>'
    + '<thead><tr>'
    + '<th style="text-align:left;padding:8px;border-bottom:1px solid #e2e6ec;font-size:0.85rem;">Kohde</th>'
    + '<th style="text-align:right;padding:8px;border-bottom:1px solid #e2e6ec;font-size:0.85rem;">Taso</th>'
    + '<th style="text-align:right;padding:8px;border-bottom:1px solid #e2e6ec;font-size:0.85rem;">Muutos viikon takaa</th>'
    + '</tr></thead><tbody>' + rows.join('') + '</tbody></table>';

  return {
    weeklyData: lines.join('\n'),
    weeklyTable: table
  };
};
