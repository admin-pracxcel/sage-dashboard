# Parabanks Dental — Leads Dashboard (May 2026)

Single-page dashboard that pulls lead data live from two Google Sheets and
shows new patients, missed phone opportunities, and a breakdown by channel
(SEO vs Google Ads) and lead type (Website vs Phone Call).

## Prerequisites

- Node.js 22+ (tested on 26)
- A Google Cloud project with the Sheets API enabled
- A service account with Viewer access to both Google Sheets

## Setup

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Copy the env template and fill in your values:

   ```bash
   cp .env.example server/.env
   ```

   You need:
   - **GOOGLE_WEBSITE_SHEET_ID** — spreadsheet ID from the website leads sheet URL
   - **GOOGLE_CALLS_SHEET_ID** — spreadsheet ID from the calls sheet URL
   - **GOOGLE_WEBSITE_TAB** — exact tab name (default: `Book Appointment`)
   - **GOOGLE_CALLS_TAB** — exact tab name (default: `Calls - May 2026`)
   - **GOOGLE_SERVICE_ACCOUNT_KEY** — the full JSON key, single line, in single quotes

3. Share both Google Sheets with the service account email (Viewer permission).
   This is the most common step to miss — if you forget either sheet, its API
   call returns 403.

## Run

```bash
npm run dev
```

This starts both:
- **Backend** — Express on http://localhost:3001
- **Frontend** — Vite on http://localhost:5173 (proxies `/api` to the backend)

## API

| Endpoint | Description |
|---|---|
| `GET /api/leads` | Returns all website + call leads (cached 60s) |
| `GET /api/leads?fresh=1` | Bypasses the cache |
| `GET /api/health` | Returns `{ ok: true }` |

## Lint

```bash
npm run lint
```

## Project structure

See [CLAUDE.md](./CLAUDE.md) for the full data model, architecture, and conventions.
