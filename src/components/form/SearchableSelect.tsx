import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';
import { ProfileAvatar } from '@/utils/UserAvatar';

interface Option {
  value: string;
  label: string;
   userId?: number;
  imageKey?: string | null;
}

interface Props {
  id: string;
  label: React.ReactNode;
  value: string;
  options: Option[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  onChange: (val: string) => void;
  className?: string;
  useAccent?: boolean;
  prefixIcon?: React.ReactNode;
  ghost?: boolean;
  priorityValue?: string;
  /** When true, allows user to type and save a value not in the options list. */
  allowCustomValue?: boolean;
}

const SearchableSelect: React.FC<Props> = ({
  id,
  label,
  value,
  options,
  placeholder = 'Select...',
  error,
  disabled = false,
  onChange,
  className = '',
  useAccent = true,
  allowCustomValue = false,
  prefixIcon,
  ghost = false,
  priorityValue,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLLIElement>(null);
  const [panelRect, setPanelRect] = useState<{ left: number; top: number; width: number } | null>(
    null
  );

  const selected = options.find((o) => o.value === value);

  // Sort: priorityValue first, then the rest in original order
  const sortedOptions = priorityValue
    ? [
        ...options.filter((o) => o.value === priorityValue),
        ...options.filter((o) => o.value !== priorityValue),
      ]
    : options;

  // Sync query state with selected value when dropdown closes or value changes externally
  useEffect(() => {
    if (!open) {
      setQuery(selected ? selected.label : allowCustomValue ? value : '');
    }
  }, [value, selected, open, allowCustomValue]);

  // Close on outside click / pointer down
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current && panelRef.current.contains(t)) return;
      if (wrapperRef.current && !wrapperRef.current.contains(t)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, []);

const updatePanelRect = () => {
  const el = triggerRef.current;
  if (!el) return;
  const r = el.getBoundingClientRect();
  const dropH = 200; // max-h-52 = 208px + padding
  const dropW = Math.max(r.width, 200);
  const viewportH = window.innerHeight;
  const viewportW = window.innerWidth;

  // Vertical: open UP if not enough space below
  const spaceBelow = viewportH - r.bottom;
  const top = spaceBelow < dropH && r.top > dropH
    ? r.top - dropH - 4    // flip UP
    : r.bottom + 4;         // open DOWN

  // Horizontal: shift LEFT if dropdown overflows right edge
  const spaceRight = viewportW - r.left;
  const left = spaceRight < dropW
    ? Math.max(0, r.right - dropW)   // align to right edge of trigger
    : r.left;                         // normal left-align

  setPanelRect({ left, top, width: dropW });
};

  // Position dropdown before paint so the portal mounts on the same frame as open=true.
  useLayoutEffect(() => {
    if (!open) return;
    updatePanelRect();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      selectedRef.current?.scrollIntoView({
        block: 'center',
        behavior: 'auto',
      });
    }, 50);

    const onScroll = () => updatePanelRect();
    const onResize = () => updatePanelRect();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  // Filter options only if the user is typing
  const isTyping = query !== (selected?.label || '');
  const filtered =
    isTyping && query.trim()
      ? sortedOptions.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
      : sortedOptions;

  const handleSelect = (opt: Option) => {
    onChange(opt.value);
    setQuery(opt.label);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleToggle = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
    if (!open) setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typed = e.target.value;
    if (!disabled) setOpen(true);
    setQuery(typed);
    if (allowCustomValue) {
      // Save whatever the user types as the value directly
      onChange(typed);
    } else {
      // Clear selection if user modifies text
      if (value) onChange('');
    }
  };

  return (
    <div className={`relative flex flex-col gap-1 ${className}`} ref={wrapperRef}>
      <label
        htmlFor={id}
        className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider"
      >
        {label}
      </label>

      {/* Trigger row / Input Area */}
      <div
        ref={triggerRef}
        role="combobox"
        aria-expanded={open}
        onClick={() => {
          if (disabled) return;
          setOpen(true);
        }}
        className={[
          'relative flex items-center w-full transition-all',
          ghost
            ? 'px-0 py-0 bg-transparent border-none shadow-none cursor-pointer'
            : [
                'border rounded-lg px-3 py-1.5 text-sm bg-white',
                disabled
                  ? 'cursor-not-allowed opacity-50 bg-gray-50 border-gray-200'
                  : 'cursor-text',
                error
                  ? 'border-red-400 ring-1 ring-red-400'
                  : open
                    ? useAccent
                      ? 'border-blue-500 ring-1 ring-blue-500'
                      : 'border-gray-400'
                    : value
                      ? useAccent
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 bg-white'
                      : 'border-gray-300 hover:border-gray-400',
              ].join(' '),
        ].join(' ')}
      >
        {/* Prefix icon */}
        {prefixIcon && <span className="flex-shrink-0 mr-1.5 flex items-center">{prefixIcon}</span>}

        <input
          id={id}
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (!disabled) setOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={[
            'flex-1 w-full truncate disabled:cursor-not-allowed min-w-0 m-0 p-0',
            'appearance-none !bg-transparent !border-0 outline-none !ring-0 !shadow-none',
            'focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0',
            ghost
              ? 'text-[11px] font-medium text-violet-700 placeholder:text-violet-400 cursor-pointer'
              : 'text-sm text-gray-900 placeholder:text-gray-400',
          ].join(' ')}
        />

        <div className="flex items-center gap-0.5 shrink-0 ml-1">
          {/* Clear button — hide in ghost mode to keep it minimal */}
          {query && !disabled && !ghost && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={14} />
            </button>
          )}

          {/* Chevron */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            disabled={disabled}
            className={[
              'p-0.5 rounded transition-all disabled:hover:bg-transparent',
              ghost
                ? // only visible on hover / when open — gives the "it's a dropdown" hint
                  `text-violet-400 ${open ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`
                : 'hover:bg-gray-200 text-gray-400',
            ].join(' ')}
          >
            <ChevronDown
              size={ghost ? 13 : 16}
              className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Dropdown panel */}
      {open &&
        !disabled &&
        (typeof document !== 'undefined' && panelRect
          ? createPortal(
              <div
                className="fixed z-[9999] pointer-events-auto"
                style={{
                  left: `${panelRect.left}px`,
                  top: `${panelRect.top}px`,
                  width: `${panelRect.width}px`,
                }}
              >
                <div
                  ref={panelRef}
                  className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
                  onPointerDown={(e) => e.stopPropagation()}
                  onWheel={(e) => e.stopPropagation()}
                >
                  <ul
                    className="max-h-52 overflow-y-auto py-1 pointer-events-auto"
                    onWheel={(e) => e.stopPropagation()}
                  >
                    {filtered.length === 0 && !allowCustomValue ? (
                      <li className="px-3 py-2 text-sm text-gray-400 text-center italic">
                        No options found
                      </li>
                    ) : (
                      <>
                        {allowCustomValue &&
                          query.trim() &&
                          !options.find((o) => o.label.toLowerCase() === query.toLowerCase()) && (
                            <li
                              onClick={() => {
                                onChange(query);
                                setOpen(false);
                              }}
                              className="px-3 py-2 text-sm cursor-pointer text-black-600 hover:bg-black-50 border-b border-gray-100 font-medium"
                            >
                              {query}
                            </li>
                          )}
                        {filtered.map((opt) => {
                          const isSelected = opt.value === value;
                          return (
                            <li
                              key={opt.value}
                              ref={isSelected ? selectedRef : null}
                              onClick={() => handleSelect(opt)}
                              className={[
                                  'px-3 py-2 text-sm cursor-pointer transition-colors flex items-center gap-2',
                                  isSelected
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-50',
                                ].join(' ')}
                              >
                                {opt.userId !== undefined && (
                                  <ProfileAvatar
                                    userId={opt.userId}
                                    imageKey={opt.imageKey}
                                    name={opt.label}
                                    size="sm"
                                  />
                                )}
                          
                              {opt.label}
                            </li>
                          );
                        })}
                      </>
                    )}
                  </ul>
                </div>
              </div>,
              document.body
            )
          : null)}

      {error && <span className="text-[11px] text-red-500 mt-0.5">{error}</span>}
    </div>
  );
};

export default SearchableSelect;
