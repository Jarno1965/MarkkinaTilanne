// Hakee Nasdaq Helsingin yritystiedotteet, seuloo merkittavat ja ristiintarkistaa
// Arvopaperin ja Kauppalehden etusivut. Palauttaa tiiviin tekstilohkon LLM:lle.
export const code = async (inputs) => {
  const WINDOW_HOURS = 24;
  const MAX_ITEMS = 5;

  const decodeEntities = function (s) {
    return String(s || '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(Number(n)); });
  };

  const fetchText = async function (url, timeoutMs) {
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, timeoutMs || 20000);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
          'accept': 'text/html,application/json,*/*'
        }
      });
      if (!res.ok) { throw new Error('HTTP ' + res.status); }
      return await res.text();
    } finally {
      clearTimeout(timer);
    }
  };

  const nowText = String(inputs.date || '').trim();
  const now = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(nowText)
    ? new Date(nowText.replace(' ', 'T') + ':00Z')
    : new Date();
  const nowMs = isNaN(now.getTime()) ? Date.now() : now.getTime();
  const cutoff = nowMs - WINDOW_HOURS * 3600 * 1000;

  const parseTime = function (s) {
    const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!m) { return 0; }
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] || 0));
  };

  // Rajapinta antaa ajat CET/CEST-ajassa. Suomen aika on siita aina yhden tunnin edella.
  const formatTime = function (s) {
    const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
    if (!m) { return String(s || ''); }
    const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]) + 1, Number(m[5])));
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    return d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.' + d.getUTCFullYear() + ' klo ' + hh + ':' + mm;
  };

  // 1) Nasdaq Nordic -tiedotteet (CNS-rajapinta, JSONP). Haetaan enintaan 4 sivua,
  // jotta 24 tunnin ikkuna tayttyy myos vilkkaina paivina.
  let rawItems = [];
  let nasdaqError = '';
  try {
    for (let page = 0; page < 4; page++) {
      const params = new URLSearchParams({
        globalName: 'NordicAllMarkets',
        freeText: '',
        cnsCategory: '',
        notCnsCategory: '',
        market: 'Helsinki',
        company: '',
        fromDate: '',
        toDate: '',
        displayLanguage: 'fi',
        callback: 'cb',
        countResults: 'true',
        timeZone: 'CET',
        dateMask: 'yyyy-MM-dd HH:mm:ss',
        limit: '100',
        start: String(page * 100),
        dir: 'DESC'
      });
      const body = await fetchText('https://api.news.eu.nasdaq.com/news/query.action?' + params.toString(), 25000);
      const jsonText = body.replace(/^[^(]*\(/, '').replace(/\)\s*;?\s*$/, '');
      const data = JSON.parse(jsonText);
      const items = (data && data.results && data.results.item) || [];
      rawItems = rawItems.concat(items);
      if (items.length < 100) { break; }
      let oldest = 0;
      for (const it of items) {
        const t = parseTime(it.releaseTime || it.published);
        if (t && (!oldest || t < oldest)) { oldest = t; }
      }
      if (oldest && oldest < cutoff) { break; }
    }
  } catch (e) {
    nasdaqError = String((e && e.message) || e);
  }

  // 2) Etusivujen otsikot ristiintarkistusta varten
  const frontTitles = { arvopaperi: [], kauppalehti: [] };
  const frontErrors = [];
  const readFront = async function (key, url) {
    try {
      const html = await fetchText(url, 25000);
      const seen = {};
      const re = /<a\b[^>]*href="([^"]*\/uutiset\/a\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
      let m;
      while ((m = re.exec(html))) {
        const title = decodeEntities(m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
        if (title.length < 20 || seen[title]) { continue; }
        seen[title] = true;
        frontTitles[key].push(title);
      }
    } catch (e) {
      frontErrors.push(key + ': ' + String((e && e.message) || e));
    }
  };
  await readFront('arvopaperi', 'https://www.arvopaperi.fi/');
  await readFront('kauppalehti', 'https://www.kauppalehti.fi/');
  const arvoText = frontTitles.arvopaperi.join(' | ').toLowerCase();
  const klText = frontTitles.kauppalehti.join(' | ').toLowerCase();

  // 3) Merkittavyyden pisteytys
  const CATEGORY_RULES = [
    [/sisäpiiritieto/i, 5],
    [/pääomatapahtuma/i, 4],
    [/osavuosikatsaus|puolivuotiskatsaus|tilinpäätös/i, 4],
    [/muutokset hallitus\/johto/i, 2],
    [/yhtiötiedote|sijoittajauutiset|company announcement/i, 1],
    [/muut pörssin sääntöjen nojalla|muu informaatio|yhtiökokouksen päätökset/i, 0],
    [/substanssiarvo/i, -2],
    [/listalleottoesite/i, -3],
    [/tulosjulkistamisajankohdat|yhtiökokouskutsu/i, -4],
    [/omien osakkeiden omistuksessa/i, -4],
    [/johtohenkilöiden liiketoimet|johtajien suorittamista transaktioista/i, -6]
  ];

  const NEGATIVE_RULES = [
    [/johdon liiketoimet|managers'? transactions?/i, -6],
    [/taloudellinen (raportointi|tiedottaminen)|tulosjulkistamisajankohdat/i, -5],
    [/omien osakkeiden|osakemäärä|äänimäärä|osakkeenomistajien lukumäärä/i, -4],
    [/yhtiökokouskutsu|ennakkoilmoittautuminen|verkkolähetys|webcast|esitysmateriaali/i, -4],
    [/vuosikertomus|palkitsemisraportti|selvitys hallinto|tilintarkastus|listalleottoesite/i, -4],
    [/optio|osakepohjainen palkitseminen/i, -4],
    [/rekisteröinti|kaupankäyntitunnus/i, -3]
  ];

  const POSITIVE_RULES = [
    [/tulosvaroitus|varoittaa|alentaa (ohjeistusta|näkymiä)|nostaa (ohjeistusta|näkymiä)/i, 6],
    [/konkurssi|saneeraus|yrityssaneeraus|uudelleenjärjestely/i, 6],
    [/yrityskauppa|sulautuminen|jakautuminen|divestointi|liiketoiminnan (myynti|osto)|myy |myymällä|myynti|ostaa /i, 5],
    [/osinko|pääomanjako|osakeanti|suunnattu anti|rahoitusjärjestely|lainajärjestely/i, 5],
    [/toimitusjohtaja|talousjohtaja|hallituksen puheenjohtaja/i, 4],
    [/yhteistoimintaneuvottelut|lomautus|irtisanominen|henkilöstövähennys/i, 4],
    [/arvonalentuminen|alaskirjaus/i, 4],
    [/ohjeistus|näkymät|ennuste/i, 3],
    [/merkittävä (tilaus|sopimus)|investointi|tehdas|tuotanto|kapasiteetti|laajennus/i, 2],
    [/puolustusvoimat|hankkii|hankinta|miljoonan euron|miljoonalla eurolla|m€/i, 2],
    [/tulos|liikevaihto|liiketulos|kannattavuus|kasvu|paranee|parani|ennätys/i, 2]
  ];

  const LARGE_CAPS = ['nokia', 'nordea', 'sampo', 'kone', 'neste', 'fortum', 'upm', 'stora enso', 'wärtsilä', 'metso', 'outokumpu', 'kesko', 'elisa', 'tietoevry', 'konecranes', 'valmet', 'orion', 'nokian renkaat', 'finnair', 'huhtamäki', 'metsä board', 'qt group', 'kemira', 'sanoma', 'fiskars', 'mandatum', 'kalmar', 'kojamo', 'citycon', 'tokmanni', 'cargotec', 'terveystalo', 'vaisala', 'ponsse'];

  const companyTokens = function (name) {
    const generic = ['oyj', 'abp', 'plc', 'oy', 'ab', 'group', 'konserni', 'bank', 'corporation', 'company', 'finland', 'nordic', 'holding'];
    return String(name || '')
      .toLowerCase()
      .replace(/[^a-zåäö0-9\- &]/g, ' ')
      .split(/[\s&]+/)
      .filter(function (t) { return t.length >= 4 && generic.indexOf(t) < 0; });
  };

  const matchesFront = function (name) {
    const tokens = companyTokens(name);
    const hits = [];
    if (tokens.some(function (t) { return arvoText.indexOf(t) >= 0; })) { hits.push('Arvopaperi'); }
    if (tokens.some(function (t) { return klText.indexOf(t) >= 0; })) { hits.push('Kauppalehti'); }
    return hits;
  };

  const HARD_EXCLUDE_CATEGORY = /johtohenkilöiden liiketoimet|johtajien suorittamista transaktioista|omien osakkeiden omistuksessa|tulosjulkistamisajankohdat|yhtiökokouskutsu|listalleottoesite|substanssiarvo/i;
  const HARD_EXCLUDE_HEADLINE = /johdon liiketoimet|managers'? transactions?|taloudellinen (raportointi|tiedottaminen)|osakkeenomistajien lukumäärä|äänimäärä/i;

  const seenIds = {};
  const candidates = [];
  for (const it of rawItems) {
    const market = String(it.market || '');
    if (!/helsinki|first north finland/i.test(market)) { continue; }
    const id = String(it.disclosureId || '');
    if (id && seenIds[id]) { continue; }
    if (id) { seenIds[id] = true; }
    const ms = parseTime(it.releaseTime || it.published);
    if (!ms || ms < cutoff) { continue; }

    const category = String(it.cnsCategory || '');
    const headline = decodeEntities(String(it.headline || '').replace(/\s+/g, ' ').trim());
    if (!headline) { continue; }

    let score = 0;
    for (const r of CATEGORY_RULES) { if (r[0].test(category)) { score += r[1]; break; } }
    for (const r of NEGATIVE_RULES) { if (r[0].test(headline)) { score += r[1]; } }
    for (const r of POSITIVE_RULES) { if (r[0].test(headline)) { score += r[1]; } }

    const company = String(it.company || '').trim();
    const companyLower = company.toLowerCase();
    if (LARGE_CAPS.some(function (c) { return companyLower.indexOf(c) >= 0; })) { score += 2; }
    const media = matchesFront(company);
    if (media.length) { score += 4; }

    const excluded = HARD_EXCLUDE_CATEGORY.test(category) || HARD_EXCLUDE_HEADLINE.test(headline);
    if (excluded || score < 6) { continue; }

    candidates.push({
      company: company,
      headline: headline,
      category: category,
      time: String(it.releaseTime || it.published || ''),
      timeLabel: formatTime(it.releaseTime || it.published),
      ms: ms,
      url: String(it.messageUrl || ''),
      language: String(it.language || ''),
      score: score,
      media: media
    });
  }

  // Sama yhtiö ja kategoria samana päivänä: pidetään vain yksi (esim. alkuperäinen + korjaus).
  candidates.sort(function (a, b) {
    if (b.score !== a.score) { return b.score - a.score; }
    if (a.language === 'fi' && b.language !== 'fi') { return -1; }
    if (b.language === 'fi' && a.language !== 'fi') { return 1; }
    return b.ms - a.ms;
  });
  const unique = [];
  const dedupe = {};
  for (const c of candidates) {
    const key = c.company.toLowerCase() + '|' + c.category.toLowerCase();
    if (dedupe[key]) { continue; }
    dedupe[key] = true;
    unique.push(c);
  }

  const chosen = unique.slice(0, MAX_ITEMS);
  const lines = [];
  lines.push('YHTIÖTIEDOTTEET (Nasdaq Helsinki, viimeiset ' + WINDOW_HOURS + ' h; valmiiksi seulottu)');
  lines.push('Kaikki tiedotteet: https://www.nasdaq.com/fi/european-market-activity/news/company-news');
  if (nasdaqError) {
    lines.push('HUOM: tiedotteiden haku epäonnistui (' + nasdaqError + '). Älä keksi tiedotteita.');
  } else if (!chosen.length) {
    lines.push('Merkittäviä yhtiötiedotteita ei löytynyt. Älä keksi niitä.');
  } else {
    for (let i = 0; i < chosen.length; i++) {
      const c = chosen[i];
      const media = c.media.length ? ' | myös: ' + c.media.join(', ') : '';
      lines.push((i + 1) + ') ' + c.company + ' | ' + c.category + ' | ' + c.timeLabel + ' | ' + c.headline + ' | ' + c.url + media);
    }
  }
  lines.push('Tarkistettu ' + rawItems.length + ' tiedotetta, merkittavaksi arvioitu ' + chosen.length + '.');

  return {
    companyNews: lines.join('\n'),
    stats: {
      fetched: rawItems.length,
      significant: chosen.length,
      nasdaqError: nasdaqError,
      frontErrors: frontErrors,
      arvopaperiTitles: frontTitles.arvopaperi.length,
      kauppalehtiTitles: frontTitles.kauppalehti.length
    }
  };
};