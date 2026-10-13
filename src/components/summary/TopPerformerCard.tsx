import React, { useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { createPortal } from 'react-dom';

// ── Types ─────────────────────────────────────────────────────────────────
export interface PerformerData {
  userId: number;
  name: string;
  offeredCount: number;
  offeredCountWeekly: number;  
}

interface Props {
  performers: PerformerData[];
  loading?: boolean;
  range?: 'week' | 'month';
  onRangeChange?: (r: 'week' | 'month') => void;
}

// ── Confetti particle ─────────────────────────────────────────────────────
interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  duration: number;
  delay: number;
  shape: 'rect' | 'circle';
  rotation: number;
}

const CONFETTI_COLORS = [
  '#378ADD', '#FAC775', '#1D9E75',
  '#D4537E', '#7F77DD', '#D85A30', '#5DCAA5',
];

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 6 + Math.random() * 7,
    duration: 1.1 + Math.random() * 1.3,
    delay: Math.random() * 0.9,
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
    rotation: Math.random() * 360,
  }));
}

// ── Confetti overlay ──────────────────────────────────────────────────────
const Confetti: React.FC<{ active: boolean }> = ({ active }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) return;
    setParticles(makeParticles(32));
    const t = setTimeout(() => setParticles([]), 2800);
    return () => clearTimeout(t);
  }, [active]);

  if (!particles.length) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 10 }}>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-12px) rotate(0deg);   opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(240px) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute', top: 0, left: `${p.x}%`,
            width: p.size, height: p.size,
            borderRadius: p.shape === 'circle' ? '50%' : 3,
            background: p.color,
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
};

// ── Trophy icon ───────────────────────────────────────────────────────────
const TrophyIcon: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 8px rgba(250,199,117,0.5))' }}>
    <rect x="18" y="38" width="12" height="3" rx="1.5" fill="#FAC775" />
    <rect x="15" y="41" width="18" height="3" rx="1.5" fill="#EF9F27" />
    <path d="M12 8h24v18a12 12 0 01-24 0V8z" fill="#FAC775" />
    <path d="M12 8H6a6 6 0 006 6V8z" fill="#EF9F27" />
    <path d="M36 8h6a6 6 0 01-6 6V8z" fill="#EF9F27" />
    <path d="M20 22l2.5-5 1.5 3 2-4 1.5 3L30 22" stroke="#BA7517" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Star icon ─────────────────────────────────────────────────────────────
const StarIcon: React.FC<{ size?: number; color?: string }> = ({ size = 14, color = '#FAC775' }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M7 1l1.545 3.13L12 4.635l-2.5 2.435.59 3.44L7 8.885l-3.09 1.625.59-3.44L2 4.635l3.455-.505L7 1z" />
  </svg>
);

// ── Avatar initials (currently unused — leaderboard panel is commented out) ──
/*
const Avatar: React.FC<{ name: string; size?: number; fontSize?: number }> = ({ name, size = 40, fontSize = 14 }) => {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#E6F1FB', border: '2px solid #B5D4F4',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, fontSize, fontWeight: 600, color: '#185FA5',
    }}>
      {initials}
    </div>
  );
};
*/

// ── Mini bar row (currently unused — leaderboard panel is commented out) ──
/*
const OtherRow: React.FC<{ performer: PerformerData; rank: number; max: number }> = ({ performer, rank, max }) => {
  const pct = max > 0 ? Math.round((performer.offeredCount / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: '#94a3b8', width: 20, textAlign: 'center', flexShrink: 0 }}>#{rank}</span>
      <Avatar name={performer.name} size={24} fontSize={10} />
      <span style={{ fontSize: 12, color: '#64748b', minWidth: 80, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {performer.name}
      </span>
      <div style={{ flex: 2, background: '#f1f5f9', borderRadius: 999, height: 6, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#B5D4F4', borderRadius: 999, transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#378ADD', minWidth: 24, textAlign: 'right', flexShrink: 0 }}>
        {performer.offeredCount}
      </span>
    </div>
  );
};
*/

// ── Full page overlay ─────────────────────────────────────────────────────
const FullPageOverlay: React.FC<{ performers: PerformerData[]; onClose: () => void; rangeLabel: string; range: 'week' | 'month'; onRangeChange: (r: 'week' | 'month') => void }>
= ({ performers, onClose, rangeLabel, range, onRangeChange }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const top = performers[0];
  // const rest = performers.slice(1);

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      zIndex: 99999, background: '#f1f5f9', display: 'flex', flexDirection: 'column',
      animation: 'fpIn 0.2s cubic-bezier(0.22,1,0.36,1)',
    }}>
      <style>{`
        @keyframes fpIn{from{opacity:0;transform:scale(0.985)}to{opacity:1;transform:scale(1)}}
        @keyframes fpBodyIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes trophyBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes countPop{from{opacity:0;transform:scale(0.7)}to{opacity:1;transform:scale(1)}}
      `}</style>

      {/* Header */}
      <div style={{ height: 66, background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.08)', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrophyIcon size={24} />
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--brand)', margin: 0 }}>Star performer</p><p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
  Top recruiter by offers — {rangeLabel}
</p>
          </div>
          <span style={{ background: '#FAEEDA', borderRadius: 20, fontSize: 11, fontWeight: 600, padding: '4px 12px', color: '#633806', marginLeft: 4 }}>
            {performers.length} recruiter{performers.length !== 1 ? 's' : ''}
          </span>
        </div>
<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
  <select
    value={range}
    onChange={(e) => onRangeChange(e.target.value as 'week' | 'month')}
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
    <option value="month">Last month</option>
    <option value="week">This week</option>
  </select>
         <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 9, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Minimize2 size={15} color="#64748b" />
  </button>
  </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '24px 32px 28px', display: 'flex', gap: 24, animation: 'fpBodyIn 0.3s 0.06s cubic-bezier(0.22,1,0.36,1) both', overflow: 'auto' }}>
        {top && (
          <div style={{ flex: 1, background: '#fff', borderRadius: 18, border: '0.5px solid rgba(0,0,0,0.07)', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <Confetti active />
            <div style={{ animation: 'trophyBounce 2.5s ease-in-out infinite' }}><TrophyIcon size={72} /></div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                <StarIcon size={16} /><StarIcon size={16} /><StarIcon size={16} />
              </div>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 6px' }}>Star performer this month</p>
              <p style={{ fontSize: 28, fontWeight: 600, color: 'var(--brand)', margin: '0 0 4px' }}>{top.name}</p>
              <p style={{ fontSize: 48, fontWeight: 700, color: 'var(--brand)', margin: 0, animation: 'countPop 0.5s 0.2s cubic-bezier(0.34,1.56,0.64,1) both', lineHeight: 1.1 }}>{top.offeredCount}</p>
              <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0' }}>candidates offered</p>
            </div>
          </div>
        )}
        {/* {rest.length > 0 && (
          <div style={{ width: 340, background: '#fff', borderRadius: 18, border: '0.5px solid rgba(0,0,0,0.07)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b', margin: '0 0 16px' }}>Full leaderboard</p>
            {top && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FAEEDA', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#633806', width: 20 }}>#1</span>
                <Avatar name={top.name} size={32} fontSize={12} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#412402', flex: 1 }}>{top.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <StarIcon size={12} color="#BA7517" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#BA7517' }}>{top.offeredCount}</span>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rest.map((p, idx) => <OtherRow key={p.userId} performer={p} rank={idx + 2} max={top?.offeredCount ?? 1} />)}
            </div>
          </div>
        )} */}
      </div>
    </div>,
    document.body
  );
};

// ── Main card ─────────────────────────────────────────────────────────────
export const TopPerformerCard: React.FC<Props> = ({ performers, loading }) => {
  const [confettiKey, setConfettiKey] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [range, setRange] = useState<'week' | 'month'>('week');
const prevTopId = React.useRef<number | null>(null);

const sorted = [...performers]
  .map((p) => ({
    ...p,
    activeCount: range === 'week' ? p.offeredCountWeekly : p.offeredCount,
  }))
  .filter((p) => p.activeCount > 0)
  .sort((a, b) => b.activeCount - a.activeCount);
  useEffect(() => {
    if (!performers.length) return;
    const topId = performers[0].userId;
    if (prevTopId.current !== topId) {
      prevTopId.current = topId;
      setConfettiKey((k) => k + 1);
    }
  }, [performers]);

  const top = sorted[0] ? { ...sorted[0], offeredCount: sorted[0].activeCount } : undefined;
const others = sorted.slice(1).map((p) => ({ ...p, offeredCount: p.activeCount }));
  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: '#fff',
          border: `0.5px solid ${hovered ? 'rgba(55,138,221,0.3)' : 'rgba(0,0,0,0.08)'}`,
          borderRadius: 16, padding: '20px 20px 16px',
          display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box',
          transition: 'border-color 0.2s, box-shadow 0.25s, transform 0.2s',
          boxShadow: hovered ? '0 8px 32px rgba(55,138,221,0.12), 0 2px 8px rgba(0,0,0,0.04)' : '0 1px 4px rgba(0,0,0,0.03)',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <style>{`
          @keyframes trophyFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
          @keyframes shimmerPill{0%,100%{opacity:0.8}50%{opacity:1}}
          @keyframes countSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
          @keyframes popIn{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}}
        `}</style>

        <Confetti active={confettiKey > 0} key={confettiKey} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: hovered ? '#FAEEDA' : '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', flexShrink: 0 }}>
              <TrophyIcon size={18} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand)', margin: 0 }}>Star performer</p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Top recruiter by offers — {range === 'week' ? 'this week' : 'last month'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {performers.length > 0 && (
              <span style={{ background: '#FAEEDA', borderRadius: 20, fontSize: 10, fontWeight: 600, padding: '3px 10px', color: '#633806', animation: 'shimmerPill 2.5s ease-in-out infinite', flexShrink: 0 }}>
                {performers.length} recruiter{performers.length !== 1 ? 's' : ''}
              </span>
            )}
            <button onClick={() => setMaximized(true)} title="Open full screen"
              style={{ background: hovered ? '#EBF4FF' : '#f8fafc', border: `0.5px solid ${hovered ? 'rgba(55,138,221,0.3)' : 'rgba(0,0,0,0.08)'}`, borderRadius: 7, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s', flexShrink: 0 }}>
              <Maximize2 size={13} color={hovered ? '#378ADD' : '#94a3b8'} />
            </button>
          </div>
        </div>

        {/* Legend slot — range toggle */}
<div style={{ height: 28, display: 'flex', alignItems: 'center', marginBottom: 4, marginTop: 6 }}>
  <select
    value={range}
    onChange={(e) => setRange(e.target.value as 'week' | 'month')}
    onClick={(e) => e.stopPropagation()}
    style={{
      fontSize: 11, color: '#64748b', background: '#f8fafc',
      border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 6,
      padding: '3px 8px', cursor: 'pointer', outline: 'none',
    }}
  >
    <option value="month">Last 30 days</option>
    <option value="week">This week</option>
  </select>
</div>

        {/* Body */}
        <div onClick={() => !loading && performers.length > 0 && setMaximized(true)}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', cursor: !loading && performers.length > 0 ? 'pointer' : 'default', borderRadius: 10, position: 'relative' }}>

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160, gap: 8 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <circle cx="12" cy="12" r="10" stroke="#e2e8f0" strokeWidth="3" fill="none" />
                <path d="M12 2a10 10 0 0110 10" stroke="#378ADD" strokeWidth="3" strokeLinecap="round" fill="none" />
              </svg>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Calculating top performer...</span>
            </div>
          )}

          {!loading && performers.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 160, gap: 8 }}>
              <TrophyIcon size={36} />
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>No offer data this month</p>
            </div>
          )}

{!loading && top && (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center',
    textAlign: 'center',
    gap: 16,
    minHeight: 160,
    padding: '8px 0',
  }}>
    {/* Trophy */}
    <div style={{ animation: 'trophyFloat 2.5s ease-in-out infinite' }}>
      <TrophyIcon size={64} />
    </div>

    {/* Stars */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <StarIcon size={14} /><StarIcon size={14} /><StarIcon size={14} />
    </div>

    {/* Name + Count + Badge */}
    <div>
      <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 6px' }}>
        {range === 'week' ? "This week's star" : "Last month's star"}
      </p>
      <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand)', margin: '0 0 10px', lineHeight: 1.2 }}>
        {top.name}
      </p>

      {/* ── Count pill ── */}
      <div style={{
        display: 'inline-flex', alignItems: 'baseline', gap: 6,
        background: '#EBF4FF', borderRadius: 12,
        padding: '6px 16px', marginBottom: 10,
      }}>
        <span style={{
          fontSize: 32, fontWeight: 700, color: '#185FA5',
          animation: 'countSlide 0.5s 0.2s ease both',
          display: 'inline-block', lineHeight: 1,
        }}>
          {top.offeredCount}
        </span>
        {/* <span style={{ fontSize: 12, color: '#94a3b8' }}>candidates offered</span> */}
      </div>
    </div>
  </div>
)}

          {!loading && top && (
            <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: hovered ? 'rgba(55,138,221,0.045)' : 'transparent', transition: 'background 0.2s', pointerEvents: 'none' }} />
          )}
        </div>
      </div>

      {maximized && (
  <FullPageOverlay
    performers={top ? [top, ...others] : []}
    onClose={() => setMaximized(false)}
    rangeLabel={range === 'week' ? 'this week' : 'last month'}
    range={range}
    onRangeChange={setRange}
  />
)}
    </>
  );
};