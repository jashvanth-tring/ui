import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { CustomDatePicker } from './custom-date-picker';
import { CustomTimePicker } from './custom-time-picker';

interface PortalPickerProps {
  type: 'date' | 'time';
  value: string;
  anchorEl: HTMLElement | null;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  allowPastDates?: boolean;
  minDate?: string;  
  maxDate?: string; 
  selectedDate?: string;
}

export function PortalPicker({
  type,
  value,
  anchorEl,
  onChange,
  onSave,
  onCancel,
  allowPastDates = false,
  minDate,  
  maxDate,
  selectedDate,
}: PortalPickerProps) {
  const pickerRef    = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);
  const pickerWidth  = type === 'date' ? 280 : 210;
  const pickerHeight = type === 'date' ? 300 : 280;

  // Find the best portal target:
  // If we're inside a Radix Dialog, portal into the DialogContent element
  // so Radix doesn't block pointer events. Otherwise use document.body.
  const getPortalTarget = (): HTMLElement => {
    if (!anchorEl) return document.body;
    // Walk up and find a [role="dialog"] container
    const dialog = anchorEl.closest('[role="dialog"]') as HTMLElement | null;
    if (dialog) return dialog;
    return document.body;
  };
  const MARGIN = 16; 
const calcPos = (el: HTMLElement): { top: number; left: number } => {
  const portalTarget = getPortalTarget();
  const rect = el.getBoundingClientRect();
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  if (portalTarget === document.body) {
    // Prefer below; flip above if not enough room below
    const spaceBelow = viewportH - rect.bottom - MARGIN;
    const spaceAbove = rect.top - MARGIN;

    let top: number;
    if (spaceBelow >= pickerHeight) {
      top = rect.bottom + 4;
    } else if (spaceAbove >= pickerHeight) {
      top = rect.top - pickerHeight - 4;
    } else {
      // Neither fits perfectly — open below but clamp to viewport
      top = rect.bottom + 4;
    }

    // Clamp vertically so it never overflows viewport
    top = Math.max(MARGIN, Math.min(top, viewportH - pickerHeight - MARGIN));

    // Align left edge with button, clamped to viewport
    let left = rect.left;
    if (left + pickerWidth > viewportW - MARGIN) {
      // Try right-aligning to button
      left = rect.right - pickerWidth;
    }
    left = Math.max(MARGIN, Math.min(left, viewportW - pickerWidth - MARGIN));

    return { top, left };
  } else {
    // Inside a dialog — use absolute positioning relative to dialog
    const elRect = el.getBoundingClientRect();
    const parentRect = portalTarget.getBoundingClientRect();
    const scrollTop = portalTarget.scrollTop;

    const spaceBelow = viewportH - elRect.bottom - MARGIN;
    const spaceAbove = elRect.top - MARGIN;

    let top: number;
    if (spaceBelow >= pickerHeight) {
      top = (elRect.bottom - parentRect.top + scrollTop) + 4;
    } else if (spaceAbove >= pickerHeight) {
      top = (elRect.top - parentRect.top + scrollTop) - pickerHeight - 4;
    } else {
      top = (elRect.bottom - parentRect.top + scrollTop) + 4;
    }

    let left = elRect.left - parentRect.left;
    if (elRect.left + pickerWidth > viewportW - MARGIN) {
      left = (elRect.right - parentRect.left) - pickerWidth;
    }
    left = Math.max(MARGIN, left);

    return { top, left };
  }
};

  const [pos, setPos] = useState<{ top: number; left: number }>(() => {
    if (anchorEl) return calcPos(anchorEl);
    return { top: 0, left: 0 };
  });

  const [portalTarget, setPortalTarget] = useState<HTMLElement>(document.body);
  const isInsideDialog = portalTarget !== document.body;

  useEffect(() => {
    if (!anchorEl) return;
    const target = getPortalTarget();
    setPortalTarget(target);
    setPos(calcPos(anchorEl));
  }, [anchorEl]);

  useEffect(() => {
  const el = pickerRef.current;
  if (!el) return;
  const onEnter = () => { isHoveredRef.current = true; };
  const onLeave = () => { isHoveredRef.current = false; };
  el.addEventListener('mouseenter', onEnter);
  el.addEventListener('mouseleave', onLeave);
  return () => {
    el.removeEventListener('mouseenter', onEnter);
    el.removeEventListener('mouseleave', onLeave);
  };
}, []);


  // Reposition on scroll
useEffect(() => {
  const onScroll = (e: Event) => {
    const target = e.target as Node;
    // If scrolling inside the picker itself, ignore
// If scrolling inside the picker itself, ignore
if (pickerRef.current && pickerRef.current.contains(target)) return;
// Also ignore if mouse is hovering over the picker (catches wheel without focus)
if (isHoveredRef.current) return;
// Also ignore if focus is currently inside the picker
if (pickerRef.current && pickerRef.current.contains(document.activeElement)) return;
// Reposition to follow anchor
    // Reposition to follow anchor
    if (anchorEl && document.contains(anchorEl)) {
      setPos(calcPos(anchorEl));
    } else {
      onCancel();
    }
  };
  window.addEventListener('scroll', onScroll, true);
  return () => window.removeEventListener('scroll', onScroll, true);
}, [onCancel, anchorEl]);

// Reposition on resize
useEffect(() => {
  const onResize = () => {
    if (anchorEl && document.contains(anchorEl)) {
      setPos(calcPos(anchorEl));
    } else {
      onCancel();
    }
  };
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}, [onCancel, anchorEl]);
// Continuously sync position via rAF for smooth scroll tracking
useEffect(() => {
  if (!anchorEl) return;
  let rafId: number;
  let lastTop = pos.top;
  let lastLeft = pos.left;

  const sync = () => {
  const isInsidePicker = isHoveredRef.current || pickerRef.current?.contains(document.activeElement);
  if (!isInsidePicker && anchorEl && document.contains(anchorEl)) {
      const next = calcPos(anchorEl);
      if (next.top !== lastTop || next.left !== lastLeft) {
        lastTop = next.top;
        lastLeft = next.left;
        setPos(next);
      }
    }
    rafId = requestAnimationFrame(sync);
  };

  rafId = requestAnimationFrame(sync);
  return () => cancelAnimationFrame(rafId);
}, [anchorEl]);

  // Close on outside click
  useEffect(() => {
    let handler: ((e: MouseEvent) => void) | null = null;
    const t = setTimeout(() => {
      handler = (e: MouseEvent) => {
        const target = e.target as Node;
        if (pickerRef.current && pickerRef.current.contains(target)) return;
        if (anchorEl && anchorEl.contains(target)) return;
        onCancel();
      };
      document.addEventListener('mousedown', handler);
    }, 50);
    return () => {
      clearTimeout(t);
      if (handler) document.removeEventListener('mousedown', handler);
    };
  }, [onCancel, anchorEl]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  if (!anchorEl) return null;
  const disablePastTimes = selectedDate === new Date().toLocaleDateString('en-CA');
  return ReactDOM.createPortal(
    <div
      ref={pickerRef}
      style={{
        position : isInsideDialog ? 'absolute' : 'fixed',
        top      : pos.top,
        left     : pos.left,
        zIndex   : 99999,
        // Ensure pointer events always work regardless of Radix body lock
        pointerEvents: 'all',
      }}
    >
      {type === 'date' ? (
        <CustomDatePicker
          value={value}
          onChange={onChange}
          onSave={onSave}
          onCancel={onCancel}
          allowPastDates={allowPastDates}
          minDate={minDate}   
          maxDate={maxDate} 
        />
      ) : (
        <CustomTimePicker
          value={value}
          onChange={onChange}
          onSave={onSave}
          onCancel={onCancel}
          disablePastTimes={disablePastTimes}
        />
      )}
    </div>,
    portalTarget
  );
}