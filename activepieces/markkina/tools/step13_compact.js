// step_13 (Lauantai): tiivistys LLM:lle. Kopio jaetusta step9.js:sta sillä erotuksella,
// että uutisrivit sisältävät lahteen URL:n, jotta raportti voidaan lahteistaa.
export const code = async (inputs) => {
  const SEP = '  ;;  ';

  const parseResults = (value) => {
    let v = value;
    if (typeof v === 'string') {
      const t = v.trim();
      if (!t) { return []; }
      try { v = JSON.parse(t); } catch (e) { return [{ title: '', content: t }]; }
    }
    if (Array.isArray(v)) { return v; }
    if (v && Array.isArray(v.results)) { return v.results; }
    if (v && typeof v === 'object') { return [v]; }
    return [];
  };

  const collapse = (text) => String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/([A-Za-z\u00c4\u00d6\u00c5]{4,}?)\1{2,}/g, '$1')
    .replace(/\b([A-Za-z\u00c4\u00d6\u00c5]{3,})(?:\s+\1\b){2,}/gi, '$1')
    .replace(/"/g, "'")
    .replace(/\\/g, '/')
    .trim();

  const flatten = (text) => String(text === null || text === undefined ? '' : text)
    .replace(/[\r\n\t]+/g, SEP)
    .replace(/[ ]{2,}/g, ' ')
    .split(SEP).map((part) => part.trim()).filter(Boolean).join(SEP);

  const cut = (text, limit) => {
    const t = collapse(text);
    if (t.length <= limit) { return t; }
    const slice = t.slice(0, limit);
    const space = slice.lastIndexOf(' ');
    return (space > limit * 0.6 ? slice.slice(0, space) : slice) + ' ...';
  };

  const domain = (url) => {
    const m = String(url || '').match(/^https?:\/\/([^\/]+)/i);
    return m ? m[1].replace(/^www\./i, '') : '';
  };

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

  const ageLabel = (epoch, freshHours) => {
    if (epoch === null) { return ''; }
    const hours = (Date.now() - epoch) / 3600000;
    if (!isFinite(hours) || hours < 0) { return ''; }
    const tag = hours <= freshHours ? 'TUORE' : 'VANHEMPI';
    if (hours < 1) { return 'TUORE, alle 1 h sitten'; }
    if (hours < 48) { return tag + ', ' + Math.round(hours) + ' h sitten'; }
    return tag + ', ' + Math.round(hours / 24) + ' vrk sitten';
  };

  const freshHours = Number(inputs.fresh_hours);
  const freshLimit = isFinite(freshHours) && freshHours > 0 ? freshHours : 3;

  const compact = (label, resultsValue, answerValue, limit) => {
    const items = parseResults(resultsValue)
      .map((item) => {
        const i = item || {};
        return { item: i, at: publishedTime(i.published_date || i.publishedDate || i.published_at || i.date || '') };
      })
      .sort((a, b) => {
        if (a.at === null && b.at === null) { return 0; }
        if (a.at === null) { return 1; }
        if (b.at === null) { return -1; }
        return b.at - a.at;
      })
      .slice(0, 8);

    const lines = items.map((entry) => {
      const i = entry.item;
      const title = cut(i.title || i.name || '', 170);
      const text = cut(i.content || i.text || i.description || i.snippet || '', 700);
      const date = cut(i.published_date || i.publishedDate || i.published_at || i.date || '', 40);
      const age = ageLabel(entry.at, freshLimit);
      const url = String(i.url || i.link || '');
      const src = domain(url);
      const meta = [date, age, src].filter(Boolean).join(', ');
      return '- ' + (title || '(ei otsikkoa)') + (meta ? ' [' + meta + ']' : '') + (url ? ' (' + url + ')' : '') + (text ? ' : ' + text : '');
    });

    const answer = cut(answerValue || '', 1600);
    const head = label ? label + ' - ' : '';
    let out = head + 'tiivistelma: ' + (answer || 'ei tiivistelmaa') + SEP + head + 'artikkelit (uusin ensin): ' + (lines.length ? lines.join(SEP) : 'ei uutisia');
    if (out.length > limit) { out = out.slice(0, limit) + ' ... (lyhennetty)'; }
    return out;
  };

  // Tapahtumahakujen tulokset voivat tulla merkkijonona tai valmiina listana.
  // Muunnetaan ne luettavaksi tekstiksi, jotta LLM ei saa [object Object] -roskaa.
  const renderResults = (value) => {
    if (value === null || value === undefined || value === '') { return 'ei tuloksia'; }
    if (typeof value === 'string') {
      const t = value.trim();
      if (!t) { return 'ei tuloksia'; }
      if (t.charAt(0) === '[' || t.charAt(0) === '{') {
        try { return renderResults(JSON.parse(t)); } catch (e) { return flatten(t); }
      }
      return flatten(t);
    }
    if (Array.isArray(value)) {
      if (!value.length) { return 'ei tuloksia'; }
      return value.map((entry) => {
        const i = entry || {};
        const title = cut(i.title || i.name || '', 160);
        const url = String(i.url || i.link || '');
        const text = cut(i.content || i.text || i.description || i.snippet || '', 400);
        const meta = [cut(i.published_date || i.publishedDate || i.published_at || i.date || '', 40), domain(url)].filter(Boolean).join(', ');
        return '- ' + (title || '(ei otsikkoa)') + (meta ? ' [' + meta + ']' : '') + (url ? ' (' + url + ')' : '') + (text ? ' : ' + text : '');
      }).join(SEP);
    }
    return flatten(String(value));
  };

  const watch = inputs.watchlist ? flatten(inputs.watchlist) : 'ei tunnistettuja odotettuja tapahtumia';

  return {
    newsAsia: compact(inputs.label_asia || '', inputs.step_7_results, inputs.step_7_answer, 7000),
    newsEurope: compact(inputs.label_europe || '', inputs.step_8_results, inputs.step_8_answer, 7000),
    watchlist: 'ODOTETUT TAPAHTUMAT JA NIIDEN TULOKSET - seurantalista: ' + watch
      + SEP + 'TAPAHTUMA 1 - hautulos: ' + (cut(inputs.step_15_answer, 1600) || 'ei tiivistelmaa') + SEP + renderResults(inputs.step_15_results)
      + SEP + 'TAPAHTUMA 2 - hautulos: ' + (cut(inputs.step_16_answer, 1600) || 'ei tiivistelmaa') + SEP + renderResults(inputs.step_16_results)
      + SEP + 'TAPAHTUMA 3 - hautulos: ' + (cut(inputs.step_17_answer, 1600) || 'ei tiivistelmaa') + SEP + renderResults(inputs.step_17_results)
      + SEP + 'HUOM: tarkista jokaisen tapahtuman tila artikkelien julkaisuajoista ja vertaa nykyhetkeen. Ennakkouutisen sanamuoto ei kerro, onko tapahtuma jo toteutunut.',
    marketData: flatten(inputs.market_data),
    eventQuotes: inputs.step_18_quotes ? flatten(inputs.step_18_quotes) : ''
  };
};
