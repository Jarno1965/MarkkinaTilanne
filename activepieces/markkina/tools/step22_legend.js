// step_22: liittaa karkiteemaosion peraan pienen selityksen siita, miten naytvyyspisteet muodostuvat.
// Selitys on kiinteaa teksta, joten se tulee raporttiin aina - riippumatta siita, mita LLM kirjoittaa.
export const code = async (inputs) => {
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

  const cleanFences = function (value) {
    return String(value || '').trim()
      .replace(/^```[a-zA-Z]*[ \t]*\r?\n?/, '')
      .replace(/\r?\n?```[ \t]*$/, '')
      .trim();
  };

  let fragment = cleanFences(pickText(inputs.fragment, 0));
  if (/^<!doctype/i.test(fragment) || /<html/i.test(fragment)) {
    fragment = '';
  }

  const legend = [
    '<details style="max-width:1040px;margin:-22px auto 34px;padding:0 16px;font-size:.8rem;color:#64748b;line-height:1.55;">',
    '<summary style="cursor:pointer;color:#475569;font-weight:600;">Mistä näkyvyyspisteet muodostuvat?</summary>',
    '<p style="margin:8px 0 0;">Näkyvyyspisteet (0–100) lasketaan neljästä osasta: kuinka moni eri media toistaa samaa teemaa (55 %), kuinka monessa eri uutissyötteessä se esiintyy (20 %), kuinka monta uutista siitä on (15 %) ja kuinka tuorein uutinen on (10 %).</p>',
    '<p style="margin:6px 0 0;">Täydet osapisteet tulevat 12 eri mediasta, 4 eri syötteestä, 20 uutisesta ja alle vuorokauden tuoreudesta. Sanalliset luokat: <strong>vahva</strong> 60 p. tai enemmän, <strong>kohtalainen</strong> 40–59 p., <strong>heikko</strong> 25–39 p. Alle 25 pisteen teemoja ei näytetä.</p>',
    '<p style="margin:6px 0 0;">Pisteet mittaavat huomiota, eivät kurssien suuntaa: nousun tai laskun ratkaisee aina kurssiluku. Saman otsikon toistot eri syötteissä on poistettu, ja yli 30 tuntia vanhat uutiset on jätetty laskennan ulkopuolelle. Jos kaksi kärkiteemaa kertoo samasta asiasta, ne on yhdistetty yhdeksi riviksi taulukossa.</p>',
    '</details>'
  ].join('');

  return {
    html: fragment ? fragment + '\n' + legend : legend,
    fragmentChars: fragment.length
  };
};
