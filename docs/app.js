/* =========================================================================
   Markkinatilanne – sovelluslogiikka
   Hakee raporttilistan GitHubin Contents API:sta, lajittelee raportit
   uusimmasta vanhimpaan ja näyttää valitun raportin iframessa (srcdoc).

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
  dataPath: 'data',

  // Paikallinen nimilista, jota käytetään kehityksessä ennen GitHub-julkaisua.
  localManifest: '../data/index.json',

  // Raporttilistan välimuistin ikä sekunteina.
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
var CACHE_KEY = 'markkinatilanne.dataFiles';

/* --------------------------------------------------------------- apuvälineet */

function $(id) { return document.getElementById(id); }

function parseReportName(name) {
  var match = FILE_PATTERN.exec(name);
  if (!match) return null;

  var time = match[4];
  var date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]),
                      Number(time.slice(0, 2)), Number(time.slice(2, 4)));

  return {
    file: name,
    slug: match[5],
    date: date,
    dateKey: match[1] + '-' + match[2] + '-' + match[3],
    time: time.slice(0, 2) + ':' + time.slice(2, 4),
    sortKey: match[1] + match[2] + match[3] + time
  };
}

function formatDateLong(date) {
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
  var parts = dateKey.split('-');
  var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return new Intl.DateTimeFormat('fi-FI', {
    timeZone: TIME_ZONE, weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric'
  }).format(d);
}

function slotInfo(slug) {
  if (CONFIG.slots[slug]) return CONFIG.slots[slug];
  var label = slug.replace(/-/g, ' ');
  return { icon: '📄', label: label.charAt(0).toUpperCase() + label.slice(1) };
}

function isLocalHost() {
  var host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '' || window.location.protocol === 'file:';
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

function listFromCache() {
  try {
    var raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    var parsed = JSON.parse(raw);
    if (!parsed || !parsed.time || !Array.isArray(parsed.reports)) return null;
    if (Date.now() - parsed.time > CONFIG.listCacheSeconds * 1000) return null;
    return parsed.reports;
  } catch (e) { return null; }
}

function saveToCache(reports) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), reports: reports }));
  } catch (e) { /* esim. yksityinen selaintila – ei haittaa */ }
}

function fetchLocalManifest() {
  return fetch(CONFIG.localManifest, { cache: 'no-store' })
    .then(function (res) {
      if (!res.ok) throw new Error('Paikallista listaa ei löytynyt (' + res.status + ')');
      return res.json();
    })
    .then(function (json) {
      var files = Array.isArray(json) ? json : (json.files || []);
      return files.map(function (f) { return { name: String(f), download_url: null }; });
    });
}

function fetchGithubListing() {
  var repoInfo = resolveRepo();
  if (!repoInfo.owner || !repoInfo.repo) {
    return Promise.reject(new Error('Repositorion omistajaa tai nimeä ei voitu päätellä. Aseta CONFIG.owner ja CONFIG.repo.'));
  }
  var url = 'https://api.github.com/repos/' + repoInfo.owner + '/' + repoInfo.repo +
            '/contents/' + CONFIG.dataPath + '?ref=' + encodeURIComponent(CONFIG.branch);

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

function loadReportList(force) {
  if (!force) {
    var cached = listFromCache();
    if (cached) return Promise.resolve(cached);
  }

  // Paikallisesti ensisijainen lähde on data/index.json, jotta sivustoa voi
  // testata ennen GitHub-julkaisua. Tuotannossa käytetään Contents API:sta.
  var primary = isLocalHost() ? fetchLocalManifest() : fetchGithubListing();
  var fallback = isLocalHost() ? fetchGithubListing() : fetchLocalManifest();

  return primary.catch(function () { return fallback; }).then(function (items) {
    var reports = items
      .map(function (i) {
        var parsed = parseReportName(i.name);
        if (parsed) parsed.downloadUrl = i.download_url;
        return parsed;
      })
      .filter(Boolean);

    reports.sort(function (a, b) { return b.sortKey.localeCompare(a.sortKey); });
    saveToCache(reports);
    return reports;
  });
}


/* ------------------------------------------------------- raporttilistan UI */

function renderList() {
  var container = $('report-list');
  container.textContent = '';

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
  return '../' + CONFIG.dataPath + '/' + report.file;
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
  var placeholder = $('viewer-placeholder');
  placeholder.hidden = false;
  placeholder.innerHTML = html;
  $('report-frame').hidden = true;
}


function selectReport(file) {
  var report = state.reports.filter(function (r) { return r.file === file; })[0];
  if (!report) return;

  state.selectedId = file;
  var info = slotInfo(report.slug);

  $('report-title').textContent = info.label;
  $('report-meta').textContent = formatDateLong(report.date) + ' klo ' + report.time + ' (Suomen aika)';
  $('open-new-tab').disabled = false;
  $('print-btn').disabled = false;
  setStatus('');

  renderList();
  closeNav();

  // Päivitä osoitteen hash, jotta raporttiin voi linkittää suoraan.
  if (window.location.hash !== '#' + file) {
    history.replaceState(null, '', '#' + file);
  }

  loadReportContent(report);
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
  $('report-list').addEventListener('click', function (event) {
    var button = event.target.closest('.report-item');
    if (button) selectReport(button.getAttribute('data-file'));
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
    var file = window.location.hash.replace('#', '');
    if (file && file !== state.selectedId) selectReport(file);
  });
}

/* ------------------------------------------------------------- käynnistys */

function refresh(force) {
  setStatus('Haetaan raporttilistaa…');
  if (force) {
    try { sessionStorage.removeItem(CACHE_KEY); } catch (e) { /* ei haittaa */ }
  }

  return loadReportList(force)
    .then(function (reports) {
      state.reports = reports;
      renderList();
      setStatus(reports.length + ' raporttia.');

      var stamp = new Intl.DateTimeFormat('fi-FI', {
        timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit'
      }).format(new Date());
      $('last-updated').textContent = 'Lista päivitetty klo ' + stamp;

      if (reports.length === 0) {
        showPlaceholder('<p class="viewer__icon" aria-hidden="true">📭</p><h3>Ei raportteja</h3>' +
          '<p>Raportteja ei löytynyt. Ne ilmestyvät tähän automaattisesti.</p>');
        return;
      }

      var wanted = window.location.hash.replace('#', '');
      var exists = reports.some(function (r) { return r.file === wanted; });
      selectReport(exists ? wanted : reports[0].file);
    })
    .catch(function (err) {
      setStatus(err.message, true);
      showPlaceholder('<p class="viewer__icon" aria-hidden="true">⚠️</p><h3>Raporttilistaa ei voitu hakea</h3><p>' +
        escapeHtml(err.message) + '</p>');
    });
}

document.addEventListener('DOMContentLoaded', function () {
  bindEvents();
  refresh(false);
});

var state = { reports: [], selectedId: null, objectUrls: {} };
