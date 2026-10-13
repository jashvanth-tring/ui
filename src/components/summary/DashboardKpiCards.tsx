import React, { useState } from 'react';
import type { DashboardKpi } from '../../store/model/dashboard.types';

interface Props {
  data: DashboardKpi | null;
  loading: boolean;
}

/* ─── Keyframes injected once ───────────────────────────────────────────── */
const STYLES = `
@keyframes kpi-stag-label {
  0%   { opacity: 0; transform: translateY(5px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes kpi-stag-val {
  0%   { opacity: 0; transform: translateY(5px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes kpi-stag-sub {
  0%   { opacity: 0; transform: translateY(5px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* card */
.kpi8-card {
  position: relative;
  overflow: hidden;
  border-radius: 11px;
  padding: 13px 15px 11px;
  background: #ffffff;
  cursor: default;
  transition:
    transform       0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow      0.22s ease,
    border-radius   0.22s ease,
    border-color    0.22s ease;
}
.kpi8-card:hover {
  transform: translateY(-3px) scale(1.025);
  border-radius: 14px;
}

/* icon */
.kpi8-ico {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition:
    transform  0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.22s ease;
}
.kpi8-card:hover .kpi8-ico {
  transform: translateY(-3px);
}

/* label stagger */
.kpi8-label {
  font-size: 11.5px;
  color: #64748b;
  margin: 0 0 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
}
.kpi8-card:hover .kpi8-label {
  animation: kpi-stag-label 0.2s ease forwards;
  color: var(--kpi-ac);
}

/* value stagger */
.kpi8-val {
  font-size: 28px;
  font-weight: 600;
  line-height: 1;
  margin: 0;
  letter-spacing: -0.5px;
  color: var(--kpi-ac);
}
.kpi8-card:hover .kpi8-val {
  animation: kpi-stag-val 0.2s 0.04s ease both;
}

/* sub-label stagger */
.kpi8-sub {
  font-size: 10.5px;
  color: #94a3b8;
  margin: 3px 0 0;
  transition: color 0.2s ease;
}
.kpi8-card:hover .kpi8-sub {
  animation: kpi-stag-sub 0.2s 0.08s ease both;
  color: var(--kpi-ac);
  opacity: 0.75;
}

/* progress bar */
.kpi8-bar-track {
  height: 3px;
  border-radius: 2px;
  background: rgba(0,0,0,0.06);
  overflow: hidden;
  margin-top: 10px;
}
.kpi8-bar-fill {
  height: 100%;
  border-radius: 2px;
  width: 0;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
`;

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
const SkeletonKpi = () => (
  <div
    style={{
      borderRadius: 11,
      padding: '13px 15px 11px',
      background: '#f8fafc',
      border: '1px solid rgba(0,0,0,0.07)',
    }}
  >
    <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e2e8f0', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 10, width: '50%', background: '#e2e8f0', borderRadius: 4, marginBottom: 7 }} />
        <div style={{ height: 24, width: '30%', background: '#e2e8f0', borderRadius: 4, marginBottom: 6 }} />
        <div style={{ height: 9, width: '65%', background: '#e2e8f0', borderRadius: 4 }} />
      </div>
    </div>
    <div style={{ height: 3, background: '#e2e8f0', borderRadius: 2 }} />
  </div>
);

/* ─── Card config ────────────────────────────────────────────────────────── */
const cards = [
  {
    key: 'todayCount' as keyof DashboardKpi,
    label: 'Interviews Today',
    accent: '#378ADD',
    iconBg: '#EBF4FC',
    shadow: '#378ADD38',
    barMax: 10,
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="#378ADD" strokeWidth="1.5" />
        <path d="M8 5v3.5l2 1.5" stroke="#378ADD" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    trend: (v: number) => ({
      label: v === 0 ? 'None scheduled' : v === 1 ? '1 scheduled' : `${v} scheduled`,
      type: v > 0 ? 'up' : 'neutral',
    }),
  },
  {
    key: 'weekCount' as keyof DashboardKpi,
    label: 'Interviews This Week',
    accent: '#1D9E75',
    iconBg: '#E1F5EE',
    shadow: '#1D9E7538',
    barMax: 20,
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="11" rx="2" stroke="#1D9E75" strokeWidth="1.5" />
        <path d="M5 1v3M11 1v3M2 7h12" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    trend: (_v: number) => {
      const now = new Date();
   // Get Monday of current week
  const day = now.getDay(); // 0 = Sun, 1 = Mon, ...
  const diffToMonday = (day === 0 ? -6 : 1 - day); // if Sun, go back 6; else go back to Mon
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);

  // Get Sunday of current week
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return { label: `${fmt(monday)} – ${fmt(sunday)}`, type: 'neutral' };},
  },
  {
  key: 'profilesShared' as keyof DashboardKpi,  // ✅
  label: 'No.of Profiles Shared',
  accent: '#e99826',
  iconBg: '#FEF6E7',
  shadow: '#e9982638',
  barMax: 15,
  icon: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="5" cy="8" r="2" stroke="#e99826" strokeWidth="1.5" />
      <circle cx="13" cy="4" r="1.5" stroke="#e99826" strokeWidth="1.5" />
      <circle cx="13" cy="12" r="1.5" stroke="#e99826" strokeWidth="1.5" />
      <path d="M7 7l4.5-2.5M7 9l4.5 2.5" stroke="#e99826" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  trend: (v: number) => ({
    label: v > 0 ? `${v} profile${v > 1 ? 's' : ''} shared today` : 'No profiles shared today',
    type: v > 0 ? 'up' : 'neutral',
  }),
},
  {
    key: 'offersThisMonth' as keyof DashboardKpi,
    label: 'Offered',
    accent: '#7F77DD',
    iconBg: '#EEEDFE',
    shadow: '#7F77DD38',
    barMax: 10,
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path
          d="M2 12l4-4 3 3 5-6"
          stroke="#7F77DD"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    trend: (v: number) => ({
      label: v > 0 ? `${v} candidate${v > 1 ? 's' : ''} offered` : 'No offers yet',
      type: v > 0 ? 'up' : 'neutral',
    }),
  },
];

/* ─── Component ──────────────────────────────────────────────────────────── */
export const DashboardKpiCards: React.FC<Props> = ({ data, loading }) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  if (loading) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <SkeletonKpi key={i} />)}
        </div>
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((card) => {
          const value    = data?.[card.key] ?? 0;
          const trend    = card.trend(value);
          const isHovered = hoveredCard === card.key;
          const borderColor = isHovered ? card.accent : 'rgba(0,0,0,0.09)';

          return (
            <div
              key={card.key}
              className="kpi8-card"
              onMouseEnter={() => setHoveredCard(card.key)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                // CSS var so child elements can inherit accent
                ['--kpi-ac' as any]: card.accent,
                borderTop:    `1px solid ${borderColor}`,
                borderRight:  `1px solid ${borderColor}`,
                borderBottom: `1px solid ${borderColor}`,
                borderLeft:   `3.5px solid ${card.accent}`,
                boxShadow: isHovered
                  ? `0 12px 32px ${card.shadow}`
                  : '0 1px 4px rgba(0,0,0,0.05)',
              }}
            >
              {/* Icon + text */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>

                {/* Icon badge — floats up on hover */}
                <div
                  className="kpi8-ico"
                  style={{
                    background: card.iconBg,
                    boxShadow: isHovered ? `0 4px 12px ${card.shadow}` : 'none',
                  }}
                >
                  {card.icon}
                </div>

                {/* Text stack */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="kpi8-label">{card.label}</p>
                  <p className="kpi8-val">{value}</p>
                  <p className="kpi8-sub">{trend.label}</p>
                </div>
              </div>

              
            </div>
          );
        })}
      </div>
    </>
  );
};