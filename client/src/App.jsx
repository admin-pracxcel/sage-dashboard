import { useMemo, useState } from 'react';
import { useLeads } from './hooks/useLeads';
import { today, currentMonthRange, priorSameLengthRange } from './lib/dates';
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
import SourceSection, { SourceSectionHeading } from './components/SourceSection';
import SectionCompareChart from './components/SectionCompareChart';
import CompareSidePanel from './components/CompareSidePanel';
import LeadModal from './components/LeadModal';
import DeltaChip from './components/DeltaChip';

const maxDate = today();

function LoadingSkeleton() {
  return (
    <div className="dot-grid bg-mesh min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <div className="h-3 w-28 skeleton-shimmer" />
          <div className="mt-3 h-10 w-72 skeleton-shimmer" />
          <div className="mt-3 h-4 w-48 skeleton-shimmer" />
          <div className="mt-6 h-px bg-surface-border" />
        </div>
        <div className="mb-8 h-10 w-96 skeleton-shimmer" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="h-36 rounded-2xl skeleton-shimmer" />
          <div className="h-36 rounded-2xl skeleton-shimmer" />
        </div>
        <div className="mt-10 space-y-10">
          {[1, 2].map((i) => (
            <div key={i}>
              <div className="mb-4 h-6 w-20 skeleton-shimmer" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="h-32 rounded-2xl skeleton-shimmer" />
                <div className="h-32 rounded-2xl skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="dot-grid bg-mesh flex min-h-screen items-center justify-center p-8">
      <div className="animate-fade-in text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-rose-light">
          <svg className="h-8 w-8 text-accent-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="font-display text-xl text-gray-900">Failed to load leads</p>
        <p className="mt-2 text-sm text-gray-400">{message}</p>
        <button
          onClick={onRetry}
          className="mt-6 rounded-xl border border-surface-border bg-surface-card px-6 py-2.5 text-sm font-medium text-gray-600 transition-all hover:border-brand/40 hover:text-brand"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

// Small helper — sum two day-of-period-indexed arrays.
function mergeDailySeries(a, b) {
  const length = Math.max(a.length, b.length);
  const out = [];
  for (let i = 0; i < length; i++) {
    out.push({ day: i + 1, count: (a[i]?.count || 0) + (b[i]?.count || 0) });
  }
  return out;
}

export default function App() {
  const { data, isLoading, isError, error, refresh, isRefreshing } = useLeads();

  const initialMain = useMemo(() => currentMonthRange(), []);
  const [mainRange, setMainRangeState] = useState(initialMain);
  const [compareRange, setCompareRangeState] = useState(() => priorSameLengthRange(initialMain));
  const [compareIsCustom, setCompareIsCustom] = useState(false);
  const [modal, setModal] = useState(null);

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
    const website = data?.website ?? [];
    const calls = data?.calls ?? [];

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
  }, [data, mainRange, compareRange]);

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorState message={error.message} onRetry={refresh} />;

  const { fetchedAt, errors } = data;

  function openModal(title, type, leads) {
    setModal({ title, type, leads });
  }

  // Shared left-cell content wrapper: centers content at max-w-6xl with horizontal padding
  // dot-grid and bg-mesh removed — body #FAF9F7 provides the background
  const LeftCell = ({ children, className = '' }) => (
    <div className={`px-6 md:px-10 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </div>
  );

  // Shared right-cell: transparent so the absolute gradient behind shows through.
  // Uses md:flex so consumers can pass items-start / items-center via className.
  const RailCell = ({ children, className = '' }) => (
    <div className={`hidden px-5 md:flex ${className}`}>
      {children}
    </div>
  );

  return (
    <>
      <div className="relative min-h-screen">
        {/* Right rail gradient — absolute, behind the rail column, spans full page height */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[450px] bg-gradient-to-b from-brand via-brand-dark to-brand-deep md:block"
        />

        {/* Page-level CSS Grid: two columns on md+, one column on mobile.
            gap-0 so right-column cells touch to form one continuous gradient rail. */}
        <div className="relative md:grid md:grid-cols-[minmax(0,1fr)_450px]">

          {/* ── Row 1: Header + DateRangeFilter + banner + Summary heading / "Compared With" ── */}
          <LeftCell className="pt-6 md:pt-10 pb-5">
            <DashboardHeader
              fetchedAt={fetchedAt}
              isRefreshing={isRefreshing}
              onRefresh={refresh}
            />
            <div className="mb-8">
              <DateRangeFilter
                dateRange={mainRange}
                maxDate={maxDate}
                onChange={setMainRange}
              />
            </div>
            {errors && errors.length > 0 && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Some data could not be loaded:</p>
                <ul className="mt-1 list-inside list-disc">
                  {errors.map((e) => (
                    <li key={e.sheet}>
                      <span className="font-mono">{e.sheet.replace(/^(calls|website):/, '')}</span> — {e.message}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-amber-800">
                  Comparison numbers for missing periods will read as zero.
                </p>
              </div>
            )}
            <h2 className="mb-5 font-display text-2xl text-gray-900">Summary</h2>
          </LeftCell>

          {/* Right row 1: "Compared With" compact block — top-aligned */}
          <RailCell className="items-start pt-6 md:pt-10 pb-5">
            <CompareSidePanel
              compareRange={compareRange}
              onChange={setCompareRange}
              onReset={resetCompareRange}
            />
          </RailCell>

          {/* ── Row 2: Highlights cards / Summary chart — chart stretches to cards height ── */}
          <LeftCell className="pb-10">
            <HighlightsSection
              totalNewPatients={mainCounts.totalNewPatients}
              missedOpportunities={mainCounts.missedOpportunities}
              onViewMissed={() => openModal('Missed Opportunities', 'calls', missedCalls)}
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
                  compareLabel={compareLabel}
                />
              }
            />
          </LeftCell>

          <RailCell className="items-stretch pb-10">
            <div className="flex h-full w-full flex-col rounded-xl bg-white/10 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">Summary</p>
              <div className="min-h-0 flex-1">
                <SectionCompareChart
                  mainSeries={highlightsDaily.main}
                  compareSeries={highlightsDaily.compare}
                  mainLabel={mainLabel}
                  compareLabel={compareLabel}
                  mainColor="#FFFFFF"
                  compareColor="#5EEAD4"
                />
              </div>
            </div>
          </RailCell>

          {/* ── Row 3: SEO heading only (spans left cell), empty rail cell ── */}
          <LeftCell className="pt-6">
            <SourceSectionHeading
              title="SEO"
              subtitle="Google Searches, Google Business, AI Search"
            />
          </LeftCell>
          <RailCell />

          {/* ── Row 4: SEO cards / SEO chart — chart stretches to cards height ── */}
          <LeftCell className="pb-10 pt-6">
            <div className="animate-slide-up stagger-4 opacity-0">
              <SourceSection
                hideHeading
                title="SEO"
                subtitle="Google Searches, Google Business, AI Search"
                websiteNewCount={mainCounts.seo.websiteNew}
                callsNewCount={mainCounts.seo.callsNew}
                onViewWebsite={() => openModal('SEO — Website Leads', 'website', seoNewLeads.website)}
                onViewCalls={() => openModal('SEO — Phone Calls', 'calls', seoNewLeads.calls)}
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
            </div>
          </LeftCell>

          <RailCell className="items-stretch pb-10 pt-6">
            <div className="flex h-full w-full flex-col rounded-xl bg-white/10 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">SEO</p>
              <div className="min-h-0 flex-1">
                <SectionCompareChart
                  mainSeries={seoDaily.main}
                  compareSeries={seoDaily.compare}
                  mainLabel={mainLabel}
                  compareLabel={compareLabel}
                  mainColor="#FFFFFF"
                  compareColor="#5EEAD4"
                />
              </div>
            </div>
          </RailCell>

          {/* ── Row 5: PPC heading only (spans left cell), empty rail cell ── */}
          <LeftCell className="pt-6">
            <SourceSectionHeading title="PPC" subtitle="Google Ads" />
          </LeftCell>
          <RailCell />

          {/* ── Row 6: PPC cards / PPC chart — chart stretches to cards height ── */}
          <LeftCell className="pb-10 pt-6">
            <div className="animate-slide-up stagger-5 opacity-0">
              <SourceSection
                hideHeading
                title="PPC"
                subtitle="Google Ads"
                websiteNewCount={mainCounts.ppc.websiteNew}
                callsNewCount={mainCounts.ppc.callsNew}
                onViewWebsite={() => openModal('PPC — Website Leads', 'website', ppcNewLeads.website)}
                onViewCalls={() => openModal('PPC — Phone Calls', 'calls', ppcNewLeads.calls)}
                deltaChipWebsite={
                  <DeltaChip
                    current={mainCounts.ppc.websiteNew}
                    previous={compareCounts.ppc.websiteNew}
                    compareLabel={compareLabel}
                  />
                }
                deltaChipCalls={
                  <DeltaChip
                    current={mainCounts.ppc.callsNew}
                    previous={compareCounts.ppc.callsNew}
                    compareLabel={compareLabel}
                  />
                }
              />
            </div>
          </LeftCell>

          <RailCell className="items-stretch pb-10 pt-6">
            <div className="flex h-full w-full flex-col rounded-xl bg-white/10 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">PPC</p>
              <div className="min-h-0 flex-1">
                <SectionCompareChart
                  mainSeries={ppcDaily.main}
                  compareSeries={ppcDaily.compare}
                  mainLabel={mainLabel}
                  compareLabel={compareLabel}
                  mainColor="#FFFFFF"
                  compareColor="#5EEAD4"
                />
              </div>
            </div>
          </RailCell>

          {/* ── Row 5: Footer / empty rail cell ── */}
          <LeftCell className="pb-6">
            <div className="border-t border-surface-border pt-6">
              <p className="text-center text-xs text-gray-300">
                Sage Psychological Services — IntelliLens
              </p>
            </div>
          </LeftCell>

          <RailCell />
        </div>
      </div>

      {modal && (
        <LeadModal
          title={modal.title}
          type={modal.type}
          leads={modal.leads}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
