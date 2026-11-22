// "Puola puhuu" – Markdown -> itsenäinen HTML5-raportti + Base64 GitHub-committia varten.
//
// Raportin rakenne tulee kokonaan LLM:ltä (dynaamiset teemaotsikot). Tämä vaihe ei
// lisää omia osioita; se vain muotoilee Markdownin, lisää aikaleimapalkin ja —
// jos LLM unohti lähdeluettelon — liittää lähderekisterin raportin loppuun.
export const code = async (inputs) => {
  const cleanDate = String(inputs.date).slice(0, 16).replace(' ', '-').replace(':', '');
  const fiDays = ['sunnuntai', 'maanantai', 'tiistai', 'keskiviikko', 'torstai', 'perjantai', 'lauantai'];
  const dm = String(inputs.date).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  let createdAt = String(inputs.date);
  if (dm) {
    const wd = fiDays[new Date(Date.UTC(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]), 12)).getUTCDay()];
    createdAt = wd + ' ' + Number(dm[3]) + '.' + Number(dm[2]) + '.' + dm[1] + ' klo ' + dm[4] + ':' + dm[5];
  }

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

  const md = String(pickText(inputs.md, 0) || '').trim()
    .replace(/^```[a-zA-Z]*[ \t]*\r?\n?/, '')
    .replace(/\r?\n?```[ \t]*$/, '')
    .trim();

  if (md.length < 800) {
    throw new Error('LLM palautti liian vähän sisältöä (' + md.length + ' merkkiä). Julkaisua ei tehty.');
  }

  const esc = (s) => String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const inline = (text) => {
    let s = esc(text);
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (m, t, u) => '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + t + '</a>');
    s = s.replace(/(^|[\s(>])(https?:\/\/[^\s<)]+)/g, (m, p, u) => p + '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + u + '</a>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    return s;
  };

  const mdToHtml = (source) => {
    const lines = String(source).split(/\r?\n/);
    const out = [];
    let listType = null;
    let para = [];
    let quote = [];

    const flushPara = () => {
      if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; }
    };
    const flushQuote = () => {
      if (quote.length) { out.push('<blockquote>' + inline(quote.join(' ')) + '</blockquote>'); quote = []; }
    };
    const closeList = () => {
      if (listType) { out.push('</' + listType + '>'); listType = null; }
    };
    const flushAll = () => { flushPara(); flushQuote(); closeList(); };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) { flushAll(); continue; }

      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        flushAll();
        const lvl = Math.min(6, Math.max(2, h[1].length));
        out.push('<h' + lvl + '>' + inline(h[2]) + '</h' + lvl + '>');
        continue;
      }

      if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) { flushAll(); out.push('<hr>'); continue; }

      if (/^>\s?/.test(line)) {
        flushPara(); closeList();
        quote.push(line.replace(/^>\s?/, ''));
        continue;
      }

      const ol = line.match(/^(\d+)[.)]\s+(.*)$/);
      if (ol) {
        flushPara(); flushQuote();
        if (listType !== 'ol') { closeList(); out.push('<ol>'); listType = 'ol'; }
        out.push('<li>' + inline(ol[2]) + '</li>');
        continue;
      }

      const ul = line.match(/^[-*+]\s+(.*)$/);
      if (ul) {
        flushPara(); flushQuote();
        if (listType !== 'ul') { closeList(); out.push('<ul>'); listType = 'ul'; }
        out.push('<li>' + inline(ul[1]) + '</li>');
        continue;
      }

      closeList();
      flushQuote();
      para.push(line);
    }
    flushAll();
    return out.join('\n');
  };

  const sourceList = Array.isArray(inputs.sources) ? inputs.sources : [];
  const renderSources = (list) => {
    if (!list.length) return '<p>Lähdeluetteloa ei saatu muodostettua.</p>';
    const items = list.map((s) => {
      const i = s || {};
      const meta = [i.domain, i.date].filter(Boolean).join(', ');
      return '<li><a href="' + esc(i.url) + '" target="_blank" rel="noopener noreferrer">' + esc(i.title) + '</a>'
        + (meta ? '<span class="src-meta">' + esc(meta) + '</span>' : '') + '</li>';
    });
    return '<ol class="sources">' + items.join('') + '</ol>';
  };

  let body = mdToHtml(md);
  const hasSourcesHeading = /(^|\n)#{1,6}\s*Lähteet/i.test(md);
  const sourcesHtml = hasSourcesHeading
    ? ''
    : '<section class="card" id="lahteet"><h2>Käytetyt lähteet</h2>' + renderSources(sourceList) + '</section>';

  const period = String(inputs.period || '');
  const banner = '<div class="banner">Raportti luotu: ' + esc(createdAt)
    + (period ? ' · kausi ' + esc(period) : '')
    + (inputs.sourceCount ? ' · ' + esc(inputs.sourceCount) + ' lähdettä / ' + esc(inputs.domainCount) + ' domainia' : '')
    + '</div>';

  const css = ':root{--pl-red:#dc143c;--ink:#1f2933;--muted:#5c6b7a;--bg:#f7f8fa;--card:#fff;--line:#e3e8ee}'
    + '*{box-sizing:border-box}'
    + 'body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}'
    + '.wrap{max-width:860px;margin:0 auto;padding:0 18px 64px}'
    + '.banner{background:#eef2f6;border-bottom:1px solid #cbd5e1;color:#475569;font:14px/1.4 Arial,sans-serif;padding:8px 16px;text-align:center}'
    + 'header.hero{background:linear-gradient(180deg,#fff 0%,#fff 50%,#dc143c 50%,#dc143c 100%);border-bottom:6px solid #b01030;padding:28px 0 0;margin-bottom:28px}'
    + 'header.hero .inner{background:#fff;border:1px solid var(--line);border-radius:14px;padding:26px 24px;margin:0 18px 26px;max-width:824px}'
    + 'h1{font-size:30px;line-height:1.25;margin:0 0 8px;letter-spacing:-.2px}'
    + 'h1 .flag{color:var(--pl-red)}'
    + '.subtitle{color:var(--muted);font-size:15px;margin:0}'
    + 'h2{font-size:23px;margin:38px 0 12px;padding-left:12px;border-left:5px solid var(--pl-red)}'
    + 'h3{font-size:19px;margin:26px 0 8px;color:#111}'
    + 'p{margin:0 0 14px}'
    + 'ul,ol{margin:0 0 16px;padding-left:22px}'
    + 'li{margin:0 0 7px}'
    + 'blockquote{margin:16px 0;padding:12px 16px;background:#fff;border-left:4px solid #cbd5e1;color:var(--muted);border-radius:0 10px 10px 0}'
    + 'a{color:#0b5cad;text-decoration:none;border-bottom:1px solid rgba(11,92,173,.25)}'
    + 'a:hover{border-bottom-color:#0b5cad}'
    + 'hr{border:0;border-top:1px solid var(--line);margin:30px 0}'
    + 'section.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:22px 24px;margin:0 0 22px;box-shadow:0 1px 2px rgba(16,24,40,.04)}'
    + 'ol.sources{padding-left:20px}'
    + 'ol.sources li{margin:0 0 10px;font-size:15px}'
    + '.src-meta{display:block;color:var(--muted);font-size:13px}'
    + 'footer{color:var(--muted);font-size:13px;border-top:1px solid var(--line);margin-top:34px;padding-top:16px}'
    + '@media (max-width:640px){body{font-size:16px}h1{font-size:25px}h2{font-size:20px}.wrap{padding:0 12px 48px}header.hero .inner{margin:0 12px 20px;padding:20px 16px}}';

  const html = '<!DOCTYPE html>\n<html lang="fi">\n<head>\n<meta charset="utf-8">\n'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
    + '<title>Puola puhuu – mistä puolalaiset keskustelevat nyt</title>\n'
    + '<style>' + css + '</style>\n</head>\n<body>\n'
    + banner + '\n<div class="wrap">\n'
    + '<header class="hero"><div class="inner"><h1><span class="flag">Puola puhuu</span> – mistä puolalaiset keskustelevat nyt</h1>'
    + '<p class="subtitle">Suomenkielinen katsaus puolalaisen median, keskustelupalstojen ja somen puheenaiheisiin'
    + (period ? ' · kausi ' + esc(period) : '') + '</p></div></header>\n'
    + '<main>\n' + body + '\n</main>\n'
    + sourcesHtml + '\n'
    + '<footer>Katsaus on koostettu puolankielisistä uutis-, aikakaus- ja keskustelulähteistä. Lähdeluettelo yllä.</footer>\n'
    + '</div>\n</body>\n</html>';

  if (html.toLowerCase().indexOf('</html>') < 0) {
    throw new Error('HTML-dokumentti ei valmistunut.');
  }

  return {
    base64: Buffer.from(html, 'utf-8').toString('base64'),
    timestamp: cleanDate,
    textLength: md.length,
    htmlLength: html.length,
    sourceCount: sourceList.length
  };
};
