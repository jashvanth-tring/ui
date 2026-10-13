import React, { useState, useEffect } from 'react';
import { TopPerformerCard, PerformerData } from './TopPerformerCard';
import { createPortal } from 'react-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { Loader2, Maximize2, Minimize2, TrendingUp, Building2 } from 'lucide-react';
import type {
  InterviewByClient,
  WeeklyTrend,
  RecruiterPerformance,
  WeeklyInterviewCount,
} from '../../store/model/dashboard.types';

interface Props {
  byClient: InterviewByClient[];
  byClientWeekly: InterviewByClient[]; 
  weeklyTrend: WeeklyTrend[];
  recruiterPerf: RecruiterPerformance[];
  loading: boolean;
  weeklyCount: WeeklyInterviewCount[];
  performers: PerformerData[];
}

const tickStyle = { fontSize: 11, fill: '#94a3b8' };
const gridColor = 'rgba(0,0,0,0.04)';

// ── Stat pill badge ───────────────────────────────────────────────────────
const StatPill: React.FC<{ value: string | number; color: string }> = ({ value, color }) => (
  <span
    style={{
      background: color,
      borderRadius: 20,
      fontSize: 10,
      fontWeight: 600,
      padding: '3px 10px',
      color: 'var(--brand)',
      letterSpacing: '0.02em',
      flexShrink: 0,
    }}
  >
    {value}
  </span>
);

// ── Animated tooltip ──────────────────────────────────────────────────────
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'rgba(20,30,50,0.96)',
        borderRadius: 12,
        padding: '10px 14px',
        fontSize: 12,
        minWidth: 130,
        border: '0.5px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        animation: 'tooltipIn 0.12s ease',
      }}
    >
      <style>{`@keyframes tooltipIn{from{opacity:0;transform:scale(0.95) translateY(-4px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 7, fontSize: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, flexShrink: 0, boxShadow: `0 0 6px ${p.color}80` }} />
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{p.name}</span>
          <span style={{ color: '#fff', fontWeight: 600, marginLeft: 'auto', fontSize: 13 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Chart sub-components ──────────────────────────────────────────────────
const ClientBarChart: React.FC<{ data: InterviewByClient[]; fullPage?: boolean }> = ({ data, fullPage }) => {
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const maxClient = data.length ? Math.max(...data.map((d) => d.count)) : 0;

  return (
    <ResponsiveContainer width="100%" height={fullPage ? '100%' : 220}>
      <BarChart data={data} barSize={fullPage ? 52 : 32} onMouseLeave={() => setActiveBar(null)}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#378ADD" />
            <stop offset="100%" stopColor="#85B7EB" />
          </linearGradient>
          <linearGradient id="barGradActive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" />
            <stop offset="100%" stopColor="#378ADD" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis
          dataKey="client"
          tick={{ ...tickStyle, fontSize: fullPage ? 13 : 11 }}
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={data.length > 4 ? -30 : 0}
          textAnchor={data.length > 4 ? 'end' : 'middle'}
          height={data.length > 4 ? 50 : 30}
        />
        <YAxis tick={{ ...tickStyle, fontSize: fullPage ? 13 : 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <ReferenceLine y={maxClient} stroke="#378ADD" strokeDasharray="4 4" strokeOpacity={0.3} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(55,138,221,0.06)' }} />
        <Bar dataKey="count" name="Interviews" radius={[6, 6, 0, 0]} onMouseEnter={(_, i) => setActiveBar(i)}>
          {data.map((_, index) => (
            <Cell
              key={index}
              fill={activeBar === index ? 'url(#barGradActive)' : 'url(#barGrad)'}
              style={{
                filter: activeBar === index ? 'drop-shadow(0 4px 10px rgba(55,138,221,0.45))' : 'none',
                transition: 'filter 0.15s',
              }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

/*
const RecruiterBarChart: React.FC<{ data: RecruiterPerformance[]; fullPage?: boolean }> = ({ data, fullPage }) => {
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const height = fullPage ? '100%' : 220;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" barSize={fullPage ? 28 : 20} margin={{ left: 8 }}>
        <defs>
          <linearGradient id="recruiterGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#EF9F27" />
            <stop offset="100%" stopColor="#FAC775" />
          </linearGradient>
          <linearGradient id="recruiterGradActive" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#BA7517" />
            <stop offset="100%" stopColor="#EF9F27" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
        <XAxis type="number" tick={{ ...tickStyle, fontSize: fullPage ? 13 : 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="recruiterName"
          tick={{ ...tickStyle, fontSize: fullPage ? 13 : 11 }}
          axisLine={false}
          tickLine={false}
          width={fullPage ? 140 : 100}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(239,159,39,0.06)' }} />
        <Bar
          dataKey="count"
          name="Interviews"
          fill="url(#recruiterGrad)"
          radius={[0, 6, 6, 0]}
          background={{ fill: 'rgba(0,0,0,0.02)', radius: [0, 6, 6, 0] } as any}
          onMouseEnter={(_, i) => setActiveBar(i)}
          onMouseLeave={() => setActiveBar(null)}
        >
          {data.map((_, index) => (
            <Cell
              key={index}
              fill={activeBar === index ? 'url(#recruiterGradActive)' : 'url(#recruiterGrad)'}
              style={{
                filter: activeBar === index ? 'drop-shadow(0 2px 8px rgba(239,159,39,0.5))' : 'none',
                transition: 'filter 0.15s',
              }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
*/

const WeeklyCountChart: React.FC<{ data: WeeklyInterviewCount[]; fullPage?: boolean }> = ({ data, fullPage }) => (
  <ResponsiveContainer width="100%" height={fullPage ? '100%' : 220}>
    <AreaChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
      <defs>
        <linearGradient id="interviewCountGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1D9E75" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#1D9E75" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
      <XAxis
        dataKey="week"
        tick={{ ...tickStyle, fontSize: fullPage ? 13 : 11 }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        tick={{ ...tickStyle, fontSize: fullPage ? 13 : 11 }}
        axisLine={false}
        tickLine={false}
        allowDecimals={false}
      />
      <Tooltip
        content={({ active, payload, label }) => {
          if (!active || !payload?.length) return null;
          return (
            <div style={{
              background: 'rgba(20,30,50,0.96)',
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: 12,
              border: '0.5px solid rgba(255,255,255,0.1)',
            }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginBottom: 5 }}>{label}</p>
              <p style={{ color: '#1D9E75', margin: 0 }}>
                interviews : {payload[0].value}
              </p>
            </div>
          );
        }}
      />
      <Area
        type="monotone"
        dataKey="interviews"
        name="interviews"
        stroke="#1D9E75"
        strokeWidth={fullPage ? 3 : 2.5}
        fill="url(#interviewCountGrad)"
        dot={{ r: fullPage ? 5 : 4, fill: '#fff', stroke: '#1D9E75', strokeWidth: 2 }}
        activeDot={{ r: fullPage ? 7 : 6, fill: '#1D9E75', stroke: '#fff', strokeWidth: 2 }}
      />
    </AreaChart>
  </ResponsiveContainer>
);

// ── Loading / empty states ────────────────────────────────────────────────
const LoadingChart = () => (
  <div style={{ flex: 1, minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Loader2 style={{ width: 24, height: 24, color: '#cbd5e1' }} className="animate-spin" />
  </div>
);

const EmptyChart = () => (
  <div style={{ flex: 1, minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Building2 size={16} color="#cbd5e1" />
    </div>
    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>No data available</p>
  </div>
);

// ── Full-page maximize overlay ────────────────────────────────────────────
interface FullPageProps {
  title: string;
  sub: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
  legend?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}

const FullPageChart: React.FC<FullPageProps> = ({
  title, sub, badge, badgeColor = '#E6F1FB', icon, legend, onClose, children,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        background: '#f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fpIn 0.2s cubic-bezier(0.22,1,0.36,1)',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes fpIn{from{opacity:0;transform:scale(0.985)}to{opacity:1;transform:scale(1)}}
        @keyframes fpBodyIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* ── Header bar ── */}
      <div
        style={{
          height: 66,
          background: '#fff',
          borderBottom: '0.5px solid rgba(0,0,0,0.08)',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
        }}
      >
        {/* Left — icon + title + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {icon && (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: '#EBF4FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
          )}
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--brand)', margin: 0, lineHeight: 1.25 }}>{title}</p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>{sub}</p>
          </div>
          {badge && (
            <span
              style={{
                background: badgeColor,
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 12px',
                color: 'var(--brand)',
                marginLeft: 4,
              }}
            >
              {badge}
            </span>
          )}
        </div>

        {/* Right — legend + divider + buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {legend && <div>{legend}</div>}
          {legend && <div style={{ width: 1, height: 24, background: 'rgba(0,0,0,0.08)' }} />}

          <button
            onClick={onClose}
            title="Minimize (Esc)"
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: 9,
              width: 36,
              height: 36,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e8f0')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#f1f5f9')}
          >
            <Minimize2 size={15} color="#64748b" />
          </button>
        </div>
      </div>

      {/* ── Chart body — fills full remaining viewport height ── */}
      <div
        style={{
          flex: 1,
          padding: '24px 32px 28px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          animation: 'fpBodyIn 0.3s 0.06s cubic-bezier(0.22,1,0.36,1) both',
        }}
      >
        <div
          style={{
            flex: 1,
            background: '#fff',
            borderRadius: 18,
            border: '0.5px solid rgba(0,0,0,0.07)',
            padding: '24px 32px 20px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Chart card wrapper ────────────────────────────────────────────────────
interface CardProps {
  title: string;
  sub: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
  legend?: React.ReactNode;
  children: React.ReactNode;
  fullPageContent: React.ReactNode;
}

const ChartCard: React.FC<CardProps> = ({
  title, sub, badge, badgeColor = '#E6F1FB', icon, legend, children, fullPageContent,
}) => {
  const [hovered, setHovered] = useState(false);
  const [maximized, setMaximized] = useState(false);

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: '#fff',
          border: `0.5px solid ${hovered ? 'rgba(55,138,221,0.3)' : 'rgba(0,0,0,0.08)'}`,
          borderRadius: 16,
          padding: '20px 20px 16px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s, box-shadow 0.25s, transform 0.2s',
          boxShadow: hovered
            ? '0 8px 32px rgba(55,138,221,0.12), 0 2px 8px rgba(0,0,0,0.04)'
            : '0 1px 4px rgba(0,0,0,0.03)',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          cursor: 'default',
        }}
      >
        {/* Card header — NOT clickable for expand */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {icon && (
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: hovered ? '#EBF4FF' : '#F8FAFC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>
            )}
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand)', margin: 0 }}>{title}</p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>{sub}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {badge && <StatPill value={badge} color={badgeColor} />}
            {/* Always-visible maximize button */}
            <button
              onClick={() => setMaximized(true)}
              title="Open full screen"
              style={{
                background: hovered ? '#EBF4FF' : '#f8fafc',
                border: `0.5px solid ${hovered ? 'rgba(55,138,221,0.3)' : 'rgba(0,0,0,0.08)'}`,
                borderRadius: 7,
                width: 28,
                height: 28,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s, border-color 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.borderColor = 'rgba(55,138,221,0.5)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = hovered ? '#EBF4FF' : '#f8fafc'; e.currentTarget.style.borderColor = hovered ? 'rgba(55,138,221,0.3)' : 'rgba(0,0,0,0.08)'; }}
            >
              <Maximize2 size={13} color={hovered ? '#378ADD' : '#94a3b8'} />
            </button>
          </div>
        </div>

        {/* Fixed-height legend slot — always reserves space so all cards stay same height */}
        <div style={{ height: 28, display: 'flex', alignItems: 'center', marginBottom: 4, marginTop: 6 }}>
          {legend}
        </div>

        {/* Clickable chart area with hover overlay hint */}
        <div
          onClick={() => setMaximized(true)}
          style={{
            position: 'relative',
            cursor: 'pointer',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          {children}

          {/* Hover overlay — "Click to expand" hint */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 10,
              background: hovered ? 'rgba(55,138,221,0.045)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s, opacity 0.2s',
              pointerEvents: 'none',
            }}
          >
           
          </div>
        </div>
      </div>

      {maximized && (
        <FullPageChart
          title={title}
          sub={sub}
          badge={badge}
          badgeColor={badgeColor}
          icon={icon}
          legend={legend}
          onClose={() => setMaximized(false)}
        >
          {fullPageContent}
        </FullPageChart>
      )}
    </>
  );
};

// ── Main component ────────────────────────────────────────────────────────
export const DashboardCharts: React.FC<Props> = ({ byClient, byClientWeekly,weeklyCount, loading, performers }) => (
  <>
    <style>{`
      @keyframes cardEnter{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      .dash-chart-card{animation:cardEnter 0.35s ease both; height:100%;}
      .dash-chart-card:nth-child(2){animation-delay:0.07s}
      .dash-chart-card:nth-child(3){animation-delay:0.14s}
    `}</style>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginBottom: 24, alignItems: 'stretch' }}>

      {/* Chart 1 — Interviews by client */}
      <div className="dash-chart-card">
        {(() => {
          const [range, setRange] = React.useState<'week' | 'month'>('week');
          const activeData = range === 'week' ? byClientWeekly : byClient;
          const totalCount = activeData.reduce((s, d) => s + d.count, 0);

          return (
            <ChartCard
              title="Interviews by client"
              sub={range === 'week' ? 'Total interviews per client — this week' : 'Total interviews per client — this month'}
              badge={activeData.length ? `${totalCount} total` : undefined}
              icon={<Building2 size={14} color="#378ADD" />}
              legend={
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value as 'week' | 'month')}
                  style={{
                    fontSize: 11,
                    color: '#64748b',
                    background: '#f8fafc',
                    border: '0.5px solid rgba(0,0,0,0.1)',
                    borderRadius: 6,
                    padding: '3px 8px',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                </select>
              }
              fullPageContent={
                loading ? <LoadingChart /> : activeData.length === 0 ? <EmptyChart /> : (
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <ClientBarChart data={activeData} fullPage />
                  </div>
                )
              }
            >
              {loading ? <LoadingChart /> : activeData.length === 0 ? <EmptyChart /> : (
                <ClientBarChart data={activeData} />
              )}
            </ChartCard>
          );
        })()}
      </div>

      {/* Chart 2 — Weekly trend */}
        <div className="dash-chart-card">
          <ChartCard
            title="Weekly Interview Trend"
            sub="Total interviews per week"
            icon={<TrendingUp size={14} color="#1D9E75" />}
            legend={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
                <span style={{ width: 24, height: 2.5, background: '#1D9E75', borderRadius: 2, display: 'inline-block' }} />
                interviews
              </div>
            }
            fullPageContent={
              loading ? <LoadingChart /> : weeklyCount.length === 0 ? <EmptyChart /> : (
                <div style={{ flex: 1, minHeight: 0 }}>
                  <WeeklyCountChart data={weeklyCount} fullPage />
                </div>
              )
            }
          >
            {loading ? <LoadingChart /> : weeklyCount.length === 0 ? <EmptyChart /> :
              <WeeklyCountChart data={weeklyCount} />
            }
          </ChartCard>
        </div>

      {/* Chart 3 — Star performer */}
<div className="dash-chart-card">
  <TopPerformerCard  performers={performers} loading={loading} />
</div>

    </div>
  </>
);