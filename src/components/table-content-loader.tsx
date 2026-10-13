import type { ReactNode } from 'react';
import Loader from './loader';

interface TableContentLoaderProps {
  loading: boolean;
  /** Short message under the spinner */
  label: string;
  /** Ensures a consistent table area height (px). */
  minHeightPx?: number;
  children: ReactNode;
}

/**
 * Centers the app Loader over table content while the first page / refetch is in flight.
 */
export function TableContentLoader({
  loading,
  label,
  minHeightPx = 420,
  children,
}: TableContentLoaderProps) {
  const resolvedMin = Math.max(
    220,
    Number.isFinite(Number(minHeightPx)) ? Number(minHeightPx) : 420,
  );
  return (
    <div
      className="relative w-full overflow-hidden rounded-md"
      style={{ minHeight: `${resolvedMin}px` }}
    >
      {loading && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-md bg-white/92 backdrop-blur-[1px]"
          aria-busy="true"
          aria-live="polite"
        >
          <Loader />
          <p className="text-sm font-medium text-slate-600">{label}</p>
        </div>
      )}
      <div
        className={
          loading ? 'pointer-events-none select-none opacity-50 transition-opacity' : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}
