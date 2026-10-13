import React, { useCallback, useEffect, useRef, useState } from 'react';

interface ResizableSplitPaneProps {
  /** Left / top panel content */
  left: React.ReactNode;
  /** Right / bottom panel content */
  right: React.ReactNode;
  /** Initial left-panel share (0–1, default 0.5) */
  defaultRatio?: number;
  /** Minimum left width in pixels (default 280) */
  minLeftPx?: number;
  /** Minimum right width in pixels (default 280) */
  minRightPx?: number;
  /** Extra classes on the root container */
  className?: string;
}

/**
 * A horizontal split-pane with a draggable divider handle.
 * Both panels flex within the parent; the divider can be
 * grabbed to resize them dynamically.
 */
const ResizableSplitPane: React.FC<ResizableSplitPaneProps> = ({
  left,
  right,
  defaultRatio = 0.5,
  minLeftPx = 280,
  minRightPx = 280,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(defaultRatio);
  const draggingRef = useRef(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      draggingRef.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalW = rect.width;
      if (totalW <= 0) return;

      const x = e.clientX - rect.left;
      // Clamp to min widths
      const clamped = Math.max(minLeftPx, Math.min(x, totalW - minRightPx));
      setRatio(clamped / totalW);
    },
    [minLeftPx, minRightPx],
  );

  const onPointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  // Prevent text selection while dragging
  useEffect(() => {
    const handler = (e: Event) => {
      if (draggingRef.current) e.preventDefault();
    };
    document.addEventListener('selectstart', handler);
    return () => document.removeEventListener('selectstart', handler);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`flex min-h-0 ${className}`}
      style={{ overflow: 'hidden' }}
    >
      {/* Left panel */}
      <div
        className="flex flex-col min-h-0 min-w-0 overflow-hidden"
        style={{ width: `calc(${ratio * 100}% - 6px)` }}
      >
        {left}
      </div>

      {/* Divider handle */}
      <div
        className="relative flex-shrink-0 group"
        style={{ width: 12, cursor: 'col-resize' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Visible track */}
        <div className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-[3px] rounded-full
          bg-gray-200 group-hover:bg-blue-400 group-active:bg-blue-500
          transition-colors duration-150"
        />
        {/* Grip dots */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          flex flex-col gap-[3px] opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="w-[3px] h-[3px] rounded-full bg-blue-400" />
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div
        className="flex flex-col min-h-0 min-w-0 overflow-hidden"
        style={{ width: `calc(${(1 - ratio) * 100}% - 6px)` }}
      >
        {right}
      </div>
    </div>
  );
};

export default ResizableSplitPane;
