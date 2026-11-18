/* =========================================================================
   Markkinatilanne – sovelluslogiikka
   Lukee syöterekisterin (feeds.json), hakee valitun syötteen raporttilistan
   GitHubin Contents API:sta, lajittelee raportit uusimmasta vanhimpaan ja
   näyttää valitun raportin iframessa (srcdoc).

   Syöte:                  data/<syöte>/  (esim. data/markkina/)
   Raportin tiedostonimi:  YYYY-MM-DD-HHMM-slug.html
   Esimerkki:              2026-11-13-0600-aamukatsaus.html
   ========================================================================= */

'use strict';

/* ------------------------------------------------------------------ asetukset
   owner ja repo päätellään automaattisesti GitHub Pages -osoitteesta.
   Jos automaattinen päätely ei toimi (esim. oma verkkotunnus), aseta arvot
   tähän suoraan. */

var CONFIG = {
  owner: '',
  repo: '',
  branch: 'main',

  // Raportit ovat syötekohtaisissa kansioissa muotoa data/<syöte>/.
  dataPath: 'data',

  // Syöterekisteri: mitkä katsaukset sivustolla näytetään ja missä
  // järjestyksessä. Uusi maa tai aihepiiri lisätään tähän tiedostoon.
  feedsUrl: 'feeds.json',

  // Käytetään, kun osoitteessa ei ole syötettä tai syötettä ei löydy.
  defaultFeed: 'markkina',

  // Raporttilistan välimuistin ikä sekunteina, syötekohtaisesti.
  listCacheSeconds: 300,

  // Kellonajan ja otsikon esitysasu. Uusi slotti toimii ilmankin,
  // mutta tähän lisäämällä se saa oman nimen ja kuvakkeen.
  slots: {
    'aamukatsaus':        { icon: '🌅', label: 'Aamukatsaus' },
    'eurooppa-avaus':     { icon: '🇪🇺', label: 'Euroopan avaus' },
    'paivan-yhteenveto':  { icon: '📊', label: 'Päivän yhteenveto' },
    'iltakatsaus':        { icon: '🌆', label: 'Iltakatsaus' }
  }
};

var FILE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})-(\d{4})-([a-z0-9-]+)\.html$/;
var TIME_ZONE = 'Europe/Helsinki';
var CACHE_PREFIX = 'markkinatilanne.lista.';

/* --------------------------------------------------------------- apuvälineet */

function $(id) { return document.getElementById(id); }

function parseReportName(name) {
  var match = FILE_PATTERN.exec(name);
  if (!match) return null;

  try {
    var time = match[4];
    var date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]),
                        Number(time.slice(0, 2)), Number(time.slice(2, 4)));
    
    // Validointi
    if (isNaN(date.getTime())) {
      console.warn('Virheellinen päivämäärä tiedostossa:', name);
      return null;
    }

    return {
      file: name,
      slug: match[5],
      date: date,
      dateKey: match[1] + '-' + match[2] + '-' + match[3],
      time: time.slice(0, 2) + ':' + time.slice(2, 4),
      sortKey: match[1] + match[2] + match[3] + time
    };
  } catch (e) {
    console.warn('Virhe päivämäärän parsinnassa:', name, e);
    return null;
  }
}

function formatDateLong(date) {
  if (isNaN(date.getTime())) return 'Virheellinen päivämäärä';
  return new Intl.DateTimeFormat('fi-FI', {
    timeZone: TIME_ZONE, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(date);
}

function dateKeyFor(date) {
  var parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  var map = {};
  parts.forEach(function (p) { map[p.type] = p.value; });
  return map.year + '-' + map.month + '-' + map.day;
}

function dayLabel(dateKey, todayKey, yesterdayKey) {
  if (dateKey === todayKey) return 'Tänään';
  if (dateKey === yesterdayKey) return 'Eilen';
  if (dateKey === 'invalid-date') return 'Virheellinen päivä';
  
  try {
    var parts = dateKey.split('-');
    if (parts.length !== 3) return dateKey;
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(d.getTime())) return dateKey;
    return new Intl.DateTimeFormat('fi-FI', {
      timeZone: TIME_ZONE, weekday: 'short', day: 'numeric', 
      month: 'short'
    }).format(d);
  } catch (e) {
    return dateKey;
  }
}

function slotInfo(slug) {
  var feed = feedInfo(state.activeFeed);
  if (feed && feed.slots && feed.slots[slug]) return feed.slots[slug];
  if (CONFIG.slots[slug]) return CONFIG.slots[slug];
  var label = slug.replace(/-/g, ' ');
  return { icon: '📄', label: label.charAt(0).toUpperCase() + label.slice(1) };
}

function isLocalHost() {
  var host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '' || window.location.protocol === 'file:';
}

/* --------------------------------------------------------------- syötteet
   Syöte on yksi raporttivirta (esim. markkina, media-se). feeds.json kertoo
   ryhmät ja niiden syötteet; koodi ei tunne yksittäisiä katsauksia. */

function feedInfo(feedId) {
  for (var i = 0; i < state.feeds.length; i++) {
    if (state.feeds[i].id === feedId) return state.feeds[i];
  }
  return null;
}

function feedTitle() {
  var feed = feedInfo(state.activeFeed);
  return feed ? feed.title : 'Markkinatilanne';
}

function applyFeeds(groups, defaultFeed) {
  state.groups = [];
  state.feeds = [];

  (groups || []).forEach(function (group) {
    if (!group || !Array.isArray(group.feeds) || group.feeds.length === 0) return;

    var feeds = group.feeds
      .filter(function (feed) { return feed && feed.id; })
      .map(function (feed) {
        return {
          id: String(feed.id),
          title: feed.title ? String(feed.title) : String(feed.id),
          icon: feed.icon ? String(feed.icon) : '📄',
          groupTitle: group.title ? String(group.title) : '',
          slots: feed.slots || null
        };
      });

    if (feeds.length === 0) return;

    state.groups.push({
      id: String(group.id || ''),
      title: group.title ? String(group.title) : '',
      feeds: feeds
    });
    state.feeds = state.feeds.concat(feeds);
  });

  if (defaultFeed && feedInfo(defaultFeed)) {
    state.defaultFeed = String(defaultFeed);
  } else if (feedInfo(CONFIG.defaultFeed)) {
    state.defaultFeed = CONFIG.defaultFeed;
  } else {
    state.defaultFeed = state.feeds.length ? state.feeds[0].id : '';
  }
}

function loadFeeds() {
  return fetch(CONFIG.feedsUrl, { cache: 'no-store' })
    .then(function (res) {
      if (!res.ok) throw new Error('Syöterekisteriä ei saatu ladattua (HTTP ' + res.status + ').');
      return res.json();
    })
    .then(function (json) {
      applyFeeds(json.groups, json.defaultFeed);
    })
    .catch(function () {
      // Jos rekisteri puuttuu, sivusto toimii yhdellä oletussyötteellä.
      applyFeeds([
        {
          id: CONFIG.defaultFeed,
          title: 'Katsaukset',
          feeds: [{ id: CONFIG.defaultFeed, title: 'Raportit' }]
        }
      ], CONFIG.defaultFeed);
    });
}

function renderFeeds() {
  var container = $('feed-list');
  container.textContent = '';

  // Valintaa ei näytetä, jos katsauksia on vain yksi.
  if (state.feeds.length < 2) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  state.groups.forEach(function (group) {
    var section = document.createElement('div');
    section.className = 'feed-group';

    if (group.title) {
      var heading = document.createElement('p');
      heading.className = 'feed-group__label';
      heading.textContent = group.title;
      section.appendChild(heading);
    }

    group.feeds.forEach(function (feed) {
      var active = feed.id === state.activeFeed;

      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'feed-item' + (active ? ' is-active' : '');
      button.setAttribute('data-feed', feed.id);
      if (active) button.setAttribute('aria-current', 'true');

      var icon = document.createElement('span');
      icon.className = 'feed-item__icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = feed.icon;

      var label = document.createElement('span');
      label.className = 'feed-item__label';
      label.textContent = feed.title;

      button.appendChild(icon);
      button.appendChild(label);
      section.appendChild(button);
    });

    container.appendChild(section);
  });
}

function parseHash() {
  var raw = window.location.hash.replace(/^#/, '');
  if (!raw) return { feed: '', file: '' };

  var parts = raw.split('/');
  if (parts.length > 1) return { feed: parts[0], file: parts.slice(1).join('/') };

  // Vanha muoto #2026-11-13-0600-aamukatsaus.html tarkoittaa oletussyötettä.
  if (FILE_PATTERN.test(parts[0])) return { feed: '', file: parts[0] };
  return { feed: parts[0], file: '' };
}

/* -------------------------------------------------------------------- tila */


/* ----------------------------------------------------- repositorion tiedot */

function resolveRepo() {
  if (CONFIG.owner && CONFIG.repo) return { owner: CONFIG.owner, repo: CONFIG.repo };

  var host = window.location.hostname;
  var segments = window.location.pathname.split('/').filter(Boolean);

  if (host.indexOf('.github.io') !== -1) {
    var owner = host.replace('.github.io', '');
    return { owner: owner, repo: segments.length > 0 ? segments[0] : owner + '.github.io' };
  }
  return { owner: '', repo: '' };
}

/* ------------------------------------------------- raporttilistan hakeminen */

function listFromCache(feedId) {
  try {
    var raw = sessionStorage.getItem(CACHE_PREFIX + feedId);
    if (!raw) return null;
    var parsed = JSON.parse(raw);
    if (!parsed || !parsed.time || !Array.isArray(parsed.reports)) return null;
    if (Date.now() - parsed.time > CONFIG.listCacheSeconds * 1000) return null;
    return parsed.reports;
  } catch (e) { return null; }
}

function saveToCache(feedId, reports) {
  try {
    sessionStorage.setItem(CACHE_PREFIX + feedId, JSON.stringify({ time: Date.now(), reports: reports }));
  } catch (e) { /* esim. yksityinen selaintila – ei haittaa */ }
}

function fetchLocalManifest(feedId) {
  return fetch('../' + CONFIG.dataPath + '/' + feedId + '/index.json', { cache: 'no-store' })
    .then(function (res) {
      if (!res.ok) throw new Error('Paikallista listaa ei löytynyt (' + res.status + ')');
      return res.json();
    })
    .then(function (json) {
      var files = Array.isArray(json) ? json : (json.files || []);
      return files.map(function (f) { return { name: String(f), download_url: null }; });
    });
}

function fetchGithubListing(feedId) {
  var repoInfo = resolveRepo();
  if (!repoInfo.owner || !repoInfo.repo) {
    return Promise.reject(new Error('Repositorion omistajaa tai nimeä ei voitu päätellä. Aseta CONFIG.owner ja CONFIG.repo.'));
  }
  var url = 'https://api.github.com/repos/' + repoInfo.owner + '/' + repoInfo.repo +
            '/contents/' + CONFIG.dataPath + '/' + encodeURIComponent(feedId) +
            '?ref=' + encodeURIComponent(CONFIG.branch);

  return fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (res) {
      if (res.status === 403 || res.status === 429) {
        throw new Error('GitHubin rajapintakiintiö täyttyi. Yritä hetken kuluttua uudelleen.');
      }
      if (!res.ok) throw new Error('Raporttilistan haku epäonnistui (HTTP ' + res.status + ').');
      return res.json();
    })
    .then(function (items) {
      if (!Array.isArray(items)) throw new Error('Odottamaton vastaus GitHubilta.');
      return items
        .filter(function (i) { return i.type === 'file' && FILE_PATTERN.test(i.name); })
        .map(function (i) { return { name: i.name, download_url: i.download_url }; });
    });
}

function loadReportList(feedId, force) {
  if (!force) {
    var cached = listFromCache(feedId);
    if (cached) return Promise.resolve(cached);
  }

  // Paikallisesti ensisijainen lähde on data/<syöte>/index.json, jotta sivustoa
  // voi testata ennen GitHub-julkaisua. Tuotannossa käytetään Contents API:sta.
  // Varalähde luodaan vasta tarvittaessa, jotta onnistunut haku ei jätä
  // käsittelemätöntä lupausta.
  var primary = isLocalHost() ? fetchLocalManifest(feedId) : fetchGithubListing(feedId);

  return primary.catch(function () {
    return isLocalHost() ? fetchGithubListing(feedId) : fetchLocalManifest(feedId);
  }).then(function (items) {
    var reports = items
      .map(function (i) {
        var parsed = parseReportName(i.name);
        if (parsed) parsed.downloadUrl = i.download_url;
        return parsed;
      })
      .filter(Boolean);

    reports.sort(function (a, b) { return b.sortKey.localeCompare(a.sortKey); });
    saveToCache(feedId, reports);
    return reports;
  });
}


/* ------------------------------------------------------- raporttilistan UI */

function renderList() {
  var container = $('report-list');
  container.textContent = '';

  if (state.listLoading) {
    var loading = document.createElement('p');
    loading.className = 'muted';
    loading.textContent = 'Ladataan raporttilistaa…';
    container.appendChild(loading);
    return;
  }

  if (state.reports.length === 0) {
    var empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'Raportteja ei vielä ole. Ne ilmestyvät tähän automaattisesti.';
    container.appendChild(empty);
    return;
  }

  var todayKey = dateKeyFor(new Date());
  var yesterdayKey = dateKeyFor(new Date(Date.now() - 86400000));
  var groups = [];

  state.reports.forEach(function (report) {
    var last = groups[groups.length - 1];
    if (!last || last.key !== report.dateKey) {
      last = { key: report.dateKey, label: dayLabel(report.dateKey, todayKey, yesterdayKey), reports: [] };
      groups.push(last);
    }
    last.reports.push(report);
  });

  groups.forEach(function (group) {
    var section = document.createElement('div');
    section.className = 'day-group';

    var heading = document.createElement('p');
    heading.className = 'day-group__label';
    heading.textContent = group.label;
    section.appendChild(heading);

    group.reports.forEach(function (report) {
      section.appendChild(buildReportButton(report));
    });

    container.appendChild(section);
  });
}

function buildReportButton(report) {
  var info = slotInfo(report.slug);
  var active = report.file === state.selectedId;

  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'report-item' + (active ? ' is-active' : '');
  button.setAttribute('data-file', report.file);
  if (active) button.setAttribute('aria-current', 'true');

  var icon = document.createElement('span');
  icon.className = 'report-item__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = info.icon;

  var body = document.createElement('span');
  body.className = 'report-item__body';

  var time = document.createElement('span');
  time.className = 'report-item__time';
  time.textContent = report.time;

  var label = document.createElement('span');
  label.className = 'report-item__label';
  label.textContent = info.label;

  body.appendChild(time);
  body.appendChild(label);
  button.appendChild(icon);
  button.appendChild(body);

  if (state.reports[0] && state.reports[0].file === report.file) {
    var badge = document.createElement('span');
    badge.className = 'report-item__badge';
    badge.textContent = 'Uusin';
    button.appendChild(badge);
  }

  return button;
}

/* --------------------------------------------------------------- katselin */

function reportSourceUrl(report) {
  if (report.downloadUrl) return report.downloadUrl;
  // Paikallinen kehitys: docs/ ja data/ ovat saman repositorion juuressa.
  return '../' + CONFIG.dataPath + '/' + state.activeFeed + '/' + report.file;
}

function setStatus(message, isError) {
  var el = $('list-status');
  el.textContent = message || '';
  el.className = 'sidebar__status' + (isError ? ' sidebar__status--error' : '');
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function showPlaceholder(html) {
  var frame = $('report-frame');
  var placeholder = $('viewer-placeholder');
  
  if (frame && placeholder) {
    placeholder.innerHTML = html;
    placeholder.hidden = false;
    frame.hidden = true;
  }
}

function setError(message) {
  showPlaceholder('<p class="viewer__icon" aria-hidden="true">⚠️</p><h3>Virhe</h3><p>' +
    escapeHtml(message) + '</p>');
}

  state.selectedId = file;
  var info = slotInfo(report.slug);

  $('report-title').textContent = info.label;
  $('report-meta').textContent = formatDateLong(report.date) + ' klo ' + report.time + ' (Suomen aika)';
  document.title = info.label + ' – ' + feedTitle();
  $('open-new-tab').disabled = false;
  $('print-btn').disabled = false;
  setStatus('');

  renderList();
  closeNav();

  // Päivitä osoitteen hash, jotta raporttiin voi linkittää suoraan.
  if (window.location.hash !== '#' + state.activeFeed + '/' + file) {
    history.replaceState(null, '', '#' + state.activeFeed + '/' + file);
  }

function selectReportFile(file) {
  if (!file) return;

  var report = state.reports.find(function (r) { return r.file === file; });
  if (!report) {
    setError('Raporttia ei löydy: ' + file);
    return;
  }

  state.selectedId = file;

  // Päivitä valittu raportti käyttöliittymässä
  var items = document.querySelectorAll('.report-item');
  items.forEach(function (item) {
    item.classList.toggle('report-item--selected', item.dataset.file === file);
  });

  // Päivitä URL
  var hash = state.activeFeed;
  if (file) hash += '/' + encodeURIComponent(file);
  if (window.location.hash.slice(1) !== hash) {
    history.replaceState(null, '', '#' + hash);
  }

  // Hae ja näytä raportti
  showPlaceholder('<p class="viewer__icon" aria-hidden="true">⏳</p><h3>Ladataan raporttia…</h3>');

  var localPath = CONFIG.dataPath + '/' + state.activeFeed + '/' + file;
  var githubPath = 'https://api.github.com/repos/' + CONFIG.owner + '/' + CONFIG.repo + 
                   '/contents/' + CONFIG.dataPath + '/' + state.activeFeed + '/' + file;

  // Kokeillaan ensin paikallista tiedostoa
  fetchWithTimeout(localPath, { cache: 'no-store' })
    .then(function (response) {
      if (response.ok) return response.text();
      throw new Error('Paikallinen tiedosto ei ole saatavilla');
    })
    .catch(function () {
      // Jos paikallinen ei toimi, käytetään GitHub API:a
      return fetchWithTimeout(githubPath)
        .then(function (response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          return response.json();
        })
        .then(function (data) {
          // Dekoodaa base64-sisältö
          return atob(data.content);
        });
    })
    .then(function (content) {
      // Varmista että sisältö on kelvollista HTML:ää
      if (typeof content !== 'string' || content.length === 0) {
        throw new Error('Tyhjä tai virheellinen sisältö');
      }

      var frame = $('report-frame');
      var placeholder = $('viewer-placeholder');
      
      if (frame && placeholder) {
        // Lisää lang-attribuutti jos puuttuu
        var html = content.trim();
        if (html.indexOf('<html') === -1) {
          html = '<html lang="fi"><head><meta charset="UTF-8"></head><body>' + html + '</body></html>';
        } else if (html.indexOf('lang=') === -1) {
          html = html.replace('<html', '<html lang="fi"');
        }

        frame.srcdoc = html;
        frame.hidden = false;
        placeholder.hidden = true;
        
        // Päivitä metatiedot
        var titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        var title = titleMatch ? titleMatch[1] : 'Raportti';
        $('report-title').textContent = title;
        $('report-meta').textContent = formatDateLong(report.date);
        
        // Aktivoi napit
        $('open-new-tab').disabled = false;
        $('print-btn').disabled = false;
      }
    })
    .catch(function (error) {
      console.error('Virhe raportin latauksessa:', error);
      setError('Raporttia ei voitu ladata: ' + error.message);
    });
}

function loadReportContent(report) {
  var frame = $('report-frame');
  showPlaceholder('<p class="viewer__icon" aria-hidden="true">⏳</p><h3>Ladataan raporttia…</h3><p>' +
    escapeHtml(slotInfo(report.slug).label) + ' klo ' + report.time + '</p>');

  fetch(reportSourceUrl(report), { cache: 'no-store' })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    })
    .then(function (html) {
      if (!/<\s*html|<\s*!doctype/i.test(html)) {
        throw new Error('Tiedosto ei näytä HTML-raportilta.');
      }

      // Raportti on eristetty iframeen, joten sen CSS ei vaikuta pääsivustoon.
      // Lisätään peruskohde, jotta raportin linkit aukeavat uuteen välilehteen,
      // ja kieliasetus vain jos se puuttuu.
      var prepared = html.replace(/<html([^>]*)>/i, function (match, attrs) {
        return /\blang\s*=/i.test(attrs) ? match : '<html' + attrs + ' lang="fi">';
      }).replace(/<head([^>]*)>/i, '<head$1><base target="_blank">');

      if (state.objectUrls[report.file]) URL.revokeObjectURL(state.objectUrls[report.file]);
      state.objectUrls[report.file] = URL.createObjectURL(new Blob([prepared], { type: 'text/html' }));

      frame.srcdoc = prepared;
      frame.hidden = false;
      $('viewer-placeholder').hidden = true;
    })
    .catch(function (err) {
      showPlaceholder('<p class="viewer__icon" aria-hidden="true">⚠️</p><h3>Raporttia ei voitu ladata</h3><p>' +
        escapeHtml(err.message) + '</p>');
      setStatus('Raportin lataus epäonnistui.', true);
    });
}

/* -------------------------------------------------------- valikon hallinta */

function openNav() {
  document.body.classList.add('nav-open');
  $('backdrop').hidden = false;
  $('menu-toggle').setAttribute('aria-expanded', 'true');
}

function closeNav() {
  document.body.classList.remove('nav-open');
  $('backdrop').hidden = true;
  $('menu-toggle').setAttribute('aria-expanded', 'false');
}


/* -------------------------------------------------------------- tapahtumat */

function bindEvents() {
  $('feed-list').addEventListener('click', function (event) {
    var button = event.target.closest('.feed-item');
    if (button) selectFeed(button.getAttribute('data-feed'));
  });

  $('report-list').addEventListener('click', function (event) {
    var button = event.target.closest('.report-item');
    if (button) selectReportFile(button.getAttribute('data-file'));
  });

  $('menu-toggle').addEventListener('click', function () {
    if (document.body.classList.contains('nav-open')) closeNav(); else openNav();
  });
  $('backdrop').addEventListener('click', closeNav);

  $('refresh-btn').addEventListener('click', function () { refresh(true); });

  $('print-btn').addEventListener('click', function () {
    var frame = $('report-frame');
    try {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } catch (e) {
      var url = state.objectUrls[state.selectedId];
      if (url) window.open(url, '_blank', 'noopener');
    }
  });

  $('open-new-tab').addEventListener('click', function () {
    var url = state.objectUrls[state.selectedId];
    if (url) window.open(url, '_blank', 'noopener');
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeNav();
  });

  window.addEventListener('hashchange', function () {
    var target = parseHash();
    var feedId = (target.feed && feedInfo(target.feed)) ? target.feed : state.activeFeed;

    if (feedId !== state.activeFeed) {
      selectFeed(feedId, { file: target.file });
      return;
    }
    if (target.file && target.file !== state.selectedId) selectReportFile(target.file);
  });
}

/* ------------------------------------------------------------- käynnistys */

function updateFeedHeading(feed) {
  $('brand-subtitle').textContent = feed.title;
  $('report-title').textContent = feed.title;
  $('report-meta').textContent = 'Valitse raportti vasemmalta listalta.';
  document.title = feed.title + ' – Markkinatilanne';
}

function updateTimestamp() {
  var stamp = new Intl.DateTimeFormat('fi-FI', {
    timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit'
  }).format(new Date());
  $('last-updated').textContent = 'Lista päivitetty klo ' + stamp;
}

/* Vaihtaa katsauksen: hakee listan vain valitulle syötteelle, jolloin
   GitHub-pyyntöjä tulee yksi per katsaus eikä yksi per sivulataus. */
function selectFeed(feedId, options) {
  var opts = options || {};
  var feed = feedInfo(feedId) || feedInfo(state.defaultFeed) || feedInfo(CONFIG.defaultFeed);
  if (!feed) {
    setStatus('Yhtään katsausta ei ole määritelty tiedostossa ' + CONFIG.feedsUrl + '.', true);
    return Promise.resolve();
  }

  state.activeFeed = feed.id;
  state.selectedId = null;
  state.reports = [];
  state.listLoading = true;

  updateFeedHeading(feed);
  $('open-new-tab').disabled = true;
  $('print-btn').disabled = true;
  renderFeeds();
  renderList();
  showPlaceholder('<p class="viewer__icon" aria-hidden="true">⏳</p><h3>Ladataan…</h3><p>' +
    escapeHtml(feed.title) + '</p>');
  setStatus('Haetaan raporttilistaa…');
  closeNav();

  if (window.location.hash.indexOf('#' + feed.id) !== 0) {
    history.replaceState(null, '', '#' + feed.id);
  }

  return loadReportList(feed.id, opts.force)
    .then(function (reports) {
      // Käyttäjä ehti vaihtaa katsausta kesken haun.
      if (state.activeFeed !== feed.id) return;

      state.reports = reports;
      state.listLoading = false;
      renderList();
      setStatus(reports.length + ' raporttia.');
      updateTimestamp();

      if (reports.length === 0) {
        showPlaceholder('<p class="viewer__icon" aria-hidden="true">📭</p><h3>Ei raportteja</h3>' +
          '<p>Raportteja ei löytynyt. Ne ilmestyvät tähän automaattisesti.</p>');
        return;
      }

      var wanted = opts.file || '';
      var exists = reports.some(function (r) { return r.file === wanted; });
      selectReportFile(exists ? wanted : reports[0].file);
    })
    .catch(function (err) {
      if (state.activeFeed !== feed.id) return;

      state.listLoading = false;
      renderList();
      setStatus(err.message, true);
      showPlaceholder('<p class="viewer__icon" aria-hidden="true">⚠️</p><h3>Raporttilistaa ei voitu hakea</h3><p>' +
        escapeHtml(err.message) + '</p>');
    });
}

function refresh(force) {
  return selectFeed(state.activeFeed, { force: !!force, file: state.selectedId || '' });
}

function start() {
  return loadFeeds().then(function () {
    renderFeeds();
    var target = parseHash();
    var feedId = (target.feed && feedInfo(target.feed)) ? target.feed : state.defaultFeed;
    return selectFeed(feedId, { file: target.file });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  bindEvents();
  start();
});

var state = {
  groups: [],
  feeds: [],
  activeFeed: '',
  defaultFeed: '',
  reports: [],
  selectedId: null,
  listLoading: false,
  objectUrls: {}
};
