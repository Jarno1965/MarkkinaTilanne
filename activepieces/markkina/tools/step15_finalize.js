export const code = async (inputs) => {
  const cleanDate = inputs.date.slice(0, 16).replace(' ', '-').replace(':', '');
  const fiDays = ['sunnuntai', 'maanantai', 'tiistai', 'keskiviikko', 'torstai', 'perjantai', 'lauantai'];
  const dm = String(inputs.date).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  let createdAt = String(inputs.date);
  if (dm) {
    const wd = fiDays[new Date(Date.UTC(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]), 12)).getUTCDay()];
    createdAt = wd + ' ' + Number(dm[3]) + '.' + Number(dm[2]) + '.' + dm[1] + ' klo ' + dm[4] + ':' + dm[5] + ':' + (dm[6] || '00');
  }
  const banner = '<div style="background:#f1f5f9;border-bottom:1px solid #cbd5e1;color:#475569;font:14px/1.4 Arial,sans-serif;padding:8px 16px;text-align:center;">Raportti luotu: ' + createdAt + '</div>';
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
      const keys = ['body', 'response', 'text', 'content', 'output', 'result', 'message', 'html'];
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
    }
    try { return JSON.stringify(v); } catch (e) { return ''; }
  };
  let rawIn = pickText(inputs.html, 0);
  if (/^\s*[\[{]/.test(rawIn)) {
    try {
      const fromJson = pickText(JSON.parse(rawIn), 0);
      if (fromJson) { rawIn = fromJson; }
    } catch (e) { }
  }
  const received = rawIn;
  let html = rawIn.trim();
  html = html.replace(/^```[a-zA-Z]*[ \t]*\r?\n?/, '').replace(/\r?\n?```[ \t]*$/, '').trim();
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
  if (endAt >= 0) { html = html.slice(0, endAt + endTag.length); }
  else { html = html + '\n' + endTag; }
  html = html.replace(/\{\{[^{}]*\}\}/g, '');
  const PREFIX = '<!DOCTYPE html>\n<html lang="fi">\n<head>\n<meta charset="utf-8">\n';
  if (html.search(/<html/i) < 0 && html.search(/<!doctype/i) < 0 && html.length >= 200 && html.search(/<\/head>|<body[\s>]/i) >= 0) {
    html = PREFIX + html;
  }
  if (html.search(/<html/i) >= 0 && html.toLowerCase().lastIndexOf('</html>') < 0) {
    html = html + (html.search(/<\/body>/i) < 0 ? '\n</body>' : '') + '\n</html>';
  }
  const hasDoc = html.search(/<html/i) >= 0 || html.search(/<!doctype/i) >= 0;
  if (!hasDoc) {
    if (html.length >= 200 && /<(div|table|section|main|article|h1|h2|h3|p|ul|style)\b/i.test(html)) {
      html = '<!DOCTYPE html>\n<html lang="fi">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Markkinakatsaus</title>\n</head>\n<body>\n' + html + '\n</body>\n</html>';
    } else {
      throw new Error('Mallin vastaus ei sis\u00e4lt\u00e4nyt kelvollista HTML-dokumenttia, joten raporttia ei julkaistu. Vastauksen tyyppi: ' + (typeof inputs.html) + ', pituus: ' + received.length + ', alku: ' + JSON.stringify(received.slice(0, 300)));
    }
  }
  const bodyOpen = html.match(/<body[^>]*>/i);
  if (bodyOpen) {
    const at = bodyOpen.index + bodyOpen[0].length;
    html = html.slice(0, at) + '\n' + banner + html.slice(at);
  } else {
    html = banner + '\n' + html;
  }
  return {
    base64: Buffer.from(html, 'utf-8').toString('base64'),
    timestamp: cleanDate
  };
};
