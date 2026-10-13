import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { PortalPicker } from '../ui/date-time-portal-picker';

interface Props {
  id?: string;
  label?: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
}

const DateField: React.FC<Props> = ({
  id,
  label,
  value,
  onChange,
  error,
  placeholder = 'Select date',
  required = false,
}) => {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Sync internal state when parent value changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const displayValue = internalValue
    ? format(new Date(internalValue), 'dd MMM yyyy')
    : '';

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider"
        >
          {label}{required && ' *'}
        </label>
      )}

      {/* Trigger input */}
      <div
        ref={triggerRef}
        id={id}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-between cursor-pointer"
        style={{
          height: '38px',
          borderRadius: '8px',
          border: error
            ? '1px solid #f87171'
            : open
            ? '1px solid var(--brand)'
            : '1px solid #d1d5db',
          backgroundColor: '#ffffff',
          padding: '0 12px',
          fontSize: '14px',
          color: displayValue ? '#111827' : '#9ca3af',
          userSelect: 'none',
          transition: 'border-color 0.15s',
        }}
      >
        <span>{displayValue || placeholder}</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Clear icon */}
          {internalValue && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setInternalValue('');
                onChange('');
                setOpen(false);
              }}
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

          {/* Calendar icon — always visible */}
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke={open ? 'var(--brand)' : '#9ca3af'}
            strokeWidth={1.5}
            style={{ width: 14, height: 14, flexShrink: 0, transition: 'stroke 0.15s' }}
          >
            <rect x="2" y="3" width="12" height="11" rx="2" />
            <path d="M5 1v3M11 1v3M2 7h12" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Portal picker — positions itself smartly relative to viewport */}
      {open && (
        <PortalPicker
          type="date"
          value={internalValue}
          anchorEl={triggerRef.current}
          onChange={(val) => {
            setInternalValue(val);
            onChange(val);
          }}
          onSave={() => setOpen(false)}
          onCancel={() => setOpen(false)}
          allowPastDates={true}
        />
      )}

      {error && (
        <span className="text-[11px] text-red-500 mt-0.5">{error}</span>
      )}
    </div>
  );
};

export default DateField;