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

## File Naming Convention
- Reports: `data/YYYY-MM-DD-HHMM-slug.html`, Finnish time, e.g. `2026-11-13-0600-aamukatsaus.html`.
  - Slugs: `aamukatsaus`, `eurooppa-avaus`, `paivan-yhteenveto` (fixed values, not LLM output; ASCII only, lowercase, hyphen-separated).
  - Alphabetical order equals chronological order, so no database is needed for sorting.
- Prompts: `prompts/morning-us-asia.md`, `prompts/europe-open.md`, `prompts/midday-summary.md`.

## Report Rendering (why srcdoc, not iframe src)
- GitHub Pages publishes only `docs/`, so `../data/x.html` is not reachable from the published site.
- `raw.githubusercontent.com` returns HTML as `text/plain` with `X-Content-Type-Options: nosniff`, so `<iframe src="raw-url">` would display source code.
- Therefore `app.js` fetches the HTML as text and sets it via `iframe.srcdoc`, inside a sandbox with no `allow-scripts` (AI output cannot execute scripts). `<base target="_blank">` and `lang="fi"` are injected beforehand.

## Frontend Rules
- Config lives in one `CONFIG` object at the top of `docs/app.js` (`owner`, `repo`, `branch`, `dataPath`, `localManifest`, `listCacheSeconds`, `slots`).
- Owner and repo are auto-detected from `<owner>.github.io/<repo>/`; explicit values override detection.
- The report list request is cached in `sessionStorage` for 5 minutes; report bodies are not.
- Adding a time slot requires an Activepieces clone only. The frontend needs no change; optionally add a label/icon to `CONFIG.slots`.
- Local testing: on localhost the app prefers `data/index.json` (filename manifest) and falls back to the Contents API; in production the reverse.

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
