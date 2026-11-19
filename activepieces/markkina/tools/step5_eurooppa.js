export const code = async (inputs) => {
  const datePart = inputs.date.slice(0, 10);
  const cleanDate = inputs.date.slice(0, 16).replace(' ', '-').replace(':', '');

  const days = ['sunnuntai', 'maanantai', 'tiistai', 'keskiviikko', 'torstai', 'perjantai', 'lauantai'];
  const dayIndex = new Date(datePart + 'T12:00:00Z').getUTCDay();
  const dayName = days[dayIndex];

  const fiDays = ['sunnuntai', 'maanantai', 'tiistai', 'keskiviikko', 'torstai', 'perjantai', 'lauantai'];
  const dm = String(inputs.date).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  let createdAt = String(inputs.date);
  if (dm) {
    const wd = fiDays[new Date(Date.UTC(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]), 12)).getUTCDay()];
    createdAt = wd + ' ' + Number(dm[3]) + '.' + Number(dm[2]) + '.' + dm[1] + ' klo ' + dm[4] + ':' + dm[5] + ':' + (dm[6] || '00');
  }
  const banner = '<div style="background:#f1f5f9;border-bottom:1px solid #cbd5e1;color:#475569;font:14px/1.4 Arial,sans-serif;padding:8px 16px;text-align:center;">Raportti luotu: ' + createdAt + '</div>';

  // Poimii viimeisen ehjän <section>...</section>-lohkon. Kaytetaan silloin, kun
  // reasoning-malli jattaa content-kentan tyhjaksi ja kirjoittaa vastauksen reasoning-kenttaan.
  const sectionFrom = function (text) {
    const s = String(text || '');
    const lower = s.toLowerCase();
    const close = lower.lastIndexOf('</section>');
    if (close < 0) { return ''; }
    const open = lower.lastIndexOf('<section', close);
    if (open < 0) { return ''; }
    return s.slice(open, close + '</section>'.length);
  };

  const pickText = function (v, depth) {
    const d = depth || 0;
    if (v === null || v === undefined) { return ''; }
    if (typeof v === 'string') { return v; }
    if (typeof v === 'number' || typeof v === 'boolean') { return String(v); }
    if (d > 4) { return ''; }
    if (Array.isArray(v)) {
      return v.map(function (x) { return pickText(x, d + 1); }).join('\n');
    }
    if (typeof v === 'object') {
      // OpenAI-yhteensopiva viesti: kayta content, jos se on oikeasti teksti.
      if (typeof v.content === 'string' && v.content.trim()) { return v.content; }
      const keys = ['body', 'response', 'text', 'output', 'result', 'message', 'html'];
      for (let i = 0; i < keys.length; i++) {
        if (v[keys[i]] !== undefined && v[keys[i]] !== null) {
          const r = pickText(v[keys[i]], d + 1);
          if (r) { return r; }
        }
      }
      if (Array.isArray(v.choices) && v.choices.length) {
        const c = v.choices[0] || {};
        const r2 = pickText(c.message !== undefined ? c.message : c.text, d + 1);
        if (r2) { return r2; }
      }
      // content oli null / tyhja: reasoning-kentassa voi olla valmis HTML-fragmentti.
      if (typeof v.reasoning === 'string' && v.reasoning.trim()) {
        const sec = sectionFrom(v.reasoning);
        if (sec) { return sec; }
        return '';
      }
      // Viestiobjektia ei koskaan sarjoiteta JSONiksi raporttiin.
      if (v.role !== undefined || v.tool_calls !== undefined || v.reasoning_details !== undefined) {
        return '';
      }
    }
    try { return JSON.stringify(v); } catch (e) { return ''; }
  };

  const extract = function (value) {
    let raw = pickText(value, 0);
    if (/^\s*[\[{]/.test(raw)) {
      try {
        const fromJson = pickText(JSON.parse(raw), 0);
        if (fromJson) { raw = fromJson; }
      } catch (e) { }
    }
    return raw;
  };

  const cleanFences = function (value) {
    return String(value || '').trim()
      .replace(/^```[a-zA-Z]*[ \t]*\r?\n?/, '')
      .replace(/\r?\n?```[ \t]*$/, '')
      .trim();
  };

  const received = extract(inputs.html);
  let html = cleanFences(received);

  const docStart = html.search(/<!doctype html/i);
  const htmlStart = html.search(/<html/i);
  if (docStart > 0) { html = html.slice(docStart); }
  else if (docStart < 0 && htmlStart > 0) { html = html.slice(htmlStart); }

  const endTag = '</html>';
  const endAt = html.toLowerCase().lastIndexOf(endTag);
  const endsWithBody = /<\/body>\s*$/i.test(html);
  if (endAt < 0 && !endsWithBody) {
    throw new Error('Pääraportin HTML katkesi kesken, joten raporttia ei julkaistu. Vastauksen pituus: ' + received.length + ' merkkiä, loppu: ' + JSON.stringify(received.slice(-200)) + '. Aja työnkulku uudelleen.');
  }
  if (endAt >= 0) {
    html = html.slice(0, endAt + endTag.length);
  } else {
    html = html + '\n' + endTag;
  }
  html = html.replace(/\{\{[^{}]*\}\}/g, '');

  let analysis = cleanFences(extract(inputs.analysis));
  if (analysis) {
    analysis = analysis.replace(/<!doctype[^>]*>/gi, '');
    analysis = analysis.replace(/<head[\s\S]*?<\/head>/gi, '');
    analysis = analysis.replace(/<\/?html[^>]*>/gi, '');
    analysis = analysis.replace(/<\/?body[^>]*>/gi, '');
    analysis = analysis.replace(/<style[\s\S]*?<\/style>/gi, '');
    analysis = analysis.replace(/^\s*(<meta[^>]*>\s*)+/i, '');
    analysis = analysis.trim();

    // Hylkaa raaka JSON (esim. reasoning-mallin viestiobjekti), jotta raporttiin ei koskaan
    // paady merkkiparvea kuten {"role":"assistant","content":null,"reasoning":"..."}.
    if (analysis.slice(0, 1) === '{' || analysis.slice(0, 1) === '[' || /"role"\s*:\s*"assistant"/i.test(analysis)) {
      analysis = '';
    }

    // Kayta vain yhtenainen <section>-lohko, jos sellainen on.
    const secStart = analysis.search(/<section[\s>]/i);
    if (analysis) {
      const secClose = analysis.toLowerCase().lastIndexOf('</section>');
      if (secStart >= 0 && secClose > secStart) {
        const secOpen = analysis.toLowerCase().lastIndexOf('<section', secClose);
        analysis = analysis.slice(secOpen, secClose + '</section>'.length);
      } else if (secStart >= 0) {
        analysis = '';
      }
    }

    analysis = analysis.trim();
    if (analysis && analysis.slice(-1) !== '>') {
      const lastTag = analysis.lastIndexOf('>');
      analysis = lastTag > 0 ? analysis.slice(0, lastTag + 1) : '';
    }
    if (analysis && analysis.slice(0, 1) !== '<') { analysis = ''; }
  }

  const bodyOpen = html.match(/<body[^>]*>/i);
  if (bodyOpen) {
    const at = bodyOpen.index + bodyOpen[0].length;
    html = html.slice(0, at) + '\n' + banner + html.slice(at);
  } else {
    html = banner + '\n' + html;
  }

  if (analysis) {
    const bodyEnd = html.toLowerCase().lastIndexOf('</body>');
    if (bodyEnd >= 0) {
      const before = html.slice(0, bodyEnd);
      const lastDiv = before.toLowerCase().lastIndexOf('</div>');
      const tailAfterDiv = lastDiv > 0 ? before.slice(lastDiv + 6).trim() : 'x';
      if (lastDiv > 0 && tailAfterDiv === '') {
        html = before.slice(0, lastDiv) + analysis + '\n' + before.slice(lastDiv) + html.slice(bodyEnd);
      } else {
        const wrapped = '<div style="max-width:1040px;margin:0 auto;padding:0 16px 64px;">' + analysis + '</div>';
        html = before + '\n' + wrapped + '\n' + html.slice(bodyEnd);
      }
    } else {
      const htmlEnd = html.toLowerCase().lastIndexOf(endTag);
      html = html.slice(0, htmlEnd) + analysis + '\n' + html.slice(htmlEnd);
    }
  }

  return {
    base64: Buffer.from(html, 'utf-8').toString('base64'),
    timestamp: cleanDate
  };
};