# Compare-to-prior period + multi-month support

**Status:** design approved 2026-08-07
**Author:** with Claude
**Related code:** `client/src/App.jsx`, `client/src/lib/dates.js`, `client/src/lib/transform.js`, `client/src/components/*`, `client/src/index.css`, `client/tailwind.config.js`, `server/sheets.js`, `.env.example`, `CLAUDE.md`

## Problem

The dashboard currently shows one date range (May 2026 only, hard-floored) with no
sense of whether the numbers are up or down. Users want to see how the current period
compares to a prior equivalent period — with the "compare to" both visible and adjustable.

Enabling this requires lifting the May-2026-only scope so multiple months can coexist.

## Goals

1. Every number on the dashboard shows a delta chip vs a comparison period.
2. Each of the three sections (Highlights, SEO, PPC) shows a small overlaid line chart
   comparing this-period vs compare-period day-by-day.
3. The main date range defaults to the current calendar month (1st → today).
4. The compare range defaults to the same-length window immediately prior to the main
   range, and follows the main range as it changes (unless the user has manually edited
   the compare range).
5. Data from multiple monthly tabs loads without changes to the sheets architecture —
   just env config + code de-scoping.

## Non-goals

- URL-based date range state (still `useState`).
- Custom compare shapes beyond "same length immediately prior" (no "vs last year",
  "vs year to date", etc.).
- Charts beyond the three per-section overlays (no daily-detail drill-down, no CSV
  export, no per-lead-source stacked charts).
- Server-side date filtering. Client keeps filtering the full dataset.
- Backfilling historical May 2026 sheet data into new tabs — assumed to be operational
  work outside this spec.

## Data & scope changes

### `lib/dates.js`

- Remove `MIN_DATE = new Date('2026-05-01T00:00:00')` and every import of it.
- Remove the `min` prop on the date `<input>`s in `DateRangeFilter.jsx`. Keep `max = today`.
- Add:
  - `currentMonthRange()` → `{ from: firstOfCurrentMonth, to: today }`
  - `priorSameLengthRange({ from, to })` → returns a range of the same day-count
    ending on the day before `from`.
    - Length is computed inclusive (`daysBetween(from, to) + 1`).
    - Result: `{ from: fromMinusN, to: fromMinusOne }` where `N = length - 1`.
  - `daysBetween(a, b)` — small helper (integer days, ignores time-of-day).
  - `daysInRange({ from, to })` → integer count, inclusive.

### `server/sheets.js`

No code changes. The existing comma-separated `GOOGLE_CALLS_TAB` support handles
multiple monthly tabs. Missing tabs already surface via the `errors` array without
500ing.

### `.env.example`

Update the comment on `GOOGLE_CALLS_TAB` to document the comma-separated pattern:

```
GOOGLE_CALLS_TAB=Calls - May 2026,Calls - June 2026,Calls - July 2026,Calls - August 2026
```

### `CLAUDE.md`

- Section 1 header: drop "May 2026 only" scope line; replace with "multi-month, driven
  by monthly calls tabs".
- Section 4.1: remove the "`min` = 2026-05-01" rule; update default range language.
- Section 9: remove "Months other than May 2026" from the not-doing list.
- Section 10: retire the sheet-strategy open question — resolved (monthly tabs).

## State & compute

### `App.jsx` state

Replace the single `dateRange` state with:

```js
const [mainRange, setMainRange] = useState(currentMonthRange());
const [compareRange, setCompareRange] = useState(priorSameLengthRange(mainRange));
const [compareIsCustom, setCompareIsCustom] = useState(false);
```

- When `setMainRange` fires and `compareIsCustom === false`, also call
  `setCompareRange(priorSameLengthRange(newMain))`. Wrap this coupling in a
  single `updateMainRange(newRange)` helper so components only touch one setter.
- When the user edits `compareRange` via the compare popover, `setCompareIsCustom(true)`.
- Provide a "Reset to previous period" action in the compare popover that resets to
  `priorSameLengthRange(mainRange)` and flips `compareIsCustom` back to `false`.

### `lib/transform.js`

No new filter functions. Add one pure helper:

```js
// Returns [{ day: 1, count: N }, ...] indexed by day-of-period.
// `range` = { from, to }. `dateField` = key on each row holding an ISO date string.
dailyCountsByDay(rows, dateField, range)
```

- Bucket rows by `daysBetween(range.from, row[dateField])` (0-indexed internally,
  1-indexed in the output for display).
- Result length = `daysInRange(range)`.
- Rows outside `range` are ignored (defensive — caller should already have filtered).

Existing counts are computed exactly as they are today, just called twice (once with
`mainRange`, once with `compareRange`) inside `App.jsx`'s `useMemo`.

## UI

### Header (compare-range control)

`DashboardHeader` gains a compact "vs" pill next to the existing Refresh button:

```
Range: [ From ] [ To ]     vs Jul 1 – Jul 31 ▾    Updated 2:34pm    [ Refresh ]
```

- Pill label uses a smart formatter:
  - Same calendar month, full month → month name (`vs Jul`).
  - Same calendar month, partial → `vs Jul 25 – Jul 31`.
  - Different months → `vs Jul 25 – Aug 3`.
- Click the pill → popover with two date `<input>`s + a "Reset to previous period" link.

The main "Range" control is the existing `DateRangeFilter` — no visual change beyond
adding the "Range:" label to differentiate it from the compare pill.

### `DeltaChip` component (new)

Props: `{ current: number, previous: number, invert?: boolean, compareLabel: string }`.

Render rules:

- `previous === 0 && current === 0` → `— vs {compareLabel}` (muted gray).
- `previous === 0 && current > 0` → `↑ {current} (new) vs {compareLabel}` (sage green,
  or muted red when `invert === true`).
- Otherwise:
  - `delta = current - previous`
  - `pct = round((delta / previous) * 100)`
  - Arrow `↑` if `delta > 0`, `↓` if `delta < 0`, `→` if `delta === 0`.
  - Format: `{arrow} {|delta|} ({sign}{pct}%) vs {compareLabel}`.
  - Zero delta: `→ 0 (0%) vs {compareLabel}` (muted).
- Sign color: green when the change is "good", red when "bad".
  - Default: `delta > 0` = good.
  - When `invert === true` (missed opportunities): `delta > 0` = bad.
  - Colors use the same sage green for positive as the rest of the brand
    (`#2e3e33`) and a muted red for negative (align with existing `accent.rose`).

### Chip placement

One `DeltaChip` below the big number on every card:

- `StatCard` (New Patients — no invert; Missed Opportunities — invert)
- `ChannelCard` × 4 (SEO Website, SEO Phone, PPC Website, PPC Phone — no invert)

Layout is `mt-2 text-xs`. Sections keep their existing structure; total card height
grows by ~20px.

### `SectionCompareChart` component (new)

One per section (Highlights, SEO, PPC). Small overlaid line chart above the section's
cards, using Recharts.

Props:

```js
{
  mainSeries: [{ day: 1, count: N }, ...],     // main period, day-of-period indexed
  compareSeries: [{ day: 1, count: M }, ...],  // compare period, same length as above
  mainLabel: string,                            // e.g. "Aug 1 – Aug 7"
  compareLabel: string,                         // e.g. "Jul 1 – Jul 31"
  accentColor: string                           // section accent (sage or teal)
}
```

Behavior:

- Truncate both series to `min(mainSeries.length, compareSeries.length)` so lines
  are directly comparable and neither ends abruptly mid-chart.
- Height: 120px. No axis lines, no y-axis labels; x-axis shows just start/end day
  numbers as ticks. Tooltip on hover: `Day N — Main: X, Compare: Y`.
- Main series: solid line, 2px, `accentColor` at full opacity.
- Compare series: solid line, 2px, `accentColor` at 25% opacity.
- Legend at top-right: two tiny swatches with `mainLabel` / `compareLabel`.

### Per-section layout

Each section renders in order:

```
[Section heading (h2) + short underline]      ← already exists
[SectionCompareChart, 120px]                  ← new
[Grid of cards, 2 columns md+]                ← already exists, each card now has DeltaChip
```

Highlights section: heading stays as-is (currently no `SourceSection`-style heading —
add a small "Highlights" heading in the same style for consistency), chart above the
two `StatCard`s.

### Empty / degraded states

- **Compare range empty (no data at all in that window):** chip shows `↑ N (new)` or
  `— vs {compareLabel}`; chart still renders the main line with the compare line at 0.
- **Main range empty:** chart shows only the compare line; chips inverted (`↓ N`).
- **Compare tab missing from sheet (in `errors` array):** show a small warning banner
  under the header — "Comparison data unavailable for {tab name}" — but don't hide
  chips or charts.
- **Chart with 1-2 data points:** Recharts renders correctly with dots; acceptable.

## Library additions

- `recharts` (~40KB gz). Only used inside `SectionCompareChart`. No global styling
  coupling — chart consumes tokens via props.

No other libraries. Popover for the compare pill is built with a plain
`useState({ open, onClose })` + click-outside handler; no need for a floating-ui
dependency at this size.

## File layout deltas

New:
- `client/src/components/DeltaChip.jsx`
- `client/src/components/SectionCompareChart.jsx`
- `client/src/components/CompareRangePill.jsx` (the header pill + popover)

Modified:
- `client/src/App.jsx` — split date state, compute compare counts + daily series,
  pass to sections.
- `client/src/lib/dates.js` — remove MIN_DATE, add helpers.
- `client/src/lib/transform.js` — add `dailyCountsByDay`.
- `client/src/lib/format.js` — add `formatCompareLabel(range)`, `formatMainLabel(range)`.
- `client/src/components/DashboardHeader.jsx` — mount `CompareRangePill`.
- `client/src/components/DateRangeFilter.jsx` — remove MIN_DATE min prop, add "Range:" label.
- `client/src/components/HighlightsSection.jsx` — add heading + chart, thread chip props.
- `client/src/components/SourceSection.jsx` — add chart, thread chip props.
- `client/src/components/StatCard.jsx` — render optional `<DeltaChip>` below value.
- `client/src/components/ChannelCard.jsx` — render optional `<DeltaChip>` below count.
- `client/package.json` — add `recharts`.
- `.env.example` — comment.
- `CLAUDE.md` — scope updates.

## Testing

No test framework yet (per CLAUDE.md §8). Verification is manual:

1. Load dashboard with default range → confirm compare defaults to previous month
   full range and chips show "vs Jul" (or equivalent).
2. Shrink main range to a week → chips + charts recompute with 7-day compare window.
3. Manually edit compare via popover → confirm subsequent main-range changes leave
   the custom compare alone; confirm "Reset" restores auto-follow behavior.
4. Break a monthly tab name in `.env` → confirm warning banner + rest of dashboard
   continues to work.
5. Missed Opportunities delta color inverts correctly (up = red).
6. Empty compare period → chip shows `(new)` label; chart renders without NaN.

Adding Vitest for `dates.js` + `transform.js` helpers is worth doing but is
separately scoped — flagged as follow-up, not a blocker.

## Rollout

Single change, deployed together. No feature flag — the compare view is the new
default. If it needs to be reverted, revert the commit.
