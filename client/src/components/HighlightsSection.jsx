import StatCard from './StatCard';

export default function HighlightsSection({
  totalNewPatients,
  missedOpportunities,
  onViewMissed,
  deltaChipNewPatients,
  deltaChipMissed,
}) {
  return (
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
  );
}
