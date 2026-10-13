import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import { Download, Loader2, RefreshCw, SearchIcon, FilterX } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { fetchRequirementPriorities } from '../../store/action/requirement-details.action';
import type { RequirementRow } from '../../store/model/requirement-details.types';
import type { RootState } from '../../store/reducers';
import { AppDispatch, useAppSelector } from '../../store';
import { cn } from '../../lib/utils';
import { DataTable } from '../customized-table';
import { Card, CardContent, CardDescription, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { PortalPicker } from '../ui/date-time-portal-picker';
import { Badge } from '../ui/badge';

export type RequirementPrioritiesPanelVariant = 'page' | 'dashboard';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'dd/MM/yyyy');
  } catch {
    return '—';
  }
}

function PriorityBadge({ priority }: { priority: string | null }) {
  if (!priority) return <span className="text-slate-400 text-sm">—</span>;
  const p = priority.toLowerCase();
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-medium capitalize',
        p === 'yes' && 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
        p === 'no' && 'border-orange-200 bg-orange-50 text-orange-700',
      )}
    >
      {priority}
    </Badge>
  );
}

function AgingBadge({ aging }: { aging: number | null }) {
  if (aging === null) return <span className="text-slate-400 text-sm">—</span>;
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-medium tabular-nums',
        aging >= 90 && 'border-red-200 bg-red-50 text-red-700',
        aging >= 30 && aging < 90 && 'border-orange-200 bg-orange-50 text-orange-700',
        aging < 30 && 'border-green-200 bg-green-50 text-green-700'
      )}
    >
      {aging}d
    </Badge>
  );
}

export const RequirementPrioritiesPanel = ({
  className,
  themeColor = 'var(--brand)',
  variant = 'page',
}: {
  className?: string;
  themeColor?: string;
  variant?: RequirementPrioritiesPanelVariant;
}) => {
  const isDashboard = variant === 'dashboard';
  const dispatch = useDispatch<AppDispatch>();
  // ── Redux state ──────────────────────────────────────────────
  const rows = useAppSelector((s: RootState) => s.requirementsSelector.dashboardRows);
  const loading = useAppSelector((s: RootState) => s.requirementsSelector.dashboardLoading);
  const error = useAppSelector((s: RootState) => s.requirementsSelector.dashboardError);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [query, setQuery] = useState('');
  const filterInputRef = useRef<HTMLInputElement>(null);
    // ── From / To picker anchor state (same pattern as FeedbackTrackerPanel) ──
  const [fromAnchorEl, setFromAnchorEl] = useState<HTMLElement | null>(null);
  const [toAnchorEl,   setToAnchorEl  ] = useState<HTMLElement | null>(null);
  const hasFilters = dateFrom || dateTo || query;
  const clearFilters = useCallback(() => {
    setDateFrom('');
    setDateTo('');
    setQuery('');
    dispatch(fetchRequirementPriorities({ page: 1, limit: 50 }));
  }, [dispatch]);

  const load = useCallback(() => {
    let from = dateFrom.trim();
    let to = dateTo.trim();

    if (from && to && from > to) {
      [from, to] = [to, from];
    }

    dispatch(
      fetchRequirementPriorities({
        page: 1,
        limit: 50,
        ...(from && { fromDate: from }),
        ...(to && { toDate: to }),
      })
    );
  }, [dispatch, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Client-side filter ───────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r: RequirementRow) =>
      [
        r.clientName,
        r.accountManager,
        r.requirementName,
        r.priority,
        r.positionType,
        r.status,
        r.remarks ?? '',
        String(r.noOfPositions ?? ''),
        r.ctc ?? '',
        formatDate(r.startDate),
        formatDate(r.reopenDate),
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [rows, query]);

  // ── CSV Export ───────────────────────────────────────────────
  const exportCsv = () => {
    const headers = [
      'No',
      'Client Name',
      'Account Holder',
      'Position',
      'No of Positions',
      'CTC',
      'Priority',
      'JRF',
      'Req Received Date',
      'Req Re-opened Date',
      'New / Replacement',
      'Aging (days)',
      'Remarks',
      'Status',
    ];
    const lines = filtered.map((r: RequirementRow, i: number) =>
      [
        i + 1,
        r.clientName,
        r.accountManager,
        r.requirementName,
        r.noOfPositions,
        r.ctc,
        r.priority,
        r.jobRequirementForm ? 'Yes' : 'No',
        formatDate(r.startDate),
        formatDate(r.reopenDate),
        r.positionType,
        r.aging ?? '',
        r.remarks ?? '',
        r.status,
      ]
        .map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([`${headers.join(',')}\n${lines.join('\n')}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), {
      href: url,
      download: `requirement-priorities-${format(new Date(), 'yyyy-MM-dd')}.csv`,
    }).click();
    URL.revokeObjectURL(url);
  };

  // ── Columns ──────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<RequirementRow>[]>(
    () => [
      {
        id: 'serial',
        header: 'S.No',
        size: 60,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row, table }) => {
          const rowIndex = table.getRowModel().rows.findIndex((r) => r.id === row.id);
          return <span className="text-muted-foreground tabular-nums text-sm">{rowIndex + 1}</span>;
        },
      },
      {
        accessorKey: 'clientName',
        header: 'Client Name',
        size: 150,
        cell: ({ row }) => (
          <span className="font-semibold text-slate-900 uppercase tracking-tight text-sm">
            {row.original.clientName ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'accountManager',
        header: 'Account Holder',
        size: 130,
        cell: ({ row }) => (
          <span className="capitalize text-slate-700 text-sm">
            {row.original.accountManager ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'requirementName',
        header: 'Position',
        size: 180,
        cell: ({ row }) => (
          <span className="capitalize text-slate-700 text-sm">
            {row.original.requirementName ?? '—'}
          </span>
        ),
      },
      {
         accessorKey: 'noOfPositions',
        header: 'No of Positions',
        size: 120,
        cell: ({ row }) => {
          const total  = Number(row.original.noOfPositions  ?? 0);
          const filled = Number(row.original.filledPositions ?? 0); 
          const openPositions = total - filled;
          return (
            <span className="tabular-nums text-slate-700 text-sm">
              {openPositions}
            </span>
          );
        },
      }, 
      {
        accessorKey: 'ctc',
        header: 'CTC',
        size: 100,
        cell: ({ row }) => (
          <span className="text-slate-700 text-sm">{row.original.ctc ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        size: 110,
        cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
      },
      {
        accessorKey: 'jobRequirementForm',
        header: 'JRF',
        size: 70,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              'text-xs font-medium',
              row.original.jobRequirementForm
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-slate-50 text-slate-500'
            )}
          >
            {row.original.jobRequirementForm ? 'Yes' : 'No'}
          </Badge>
        ),
      },
      {
        accessorKey: 'startDate',
        header: 'Req Received Date',
        size: 140,
        cell: ({ row }) => (
          <span className="text-slate-600 whitespace-nowrap text-sm">
            {formatDate(row.original.startDate)}
          </span>
        ),
      },
      {
        accessorKey: 'reopenDate',
        header: 'Req Re-opened Date',
        size: 150,
        cell: ({ row }) => (
          <span className="text-slate-600 whitespace-nowrap text-sm">
            {formatDate(row.original.reopenDate)}
          </span>
        ),
      },
      {
        accessorKey: 'positionType',
        header: 'New / Replacement',
        size: 110,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              'text-xs font-medium capitalize',
              row.original.positionType?.toLowerCase() === 'new'
                ? 'border-sky-200 bg-sky-50 text-sky-700'
                : 'border-violet-200 bg-violet-50 text-violet-700'
            )}
          >
            {row.original.positionType ?? '—'}
          </Badge>
        ),
      },
      {
        accessorKey: 'aging',
        header: 'Aging',
        size: 80,
        cell: ({ row }) => <AgingBadge aging={row.original.aging} />,
      },
      {
        accessorKey: 'remarks',
        header: 'Remarks',
        size: 200,
        cell: ({ row }) => (
          <span
            className="block max-w-[200px] truncate text-slate-600 text-sm"
            title={row.original.remarks ?? ''}
          >
            {row.original.remarks || (
              <span className="text-slate-400">—</span>
            )}
          </span>
        ),
      },
    ],
    []
  );

  // ── Render ───────────────────────────────────────────────────
  return (
    <Card
      className={cn(
        'flex flex-col',
        isDashboard
          ? 'h-full min-h-0 mb-0 border border-gray-100 shadow-sm rounded-lg'
          : 'rounded-sm shadow-lg border border-slate-200/80 mb-3',
        className
      )}
    >
      <CardHeader
        className={cn(
          'border-b shrink-0',
          isDashboard
            ? 'p-3 border-gray-100 bg-white'
            : 'py-4 px-4 sm:px-6 border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/90'
        )}
      >
        {/* ── Title + Actions ── */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            {!isDashboard && (
              <CardDescription className="mt-0.5">
                All active requirements with priority, aging, and position details.
              </CardDescription>
            )}
          </div>
        </div>

        {/* ── Search ── */}
        <div className={cn('flex flex-wrap items-end gap-2', isDashboard ? 'mt-2' : 'mt-3')}>
          <div className="flex items-end gap-2">
                        {/* From date button */}
            <div className="space-y-1">
              <span className="text-xs font-medium block" style={{ color: themeColor }}>From</span>
              <button
                type="button"
                onClick={(e) => {
                  setToAnchorEl(null);
                  setFromAnchorEl(fromAnchorEl ? null : e.currentTarget);
                }}
                className={cn(
                  'flex items-center gap-1.5 w-[11rem] h-9 px-3 rounded-md border bg-white text-sm text-slate-700 text-left transition-all',
                  fromAnchorEl
                    ? 'border-[var(--brand)] ring-2 ring-[var(--brand)]/20'
                    : 'border-slate-200 hover:border-[var(--brand)] hover:bg-slate-50'
                )}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3.5 w-3.5 shrink-0 text-[var(--brand)]">
                  <rect x="2" y="3" width="12" height="11" rx="2"/>
                  <path d="M5 1v3M11 1v3M2 7h12"/>
                </svg>
                <span className={dateFrom ? 'text-slate-700' : 'text-slate-400'}>
                  {dateFrom ? format(parseISO(dateFrom), 'dd MMM yyyy') : 'Pick date'}
                </span>
              </button>
            </div>
 
            {/* To date button */}
            <div className="space-y-1">
              <span className="text-xs font-medium block" style={{ color: themeColor }}>To</span>
              <button
                type="button"
                onClick={(e) => {
                  setFromAnchorEl(null);
                  setToAnchorEl(toAnchorEl ? null : e.currentTarget);
                }}
                className={cn(
                  'flex items-center gap-1.5 w-[11rem] h-9 px-3 rounded-md border bg-white text-sm text-slate-700 text-left transition-all',
                  toAnchorEl
                    ? 'border-[var(--brand)] ring-2 ring-[var(--brand)]/20'
                    : 'border-slate-200 hover:border-[var(--brand)] hover:bg-slate-50'
                )}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3.5 w-3.5 shrink-0 text-[var(--brand)]">
                  <rect x="2" y="3" width="12" height="11" rx="2"/>
                  <path d="M5 1v3M11 1v3M2 7h12"/>
                </svg>
                <span className={dateTo ? 'text-slate-700' : 'text-slate-400'}>
                  {dateTo ? format(parseISO(dateTo), 'dd MMM yyyy') : 'Pick date'}
                </span>
              </button>
            </div>
 
          </div>
          <div className="relative flex-1 min-w-[180px]">
            <SearchIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              ref={filterInputRef}
              placeholder="Filter by client, position…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(
                'pl-8 bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-[var(--brand)]/25',
                isDashboard && 'h-9 text-xs w-[25rem]'
              )}
              aria-label="Filter requirement rows"
            />
          </div>
            <Badge
              variant="secondary"
              className="bg-white border border-slate-200 text-xs"
              style={{ color: themeColor }}
            >
              {loading ? '…' : `${filtered.length} in view`}
            </Badge>

            {/* ── Refresh ── */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'border-slate-200 hover:bg-slate-50 bg-white',
                isDashboard && 'h-7 px-2 text-xs'
              )}
              style={{ color: themeColor }}
              onClick={load}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {!isDashboard && <span className="ml-1.5">Refresh</span>}
            </Button>

            {/* ── Clear (only when filters are active) ── */}
            {hasFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  'border-red-200 hover:bg-red-50 bg-white text-red-600',
                  isDashboard && 'h-7 px-2 text-xs'
                )}
                onClick={clearFilters}
                disabled={loading}
              >
                <FilterX className="h-3.5 w-3.5" />
                {!isDashboard && <span className="ml-1.5">Clear</span>}
              </Button>
            )}

            {/* ── Export ── */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'border-slate-200 hover:bg-slate-50 bg-white',
                isDashboard && 'h-7 px-2 text-xs'
              )}
              style={{ color: themeColor }}
              onClick={exportCsv}
              disabled={loading || filtered.length === 0}
            >
              <Download className="h-3.5 w-3.5" />
              {!isDashboard && <span className="ml-1.5">Export</span>}
            </Button>
          </div>
      </CardHeader>

      {/* ── Content ── */}
      <CardContent className="p-0 flex flex-col flex-1 min-h-0 w-full overflow-x-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)rand)]" />
            <span className="text-sm">Loading requirements…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 px-4 text-center">
            <p className="text-sm text-destructive max-w-md">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={load}
              style={{ color: themeColor }}
            >
              Try again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-sm text-muted-foreground px-4">
            {rows.length === 0 ? 'No requirement records found.' : 'No rows match your filter.'}
          </div>
        ) : (
          <div className={cn('w-full', isDashboard ? 'px-3 py-2' : 'px-4 py-3')}>
            <DataTable<RequirementRow, unknown>
              columns={columns}
              data={filtered}
              tableName="requirementPriorities"
              preferences={{}}
              initialSorting={[{ id: 'priority', desc: false }]}
              minHeightPx={isDashboard ? 200 : 360}
              scrollMaxHeight={isDashboard ? 'min(480px, 58vh)' : undefined}
              afterTableContent={
                <div className="py-2 text-center text-xs text-slate-400 border-t border-gray-100 bg-white">
                  All {filtered.length} record{filtered.length !== 1 ? 's' : ''} loaded.
                </div>
              }
            />
          </div>
        )}
      </CardContent>
            {/* ── From date portal picker ── */}
      {fromAnchorEl && (
        <PortalPicker
          type="date"
          value={dateFrom}
          anchorEl={fromAnchorEl}
          onChange={setDateFrom}
          allowPastDates={true}
          maxDate={dateTo || undefined} 
          onSave={() => setFromAnchorEl(null)}
          onCancel={() => setFromAnchorEl(null)}
        />
      )}
 
      {/* ── To date portal picker ── */}
      {toAnchorEl && (
        <PortalPicker
          type="date"
          value={dateTo}
          anchorEl={toAnchorEl}
          onChange={setDateTo}
          allowPastDates={true}
          minDate={dateFrom || undefined}
          onSave={() => setToAnchorEl(null)}
          onCancel={() => setToAnchorEl(null)}
        />
      )}
    </Card>
  );
};

export default RequirementPrioritiesPanel;
