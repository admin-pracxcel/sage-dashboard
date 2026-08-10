import { useState } from 'react';
import { useLeads } from './hooks/useLeads';
import { today, toDateString } from './lib/dates';
import {
  applyDateRange,
  filterBySource,
  filterNewPatients,
  filterMissedOpportunities,
} from './lib/transform';
import DashboardHeader from './components/DashboardHeader';
import DateRangeFilter from './components/DateRangeFilter';
import HighlightsSection from './components/HighlightsSection';
import SourceSection from './components/SourceSection';
import LeadModal from './components/LeadModal';

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

export default function App() {
  const { data, isLoading, isError, error, refresh, isRefreshing } = useLeads();
  const [dateRange, setDateRange] = useState({
    from: toDateString(today()),
    to: toDateString(maxDate),
  });
  const [modal, setModal] = useState(null);

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorState message={error.message} onRetry={refresh} />;

  const { website, calls, fetchedAt } = data;

  const filtered = applyDateRange({ website, calls }, dateRange.from, dateRange.to);
  const newPatients = filterNewPatients(filtered);
  const missed = filterMissedOpportunities(filtered);

  const seo = filterBySource(filtered, 'SEO');
  const ppc = filterBySource(filtered, 'PPC');
  const seoNew = filterNewPatients(seo);
  const ppcNew = filterNewPatients(ppc);

  const counts = {
    totalNewPatients: newPatients.website.length + newPatients.calls.length,
    missedOpportunities: missed.calls.length,
    seo: { websiteNew: seoNew.website.length, callsNew: seoNew.calls.length },
    ppc: { websiteNew: ppcNew.website.length, callsNew: ppcNew.calls.length },
  };

  function openModal(title, type, leads) {
    setModal({ title, type, leads });
  }

  return (
    <div className="dot-grid bg-mesh min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <DashboardHeader
          fetchedAt={fetchedAt}
          isRefreshing={isRefreshing}
          onRefresh={refresh}
        />

        <div className="mb-8">
          <DateRangeFilter
            dateRange={dateRange}
            maxDate={maxDate}
            onChange={setDateRange}
          />
        </div>

        <h2 className="mb-5 font-display text-2xl text-gray-900">Summary</h2>

        <HighlightsSection
          totalNewPatients={counts.totalNewPatients}
          missedOpportunities={counts.missedOpportunities}
          onViewMissed={() => openModal('Missed Opportunities', 'calls', missed.calls)}
        />

        <div className="mt-10 space-y-10">
          <div className="animate-slide-up stagger-4 opacity-0">
            <SourceSection
              title="SEO"
              subtitle="Google Searches, Google Business, AI Search"
              websiteNewCount={counts.seo.websiteNew}
              callsNewCount={counts.seo.callsNew}
              onViewWebsite={() => openModal('SEO — Website Leads', 'website', seoNew.website)}
              onViewCalls={() => openModal('SEO — Phone Calls', 'calls', seoNew.calls)}
            />
          </div>
          <div className="animate-slide-up stagger-5 opacity-0">
            <SourceSection
              title="PPC"
              subtitle="Google Ads"
              websiteNewCount={counts.ppc.websiteNew}
              callsNewCount={counts.ppc.callsNew}
              onViewWebsite={() => openModal('PPC — Website Leads', 'website', ppcNew.website)}
              onViewCalls={() => openModal('PPC — Phone Calls', 'calls', ppcNew.calls)}
            />
          </div>
        </div>

        <div className="mt-16 border-t border-surface-border pt-6">
          <p className="text-center text-xs text-gray-300">
            Sage Psychological Services — IntelliLens
          </p>
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
    </div>
  );
}
