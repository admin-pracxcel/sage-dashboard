import ChannelCard from './ChannelCard';

const config = {
  SEO: {
    accent: 'text-[#2e3e33]',
    underline: 'bg-accent-teal',
    tagBg: 'bg-accent-teal-light text-accent-teal-dark',
    websiteIcon: '🌐',
    callIcon: '📞',
  },
  PPC: {
    accent: 'text-[#2e3e33]',
    underline: 'bg-brand',
    tagBg: 'bg-brand-light text-brand-dark',
    websiteIcon: '🎯',
    callIcon: '📱',
  },
};

export default function SourceSection({
  title,
  subtitle,
  websiteNewCount,
  callsNewCount,
  onViewWebsite,
  onViewCalls,
}) {
  const c = config[title] || config.SEO;

  return (
    <section>
      <div className="mb-6">
        <div className="flex items-baseline gap-4">
          <h2 className={`font-display text-4xl md:text-5xl ${c.accent}`}>
            {title}
          </h2>
          {subtitle && (
            <span className="text-base font-medium text-gray-500">{subtitle}</span>
          )}
        </div>
        <div className={`mt-3 h-0.5 w-16 rounded-full ${c.underline}`} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChannelCard
          label="Website"
          icon={c.websiteIcon}
          count={websiteNewCount}
          buttonLabel="View leads"
          onButtonClick={onViewWebsite}
          accentClass={c.accent}
        />
        <ChannelCard
          label="Phone Call"
          icon={c.callIcon}
          count={callsNewCount}
          buttonLabel="View calls"
          onButtonClick={onViewCalls}
          accentClass={c.accent}
        />
      </div>
    </section>
  );
}
