// step_21: etusivujen karkiteemojen painoarvo.
// Mittaa, kuinka moni eri media ja kuinka monessa syotteessa samaa teemaa toistetaan,
// kuinka tuore se on ja kuinka paljon siita on uutisia. Painoarvo ei ole suunta:
// suunnan ratkaisevat kurssit (step_6 ja step_18), jotka LLM saa erikseen.
export const code = async (inputs) => {
  const parseArray = (value) => {
    let v = value;
    if (typeof v === 'string') {
      const t = v.trim();
      if (!t) { return []; }
      try { v = JSON.parse(t); } catch (e) { return []; }
    }
    if (Array.isArray(v)) { return v; }
    if (v && Array.isArray(v.items)) { return v.items; }
    if (v && Array.isArray(v.results)) { return v.results; }
    return [];
  };

  const FEEDS = [
    { match: 'section/topic/BUSINESS?hl=fi', name: 'Google Uutiset Talous (FI)' },
    { match: 'section/topic/BUSINESS', name: 'Google News Business (US)' },
    { match: 'section/topic/TECHNOLOGY', name: 'Google News Technology (US)' },
    { match: 'mw_topstories', name: 'MarketWatch' },
    { match: 'nasdaq.com/feed', name: 'Nasdaq' },
    { match: 'ft.com/rss', name: 'FT' },
    { match: 'yle.fi', name: 'Yle' }
  ];

  const feedNameOf = (url) => {
    const u = String(url || '');
    for (let i = 0; i < FEEDS.length; i++) {
      if (u.indexOf(FEEDS[i].match) >= 0) { return FEEDS[i].name; }
    }
    const m = u.match(/^https?:\/\/([^\/]+)/i);
    return m ? m[1].replace(/^www\./i, '') : 'tuntematon';
  };

  const domainOf = (url) => {
    const m = String(url || '').match(/^https?:\/\/([^\/]+)/i);
    return m ? m[1].replace(/^www\./i, '').toLowerCase() : '';
  };

  const QUALITY_NAMES = {
    'wsj.com': 'WSJ',
    'bloomberg.com': 'Bloomberg',
    'reuters.com': 'Reuters',
    'ft.com': 'FT',
    'cnbc.com': 'CNBC',
    'marketwatch.com': 'MarketWatch',
    'finance.yahoo.com': 'Yahoo Finance'
  };

  const THEMES = [
    {
      id: 'tekoaly',
      label: 'Tekoäly ja sen rahoitus',
      patterns: [/tekoäly/i, /\bai\b/i, /artificial intelligence/i, /anthropic/i, /openai/i, /chatgpt/i, /claude/i, /nvidia/i, /semiconductor/i, /\bchip/i, /siru/i, /data ?center/i, /konesali/i, /capex/i],
      transmission: 'Nasdaq 100 -futuurit, S&P 500 ja puolijohteet; Helsingissä teknologia ja Nokian alihankkijat'
    },
    {
      id: 'listautumiset',
      label: 'Listautumiset ja pääomamarkkina',
      patterns: [/\bipo\b/i, /listautu/i, /listing/i, /debut/i, /first trade/i, /oversubscri/i, /ylimerk/i, /antihinta/i],
      transmission: 'Nasdaq ja riskinottohalukkuus; annin kysyntä kertoo, paljonko sijoittajat maksavat kasvusta'
    },
    {
      id: 'korot',
      label: 'Korot ja keskuspankit',
      patterns: [/federal reserve/i, /\bfed\b/i, /fomc/i, /interest[- ]rate/i, /rate (cut|hike)/i, /korko/i, /\becb\b/i, /central bank/i, /keskuspankki/i, /yield/i, /\bminutes\b/i],
      transmission: 'S&P 500 ja Nasdaq, EUR/USD, korkotuotot, pankit ja kiinteistösektori'
    },
    {
      id: 'tulokset',
      label: 'Tuloskausi ja ohjeistukset',
      patterns: [/earnings/i, /guidance/i, /quarterly/i, /tulosjulkistus/i, /tulosvaroitus/i, /profit warning/i, /revenue/i, /q[1-4] ?20\d\d/i],
      transmission: 'Yhtiökohtaiset liikkeet ja sektorien indeksit'
    },
    {
      id: 'oljy',
      label: 'Öljy ja energia',
      patterns: [/oil/i, /brent/i, /\bwti\b/i, /opec/i, /crude/i, /öljy/i, /natural gas/i, /maakaasu/i, /refinery/i],
      transmission: 'Öljyn hinta ja energialuokka; vaikuttaa inflaatiokuvaan ja sitä kautta korkoihin'
    },
    {
      id: 'kulta',
      label: 'Kulta ja turvasatamat',
      patterns: [/gold/i, /kulta/i, /bullion/i, /safe haven/i, /turvasatama/i, /silver/i, /hopea/i],
      transmission: 'Kulta, hopea ja USD; turvasatamien kysyntä kertoo riskinottohalukkuudesta'
    },
    {
      id: 'tullit',
      label: 'Tullit ja kauppapolitiikka',
      patterns: [/tariff/i, /tulli/i, /trade war/i, /kauppasota/i, /export control/i, /vientirajoit/i, /sanction/i, /pakote/i],
      transmission: 'Kiina-riippuvainen teollisuus, eurooppalaiset autonvalmistajat ja toimitusketjut'
    },
    {
      id: 'kiina',
      label: 'Kiina ja Aasia',
      patterns: [/china/i, /kiina/i, /beijing/i, /pboc/i, /stimulus/i, /elvytys/i, /hang seng/i, /shanghai/i],
      transmission: 'Hang Seng ja Shanghai; Euroopassa luksus, konepajat ja kupari'
    },
    {
      id: 'valuutat',
      label: 'Valuutat',
      patterns: [/dollar/i, /euro/i, /\byen\b/i, /currency/i, /valuutta/i, /\bfx\b/i, /exchange rate/i],
      transmission: 'EUR/USD ja dollarimääräiset raaka-aineet; vientiyhtiöt Helsingissä'
    },
    {
      id: 'pankit',
      label: 'Pankit ja luotto',
      patterns: [/\bbank/i, /pankki/i, /credit/i, /luotto/i, /lending/i, /default/i],
      transmission: 'Pankkiosakkeet ja rahoitussektori, luottoriskimarginaalit'
    },
    {
      id: 'puolustus',
      label: 'Puolustus ja geopolitiikka',
      patterns: [/defen[cs]e/i, /puolustus/i, /nato/i, /ukrain/i, /military/i, /aseapu/i, /\bwar\b/i, /\bsota\b/i],
      transmission: 'Puolustusteollisuus, Euroopan indeksit ja öljyn riskipreemio'
    },
    {
      id: 'makro',
      label: 'Makrotalous',
      patterns: [/inflation/i, /inflaatio/i, /\bcpi\b/i, /payroll/i, /jobs report/i, /unemployment/i, /työttömyys/i, /\bgdp\b/i, /\bpmi\b/i, /retail sales/i],
      transmission: 'Korot, dollari ja indeksit; makroluku muuttaa korko-odotuksia'
    },
    {
      id: 'helsinki',
      label: 'Helsingin pörssi ja Suomi',
      patterns: [/helsinki/i, /\bomx/i, /\bnokia\b/i, /\bfortum\b/i, /\bsampo\b/i, /\bneste\b/i, /\bmetso\b/i, /wartsila/i, /\bupm\b/i, /\bstora\b/i, /pörssi/i],
      transmission: 'OMX Helsinki 25 ja kotimaiset yhtiöt'
    }
  ];

  const pubFromTitle = (title) => {
    const m = String(title || '').match(/\s[-–]\s([^\-–|]{2,45})\s*$/);
    return m ? m[1].trim() : '';
  };

  const trimPub = (title) => String(title || '')
    .replace(/\s[-–]\s[^\-–|]{2,45}\s*$/, '')
    .trim();

  const timeFmt = new Intl.DateTimeFormat('fi-FI', {
    timeZone: 'Europe/Helsinki',
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
  });

  const stamp = (epoch) => {
    if (!epoch || !isFinite(epoch)) { return 'aika ei tiedossa'; }
    const parts = {};
    timeFmt.formatToParts(new Date(epoch)).forEach((p) => { parts[p.type] = p.value; });
    return Number(parts.day) + '.' + Number(parts.month) + '. klo ' + parts.hour + ':' + parts.minute;
  };

  const ageText = (hours) => {
    if (hours === null || !isFinite(hours) || hours < 0) { return 'aika ei tiedossa'; }
    if (hours < 1) { return 'alle 1 h sitten'; }
    if (hours < 48) { return Math.round(hours) + ' h sitten'; }
    return Math.round(hours / 24) + ' vrk sitten';
  };

  // Aamuraportti ajetaan 06:00 Helsingin aikaa, joten vertailuhetki on kesäaikana UTC-2.
  const nowEpoch = (() => {
    const raw = String(inputs.now || '');
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (m) {
      return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] || 0)) - 2 * 3600000;
    }
    return Date.now();
  })();

  const entries = [];

  parseArray(inputs.front_items).forEach((raw) => {
    const item = raw || {};
    const feedUrl = String(item.feed_url || '');
    const isGoogle = /news\.google\.com/.test(feedUrl);
    const title = String(item.title || '');
    const feed = feedNameOf(feedUrl);
    const link = String(item.link || '');
    const at = Date.parse(String(item.published_at || item.published || ''));
    entries.push({
      title: isGoogle ? trimPub(title) : title,
      publisher: isGoogle ? (pubFromTitle(title) || feed) : feed,
      feed: feed,
      at: isFinite(at) ? at : null,
      link: link,
      citable: !isGoogle && /^https?:/i.test(link)
    });
  });

  parseArray(inputs.quality_results).forEach((raw) => {
    const item = raw || {};
    const link = String(item.url || item.link || '');
    const host = domainOf(link);
    const at = Date.parse(String(item.published_date || item.published_at || ''));
    entries.push({
      title: String(item.title || ''),
      publisher: QUALITY_NAMES[host] || host,
      feed: 'laatulehdet',
      at: isFinite(at) ? at : null,
      link: link,
      citable: /^https?:/i.test(link)
    });
  });

  const usable = entries.filter((e) => {
    if (!e.title) { return false; }
    if (e.at === null) { return true; }
    return (nowEpoch - e.at) / 3600000 <= 30;
  });

  const seen = {};
  const unique = [];
  usable.forEach((e) => {
    const key = e.title.toLowerCase().replace(/[^a-z0-9äöå]+/g, ' ').trim().split(' ').slice(0, 6).join(' ');
    if (key && seen[key]) { return; }
    if (key) { seen[key] = true; }
    unique.push(e);
  });

  const ranked = [];
  THEMES.forEach((theme) => {
    const hits = unique.filter((e) => theme.patterns.some((p) => p.test(e.title)));
    if (!hits.length) { return; }

    const publishers = {};
    const feeds = {};
    let newest = null;
    hits.forEach((e) => {
      publishers[e.publisher || e.feed] = true;
      feeds[e.feed] = true;
      if (e.at !== null && (newest === null || e.at > newest)) { newest = e.at; }
    });

    const outlets = Object.keys(publishers).length;
    const feedCount = Object.keys(feeds).length;
    const ageHours = newest === null ? null : (nowEpoch - newest) / 3600000;
    const freshNorm = ageHours === null ? 0 : Math.max(0, 1 - ageHours / 24);
    // Painot: eri mediat 55 %, eri syotteet 20 %, uutismaara 15 %, tuoreus 10 %.
    const scoreRaw = 0.55 * Math.min(1, outlets / 12)
      + 0.20 * Math.min(1, feedCount / 4)
      + 0.15 * Math.min(1, hits.length / 20)
      + 0.10 * freshNorm;

    ranked.push({
      id: theme.id,
      label: theme.label,
      score: Math.round(scoreRaw * 100),
      outlets: outlets,
      feeds: feedCount,
      hits: hits.length,
      ageHours: ageHours,
      transmission: theme.transmission,
      examples: hits.slice().sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 2)
    });
  });

  ranked.sort((a, b) => b.score - a.score);

  const labelOf = (score) => {
    if (score >= 60) { return 'vahva'; }
    if (score >= 40) { return 'kohtalainen'; }
    if (score >= 25) { return 'heikko'; }
    return 'vähäinen';
  };

  const clean = (text) => String(text || '').replace(/"/g, "'").replace(/\s+/g, ' ').trim();

  const lines = [];
  lines.push('ETUSIVUJEN KÄRKITEEMAT - mitattu näkyvyys, ei tulkintaa suunnasta.');
  lines.push('Mittaus: kuinka moni eri media toistaa teemaa, kuinka monessa eri syötteessä se on, kuinka monta uutista siitä on ja kuinka tuore se on. Näkyvyyspisteet on laskettu valmiiksi, älä muuta niitä.');
  lines.push('Huom: teemat voivat mennä päällekkäin, koska sama uutinen voi kuulua kahteen teemaan. Jos kaksi kärkiteemaa kertoo samasta asiasta (esimerkiksi tekoäly ja listautuminen samasta annista), yhdistä ne raportissa yhdeksi riviksi.');
  lines.push('');

  const shown = ranked.filter((r) => r.score >= 25).slice(0, 5);
  if (!shown.length) {
    lines.push('Kärkiteemoja ei saatu tänä aamuna ryhmiteltyä. Kirjoita osio varovasti ja kerro, että uutisvirran kärkiteemoja ei voitu mitata.');
  }

  shown.forEach((r, idx) => {
    lines.push((idx + 1) + '. ' + r.label + ' - NÄKYVYYS: ' + labelOf(r.score) + ' (' + r.score + ' p.)');
    lines.push('   ' + r.outlets + ' eri mediaa, ' + r.feeds + ' eri syötettä, ' + r.hits + ' uutista, tuorein ' + ageText(r.ageHours));
    r.examples.forEach((e) => {
      lines.push('   Esimerkki: "' + clean(e.title) + '" (' + clean(e.publisher || e.feed) + ', ' + stamp(e.at) + ')');
    });
    lines.push('   Välittyminen avaukseen: ' + r.transmission);
    lines.push('');
  });

  const others = ranked.filter((r) => r.score < 25).slice(0, 4);
  if (others.length) {
    lines.push('Taustalla näkyvät myös: ' + others.map((r) => r.label + ' (' + labelOf(r.score) + ')').join(', ') + '.');
    lines.push('');
  }

  const links = unique.filter((e) => e.citable).sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 6);
  const head = lines.join('\n');
  const tail = [];
  tail.push('SUORAT LINKIT - nämä on pakko näyttää osion lopussa lähdeluettelona (3-6 linkkiä, klikattavina; osoitteet ovat suoria, eivät hakukoneen uudelleenohjauksia):');
  if (links.length) {
    links.forEach((e) => {
      tail.push('- ' + clean(e.publisher || e.feed) + ': "' + clean(e.title) + '" ' + stamp(e.at) + ' - ' + e.link);
    });
  } else {
    tail.push('- Suoria linkkejä ei tällä kertaa saatu. Älä keksi osoitteita.');
  }
  tail.push('');
  tail.push('MUISTA: näkyvyys kertoo huomiosta, ei suunnasta. Suunnan ratkaisee kurssiluku, ja toteutunut tapahtuma arvioidaan toteutuneen tiedon kautta, ei ennakkouutisen sanamuodolla.');

  if (inputs.quality_answer) {
    tail.push('');
    tail.push('LAATULEHTIEN TIIVISTELMÄ (WSJ, Bloomberg, Reuters, FT, CNBC): ' + clean(String(inputs.quality_answer)).slice(0, 800));
  }

  // Linkkiosio pidetaan aina mukana: tarvittaessa teemaosaa lyhennetaan.
  const tailText = tail.join('\n');
  const headBudget = 6600 - tailText.length;
  let block = head + '\n' + tailText;
  if (head.length > headBudget && headBudget > 300) {
    block = head.slice(0, headBudget) + '\n... (lyhennetty)\n' + tailText;
  }

  const topThemes = ranked.slice(0, 5).map((r) => r.id + '=' + labelOf(r.score)).join(', ');
  const frontCount = parseArray(inputs.front_items).length;
  const qualityCount = parseArray(inputs.quality_results).length;

  return {
    prominenceBlock: block,
    topThemes: topThemes || 'ei teemoja',
    itemCount: unique.length,
    diagnostics: 'etusivut=' + frontCount + ', laatulehdet=' + qualityCount + ', kaytetyt=' + unique.length + ', teemoja=' + ranked.length
  };
};
