# Automated tests

From `web/`:

- `pnpm test:unit` runs 36 Vitest cases across contact extraction, redaction, session titles, auth schemas, and chat composer validation.
- `pnpm test:e2e` runs all browser journeys, including a real chat analysis through the configured Gemini and search providers, and writes an HTML report to `playwright-report/`. Valid provider keys in `web/.env` are required, and the analysis test makes live provider requests.
- `pnpm test:all` runs frontend unit tests, browser tests, then the Laravel PHPUnit suite. It requires PHP/Composer dependencies in `api/`.

Playwright starts the Next.js dev server on `127.0.0.1:3000`. Install its browser once with `pnpm exec playwright install chromium`. To use an already running app, set `PLAYWRIGHT_BASE_URL` to its URL.

The existing LLM evaluation commands (`pnpm eval` and related scripts) remain separate from functional tests.
