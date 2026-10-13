import React, { useState, useRef, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

const MONTHS_LONG = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const MONTHS_SHORT = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];
const WEEKDAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const ITEM_H  = 44;
const VISIBLE = 5;
const DRUM_H  = ITEM_H * VISIBLE;
const CENTER  = Math.floor(VISIBLE / 2);

interface CustomDatePickerProps {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  allowPastDates?: boolean;
  minDate?: string;
  maxDate?: string;
}

// ── Drum ──────────────────────────────────────────────────────────────────
function Drum({
  items,
  selectedIdx,
  onSelect,
  onConfirm,
  disabledBefore = -1,
  autoFocus = false,
}: {
  items: string[];
  selectedIdx: number;
  onSelect: (i: number) => void;
  onConfirm?: () => void;
  disabledBefore?: number;
  autoFocus?: boolean;
}) {
  const trackRef   = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const offsetY    = useRef(0);
  const isDrag     = useRef(false);
  const startY     = useRef(0);
  const startOff   = useRef(0);
  const vel        = useRef(0);
  const lastY      = useRef(0);
  const lastT      = useRef(0);
  const rafRef     = useRef<number>(0);
  const whtRef     = useRef<ReturnType<typeof setTimeout>>();

  const idxToOffset = (idx: number) => CENTER * ITEM_H - idx * ITEM_H;

  const clamp = useCallback(
    (off: number) => {
      const max =  CENTER * ITEM_H;
      const min = -(items.length - 1 - CENTER) * ITEM_H;
      return Math.max(min, Math.min(max, off));
    },
    [items.length]
  );

  const applyRaw = useCallback((off: number) => {
    offsetY.current = off;
    if (trackRef.current)
      trackRef.current.style.transform = `translateY(${off}px)`;
  }, []);

  const animTo = useCallback(
    (target: number, cb?: () => void) => {
      cancelAnimationFrame(rafRef.current);
      const step = () => {
        const diff = target - offsetY.current;
        if (Math.abs(diff) < 0.4) { applyRaw(target); cb?.(); return; }
        applyRaw(offsetY.current + diff * 0.2);
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [applyRaw]
  );

  const snapNearest = useCallback(
    (v: number) => {
      let proj = offsetY.current;
      let vv   = v;
      while (Math.abs(vv) > 0.5) { proj += vv; vv *= 0.88; }
      let idx = Math.round((CENTER * ITEM_H - proj) / ITEM_H);
      idx = Math.max(disabledBefore + 1, Math.min(items.length - 1, idx));
      animTo(clamp(idxToOffset(idx)), () => onSelect(idx));
    },
    [animTo, clamp, idxToOffset, items.length, onSelect, disabledBefore]
  );

  // ── Keyboard handler ──────────────────────────────────────────────────
  const onKD = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();              // prevent page scroll
        const dir  = e.key === 'ArrowDown' ? 1 : -1;
        let next   = selectedIdx + dir;
        next = Math.max(disabledBefore + 1, Math.min(items.length - 1, next));
        animTo(clamp(idxToOffset(next)), () => onSelect(next));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm?.();
      }
    },
    [selectedIdx, disabledBefore, items.length, animTo, clamp, idxToOffset, onSelect, onConfirm]
  );

  // ── Wheel ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const wh = (e: WheelEvent) => {
      e.preventDefault();
      cancelAnimationFrame(rafRef.current);
      applyRaw(clamp(offsetY.current - e.deltaY * 0.5));
      clearTimeout(whtRef.current);
      whtRef.current = setTimeout(() => {
        let idx = Math.round((CENTER * ITEM_H - offsetY.current) / ITEM_H);
        idx = Math.max(disabledBefore + 1, Math.min(items.length - 1, idx));
        animTo(clamp(idxToOffset(idx)), () => onSelect(idx));
      }, 100);
    };
    el.addEventListener('wheel', wh, { passive: false });
    return () => { el.removeEventListener('wheel', wh); clearTimeout(whtRef.current); };
  }, [applyRaw, clamp, animTo, onSelect, items.length, disabledBefore]);

  // ── Sync external selectedIdx ─────────────────────────────────────────
  useEffect(() => {
    animTo(clamp(idxToOffset(selectedIdx)));
  }, [selectedIdx]);

  // ── Init on mount + optional auto-focus ──────────────────────────────
  useEffect(() => {
    applyRaw(clamp(idxToOffset(selectedIdx)));
    if (autoFocus) {
      // rAF ensures the element is visible before we focus it
      requestAnimationFrame(() => wrapperRef.current?.focus());
    }
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Pointer drag ──────────────────────────────────────────────────────
  const onPD = useCallback((e: React.PointerEvent) => {
    wrapperRef.current?.focus();          // also focus on click/drag
    cancelAnimationFrame(rafRef.current);
    isDrag.current   = true;
    startY.current   = e.clientY;
    startOff.current = offsetY.current;
    lastY.current    = e.clientY;
    lastT.current    = performance.now();
    vel.current      = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, []);

  const onPM = useCallback((e: React.PointerEvent) => {
    if (!isDrag.current) return;
    const now = performance.now();
    const dt  = now - lastT.current;
    if (dt > 0) vel.current = (e.clientY - lastY.current) / dt * 16;
    lastY.current = e.clientY;
    lastT.current = now;
    applyRaw(clamp(startOff.current + (e.clientY - startY.current)));
    e.preventDefault();
  }, [applyRaw, clamp]);

  const onPU = useCallback(() => {
    if (!isDrag.current) return;
    isDrag.current = false;
    snapNearest(vel.current);
  }, [snapNearest]);

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      onKeyDown={onKD}
      className="relative focus:outline-none"
      style={{ width: '100%', height: DRUM_H, overflow: 'hidden' }}
    >
      {/* Top fade */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none z-10"
        style={{
          height: ITEM_H * 2,
          background: 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)',
        }}
      />

      {/* Center selection band */}
      <div
        className="absolute inset-x-2 pointer-events-none z-10 rounded-2xl"
        style={{
          top: CENTER * ITEM_H,
          height: ITEM_H,
          background: 'rgba(25,38,59,0.06)',
          border: '1px solid rgba(25,38,59,0.8)',
        }}
      />

      {/* Bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none z-10"
        style={{
          height: ITEM_H * 2,
          background: 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)',
        }}
      />

      {/* Scrollable track */}
      <div
        ref={trackRef}
        onPointerDown={onPD}
        onPointerMove={onPM}
        onPointerUp={onPU}
        onPointerCancel={onPU}
        className="absolute inset-x-0 top-0 cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none', willChange: 'transform' }}
      >
        {items.map((item, i) => {
          const dist       = Math.abs(i - selectedIdx);
          const isSelected = i === selectedIdx;
          const isDisabled = i <= disabledBefore;
          return (
            <div
              key={i}
              style={{
                height:     ITEM_H,
                fontSize:   isSelected ? 16 : dist === 1 ? 14 : 12,
                fontWeight: isSelected ? 700 : 400,
                color:      isDisabled
                  ? '#e2e8f0'
                  : isSelected
                  ? 'var(--brand)'
                  : dist === 1
                  ? '#64748b'
                  : '#94a3b8',
                opacity:    isDisabled ? 0.4 : 1,
                cursor:     isDisabled ? 'not-allowed' : 'pointer',
                transition: 'font-size 0.15s, color 0.15s, font-weight 0.15s',
              }}
              className="flex items-center justify-center select-none"
              onClick={() => {
                if (!isDisabled) {
                  if (i === selectedIdx) {
                    onConfirm?.();
                  } else {
                    animTo(clamp(idxToOffset(i)), () => onSelect(i));
                  }
                }
              }}
            >
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function CustomDatePicker({
  value,
  onChange,
  onSave,
  allowPastDates = true,
  minDate,
  maxDate,
}: CustomDatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse minDate / maxDate into midnight-normalised Date objects
  const minD = minDate
    ? (() => { const d = new Date(minDate); d.setHours(0, 0, 0, 0); return d; })()
    : null;
  const maxD = maxDate
    ? (() => { const d = new Date(maxDate); d.setHours(0, 0, 0, 0); return d; })()
    : null;

  const parsed = value ? new Date(value) : new Date(today);
  const [selected, setSelected] = useState<Date>(parsed);
  const [view,     setView]     = useState(
    new Date(parsed.getFullYear(), parsed.getMonth(), 1)
  );
  const [mode, setMode] = useState<'cal' | 'drum'>('cal');

  const [drumMonth, setDrumMonth] = useState(view.getMonth());
  const [drumYear,  setDrumYear]  = useState(0);
  const drumMonthRef = useRef(view.getMonth());
  const drumYearRef  = useRef(0);

  const YEARS = Array.from({ length: 10 }, (_, i) =>
    String(today.getFullYear() + i)
  );

  const yr = view.getFullYear();
  const mo = view.getMonth();

  const firstDay    = new Date(yr, mo, 1).getDay();
  const daysInMonth = new Date(yr, mo + 1, 0).getDate();
  const prevDays    = new Date(yr, mo, 0).getDate();

  const isSame = (a: Date, b: Date) =>
    a.getDate()     === b.getDate()  &&
    a.getMonth()    === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  const isPast = (d: Date) => {
    const x = new Date(d); x.setHours(0, 0, 0, 0); return x < today;
  };

  /** Returns true if `d` falls outside the [minD, maxD] window */
  const isOutOfRange = (d: Date) => {
    const x = new Date(d); x.setHours(0, 0, 0, 0);
    if (minD && x < minD) return true;
    if (maxD && x > maxD) return true;
    return false;
  };

  // ── Build calendar cells ─────────────────────────────────────────────
  const cells: { date: Date; outside: boolean }[] = [];
  for (let i = 0; i < firstDay; i++)
    cells.push({ date: new Date(yr, mo - 1, prevDays - firstDay + 1 + i), outside: true });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ date: new Date(yr, mo, d), outside: false });
  for (let i = 1; cells.length < 42; i++)
    cells.push({ date: new Date(yr, mo + 1, i), outside: true });

  // ── Month / year navigation guards ──────────────────────────────────
  /**
   * Prev arrow: disabled when the entire previous month is before today
   * (when allowPastDates=false) OR before minD.
   */
  const canGoPrev = (() => {
    const lastDayPrevMonth = new Date(yr, mo, 0); // last day of previous month
    if (!allowPastDates && lastDayPrevMonth < today) return false;
    if (minD && lastDayPrevMonth < minD) return false;
    return true;
  })();

  /**
   * Next arrow: disabled when the first day of the next month is after maxD.
   */
  const canGoNext = (() => {
    if (!maxD) return true;
    const firstDayNextMonth = new Date(yr, mo + 1, 1);
    return firstDayNextMonth <= maxD;
  })();

  // ── Drum disabled-before index for months ────────────────────────────
  const disabledMonthBefore = allowPastDates
    ? -1
    : drumYear === 0
    ? today.getMonth() - 1
    : -1;

  // ── Drum open ────────────────────────────────────────────────────────
  const openDrum = () => {
    const m = view.getMonth();
    const y = Math.max(0, view.getFullYear() - today.getFullYear());
    setDrumMonth(m);
    setDrumYear(y);
    drumMonthRef.current = m;
    drumYearRef.current  = y;
    setMode('drum');
  };

  // ── Today button disabled when today is out of range ─────────────────
  const todayDisabled = (!allowPastDates && isPast(today)) || isOutOfRange(today);

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden w-[280px] h-[280px] shadow-xl">

      {/* ── Nav header ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-white text-black shadow-sm">
        {mode === 'cal' ? (
          <>
            <button
              type="button"
              onClick={openDrum}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-white/10 transition-all"
            >
              <div className="text-[var(--brand)] text-sm font-medium leading-tight">
                {MONTHS_LONG[mo]} {yr}
              </div>
            </button>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={!canGoPrev}
                onClick={() => setView(new Date(yr, mo - 1, 1))}
                className="text-slate-400 hover:text-[var(--brand)] p-1.5 rounded transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path d="M10 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                type="button"
                disabled={!canGoNext}
                onClick={() => setView(new Date(yr, mo + 1, 1))}
                className="text-slate-400 hover:text-[var(--brand)] p-1.5 rounded transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-[var(--brand)] text-sm font-medium">Choose month &amp; year</span>
            <button
              type="button"
              onClick={() => {
                setView(new Date(today.getFullYear() + drumYearRef.current, drumMonthRef.current, 1));
                setMode('cal');
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 transition-all"
            >
              <span className="text-[var(--brand)] text-xs font-semibold">Done</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Calendar body ── */}
      {mode === 'cal' ? (
        <>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 px-5 pb-0.5 gap-1">
            {WEEKDAYS.map((d) => (
              <span key={d} className="text-center text-[10px] font-semibold text-slate-400 py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 px-5 pb-2 gap-0.5">
            {cells.map(({ date, outside }, i) => {
              const past       = !outside && isPast(date);
              const outOfRange = !outside && isOutOfRange(date);
              // Single source of truth for disabled state
              const isDisabled = outside || (past && !allowPastDates) || outOfRange;
              const isToday    = !outside && isSame(date, today);
              const isSel      = !outside && isSame(date, selected);

              return (
                <button
                  key={i}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    if (!isDisabled) {
                      setSelected(date);
                      onChange(format(date, 'yyyy-MM-dd'));
                      onSave();
                    }
                  }}
                  className={cn(
                    'aspect-square flex items-center justify-center text-[12px] rounded-lg transition-all duration-150',
                    outside
                      ? 'text-slate-200 cursor-default'
                      : isDisabled
                      ? 'text-slate-300 opacity-75 cursor-not-allowed'
                      : isSel
                      ? 'bg-[var(--brand3)] text-[var(--brand)] font-semibold shadow-sm'
                      : isToday
                      ? 'text-[var(--brand)] font-bold ring-1 ring-inset ring-[var(--brand3)] hover:bg-slate-100'
                      : 'text-slate-700 hover:bg-slate-100'
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              disabled={todayDisabled}
              onClick={() => {
                if (todayDisabled) return;
                const t = new Date(today);
                setSelected(t);
                setView(new Date(t.getFullYear(), t.getMonth(), 1));
                onChange(format(t, 'yyyy-MM-dd'));
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all',
                todayDisabled
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
                  : 'border-[var(--brand3)] text-[var(--brand)] hover:bg-[var(--brand3)] transition-all'
              )}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3 h-3">
                <rect x="2" y="3" width="12" height="11" rx="2"/>
                <path d="M5 1v3M11 1v3M2 7h12"/>
              </svg>
              Today
            </button>
          </div>
        </>
      ) : (
        <>
          {/* ── Drum pickers ── */}
          <div className="flex" style={{ height: DRUM_H, position: 'relative' }}>

            {/* Month drum */}
            <div style={{ width: '50%', overflow: 'hidden', position: 'relative' }}>
              <Drum
                items={MONTHS_SHORT}
                selectedIdx={drumMonth}
                onSelect={(i) => { setDrumMonth(i); drumMonthRef.current = i; }}
                disabledBefore={disabledMonthBefore}
                autoFocus={true}
              />
            </div>

            {/* Divider */}
            <div style={{ width: 1, background: '#f1f5f9', flexShrink: 0, margin: '8px 0' }} />

            {/* Year drum */}
            <div style={{ width: '50%', overflow: 'hidden', position: 'relative' }}>
              <Drum
                items={YEARS}
                selectedIdx={drumYear}
                onSelect={(i) => { setDrumYear(i); drumYearRef.current = i; }}
                disabledBefore={-1}
              />
            </div>

          </div>

          {/* Labels */}
          <div className="flex border-t border-slate-100">
            <div className="flex-1 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider py-1.5">
              Month
            </div>
            <div className="flex-1 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider py-1.5">
              Year
            </div>
          </div>
        </>
      )}
    </div>
  );
}