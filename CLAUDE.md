# Parabanks Dental — Leads Dashboard (May 2026)

A single-page dashboard for Parabanks Dental that pulls lead data live from
Google Sheets and surfaces three things at a glance: total new patients,
missed phone opportunities, and a breakdown by channel (SEO vs Google Ads)
and lead type (Website vs Phone Call).

**Scope: multi-month.** Monthly calls tabs are added to `GOOGLE_CALLS_TAB` as each
month's data becomes available. Default view is the current calendar month.

This file is the source of truth for the project. Read it before touching
code. Update it when the data model or sections change — drift between this
file and the code is the main thing to avoid.

---

## 1. Data model

**Two separate Google Sheets** feed the dashboard — one for website leads,
one for calls. Each has a single relevant tab. The columns below are the
live schema (verified from sample exports on 2026-05-27).

### Sheet 1: Website Leads — tab `Book Appointment`

| Column | Type | Values / format | Notes |
|---|---|---|---|
| `Email` | string | email | identifier; can repeat |
| `Are you an existing patient?` | enum | `Yes` / `No` / `-` | added to form later; `-` means the field didn't exist at submit time |
| `Lead Country` | string | ISO-2 (`AU`, `US`, etc.) or `-` | |
| `Lead Source` | string | `SEO` / `google_paid` / `chatgpt.com` / future values | see source mapping |
| `Lead Date` | string | `"April 15, 2026 at 3:15 PM"` | human-readable; parse with `date-fns` `parse()` |

### Sheet 2: Calls Leads — tab `Calls - May 2026`

| Column | Type | Values / format | Notes |
|---|---|---|---|
| `Call Status` | enum | `Answered Call` / `Abandoned Call` | |
| `Source` | string | `Organic Search` / `Google Ads` / future values | see source mapping |
| `Duration (seconds)` | number | integer | |
| `Date & Time` | string | `"2026-05-01 11:49:17"` | ISO-ish; parse directly |
| `Caller Number` | string | `"+61 420 702 296"` | identifier |
| `Call Remarks` | string \| null | free text | mostly empty |
| `Tags` | enum | see below | the key classifier |
| `Recording Link` | string | Google Drive URL | show as link in modal |

`Tags` values: `Existing Customer`, `Patient Enquiry`, `New Patient`,
`Missed Opportunity`, `Irrelevant`, `Abandoned Call`,
`Call on non-working day`, or blank.

### Source mapping (centralize this in one helper)

**PPC is the specific value. SEO is everything else.** This way, new
source labels that appear in the sheet (e.g. a future `bing_ads`) auto-
classify as SEO until we explicitly recognize them.

```
PPC (website)  = Lead Source === "google_paid"
SEO (website)  = anything else (SEO, chatgpt.com, future values)

PPC (calls)    = Source === "Google Ads"
SEO (calls)    = anything else (Organic Search, future values)
```

### Identifier rules

| Metric | Rule |
|---|---|
| **New patient (website)** | `Are you an existing patient? !== "Yes"` (so `No` AND `-` both count, because `-` means the field didn't exist when they submitted) |
| **New patient (calls)** | `Tags === "New Patient"` |
| **Missed opportunity** | `Tags === "Missed Opportunity"` (calls only) |
| **Total new patients** | website new + calls new across all sources, within the active date range |

---

## 2. Architecture

```
                                                                ┌───────────────────┐
┌─────────────────┐   HTTPS    ┌──────────────────┐  Sheets API │ Sheet 1: Website  │
│  React frontend │ ─────────▶ │  Express backend │ ──────────▶ │ (Book Appointment)│
│  (Vite, :5173)  │            │  (Node, :3001)   │             ├───────────────────┤
└─────────────────┘            │  (service acct)  │ ──────────▶ │ Sheet 2: Calls    │
                               └──────────────────┘             │ (Calls - May 2026)│
                                                                └───────────────────┘
```

- **Browser never sees the service account key.** All Sheets calls go
  through the Express server. The key lives in `server/.env` only.
- The backend makes **two** Sheets API calls (one per sheet), merges
  the normalized results, and returns a single `/api/leads` response.
- Frontend hits `GET /api/leads`, gets back all rows from both sheets,
  then applies the date-range filter client-side before counting.
- Backend caches the merged response in-memory for 60 seconds. The
  Refresh button bypasses the cache with `?fresh=1`.
- Date filtering is client-side because the dataset is small
  (hundreds of rows). No server-side filter needed in v1.

---

## 3. File layout

```
parabanks-dashboard/
├── CLAUDE.md
├── README.md
├── package.json              # workspaces: client + server
├── .env.example
├── .gitignore
├── server/
│   ├── package.json
│   ├── index.js              # Express app, /api/leads, /api/health
│   ├── sheets.js             # googleapis wrapper (reads both sheets) + in-memory cache
│   └── .env                  # GOOGLE_*_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_KEY (gitignored)
└── client/
    ├── package.json
    ├── vite.config.js        # proxy /api → http://localhost:3001
    ├── index.html
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css         # tailwind directives
        ├── lib/
        │   ├── api.js        # fetchLeads()
        │   ├── transform.js  # source/new-patient/missed rules + date filter
        │   ├── dates.js      # MIN_DATE = May 1 2026, today(), clamp()
        │   └── format.js     # date + phone + duration formatters
        ├── hooks/
        │   └── useLeads.js   # TanStack Query wrapper
        └── components/
            ├── DashboardHeader.jsx     # title + refresh button + last-updated
            ├── DateRangeFilter.jsx     # two date inputs, May 1 → today
            ├── HighlightsSection.jsx   # new patients + missed opportunities
            ├── StatCard.jsx            # big-number card (reused)
            ├── SourceSection.jsx       # one per source (SEO / PPC)
            ├── ChannelCard.jsx         # one per channel (Website / Phone)
            ├── LeadModal.jsx           # scrollable list overlay
            └── LeadRow.jsx             # one row in the modal
```

---

## 4. UI sections (top to bottom, single page, no routing)

### 4.0 Header
- Title "Parabanks Dental — May 2026"
- Date range filter (see 4.1)
- Refresh button + last-updated timestamp

### 4.1 Date range filter
Two `<input type="date">` controls, "From" and "To".
- `max` on both = today's date (computed at render)
- Default state on first load: From = 1st of current month, To = today.
- On change, every count below recomputes. No "Apply" button — live.
- If user picks a "To" before "From", swap them silently.

Source of truth: `useState` in `App.jsx`, passed down as a `dateRange`
prop. Don't put it in URL params for v1; can add later.

### 4.2 Highlights
- **New Patients** — big number. Website new + calls new within
  date range (across both sources).
- **Missed Opportunities** — big number. Calls only, within date range.
- Two `StatCard`s side by side on desktop, stacked on mobile.

### 4.3 SEO (Google Searches, Google Business, AI Search)
Two-column layout (`ChannelCard` × 2):
- **Website** — count of new-patient website leads where source = SEO,
  within date range. Button "View leads" → `LeadModal` listing those
  rows (Email, Country, Lead Date).
- **Phone Call** — count of new-patient calls where source = SEO,
  within date range. Button "View calls" → `LeadModal` listing those
  rows (Caller Number, Date & Time, Duration, Recording Link).

### 4.4 PPC (Google Ads)
Identical structure to SEO, filtered to PPC source.

---

## 5. Conventions

- **All filtering and counting lives in `lib/transform.js`.**
  Components receive already-filtered arrays + counts. Never filter
  inline in a component.
- **`transform.js` exports four pure functions**: `applyDateRange`,
  `filterBySource`, `filterNewPatients`, `filterMissedOpportunities`.
  Compose them — don't write per-section ad-hoc filters.
- **Date constants in `lib/dates.js`.** `MIN_DATE = new Date('2026-05-01T00:00:00')`.
  Anywhere the May 1 floor is enforced, import it. No magic strings.
- **Tailwind only** — no CSS files beyond `index.css`.
- **No global state library.** TanStack Query for server state,
  `useState` for date range and modal open/close.
- **Mobile breakpoint at `md:`** — two-column sections stack below it.
- **One source of truth for source/new-patient/date rules**: `transform.js`.
  If a rule changes, it changes in exactly one place.

---

## 6. Backend contract

`GET /api/leads` reads **both Google Sheets in parallel** (`Promise.all`),
normalizes each, and returns the merged result, unfiltered by date:

```json
{
  "fetchedAt": "2026-05-27T12:34:56.000Z",
  "website": [
    {
      "email": "string",
      "isExistingPatient": "Yes" | "No" | null,
      "country": "AU" | string | null,
      "source": "SEO" | "PPC",
      "leadDate": "2026-04-15T15:15:00.000Z"
    }
  ],
  "calls": [
    {
      "callStatus": "Answered Call" | "Abandoned Call",
      "source": "SEO" | "PPC",
      "durationSeconds": 415,
      "dateTime": "2026-05-01T11:49:17.000Z",
      "callerNumber": "+61 420 702 296",
      "remarks": "string | null",
      "tag": "New Patient" | "Existing Customer" | ...,
      "recordingUrl": "https://..."
    }
  ]
}
```

The server normalizes (parses dates, maps `google_paid → PPC`, everything
else → `SEO`; `Google Ads → PPC`, everything else → `SEO`) so the client
never deals with raw sheet strings. Rows that fail to parse are dropped
with a `console.warn` on the server — never thrown — so one bad row
doesn't kill the dashboard.

If one of the two Sheets API calls fails, log the error and return the
other sheet's data with an `errors` array in the response — don't 500
the whole endpoint. Half a dashboard is better than no dashboard.

`?fresh=1` skips the 60s in-memory cache.

`GET /api/health` returns `{ ok: true }` for sanity checks.

---

## 7. Environment

`.env.example` (copy to `server/.env`):

```
# Website leads
GOOGLE_WEBSITE_SHEET_ID=1abc...                 # spreadsheet ID from the URL
GOOGLE_WEBSITE_TAB=Book Appointment             # exact tab name

# Calls leads
GOOGLE_CALLS_SHEET_ID=1xyz...                   # different spreadsheet ID
GOOGLE_CALLS_TAB=Calls - May 2026               # exact tab name

# Auth (same service account reads both sheets)
GOOGLE_SERVICE_ACCOUNT_KEY=                     # paste the FULL JSON, single line, in single quotes

PORT=3001
CACHE_TTL_SECONDS=60
```

Setup steps for the human (also in README):
1. Create a GCP project → enable Google Sheets API.
2. Create one service account → download the JSON key.
3. Share **both** Google Sheets with the service account's email (Viewer).
   This is the most common step to miss — if you forget either, that
   sheet's API call returns 403.
4. Paste both spreadsheet IDs + the key into `server/.env`.

---

## 8. Build plan (Claude Code follows this order)

Each step ends with a runnable, testable artifact. Don't skip ahead.

1. **Scaffolding** — npm workspaces, install deps, Tailwind config, Vite
   proxy, ESLint. Verify `npm run dev` boots both server and client.
2. **Backend, mock first** — `/api/leads` returns hardcoded JSON matching
   the contract. Frontend fetches and shows raw counts.
3. **Backend, real Sheets** — replace mock with two parallel googleapis
   calls (one per sheet). Normalize per contract. Add 60s cache.
   Test that auth works against both sheets.
4. **Date range filter + transforms** — `dates.js`, `transform.js`,
   `DateRangeFilter.jsx`. Wire the date range as `useState` in `App.jsx`,
   passed down. No other UI sections yet — just verify the filter
   produces the right counts in a debug `<pre>` dump.
5. **Highlights section** — `StatCard` + `HighlightsSection`. Wire to
   filtered data.
6. **Source sections** — `ChannelCard` + `SourceSection`. Render SEO +
   PPC blocks. Buttons stub for now (alert on click).
7. **Lead modal** — `LeadModal` + `LeadRow`. Two variants (website /
   calls). Scrollable, closes on backdrop click + Esc.
8. **Polish** — Refresh button, last-updated timestamp, loading
   skeleton, error state. Phone + date + duration formatters.
9. **README** — setup, run, deploy notes.

Before each commit: `npm run lint` + manual click-through. No tests in
v1 — small surface, fast iteration. Add Vitest in v2 if transform logic
grows.

---

## 9. Known not-doing (v1 scope guard)

If asked, push back. Out of scope until v2:

- Charts / time series
- Export to CSV
- Multi-clinic support
- Auth / login
- Webhook-based real-time updates (polling + Refresh button is enough)
- URL-based date filter state (just `useState` for now)

---

## 10. Open questions

None blocking — clear to start step 1. Revisit when planning v2:
- Should each month's calls tab be created manually, or automated via a script?
- Should the dashboard get a tiny chart strip (daily new patients) once
  multi-month data exists?