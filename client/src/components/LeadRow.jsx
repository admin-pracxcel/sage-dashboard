import { formatDate, formatDateTime, formatDuration, formatPhone } from '../lib/format';

export function WebsiteLeadRow({ lead, index }) {
  return (
    <tr
      className="border-b border-surface-border/60 transition-colors hover:bg-surface-raised/50"
      style={{ animationDelay: `${index * 20}ms` }}
    >
      <td className="py-3 pr-4 text-sm text-gray-700">
        <span className="mr-3 inline-flex min-w-[1.5rem] items-center justify-center rounded bg-surface-raised px-1.5 py-0.5 text-xs font-semibold tabular-nums text-gray-500">{index + 1}</span>
        {lead.email}
      </td>
      <td className="py-3 pr-4">
        {lead.country ? (
          <span className="inline-flex rounded bg-surface-raised px-2 py-0.5 text-xs font-medium text-gray-500">
            {lead.country}
          </span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>
      <td className="py-3 text-sm text-gray-400">{formatDate(lead.leadDate)}</td>
    </tr>
  );
}

export function BookAppointmentLeadRow({ lead, index }) {
  return (
    <tr
      className="border-b border-surface-border/60 transition-colors hover:bg-surface-raised/50"
      style={{ animationDelay: `${index * 20}ms` }}
    >
      <td className="py-3 text-sm text-gray-700">
        <span className="mr-3 inline-flex min-w-[1.5rem] items-center justify-center rounded bg-surface-raised px-1.5 py-0.5 text-xs font-semibold tabular-nums text-gray-500">{index + 1}</span>
        {formatDateTime(lead.leadDate)}
      </td>
    </tr>
  );
}

export function CallLeadRow({ lead, index }) {
  return (
    <tr
      className="border-b border-surface-border/60 transition-colors hover:bg-surface-raised/50"
      style={{ animationDelay: `${index * 20}ms` }}
    >
      <td className="py-3 pr-4 font-mono text-sm text-gray-700">{formatPhone(lead.callerNumber)}</td>
      <td className="py-3 pr-4 text-sm text-gray-400">{formatDateTime(lead.dateTime)}</td>
      <td className="py-3 pr-4">
        <span className="inline-flex rounded bg-surface-raised px-2 py-0.5 text-xs font-medium text-gray-500">
          {formatDuration(lead.durationSeconds)}
        </span>
      </td>
      <td className="py-3 text-sm">
        {lead.recordingUrl ? (
          <a
            href={lead.recordingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-brand transition-colors hover:text-brand-dark"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
            <span className="text-xs font-medium">Play</span>
          </a>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>
    </tr>
  );
}
