# Supply Checkout

A shared supply tracker for taking supplies from storage to client jobs and bringing back what wasn't used.

- **Sheets** – one per client and date, recording who prepared it. Scan a barcode (or pick an item without one) to check supplies out, scan again on return to record what came back unused, then tap **Finished Return**. Each sheet totals what was used and what to charge, and downloads as CSV.
- **Inventory** – items, prices and how many are in storage. Checkouts subtract from storage; returns add back.
- **Receipts** – photograph a store receipt and Claude reads the line items and prices, suggests matches against existing inventory, and lets you assign each item to a client's sheet or to general inventory before anything is saved.

The app runs as a [Claude artifact](https://claude.ai/artifact/LcSb29dTE99AK4N6iuVFrj). claude.ai provides the shared database, sign-in, file downloads and receipt reading through `window.claude`; there is no server to run.

## Repository layout

| Path | What it is |
| --- | --- |
| `index.html` | The whole app. This file is what gets published to claude.ai. |
| `scripts/page.mjs` | Wraps `index.html` in the same document skeleton claude.ai adds at publish time. |
| `scripts/validate-html.mjs` | HTML validation (html-validate). |
| `tests/` | Playwright end-to-end tests, run against an in-memory mock of the claude.ai runtime (`tests/mock-claude.js`). |

## Development

Requires Node 22 or newer.

```bash
npm ci
npx playwright install chromium webkit
npm run check
```

`npm run lint` runs ESLint on the app's inline script and the tests, then validates the HTML. `npm test` runs the end-to-end tests in desktop Chrome and an iPhone-sized Safari (WebKit).

## CI and releases

- **CI** (`.github/workflows/ci.yml`) runs lint, HTML validation and the end-to-end tests on every pull request and on every push to `main`.
- **Releases** (`.github/workflows/release.yml`) use [release-please](https://github.com/googleapis/release-please). Write commit messages in [Conventional Commits](https://www.conventionalcommits.org/) style:
  - `fix: …` → patch release
  - `feat: …` → minor release
  - `feat!: …` or a `BREAKING CHANGE:` footer → major release

  release-please keeps a release pull request open with the next version and changelog. Merging it tags the release, re-runs the full check suite, and attaches `index.html` to the GitHub Release.
- **Dependabot** opens weekly update PRs for npm packages and GitHub Actions.

## Publishing to claude.ai

Publishing the artifact is a manual step, because claude.ai artifacts are published from a Claude session rather than from CI. After a release, ask Claude to republish `index.html` from this repo to the existing artifact URL above. Publishing to the same URL keeps all saved sheets and inventory.
