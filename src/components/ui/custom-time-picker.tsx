import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface CustomTimePickerProps {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  disablePastTimes?: boolean;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

// ── Single scrollable+typeable box ────────────────────────────────────────
function TimeBox({
  value,
  min,
  max,
  label,
  onValue,
  isActive,
  onActivate,
  nextRef,
}: {
  value: number;
  min: number;
  max: number;
  label: string;
  onValue: (v: number) => void;
  isActive: boolean;
  onActivate: () => void;
  nextRef?: React.RefObject<HTMLInputElement>;
}) {
  const inputRef    = useRef<HTMLInputElement>(null);
  const typingRef   = useRef('');        // typed digits buffer
  const wheelAcc    = useRef(0);         // wheel accumulator for smooth scroll
  const rafRef      = useRef<number>(0);
  const [displayVal, setDisplayVal] = useState(pad(value));

  // Keep display in sync when value changes externally (e.g. drum → box sync)
  const prevValue = useRef(value);
  if (prevValue.current !== value && typingRef.current === '') {
    prevValue.current = value;
    setDisplayVal(pad(value));
  }

  const commit = useCallback(
    (raw: number) => {
      const clamped = Math.max(min, Math.min(max, raw));
      setDisplayVal(pad(clamped));
      onValue(clamped);
      return clamped;
    },
    [min, max, onValue]
  );
// ── Typing ───────────────────────────────────────────────────────────────
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const digits = e.target.value.replace(/\D/g, '').slice(-2);
  typingRef.current = digits;

  // Show what user is typing immediately
  setDisplayVal(digits);

  const num = parseInt(digits, 10);
  if (isNaN(num) || digits === '') return;

  // Strict range block — reject silently if already out of range
  // For hour: 1–12, for minute: 0–59
  // Only emit if within valid range
  if (num >= min && num <= max) {
    onValue(num);
  }

  // Auto-advance to next field when:
  // - 2 digits typed AND valid
  // - OR first digit already makes a 2-digit valid number impossible
  //   e.g. hour: typing "2" can still become 12, so wait
  //        but typing "9" for hour → can only be 9 (no valid 9x in 1–12), advance
  const shouldAutoAdvance =
    digits.length === 2 && num >= min && num <= max && nextRef?.current;

  // For hour: if first digit > 1, it can only be single digit valid (1–9), auto-advance
  const isHourSingleDigitComplete =
    max === 12 &&
    digits.length === 1 &&
    num >= 2 &&   // "2"–"9" → no valid second digit possible for 1–12
    num <= 9 &&
    nextRef?.current;

  if (shouldAutoAdvance || isHourSingleDigitComplete) {
    if (num >= min && num <= max) onValue(num);
    nextRef?.current?.focus();
  }
};

const handleBlur = () => {
  const raw = parseInt(typingRef.current || String(value), 10);
  typingRef.current = '';

  if (isNaN(raw)) {
    // Revert to last valid value
    commit(value);
    return;
  }

  // Clamp to valid range on blur
  const clamped = Math.max(min, Math.min(max, raw));
  commit(clamped);
};

  const handleFocus = () => {
    onActivate();
    typingRef.current = '';
    setDisplayVal('');
  };

  // ── Keyboard arrows ──────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      commit(value < max ? value + 1 : min);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      commit(value > min ? value - 1 : max);
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      handleBlur();
    }
  };

  // ── Smooth wheel scroll ──────────────────────────────────────────────────
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      cancelAnimationFrame(rafRef.current);

      // Accumulate wheel delta for smooth feel
      wheelAcc.current += e.deltaY;

      rafRef.current = requestAnimationFrame(() => {
        const steps = Math.round(wheelAcc.current / 30);
        if (steps === 0) return;
        wheelAcc.current -= steps * 30;

        let next = value + steps;
        // Wrap around
        const range = max - min + 1;
        next = ((next - min) % range + range) % range + min;
        commit(next);
      });
    },
    [value, min, max, commit]
  );

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        onClick={() => { onActivate(); inputRef.current?.focus(); }}
        onWheel={handleWheel}
        style={{ borderRadius: '12px' }}
        className={cn(
        'w-[88px] h-[72px] flex items-center justify-center cursor-text transition-colors duration-150 border-2 outline-none overflow-visible',
        isActive
            ? 'bg-slate-100 border-[var(--brand)]'
            : 'bg-slate-100 border-slate-100'
        )}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={displayVal}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-[80px] h-[60px] text-center text-[36px] font-medium bg-transparent outline-none tabular-nums caret-[var(--brand)] select-all rounded-lg"
        style={{
        color: isActive ? 'var(--brand)' : '[var(--brand)]',
        border: 'none',
        boxShadow: 'none',
        WebkitAppearance: 'none',
        }}
          placeholder={pad(min === 1 ? 12 : 0)}
        />
      </div>
      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function CustomTimePicker({
  value,
  onChange,
  onSave,
  onCancel,
  disablePastTimes = false,
}: CustomTimePickerProps) {
  const init = useMemo(() => {
    const [hh, mm] = (value || '09:00').split(':').map(Number);
    return {
      hour: hh % 12 || 12,
      min:  mm,
      ampm: hh >= 12 ? 1 : 0,
    };
  }, []);

  const [hour,    setHour]    = useState(init.hour);
  const [min,     setMin]     = useState(init.min);
  const [ampmIdx, setAmpmIdx] = useState(init.ampm);
  const [active,  setActive]  = useState<'hour' | 'min' | null>(null);

  const minInputRef = useRef<HTMLInputElement>(null);

 const [currentMinutes, setCurrentMinutes] = useState(() => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
});

useEffect(() => {
  const interval = setInterval(() => {
    const now = new Date();
    setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
  }, 10000); // refresh every 10 seconds
  return () => clearInterval(interval);
}, []);
  const isCurrentTimePast = useMemo(() => {
    if (!disablePastTimes) return false;
    const h24 =
      ampmIdx === 1
        ? hour === 12 ? 12 : hour + 12
        : hour === 12 ? 0  : hour;
    return h24 * 60 + min < currentMinutes;
  }, [disablePastTimes, hour, min, ampmIdx, currentMinutes]);

  const handleSave = () => {
    if (isCurrentTimePast) return;
    onSave();
  };


  const emit = useCallback(
    (h: number, m: number, ap: number) => {
      const h24 =
        ap === 1
          ? h === 12 ? 12 : h + 12
          : h === 12 ? 0  : h;
      onChange(`${pad(h24)}:${pad(m)}`);
    },
    [onChange]
  );

  const handleHour = (v: number) => { setHour(v); emit(v, min, ampmIdx); };
  const handleMin  = (v: number) => { setMin(v);  emit(hour, v, ampmIdx); };
  const handleAmpm = (i: number) => { setAmpmIdx(i); emit(hour, min, i); };

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-[320px] overflow-hidden border border-slate-100">

      {/* ── Header ── */}
      <div className="px-6 pt-5 pb-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
          Enter time
        </p>
        <p className="text-[10px] text-slate-300 mt-0.5">
          Click to type · Scroll wheel or ↑↓ keys to adjust
        </p>
      </div>

      {/* ── Single row: Hour : Minute  AM/PM ── */}
      <div className="px-6 pb-5 flex items-start gap-2">

        {/* Hour */}
        <TimeBox
          value={hour}
          min={1}
          max={12}
          label="Hour"
          onValue={handleHour}
          isActive={active === 'hour'}
          onActivate={() => setActive('hour')}
          nextRef={minInputRef as React.RefObject<HTMLInputElement>}
        />

        {/* Colon */}
        <div className="flex flex-col items-center justify-center h-[72px] pb-4">
          <div className="flex flex-col gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          </div>
        </div>

        {/* Minute */}
        <TimeBox
          value={min}
          min={0}
          max={59}
          label="Minute"
          onValue={handleMin}
          isActive={active === 'min'}
          onActivate={() => setActive('min')}
        />

        {/* AM / PM */}
        <div className="flex flex-col h-[72px] ml-1 rounded-xl overflow-hidden border border-slate-200">
          {['AM', 'PM'].map((label, i) => (
            <React.Fragment key={label}>
              {i === 1 && <div className="h-px bg-slate-200" />}
              <button
                type="button"
                onClick={() => handleAmpm(i)}
                className={cn(
                  'flex-1 w-[52px] text-sm font-semibold transition-colors',
                  ampmIdx === i
                    ? 'bg-[#e8edf2] text-[var(--brand)]'
                    : 'bg-white text-slate-500 hover:bg-slate-50'
                )}
              >
                {label}
              </button>
            </React.Fragment>
          ))}
        </div>

      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100">
        <div className="text-slate-400">
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-semibold text-[var(--brand)] hover:text-[var(--brand)] uppercase tracking-wide transition-colors"
          >
            Cancel
          </button>
          <button
  type="button"
  onClick={handleSave}
  disabled={isCurrentTimePast}
  className={cn(
    'text-sm font-semibold uppercase tracking-wide transition-colors',
    isCurrentTimePast
      ? 'text-slate-300 cursor-not-allowed'
      : 'text-[var(--brand)] hover:opacity-80'
  )}
>
  OK
</button>
        </div>
      </div>

    </div>
  );
}