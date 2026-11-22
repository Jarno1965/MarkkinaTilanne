# System Patterns

## Architecture Overview
Three layers, no backend:
1.  **Generation Layer:** Activepieces workflows + OpenRouter API.
2.  **Storage Layer:** GitHub repository (`data/` folder), committed automatically.
3.  **Presentation Layer:** Static website in `docs/`, hosted on GitHub Pages.

## Data Flow
1.  **Schedule Trigger** (Activepieces) fires at 06:00, 10:00 or 12:00 Europe/Helsinki.
2.  **HTTP Request** calls OpenRouter API with the report prompt (prompts versioned in `prompts/`).
3.  **Code step** builds the filename `data/YYYY-MM-DD-HHMM-slug.html` using Finnish local time and a fixed per-slot slug, strips any markdown code fences, and base64-encodes the HTML as UTF-8.
4.  **GitHub commit** via a Custom API Call to `PUT /repos/{owner}/{repo}/contents/{path}`.
5.  **Frontend** fetches the file list from the GitHub Contents API on page load and renders the menu.
6.  **User** clicks a report -> the HTML text is fetched from `download_url` and injected into a sandboxed `<iframe srcdoc>`.

## Search and Scraping Layer
- **Tavily** is the primary news search in all market workflows (`search`, `time_range`, `days`).
  Tavily rejects an empty `time_range` value, so the field is removed entirely when unused.
- **Firecrawl** (`@activepieces/piece-firecrawl`) is used only in the `Lauantai` weekly review as a
  free web scraper. `search_web` with `includePageContent: true` returns the week's articles as
  markdown in a single call. Free tier: 1 000 credits/month, 1 credit per scraped page.
- Scraper steps are marked `continueOnFailure = true` so a scraper outage never blocks a report.


## File Naming Convention
- Reports: `data/YYYY-MM-DD-HHMM-slug.html`, Finnish time, e.g. `2026-11-13-0600-aamukatsaus.html`.
  - Slugs: `aamukatsaus`, `eurooppa-avaus`, `paivan-yhteenveto`, `viikkokatsaus` (Saturday weekly
    review), `viikkoennakko` (Sunday week-ahead preview) (fixed values, not LLM output; ASCII only,
    lowercase, hyphen-separated).
  - Alphabetical order equals chronological order, so no database is needed for sorting.
- Prompts: `prompts/markkina/viikkokatsaus.md` (Lauantai), `prompts/markkina/viikkoennakko.md`
  (Sunnuntai); the live prompt text lives in `activepieces/markkina/tools/txt_*.txt`.

## Weekend Pair: Lauantai (backward) and Sunnuntai (forward)
- `Lauantai` looks back: the week's biggest events and what moved the markets.
- `Sunnuntai` looks ahead: the coming week's catalysts plus a mandatory speculation section
  (three scenarios with invalidation, a surprise card, 2-3 speculative themes).
- Both share the same 17-step skeleton (Tavily searches -> LLM event picker -> event searches ->
  Yahoo start-point quotes -> Firecrawl page content -> compact -> LLM HTML -> finalize -> GitHub).
  `Sunnuntai` was created with `ap_duplicate_flow` from `Lauantai`, so code steps differ only in
  wording/constants; each flow keeps its own copies under `activepieces/markkina/tools/`
  (`*_sunnuntai.js` suffix).
- **Freshness guard (21.11.2026):** Tavily's `days` parameter is **not** a hard filter — a 5-day-old
  article came through both with and without `time_range`. Both weekend flows therefore filter by
  publication date in code: `step12_scrape.js` drops Firecrawl articles older than `max_age_hours`
  (default 120 h) and `step13_compact.js` does the same for Tavily items, each labelling the item's
  age (TUORE / VANHEMPI, N vrk sitten) so the LLM can weigh it. The Sunday prompt defines "the coming
  week"; the Saturday prompt adds AJANTASAISUUS (newest figure wins, state its as-of date),
  ALKUVIIKON KATSAUS KERTOO EDELLISESTÄ VIIKOSTA (a Monday "Weekly Market Recap" describes the
  *previous* week) and MENNYT TAPAHTUMA EI OLE TULEVA (by Saturday the week's events have happened).
- **Providers disagree on earnings figures** (FactSet 31.9 %/14.4 %, Zacks 28.9 %/14.6 %, U.S. Bank
  27.4 %/13.4 %), so the Saturday report must name the source and the as-of date of each figure.

## Dynamic Topic Discovery (Puola puhuu, 22.11.2026)

The monthly media review for Poland no longer uses fixed topic searches. It follows a
**discover → identify → deep-dive → write** pattern:

1. **Discovery (no locked topics):** three independent sweeps over Polish sources —
   news portals and dailies (Tavily, `topic: news`, `days: 30`), opinion/business/weekly media
   (Tavily, `topic: general`, `time_range: month`) and citizen discussion (Firecrawl `search_web`,
   `timeFilter: qdr:m`, `includePageContent`).
2. **Topic identification (LLM 1):** a cheap, fast model (`google/gemini-2.5-flash`) reads the
   compacted discovery text and returns JSON: 5–7 themes (specific phenomena, not categories),
   exactly 3 Polish follow-up queries, and up to 6 article URLs. Code step `step_8` parses it and
   falls back to three generic queries if the model does not return JSON.
3. **Deep dive:** the three AI-written queries feed Tavily searches; Tavily Extract pulls full text
   from the AI-selected URLs; a second Firecrawl call fetches discussion around the theme keywords.
4. **Compaction + freshness:** `step_14` merges four blocks (`teemat`, `uutiset`, `artikkelit`,
   `some`), drops items with a known publication date older than 32 days, labels undated items
   `ei päivämäärää`, and builds a numbered source registry (`sources`, `sourcesText`).
5. **Quality gate:** `step_15` aborts the run (no commit) when themes < 3, sources < 8,
   domains < 5, non-empty blocks < 3 or material < 6 000 chars.
6. **Writer (LLM 2):** `anthropic/claude-sonnet-4.6` (OpenRouter fallbacks
   `google/gemini-2.5-pro`, `openai/gpt-4.1`) writes Markdown whose `##` headings are the themes
   themselves. The prompt explicitly bans the old fixed headings and tells the model to drop themes
   without evidence and add themes the material reveals.
7. **Finalize:** `step_17` converts Markdown to a standalone HTML document (Polish-red accent),
   appends the source list only if the model omitted it, and throws if the document is truncated.

**Why two models:** topic extraction needs speed, a large context and strict JSON (Gemini Flash);
report writing needs idiomatic Finnish and journalistic judgement (Claude Sonnet). Running monthly
means the quality tier is affordable.

**Model gotcha:** `google/gemini-2.5-pro` spends many tokens on internal reasoning (a 50-token
probe ended with `finish_reason: length`), so it is only a fallback with a large `max_tokens`.


- GitHub Pages publishes only `docs/`, so `../data/x.html` is not reachable from the published site.
- `raw.githubusercontent.com` returns HTML as `text/plain` with `X-Content-Type-Options: nosniff`, so `<iframe src="raw-url">` would display source code.
- Therefore `app.js` fetches the HTML as text and sets it via `iframe.srcdoc`, inside a sandbox with no `allow-scripts` (AI output cannot execute scripts). `<base target="_blank">` and `lang="fi"` are injected beforehand.

## Frontend Rules
- Config lives in one `CONFIG` object at the top of `docs/app.js` (`owner`, `repo`, `branch`, `dataPath`, `localManifest`, `listCacheSeconds`, `slots`).
- Owner and repo are auto-detected from `<owner>.github.io/<repo>/`; explicit values override detection.
- The report list request is cached in `sessionStorage` for 5 minutes; report bodies are not.
  **Gotcha:** `JSON.stringify` turns `Date` objects into strings and `JSON.parse` does not restore
  them, so `listFromCache` must convert `report.date` back to a `Date` before use. Otherwise a
  browser reload crashes with `date.getTime is not a function` (the cache survives a reload, and
  the error surfaces as "Raporttilistaa ei voitu hakea"). `formatDateLong` also accepts a string
  defensively. Fixed 21.11.2026; covered by `tests/site-check.mjs`.
- Adding a time slot requires an Activepieces clone only. The frontend needs no change; optionally add a label/icon to `CONFIG.slots`.
- Local testing: on localhost the app prefers `../data/<feed>/index.json` (a filename manifest in
  the repo root `data/`) and falls back to the Contents API; in production the reverse. Report
  bodies in production always come from GitHub's `download_url`.
- Regenerate the local manifests with `node tests/make-manifests.mjs` after adding or deleting
  reports, otherwise the local list goes stale (this happened on 21.11.2026: `data/media/index.json`
  listed 6 files while the folder held 13).
- `docs/data/` (13 sample reports plus manifests from 18.11.2026, when `docs/` was the site root)
  was deleted on 21.11.2026. `docs/` holds only the site's own files (`index.html`, `style.css`,
  `app.js`, `feeds.json`); the old files remain in git history.

## Scalability Note
The Contents API lists at most 1000 entries per directory (~11 months at 3 reports/day). When that becomes relevant: move to `data/YYYY/MM/` subfolders, use the Git Trees API, or archive older reports. The filename format stays identical, so the change is contained in `docs/app.js`.

## Repository Structure

```text
/
  .clinerules
  memory-bank/
    projectbrief.md
    activeContext.md
    systemPatterns.md
    techContext.md
    progress.md
  README.md                                 (site + workflow contract, feeds)
  data/
    markkina/                               (one folder per feed)
      2026-11-13-0600-aamukatsaus.html      (AI-generated reports)
      index.json                            (local-dev filename manifest only)
  prompts/                                  (planned, not created yet)
  docs/                                     (GitHub Pages source)
    index.html
    style.css
    app.js
    feeds.json                              (feed registry)
  activepieces/
    Raporttien-ohje.md                      (workflow maintenance guide)
    markkina/                               (flow JSON files)
      tools/                                (build/decode/check scripts, step*.js, tests)
    tools/
      import-to-activepieces.ps1            (shared import script)
  tests/
    site-check.mjs                          (site smoke test)
    parse-check.ps1                         (PowerShell syntax check)
```

Note: report paths are `data/<feed>/YYYY-MM-DD-HHMM-slug.html`. The workflows currently commit to `data/markkina/`.
