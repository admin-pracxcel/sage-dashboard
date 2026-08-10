import { useEffect } from 'react';
import { WebsiteLeadRow, CallLeadRow } from './LeadRow';

export default function LeadModal({ title, type, leads, onClose }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const isWebsite = type === 'website';

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-900/30 pt-12 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 mb-12 w-full max-w-3xl animate-scale-in overflow-hidden rounded-2xl border border-surface-border bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border px-6 py-5">
          <div>
            <h3 className="font-display text-xl text-gray-900">{title}</h3>
            <p className="mt-0.5 text-xs text-gray-400">
              {leads.length} {leads.length === 1 ? 'record' : 'records'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-surface-border p-2 text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[65vh] overflow-auto px-6 py-4">
          {leads.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">No leads match this filter.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-surface-border">
                  {isWebsite ? (
                    <>
                      <th className="pb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Email</th>
                      <th className="pb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Country</th>
                      <th className="pb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Date</th>
                    </>
                  ) : (
                    <>
                      <th className="pb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Caller</th>
                      <th className="pb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Date</th>
                      <th className="pb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Duration</th>
                      <th className="pb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Recording</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {isWebsite
                  ? leads.map((l, i) => <WebsiteLeadRow key={i} lead={l} index={i} />)
                  : leads.map((l, i) => <CallLeadRow key={i} lead={l} index={i} />)}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
