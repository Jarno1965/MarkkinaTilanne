# Tech Context

## Tools & Services
- **Development:** VS Code, Cline extension. Local testing with a static server run from the repository root (so that both `docs/` and `data/` are reachable).
- **Orchestration:** Activepieces (cloud or self-hosted). Chosen for its visual workflow builder and built-in OpenRouter + GitHub integrations.
- **AI:** OpenRouter API. Use the `models` parameter with a fallback list (e.g. primary model + 1-2 backups) to ensure reliability.
- **Hosting:** GitHub Pages, source = branch `main`, folder `/docs`. No GitHub Actions build is required, because the frontend reads reports from GitHub directly.
- **Version Control:** GitHub (public repository).
- **Frontend:** Vanilla HTML/CSS/JS, no dependencies, `Intl.DateTimeFormat` with the `Europe/Helsinki` time zone.

## Frontend Platform Constraints (learned while building)
- GitHub Pages publishes only `docs/`; sibling folders such as `data/` are not part of the site.
- `raw.githubusercontent.com` serves HTML as `text/plain` with `X-Content-Type-Options: nosniff`, so a report cannot be embedded with `<iframe src>`. It must be fetched as text and injected via `srcdoc`.
- The anonymous GitHub Contents API allows 60 requests per hour per IP, so the listing is fetched once and cached in `sessionStorage` for 5 minutes. Report bodies use `download_url`, which does not consume that quota.
- The Contents API returns at most 1000 entries per directory.

## API Keys (do not commit)
- `OPENROUTER_API_KEY` – store in Activepieces credentials or GitHub Actions secrets.
- `GITHUB_TOKEN` – a **fine-grained personal access token scoped to this repository only**, with *Contents: Read and write*. Activepieces supplies a token automatically only when its GitHub piece is used; for a Custom API Call you must create one yourself.

## Constraints
- **No backend server.** The frontend must work purely as static files.
- **GitHub Pages limitations:** static assets only, no server-side rendering.
- **Report HTML is untrusted input:** it is rendered in a sandbox without `allow-scripts`.
- **Activepieces tier:** verify the available integrations (GitHub, OpenRouter) on the chosen tier.
