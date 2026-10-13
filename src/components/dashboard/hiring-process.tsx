import { useState } from 'react';
import { UpcomingInterviewsPanel } from '../summary/UpcomingInterviewsPanel';
import { FeedbackTrackerPanel } from '../summary/FeedbackTrackerPanel';
import { RequirementPrioritiesPanel } from '../summary/RequirementPrioritiesPanel';
import { cn } from '../../lib/utils';

const DASHBOARD_THEME = 'var(--brand)';

type Tab = 'interviews' | 'feedback' | 'requirements';

export default function DashboardMainCard() {
  const [tab, setTab] = useState<Tab>('interviews');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'interviews',   label: 'Upcoming Interviews' },
    { key: 'feedback',     label: 'Feedback Tracker' },
    { key: 'requirements', label: 'Requirement Priorities' },
  ];

  return (
    <div className="h-full flex flex-col border rounded-lg overflow-hidden bg-white">

      {/* Tabs Header */}
      <div className="p-2">
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                tab === key
                  ? 'bg-white shadow text-[var(--brand)]'
                  : 'text-gray-600 hover:text-gray-900',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {tab === 'interviews' && (
          <UpcomingInterviewsPanel
            variant="dashboard"
            themeColor={DASHBOARD_THEME}
            className="h-full"
          />
        )}
        {tab === 'feedback' && (
          <FeedbackTrackerPanel
            variant="dashboard"
            themeColor={DASHBOARD_THEME}
            className="h-full"
          />
        )}
        {tab === 'requirements' && (
          <RequirementPrioritiesPanel
            variant="dashboard"
            themeColor={DASHBOARD_THEME}
            className="h-full"
          />
        )}
      </div>
    </div>
  );
}