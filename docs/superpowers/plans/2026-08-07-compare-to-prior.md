# Compare-to-Prior Period Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "compare to prior period" view to the Sage Psychological Services dashboard — every number shows a delta chip vs a comparison period, and each of the three sections shows a small overlaid line chart. Simultaneously lift the May-2026-only scope so multiple monthly call tabs can coexist.

**Architecture:** Client-side only (backend already supports multiple monthly tabs via comma-separated env). App.jsx holds two date ranges (`mainRange`, `compareRange`); `compareRange` auto-follows `mainRange` at "same length immediately prior" unless the user has manually edited it. Existing pure filter functions (`applyDateRange`, `filterBySource`, etc.) are called twice per section — once with each range. Two new components: `<DeltaChip>` (renders under every number) and `<SectionCompareChart>` (Recharts line chart per section).

**Tech Stack:** React 18, Vite, TailwindCSS, TanStack Query, date-fns, Recharts (new).

**Design spec:** `docs/superpowers/specs/2026-08-07-compare-to-prior-design.md`

## Global Constraints

- **No test framework in v1.** Do NOT introduce Vitest, Jest, or add test files. Verification per task is manual: run `npm run dev`, open browser, follow the "Verify" step. This is called out in `CLAUDE.md` §8 and reiterated in the spec.
- **Single source of truth for filter/date logic:** `lib/transform.js` and `lib/dates.js`. Never inline filter or date arithmetic in a component.
- **Sage brand color:** `#2e3e33` (Tailwind token `brand`). Existing rose token used for negative-delta indication.
- **Tailwind only** — no new CSS files beyond `index.css`.
- **Mobile breakpoint at `md:`** — all new UI must degrade cleanly below `md`.
- **File paths are relative to repo root** `/Users/bilalshaikh/Downloads/dashboard-6e112f6fac5c47cc2b3a0c1f707c234b45f83a3d/`.

---

### Task 1: Repo init, multi-month scope removal, and date helpers

**Files:**
- Modify: `client/src/lib/dates.js` (rewrite — remove MIN_DATE, add helpers)
- Modify: `client/src/components/DateRangeFilter.jsx:1,4,27,38` (drop MIN_DATE import + `min` attribute)
- Modify: `client/src/App.jsx:3` (drop `MIN_DATE` import — actual default state is set in Task 6)
- Modify: `.env.example` (comment `GOOGLE_CALLS_TAB` line)
- Modify: `CLAUDE.md` (§1, §4.1, §9, §10)

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `today(): Date` — unchanged
  - `clamp(date, min, max): Date` — unchanged
  - `toDateString(date): string` — unchanged
  - `currentMonthRange(): { from: string, to: string }` — new; returns `{ from: 'YYYY-MM-01' of current month, to: toDateString(today()) }`
  - `daysInRange({ from, to }): number` — new; inclusive integer day count
  - `daysBetween(a, b): number` — new; integer days from date `a` to date `b` (ignores time)
  - `priorSameLengthRange({ from, to }): { from: string, to: string }` — new; returns the same-length window ending on the day before `from`

- [ ] **Step 1: Initialize the git repo** (skip if already initialized — check `.git/` first)

```bash
cd /Users/bilalshaikh/Downloads/dashboard-6e112f6fac5c47cc2b3a0c1f707c234b45f83a3d
ls -la .git 2>/dev/null || git init && git add -A && git commit -m "chore: initial commit — snapshot before compare-to-prior feature"
```

- [ ] **Step 2: Rewrite `client/src/lib/dates.js`**

```js
/** Today at midnight local (stable per render cycle). */
export function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Clamp a date between min and max. */
export function clamp(date, min, max) {
  if (date < min) return min;
  if (date > max) return max;
  return date;
}

/** Format a Date to "YYYY-MM-DD" for <input type="date"> value. */
export function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse "YYYY-MM-DD" into a Date at midnight local. */
export function fromDateString(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** { from, to } for the 1st of the current month → today, as YYYY-MM-DD strings. */
export function currentMonthRange() {
  const now = today();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: toDateString(first), to: toDateString(now) };
}

/** Integer days between two dates, ignoring time of day. b - a. */
export function daysBetween(a, b) {
  const MS = 24 * 60 * 60 * 1000;
  const aMid = new Date(a);
  aMid.setHours(0, 0, 0, 0);
  const bMid = new Date(b);
  bMid.setHours(0, 0, 0, 0);
  return Math.round((bMid - aMid) / MS);
}

/** Inclusive day count of a { from, to } range. */
export function daysInRange({ from, to }) {
  return daysBetween(fromDateString(from), fromDateString(to)) + 1;
}

/**
 * Given a { from, to } range, return the same-length range ending on the day before `from`.
 * Example: { from: '2026-08-01', to: '2026-08-07' } (7 days) → { from: '2026-07-25', to: '2026-07-31' }.
 */
export function priorSameLengthRange(range) {
  const length = daysInRange(range);
  const fromDate = fromDateString(range.from);
  const priorTo = new Date(fromDate);
  priorTo.setDate(priorTo.getDate() - 1);
  const priorFrom = new Date(priorTo);
  priorFrom.setDate(priorFrom.getDate() - (length - 1));
  return { from: toDateString(priorFrom), to: toDateString(priorTo) };
}
```

- [ ] **Step 3: Update `client/src/components/DateRangeFilter.jsx`** — drop MIN_DATE import and the `min` attribute on both inputs

Change line 1 from:
```js
import { MIN_DATE, toDateString } from '../lib/dates';
```
to:
```js
import { toDateString } from '../lib/dates';
```

Remove line 4 (`const minStr = toDateString(MIN_DATE);`).

Delete the `min={minStr}` prop from both `<input>` elements (lines 27 and 38).

- [ ] **Step 4: Update `client/src/App.jsx` import**

Change line 3 from:
```js
import { today, toDateString, MIN_DATE } from './lib/dates';
```
to:
```js
import { today, toDateString } from './lib/dates';
```

(Line 74's `toDateString(MIN_DATE)` will break — Task 6 rewrites this whole state block. For now, temporarily replace `MIN_DATE` with `today()` on line 74 so the app still boots.)

- [ ] **Step 5: Update `.env.example` comment for `GOOGLE_CALLS_TAB`**

Find the line `GOOGLE_CALLS_TAB=Calls - May 2026` and replace with:

```
# Comma-separated list of monthly tab names — add each month's tab as it exists in the sheet.
GOOGLE_CALLS_TAB=Calls - May 2026,Calls - June 2026,Calls - July 2026,Calls - August 2026
```

- [ ] **Step 6: Update `CLAUDE.md`**

- **§1 header paragraph** (starts "Scope: May 2026 only"): replace the bolded scope line with:
  ```
  **Scope: multi-month.** Monthly calls tabs are added to `GOOGLE_CALLS_TAB` as each
  month's data becomes available. Default view is the current calendar month.
  ```
- **§4.1** — remove the two bullets referring to `min` and `MIN_DATE`. Change the default-range bullet to:
  ```
  - Default state on first load: From = 1st of current month, To = today.
  ```
- **§9** — delete the first bullet ("Months other than May 2026").
- **§10** — replace the sheet-strategy question with:
  ```
  - Should each month's calls tab be created manually, or automated via a script?
  ```

- [ ] **Step 7: Verify**

Run `npm run dev`. In the browser, confirm the app still boots without console errors, the date pickers no longer enforce a minimum date, and the default range still shows something reasonable (temporarily `today → today` since Task 6 hasn't set the real default yet).

- [ ] **Step 8: Commit**

```bash
git add client/src/lib/dates.js client/src/components/DateRangeFilter.jsx client/src/App.jsx .env.example CLAUDE.md
git commit -m "feat(dates): remove May-2026 scope floor, add compare-range helpers"
```

---

### Task 2: `transform.js` daily-counts helper + `format.js` compare label

**Files:**
- Modify: `client/src/lib/transform.js` (append one function)
- Modify: `client/src/lib/format.js` (append two functions)

**Interfaces:**
- Consumes: `daysBetween`, `daysInRange`, `fromDateString` from Task 1.
- Produces:
  - `dailyCountsByDay(rows, dateField, range): [{ day: number, count: number }]` — day 1-indexed; length = `daysInRange(range)`; rows outside range are ignored.
  - `formatCompareLabel(range): string` — smart label ("Jul" / "Jul 25 – Jul 31" / "Jul 25 – Aug 3")
  - `formatMainLabel(range): string` — same rules as above (used for chart legend of main period)

- [ ] **Step 1: Add `dailyCountsByDay` to `client/src/lib/transform.js`**

Append to end of file:

```js
import { daysBetween, daysInRange, fromDateString } from './dates';

/**
 * Bucket `rows` into daily counts indexed by day-of-period.
 * Returns an array of length daysInRange(range) with { day, count } entries (day is 1-indexed).
 * Rows whose date falls outside `range` are ignored.
 */
export function dailyCountsByDay(rows, dateField, range) {
  const length = daysInRange(range);
  const start = fromDateString(range.from);
  const buckets = Array.from({ length }, (_, i) => ({ day: i + 1, count: 0 }));

  for (const row of rows) {
    const rowDate = new Date(row[dateField]);
    const offset = daysBetween(start, rowDate);
    if (offset >= 0 && offset < length) {
      buckets[offset].count += 1;
    }
  }

  return buckets;
}
```

- [ ] **Step 2: Add label formatters to `client/src/lib/format.js`**

Append to end of file:

```js
import { fromDateString } from './dates';

/**
 * Smart label for a { from, to } range.
 * - Full calendar month (from='YYYY-MM-01', to=last day of same month) → "Jul"
 * - Same month, partial → "Jul 25 – Jul 31"
 * - Different months → "Jul 25 – Aug 3"
 */
function formatRangeLabel(range) {
  const from = fromDateString(range.from);
  const to = fromDateString(range.to);
  const sameMonth = from.getFullYear() === to.getFullYear() && from.getMonth() === to.getMonth();
  const lastDayOfMonth = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate();
  const isFullMonth = sameMonth && from.getDate() === 1 && to.getDate() === lastDayOfMonth;

  if (isFullMonth) return format(from, 'MMM');
  if (sameMonth) return `${format(from, 'MMM d')} – ${format(to, 'MMM d')}`;
  return `${format(from, 'MMM d')} – ${format(to, 'MMM d')}`;
}

export function formatCompareLabel(range) {
  return formatRangeLabel(range);
}

export function formatMainLabel(range) {
  return formatRangeLabel(range);
}
```

- [ ] **Step 3: Verify**

Run `npm run dev`. Confirm no console errors on boot (these functions aren't used yet, so this is just a smoke test that imports resolve).

Optional sanity check in DevTools console:

```js
// Paste in the browser console after opening the app
const { formatCompareLabel } = await import('/src/lib/format.js');
formatCompareLabel({ from: '2026-07-01', to: '2026-07-31' }); // "Jul"
formatCompareLabel({ from: '2026-07-25', to: '2026-07-31' }); // "Jul 25 – Jul 31"
formatCompareLabel({ from: '2026-07-25', to: '2026-08-03' }); // "Jul 25 – Aug 3"
```

- [ ] **Step 4: Commit**

```bash
git add client/src/lib/transform.js client/src/lib/format.js
git commit -m "feat(lib): add dailyCountsByDay and range-label formatters"
```

---

### Task 3: `<DeltaChip>` component

**Files:**
- Create: `client/src/components/DeltaChip.jsx`

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `<DeltaChip current={number} previous={number} invert?={boolean} compareLabel={string} />` — renders a small colored chip.

- [ ] **Step 1: Create `client/src/components/DeltaChip.jsx`**

```jsx
export default function DeltaChip({ current, previous, invert = false, compareLabel }) {
  // Both zero — muted placeholder.
  if (previous === 0 && current === 0) {
    return (
      <p className="mt-2 text-xs text-gray-400">— vs {compareLabel}</p>
    );
  }

  // No prior data but current has something — "new".
  if (previous === 0 && current > 0) {
    const tone = invert ? 'text-accent-rose' : 'text-brand';
    return (
      <p className={`mt-2 text-xs font-medium ${tone}`}>
        ↑ {current} (new) vs {compareLabel}
      </p>
    );
  }

  const delta = current - previous;
  const pct = Math.round((delta / previous) * 100);
  const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
  const pctSign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  const absDelta = Math.abs(delta);
  const absPct = Math.abs(pct);

  let tone;
  if (delta === 0) tone = 'text-gray-400';
  else {
    const isGood = invert ? delta < 0 : delta > 0;
    tone = isGood ? 'text-brand' : 'text-accent-rose';
  }

  return (
    <p className={`mt-2 text-xs font-medium ${tone}`}>
      {arrow} {absDelta} ({pctSign}{absPct}%) vs {compareLabel}
    </p>
  );
}
```

- [ ] **Step 2: Verify**

Run `npm run dev`. Component isn't mounted yet (mounted in Task 4). Confirm no console errors — this is a smoke test on the import path only.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/DeltaChip.jsx
git commit -m "feat(components): add DeltaChip"
```

---

### Task 4: Wire `<DeltaChip>` into `StatCard` and `ChannelCard`

**Files:**
- Modify: `client/src/components/StatCard.jsx` (import + render conditionally after AnimatedNumber)
- Modify: `client/src/components/ChannelCard.jsx` (import + render conditionally after AnimatedNumber)

**Interfaces:**
- Consumes: `<DeltaChip>` from Task 3.
- Produces:
  - `<StatCard>` gains optional prop `deltaChip: ReactNode` (any element or `null`).
  - `<ChannelCard>` gains optional prop `deltaChip: ReactNode`.

- [ ] **Step 1: Modify `client/src/components/StatCard.jsx`**

Change the function signature to accept `deltaChip`:

```jsx
export default function StatCard({ label, value, sublabel, accent = 'brand', buttonLabel, onButtonClick, deltaChip }) {
```

Insert `{deltaChip}` immediately after the `<AnimatedNumber />` `<p>` block. It should sit between the value and the `sublabel` paragraph:

```jsx
<p className="mt-4 font-display text-5xl text-white">
  <AnimatedNumber value={value} />
</p>
{deltaChip}
{sublabel && (
  <p className="mt-2 text-xs text-white/50">{sublabel}</p>
)}
```

Note: `DeltaChip` renders sage/rose colors that were designed for light backgrounds. On the dark `StatCard`, override text color to a lighter variant. Wrap `{deltaChip}` in a div that lightens child text:

```jsx
{deltaChip && (
  <div className="[&>p]:!text-white/70 [&>p.text-brand]:!text-emerald-300 [&>p.text-accent-rose]:!text-rose-300">
    {deltaChip}
  </div>
)}
```

- [ ] **Step 2: Modify `client/src/components/ChannelCard.jsx`**

Add `deltaChip` to props and render it immediately after the number `<p>`:

```jsx
export default function ChannelCard({ label, count, buttonLabel, onButtonClick, icon, accentClass, deltaChip }) {
  return (
    <div className="card group p-5 transition-all duration-300 hover:-translate-y-0.5">
      <div>
        <div className="flex items-center gap-2">
          {icon && <span className="text-base">{icon}</span>}
          <p className="text-sm font-medium text-gray-400">{label}</p>
        </div>
        <p className={`mt-2 font-display text-4xl ${accentClass || 'text-gray-900'}`}>
          <AnimatedNumber value={count} />
        </p>
        {deltaChip}
      </div>
      ...
```

- [ ] **Step 3: Verify**

Run `npm run dev`. The dashboard should render exactly as before (no `deltaChip` prop is being passed yet — that's Task 6). Confirm no visual changes and no console errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/StatCard.jsx client/src/components/ChannelCard.jsx
git commit -m "feat(cards): thread optional deltaChip slot into StatCard and ChannelCard"
```

---

### Task 5: `<CompareRangePill>` component + integrate into `<DashboardHeader>`

**Files:**
- Create: `client/src/components/CompareRangePill.jsx`
- Modify: `client/src/components/DashboardHeader.jsx` (accept + mount the pill)

**Interfaces:**
- Consumes: `formatCompareLabel` from Task 2; `toDateString` from Task 1.
- Produces:
  - `<CompareRangePill compareRange={{from, to}} mainRange={{from, to}} onChange={(range) => void} onReset={() => void} />`
  - `<DashboardHeader>` gains three new props: `compareRange`, `mainRange`, `onCompareChange`, `onCompareReset`.

- [ ] **Step 1: Create `client/src/components/CompareRangePill.jsx`**

```jsx
import { useEffect, useRef, useState } from 'react';
import { formatCompareLabel } from '../lib/format';

export default function CompareRangePill({ compareRange, onChange, onReset }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function handleEsc(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  function handleField(field, value) {
    let from = field === 'from' ? value : compareRange.from;
    let to = field === 'to' ? value : compareRange.to;
    if (to < from) [from, to] = [to, from];
    onChange({ from, to });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-card px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-brand/40 hover:text-brand"
      >
        vs {formatCompareLabel(compareRange)}
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-surface-border bg-surface-card p-4 shadow-lg">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Compare to
          </p>
          <div className="flex flex-col gap-3">
            <label className="flex items-center justify-between gap-2 text-sm text-gray-500">
              From
              <input
                type="date"
                value={compareRange.from}
                onChange={(e) => handleField('from', e.target.value)}
              />
            </label>
            <label className="flex items-center justify-between gap-2 text-sm text-gray-500">
              To
              <input
                type="date"
                value={compareRange.to}
                onChange={(e) => handleField('to', e.target.value)}
              />
            </label>
          </div>
          <button
            onClick={() => {
              onReset();
              setOpen(false);
            }}
            className="mt-4 text-xs font-medium text-brand hover:underline"
          >
            Reset to previous period
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Modify `client/src/components/DashboardHeader.jsx`**

Change the function signature to:

```jsx
export default function DashboardHeader({ fetchedAt, isRefreshing, onRefresh, compareRange, onCompareChange, onCompareReset }) {
```

Import at the top:

```jsx
import CompareRangePill from './CompareRangePill';
```

Insert `<CompareRangePill>` inside the existing right-side `div className="flex items-center gap-4"` block, before the "Updated ..." paragraph:

```jsx
<div className="flex items-center gap-4">
  <CompareRangePill
    compareRange={compareRange}
    onChange={onCompareChange}
    onReset={onCompareReset}
  />
  {fetchedAt && (
    <p className="text-xs text-gray-400">
      Updated {formatTimestamp(fetchedAt)}
    </p>
  )}
  <button ...>Refresh</button>
</div>
```

- [ ] **Step 3: Verify**

Run `npm run dev`. The header will crash because `App.jsx` isn't yet passing `compareRange` — that's fixed in Task 6. For now, confirm the file compiles and the crash message is about `compareRange` being undefined, not a syntax error. If you want to temporarily test the pill in isolation, hard-code `compareRange={{ from: '2026-07-01', to: '2026-07-31' }}` and stub the callbacks, click the pill, verify the popover opens, closes on outside-click and Esc, and the date inputs render.

Revert the temporary hard-code before committing.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/CompareRangePill.jsx client/src/components/DashboardHeader.jsx
git commit -m "feat(components): add CompareRangePill, mount in header"
```

---

### Task 6: `App.jsx` — split date state, compute compare, pass everything down

**Files:**
- Modify: `client/src/App.jsx` (state, computes, section prop-passing)

**Interfaces:**
- Consumes: `currentMonthRange`, `priorSameLengthRange`, `daysInRange`, `today`, `toDateString` from Task 1; `dailyCountsByDay` from Task 2; `formatCompareLabel` from Task 2; `<DeltaChip>` from Task 3.
- Produces:
  - `<HighlightsSection>` and `<SourceSection>` receive new props (defined here, consumed in Task 8):
    - `mainDailySeries: [{day, count}]`
    - `compareDailySeries: [{day, count}]`
    - `mainLabel: string`, `compareLabel: string`
    - `deltaChipWebsite: ReactNode` (SourceSection only), `deltaChipCalls: ReactNode` (SourceSection only)
    - `deltaChipNewPatients: ReactNode`, `deltaChipMissed: ReactNode` (HighlightsSection)

- [ ] **Step 1: Rewrite the imports block at the top of `App.jsx`**

```jsx
import { useMemo, useState } from 'react';
import { useLeads } from './hooks/useLeads';
import { today, toDateString, currentMonthRange, priorSameLengthRange } from './lib/dates';
import {
  applyDateRange,
  filterBySource,
  filterNewPatients,
  filterMissedOpportunities,
  dailyCountsByDay,
} from './lib/transform';
import { formatCompareLabel, formatMainLabel } from './lib/format';
import DashboardHeader from './components/DashboardHeader';
import DateRangeFilter from './components/DateRangeFilter';
import HighlightsSection from './components/HighlightsSection';
import SourceSection from './components/SourceSection';
import LeadModal from './components/LeadModal';
import DeltaChip from './components/DeltaChip';
```

- [ ] **Step 2: Replace the existing `dateRange` state (lines 73–76 in current file) with the new split state and coupling helpers**

Inside `App()`, replace:

```jsx
const [dateRange, setDateRange] = useState({
  from: toDateString(MIN_DATE),
  to: toDateString(maxDate),
});
```

with:

```jsx
const initialMain = useMemo(() => currentMonthRange(), []);
const [mainRange, setMainRangeState] = useState(initialMain);
const [compareRange, setCompareRangeState] = useState(() => priorSameLengthRange(initialMain));
const [compareIsCustom, setCompareIsCustom] = useState(false);

function setMainRange(newRange) {
  setMainRangeState(newRange);
  if (!compareIsCustom) {
    setCompareRangeState(priorSameLengthRange(newRange));
  }
}

function setCompareRange(newRange) {
  setCompareRangeState(newRange);
  setCompareIsCustom(true);
}

function resetCompareRange() {
  setCompareRangeState(priorSameLengthRange(mainRange));
  setCompareIsCustom(false);
}
```

- [ ] **Step 3: Replace the single `filtered` block with main + compare computations**

Immediately after `const { website, calls, fetchedAt } = data;` replace the existing counts block with:

```jsx
const compareLabel = formatCompareLabel(compareRange);
const mainLabel = formatMainLabel(mainRange);

const {
  mainCounts,
  compareCounts,
  seoDaily,
  ppcDaily,
  highlightsDaily,
  missedCalls,
  seoNewLeads,
  ppcNewLeads,
} = useMemo(() => {
  function computeCounts(range) {
    const filtered = applyDateRange({ website, calls }, range.from, range.to);
    const newPatients = filterNewPatients(filtered);
    const missed = filterMissedOpportunities(filtered);
    const seo = filterBySource(filtered, 'SEO');
    const ppc = filterBySource(filtered, 'PPC');
    const seoNew = filterNewPatients(seo);
    const ppcNew = filterNewPatients(ppc);
    return {
      newPatients,
      missed,
      seoNew,
      ppcNew,
      counts: {
        totalNewPatients: newPatients.website.length + newPatients.calls.length,
        missedOpportunities: missed.calls.length,
        seo: { websiteNew: seoNew.website.length, callsNew: seoNew.calls.length },
        ppc: { websiteNew: ppcNew.website.length, callsNew: ppcNew.calls.length },
      },
    };
  }

  const main = computeCounts(mainRange);
  const compare = computeCounts(compareRange);

  // Section-level daily series. For section charts we count all "new patient" leads
  // in that section (website new + calls new), giving a single trend line per section.
  function seriesFor(rows, dateField, range) {
    return dailyCountsByDay(rows, dateField, range);
  }

  // Highlights = total new patients (website + calls, all sources).
  function highlightsSeries(source, range) {
    return {
      main: mergeDailySeries(
        seriesFor(source.newPatients.website, 'leadDate', range),
        seriesFor(source.newPatients.calls, 'dateTime', range),
      ),
    };
  }

  function sectionSeries(newLeads, range) {
    return mergeDailySeries(
      seriesFor(newLeads.website, 'leadDate', range),
      seriesFor(newLeads.calls, 'dateTime', range),
    );
  }

  return {
    mainCounts: main.counts,
    compareCounts: compare.counts,
    highlightsDaily: {
      main: sectionSeries(main.newPatients, mainRange),
      compare: sectionSeries(compare.newPatients, compareRange),
    },
    seoDaily: {
      main: sectionSeries(main.seoNew, mainRange),
      compare: sectionSeries(compare.seoNew, compareRange),
    },
    ppcDaily: {
      main: sectionSeries(main.ppcNew, mainRange),
      compare: sectionSeries(compare.ppcNew, compareRange),
    },
    missedCalls: main.missed.calls,
    seoNewLeads: main.seoNew,
    ppcNewLeads: main.ppcNew,
  };
}, [website, calls, mainRange, compareRange]);

// Small helper — sum two day-of-period-indexed arrays.
function mergeDailySeries(a, b) {
  const length = Math.max(a.length, b.length);
  const out = [];
  for (let i = 0; i < length; i++) {
    out.push({ day: i + 1, count: (a[i]?.count || 0) + (b[i]?.count || 0) });
  }
  return out;
}
```

**Note:** `mergeDailySeries` is a plain function declaration outside the `useMemo`. Place it above the `useMemo` block so hoisting isn't required.

- [ ] **Step 4: Update the JSX**

Replace the `<DashboardHeader>` element with:

```jsx
<DashboardHeader
  fetchedAt={fetchedAt}
  isRefreshing={isRefreshing}
  onRefresh={refresh}
  compareRange={compareRange}
  onCompareChange={setCompareRange}
  onCompareReset={resetCompareRange}
/>
```

Replace the `<DateRangeFilter>` element with:

```jsx
<DateRangeFilter
  dateRange={mainRange}
  maxDate={maxDate}
  onChange={setMainRange}
/>
```

Replace `<HighlightsSection>` with:

```jsx
<HighlightsSection
  totalNewPatients={mainCounts.totalNewPatients}
  missedOpportunities={mainCounts.missedOpportunities}
  onViewMissed={() => openModal('Missed Opportunities', 'calls', missedCalls)}
  mainSeries={highlightsDaily.main}
  compareSeries={highlightsDaily.compare}
  mainLabel={mainLabel}
  compareLabel={compareLabel}
  deltaChipNewPatients={
    <DeltaChip
      current={mainCounts.totalNewPatients}
      previous={compareCounts.totalNewPatients}
      compareLabel={compareLabel}
    />
  }
  deltaChipMissed={
    <DeltaChip
      current={mainCounts.missedOpportunities}
      previous={compareCounts.missedOpportunities}
      invert
      compareLabel={compareLabel}
    />
  }
/>
```

Replace both `<SourceSection>` blocks with (SEO shown; PPC is identical with `title="PPC"`, `subtitle="Google Ads"`, `mainCounts.ppc`/`compareCounts.ppc`, `ppcDaily`, `ppcNewLeads`):

```jsx
<SourceSection
  title="SEO"
  subtitle="Google Searches, Google Business, AI Search"
  websiteNewCount={mainCounts.seo.websiteNew}
  callsNewCount={mainCounts.seo.callsNew}
  onViewWebsite={() => openModal('SEO — Website Leads', 'website', seoNewLeads.website)}
  onViewCalls={() => openModal('SEO — Phone Calls', 'calls', seoNewLeads.calls)}
  mainSeries={seoDaily.main}
  compareSeries={seoDaily.compare}
  mainLabel={mainLabel}
  compareLabel={compareLabel}
  deltaChipWebsite={
    <DeltaChip
      current={mainCounts.seo.websiteNew}
      previous={compareCounts.seo.websiteNew}
      compareLabel={compareLabel}
    />
  }
  deltaChipCalls={
    <DeltaChip
      current={mainCounts.seo.callsNew}
      previous={compareCounts.seo.callsNew}
      compareLabel={compareLabel}
    />
  }
/>
```

- [ ] **Step 5: Verify**

Run `npm run dev`. `HighlightsSection` and `SourceSection` don't consume the new props yet (Task 8), so charts won't appear — that's expected. Confirm:
- The dashboard renders without console errors.
- The header shows the "vs Jul" pill (or whatever the previous month is for today's date).
- Clicking the pill opens the popover; editing dates flips `compareIsCustom` to true (verify by then changing the main range and confirming the compare doesn't auto-follow).
- Clicking "Reset to previous period" restores auto-follow behavior.

- [ ] **Step 6: Commit**

```bash
git add client/src/App.jsx
git commit -m "feat(app): split main/compare date state and compute compare counts"
```

---

### Task 7: Install Recharts + build `<SectionCompareChart>` component

**Files:**
- Modify: `client/package.json` (add recharts)
- Create: `client/src/components/SectionCompareChart.jsx`

**Interfaces:**
- Consumes: nothing new (Recharts is the new dependency).
- Produces:
  - `<SectionCompareChart mainSeries={[{day,count}]} compareSeries={[{day,count}]} mainLabel={string} compareLabel={string} accentColor={string} />`

- [ ] **Step 1: Install recharts**

```bash
cd /Users/bilalshaikh/Downloads/dashboard-6e112f6fac5c47cc2b3a0c1f707c234b45f83a3d/client
npm install recharts
```

- [ ] **Step 2: Create `client/src/components/SectionCompareChart.jsx`**

```jsx
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function SectionCompareChart({
  mainSeries,
  compareSeries,
  mainLabel,
  compareLabel,
  accentColor,
}) {
  // Truncate to overlap length so both lines cover the same x-range.
  const length = Math.min(mainSeries.length, compareSeries.length);
  if (length === 0) return null;

  const data = Array.from({ length }, (_, i) => ({
    day: i + 1,
    main: mainSeries[i]?.count ?? 0,
    compare: compareSeries[i]?.count ?? 0,
  }));

  return (
    <div className="mb-5 h-32 w-full rounded-xl border border-surface-border bg-surface-card p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid #E8E5E0',
              backgroundColor: '#FFFFFF',
            }}
            labelFormatter={(day) => `Day ${day}`}
            formatter={(value, name) => [value, name === 'main' ? mainLabel : compareLabel]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={(name) => (name === 'main' ? mainLabel : compareLabel)}
            iconSize={8}
          />
          <Line
            type="monotone"
            dataKey="compare"
            stroke={accentColor}
            strokeOpacity={0.25}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="main"
            stroke={accentColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run `npm run dev`. Component isn't mounted yet. Confirm no console errors — import path is valid, Recharts loads.

- [ ] **Step 4: Commit**

```bash
git add client/package.json client/package-lock.json client/src/components/SectionCompareChart.jsx
git commit -m "feat(chart): add SectionCompareChart with Recharts"
```

---

### Task 8: Wire chart + chips into `<HighlightsSection>` and `<SourceSection>`

**Files:**
- Modify: `client/src/components/HighlightsSection.jsx`
- Modify: `client/src/components/SourceSection.jsx`

**Interfaces:**
- Consumes: `<SectionCompareChart>` from Task 7; new props from Task 6.
- Produces: no new interfaces — this is the last integration step.

- [ ] **Step 1: Rewrite `client/src/components/HighlightsSection.jsx`**

```jsx
import StatCard from './StatCard';
import SectionCompareChart from './SectionCompareChart';

export default function HighlightsSection({
  totalNewPatients,
  missedOpportunities,
  onViewMissed,
  mainSeries,
  compareSeries,
  mainLabel,
  compareLabel,
  deltaChipNewPatients,
  deltaChipMissed,
}) {
  return (
    <div>
      <SectionCompareChart
        mainSeries={mainSeries}
        compareSeries={compareSeries}
        mainLabel={mainLabel}
        compareLabel={compareLabel}
        accentColor="#2e3e33"
      />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 [&>div>div]:h-full">
        <div className="animate-slide-up stagger-2 opacity-0">
          <StatCard
            label="New Patients"
            value={totalNewPatients}
            sublabel="Website + Phone across all sources"
            accent="brand"
            deltaChip={deltaChipNewPatients}
          />
        </div>
        <div className="animate-slide-up stagger-3 opacity-0">
          <StatCard
            label="Missed Opportunities"
            value={missedOpportunities}
            sublabel="Unanswered or abandoned calls"
            accent="rose"
            buttonLabel="View Missed Opportunity"
            onButtonClick={onViewMissed}
            deltaChip={deltaChipMissed}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Modify `client/src/components/SourceSection.jsx`**

Update the imports at the top:

```jsx
import ChannelCard from './ChannelCard';
import SectionCompareChart from './SectionCompareChart';
```

Change the config to include a hex `accentHex` value (needed for Recharts, which can't consume Tailwind class names):

```jsx
const config = {
  SEO: {
    accent: 'text-[#2e3e33]',
    underline: 'bg-accent-teal',
    accentHex: '#0D9488',
    tagBg: 'bg-accent-teal-light text-accent-teal-dark',
    websiteIcon: '🌐',
    callIcon: '📞',
  },
  PPC: {
    accent: 'text-[#2e3e33]',
    underline: 'bg-brand',
    accentHex: '#2e3e33',
    tagBg: 'bg-brand-light text-brand-dark',
    websiteIcon: '🎯',
    callIcon: '📱',
  },
};
```

Change the function signature:

```jsx
export default function SourceSection({
  title,
  subtitle,
  websiteNewCount,
  callsNewCount,
  onViewWebsite,
  onViewCalls,
  mainSeries,
  compareSeries,
  mainLabel,
  compareLabel,
  deltaChipWebsite,
  deltaChipCalls,
}) {
```

Insert the chart between the heading block and the card grid (after the closing `</div>` of the heading `<div className="mb-6">`):

```jsx
<SectionCompareChart
  mainSeries={mainSeries}
  compareSeries={compareSeries}
  mainLabel={mainLabel}
  compareLabel={compareLabel}
  accentColor={c.accentHex}
/>
```

Add `deltaChip={deltaChipWebsite}` to the first `<ChannelCard>` and `deltaChip={deltaChipCalls}` to the second.

- [ ] **Step 3: Verify (full end-to-end walkthrough)**

Run `npm run dev`. Confirm:

1. Dashboard loads. Each of the three sections now shows a small overlaid line chart at the top.
2. Each of the six numbers (2 in Highlights, 2 in SEO, 2 in PPC) shows a delta chip below it.
3. New Patients / channel counts: up = sage green, down = rose. Missed Opportunities: **inverted** — up = rose, down = green.
4. Shrink the main range to a week (e.g. `Aug 1 → Aug 7`). Chart and chips recompute; compare range in the pill becomes `Jul 25 – Jul 31`.
5. Click the pill → popover opens. Edit the compare "From" date → popover updates. Close popover. Change main range → compare stays custom (does NOT auto-follow).
6. Click the pill → click "Reset to previous period" → compare snaps back to same-length prior; changing main range again now auto-updates compare.
7. Compare period with zero data: chip shows `↑ N (new)`. Both zero: `— vs ...`.
8. Resize to mobile width. Charts, chips, and pill all remain readable and don't overflow.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/HighlightsSection.jsx client/src/components/SourceSection.jsx
git commit -m "feat(sections): render SectionCompareChart and DeltaChips in each section"
```

---

### Task 9: Missing-tab warning banner + spec-testing checklist

**Files:**
- Modify: `client/src/App.jsx` (render banner when `data.errors` present)

**Interfaces:**
- Consumes: `data.errors` from the existing backend response (already returned by `server/sheets.js:158-163`).
- Produces: no new interfaces.

- [ ] **Step 1: Add the banner to `App.jsx`**

Just below `const { website, calls, fetchedAt } = data;` (after the destructure), also destructure `errors`:

```jsx
const { website, calls, fetchedAt, errors } = data;
```

Insert immediately after the `<DateRangeFilter>` block (before `<h2>Summary</h2>`):

```jsx
{errors && errors.length > 0 && (
  <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
    <p className="font-semibold">Some data could not be loaded:</p>
    <ul className="mt-1 list-inside list-disc">
      {errors.map((e) => (
        <li key={e.sheet}>
          <span className="font-mono">{e.sheet}</span> — {e.message}
        </li>
      ))}
    </ul>
    <p className="mt-2 text-xs text-amber-800">
      Comparison numbers for missing periods will read as zero.
    </p>
  </div>
)}
```

- [ ] **Step 2: Verify banner (induce an error)**

Temporarily add a bogus tab name to `server/.env`:

```
GOOGLE_CALLS_TAB=Calls - May 2026,Calls - Nope 2099
```

Restart the server. Reload the dashboard. Confirm:
- The banner appears at the top listing `calls:Calls - Nope 2099` with the sheet error.
- The rest of the dashboard renders normally.
- Charts and chips for the good months are unaffected.

Then revert the `.env` change and restart the server.

- [ ] **Step 3: Final spec-testing pass**

Walk through the full test list from the design spec's "Testing" section (`docs/superpowers/specs/2026-08-07-compare-to-prior-design.md` §Testing):

1. Default range → compare defaults to previous full month, chips read "vs Jul" (or equivalent).
2. Shrink main range to a week → compare becomes 7-day window; chips + chart recompute.
3. Custom compare via popover → main-range changes leave custom compare alone; Reset restores auto-follow.
4. Bad tab in `.env` → banner + rest of dashboard works.
5. Missed Opportunities delta color inverts (up = red).
6. Empty compare period → chip shows `(new)` label; chart renders without NaN.

- [ ] **Step 4: Commit**

```bash
git add client/src/App.jsx
git commit -m "feat(app): show warning banner when a Sheets tab fails to load"
```

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| Goal 1: delta chips on every number | Tasks 3, 4, 6 |
| Goal 2: per-section overlaid line chart | Tasks 7, 8 |
| Goal 3: main defaults to current month | Task 6 (uses `currentMonthRange()` from Task 1) |
| Goal 4: compare defaults & auto-follow | Task 6 (state) + Task 1 (`priorSameLengthRange`) |
| Goal 5: multi-month sheet support | Task 1 (env comment, doc updates); backend needs no code change |
| `dates.js` API | Task 1 |
| `transform.js` daily helper | Task 2 |
| Label formatters | Task 2 |
| `<DeltaChip>` all rules | Task 3 |
| Compare range pill + popover + reset | Task 5 |
| `<SectionCompareChart>` | Task 7 |
| Chip placement rules | Tasks 4 + 6 (wiring) + 8 (SourceSection) |
| Section per-heading chart | Task 8 |
| Empty/degraded chart & chip states | Tasks 3 (chip logic), 7 (chart returns null on 0 length) |
| Missing-tab warning banner | Task 9 |
| CLAUDE.md scope updates | Task 1 |
| `.env.example` comment | Task 1 |

**Placeholder scan:** No TBDs, TODOs, or "add appropriate error handling" phrases. Every code block is complete.

**Type consistency:**
- `dailyCountsByDay` returns `[{ day, count }]` — used by `mergeDailySeries` (Task 6) and `<SectionCompareChart>` (Task 7). ✓
- `mainRange` / `compareRange` shape `{ from: string, to: string }` — matches `<DateRangeFilter>` (existing) and `<CompareRangePill>` (Task 5). ✓
- `deltaChip` prop name consistent across `<StatCard>` and `<ChannelCard>` (Task 4). ✓
- `mainSeries` / `compareSeries` / `mainLabel` / `compareLabel` props identical between `<HighlightsSection>`, `<SourceSection>`, and `<SectionCompareChart>`. ✓

**Note on git commits:** Task 1 conditionally initializes the repo if missing. All subsequent commit steps assume it exists.
