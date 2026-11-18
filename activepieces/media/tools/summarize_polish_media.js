export const code = async (inputs) => {
  // Summarize translated Polish media content
  const FALLBACK = [
    'polish media weekly summary',
    'what polish people are talking about this week'
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

  // Find extractor text content from any response structure
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
      if (Array.isArray(v.articles)) { return v.articles; }
      return [v];
    }
    return [];
  };

  const rawText = deepText(inputs.raw !== undefined && inputs.raw !== null && inputs.raw !== '' ? inputs.raw : inputs.translated_articles, 0);
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

  const articles = collect(jsonText);
  const topics = [];
  const summaries = [];

  for (const article of articles) {
    if (!article || typeof article !== 'object') { continue; }
    const title = clip(article.title || article.originalTitle || '', 90);
    const content = clip(article.content || article.summary || '', 300);
    if (title || content) {
      summaries.push({ title: title, content: content, url: article.url || '' });
    }
  }

  return {
    summaries: JSON.stringify(summaries.slice(0, 10)),
    summary_count: summaries.length,
    raw_preview: rawPreview,
    topic_summary: summaries.length > 0 
      ? summaries.slice(0, 5).map(item => `- ${item.title}: ${item.content}`).join(' ;; ')
      : 'no polish media stories found'
  };
};