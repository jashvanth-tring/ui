import { useState, useRef } from 'react';
import { cn } from '../../lib/utils';
import { PortalPicker } from './date-time-portal-picker';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
  allowPastDates?: boolean;
}

export function DateInput({
  value,
  onChange,
  placeholder = 'Select date',
  className,
  'aria-label': ariaLabel,
  allowPastDates = false,
}: DateInputProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState('');
  const [internalValue, setInternalValue] = useState(value);

  const openPicker = () => {
    setTempDate(internalValue);
    setIsOpen(true);
  };

  const closePicker = () => {
    setIsOpen(false);
    setTempDate('');
  };

  const savePicker = () => {
    setInternalValue(tempDate);
    onChange(tempDate);
    closePicker();
  };

  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInternalValue('');
    onChange('');
    closePicker();
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={cn(
          'bg-white border border-slate-200 rounded-md px-3 py-2 text-sm cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/25 flex items-center justify-between gap-2',
          className
        )}
        onClick={openPicker}
        aria-label={ariaLabel}
      >
        {/* Calendar icon + value/placeholder */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke={internalValue ? 'var(--brand)' : '#9ca3af'}
            strokeWidth={1.5}
            style={{ width: 14, height: 14, flexShrink: 0 }}
          >
            <rect x="2" y="3" width="12" height="11" rx="2" />
            <path d="M5 1v3M11 1v3M2 7h12" strokeLinecap="round" />
          </svg>
          <span className={internalValue ? 'text-slate-700' : 'text-slate-400'}>
            {internalValue || placeholder}
          </span>
        </div>

        {/* Clear icon — only when a date is selected */}
        {internalValue && (
          <button
            type="button"
            onClick={clearDate}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
              color: '#9ca3af',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              lineHeight: 1,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
            aria-label="Clear date"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              style={{ width: 11, height: 11 }}
            >
              <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <PortalPicker
          type="date"
          value={tempDate}
          anchorEl={triggerRef.current}
          onChange={setTempDate}
          onSave={savePicker}
          onCancel={closePicker}
          allowPastDates={allowPastDates}
        />
      )}
    </>
  );
}