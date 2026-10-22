# Automated tests

From `web/`:

- `pnpm test:unit` runs 28 Vitest cases across contact identifier extraction, personal-data redaction, session-title cleanup, and auth-form schemas.
- `pnpm test:e2e` runs seven Playwright browser journeys and writes an HTML report to `playwright-report/`.
- `pnpm test:all` runs frontend unit tests, browser tests, then the Laravel PHPUnit suite. It requires PHP/Composer dependencies in `api/`.

Playwright starts the Next.js dev server on `127.0.0.1:3000`. Install its browser once with `pnpm exec playwright install chromium`. To use an already running app, set `PLAYWRIGHT_BASE_URL` to its URL. The browser tests avoid live AI requests.

The existing LLM evaluation commands (`pnpm eval` and related scripts) remain separate from functional tests.
