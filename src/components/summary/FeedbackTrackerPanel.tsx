import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import { Download, Loader2, RefreshCw, SearchIcon } from 'lucide-react';
import { EditIcon } from 'lucide-react';
import { FaRegSave } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { fetchFeedbackTracker } from '../../store/action/round.action';
import { updateRejectReason } from '../../store/services/round';
import { FeedbackRow } from '../../store/model/feedbackTracker.types';
import type { RootState } from '../../store/reducers';
import { AppDispatch, useAppSelector } from '../../store';
import { fetchTablePreference } from '../../store/action/table-preference.action';
import { cn } from '../../lib/utils';
import { DataTable } from '../customized-table';
import { Card, CardContent, CardDescription, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { PortalPicker } from '../ui/date-time-portal-picker';

function formatInterviewTime(iso: string): string {
  try { return format(parseISO(iso), 'h:mm a'); } catch { return '—'; }
}
function formatInterviewDate(iso: string): string {
  try { return format(parseISO(iso), 'EEE, MMM d, yyyy'); } catch { return '—'; }
}
function parseInterviewMs(iso: string): number {
  try { return parseISO(iso).getTime(); } catch { return 0; }
}

export type FeedbackTrackerPanelVariant = 'page' | 'dashboard';
const FEEDBACK_TABLE = 'feedbackTracker';

export const FeedbackTrackerPanel = ({
  className,
  themeColor = 'var(--brand)',
  variant = 'page',
}: {
  className?: string;
  themeColor?: string;
  variant?: FeedbackTrackerPanelVariant;
}) => {
  const isDashboard = variant === 'dashboard';
  const dispatch = useDispatch<AppDispatch>();

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { user } = useAppSelector((s: RootState) => s?.authSelector);

  const preferences = useAppSelector((s: RootState) => s?.tablePreference?.preferences ?? {});
  useEffect(() => {
    const id = requestAnimationFrame(() => dispatch(fetchTablePreference(FEEDBACK_TABLE)));
    return () => cancelAnimationFrame(id);
  }, [dispatch]);

  const rows    = useAppSelector((s: RootState) => s.roundsSelector.feedbackRows);
  const loading = useAppSelector((s: RootState) => s.roundsSelector.feedbackLoading);
  const error   = useAppSelector((s: RootState) => s.roundsSelector.feedbackError);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo  ] = useState('');
  const [query,    setQuery   ] = useState('');
  const filterInputRef = useRef<HTMLInputElement>(null);
   // ── From / To picker anchor state ─────────────────────────────────────────
  const [fromAnchorEl, setFromAnchorEl] = useState<HTMLElement | null>(null);
  const [toAnchorEl,   setToAnchorEl  ] = useState<HTMLElement | null>(null);

  // ── Inline edit state — same pattern as UpcomingInterviewsPanel ──────────
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [savingRowId,  setSavingRowId ] = useState<number | null>(null);
  // pendingEdits tracks whether the user has actually changed the value
  const [pendingEdits, setPendingEdits] = useState<Record<number, { rejectReason: string }>>({});

  const hasUnsavedChanges = editingRowId != null && pendingEdits[editingRowId] != null;

  // ── Data loading ──────────────────────────────────────────────────────────
  const load = useCallback(() => {
    let from = dateFrom.trim();
    let to   = dateTo.trim();
    if (from && to && from > to) { [from, to] = [to, from]; }
    dispatch(fetchFeedbackTracker(from && to ? { from, to } : undefined));
  }, [dispatch, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  // ── Edit handlers ─────────────────────────────────────────────────────────
  const startRowEdit = useCallback((rowId: number, currentReason: string | null) => {
    setEditingRowId(rowId);
    setEditingValue(currentReason ?? '');
    // Don't set pendingEdits yet — only set it when user actually types
  }, []);

  const discardRowEdit = useCallback(() => {
    setPendingEdits((prev) => {
      const next = { ...prev };
      if (editingRowId != null) delete next[editingRowId];
      return next;
    });
    setEditingRowId(null);
    setEditingValue('');
  }, [editingRowId]);

  const saveRowEdit = useCallback(async () => {
    const rowId = editingRowId;
    if (!rowId || !user?.id) return;

    // Use pendingEdits value if set, otherwise use the current editingValue
    const valueToSave = pendingEdits[rowId]?.rejectReason ?? editingValue;

    // Clear edit state immediately (same as UpcomingInterviews)
    setEditingRowId(null);
    setEditingValue('');
    setPendingEdits((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });

    setSavingRowId(rowId);
    try {
      await updateRejectReason(rowId, {
        rejectReason: valueToSave,
        updatedBy: { id: user.id },
      });
      void load(); // reload to get fresh data from server
    } catch {
      void load(); // reload anyway to revert to server state on error
    } finally {
      setSavingRowId(null);
    }
  }, [editingRowId, editingValue, pendingEdits, user, load]);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r: FeedbackRow) =>
      [
        r.candidateName, r.clientOrAccountName, r.positionName,
        r.interviewType, r.level, r.recruiterName,
        r.feedBack, r.rejectReason ?? '', r.dayLabel,r.createdBy,
        formatInterviewDate(r.interviewAt ?? ''),
      ].join(' ').toLowerCase().includes(q)
    );
  }, [rows, query]);

  // ── CSV Export ────────────────────────────────────────────────────────────
  const exportCsv = () => {
    const headers = ['S.No','Candidate Name','Client','Position','Interview Type','Level','Date','Time','Day','Recruiter','Feedback','Rejection Reason'];
    const lines = [...filtered]
      .sort((a, b) => parseInterviewMs(a.interviewAt ?? '') - parseInterviewMs(b.interviewAt ?? ''))
      .map((r, i) =>
        [i+1, r.candidateName, r.clientOrAccountName, r.positionName, r.interviewType, r.level,
          formatInterviewDate(r.interviewAt ?? ''), formatInterviewTime(r.interviewAt ?? ''),
          r.dayLabel, r.recruiterName, r.feedBack, r.rejectReason ?? '']
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(',')
      );
    const blob = new Blob([`${headers.join(',')}\n${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: `feedback-tracker-${format(new Date(), 'yyyy-MM-dd')}.csv` }).click();
    URL.revokeObjectURL(url);
  };

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<FeedbackRow>[]>(() => [
    {
      id: 'serial',
      header: 'S.No',
      size: 60,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums text-sm">{row.index + 1}</span>
      ),
    },
    {
      accessorKey: 'candidateName',
      header: 'Candidate Name',
      size: 170,
      cell: ({ row }) => {
        const v = row.original.candidateName;
        return (
          <span className="font-semibold text-slate-900 tracking-tight text-sm" title={v}>
            {v.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
        );
      },
    },
    {
      accessorKey: 'clientOrAccountName',
      header: 'Client',
      size: 120,
      cell: ({ row }) => (
        <span className="capitalize text-slate-700 text-sm">{row.original.clientOrAccountName}</span>
      ),
    },
    {
      accessorKey: 'positionName',
      header: 'Position',
      size: 160,
      cell: ({ row }) => (
        <span className="capitalize text-slate-700 text-sm">{row.original.positionName}</span>
      ),
    },
    {
      accessorKey: 'interviewType',
      header: 'Interview',
      size: 100,
      cell: ({ row }) => {
        const t = row.original.interviewType?.toLowerCase();
        return (
          <Badge variant="outline" className={cn(
            'text-xs font-medium',
            t === 'client'   && 'border-sky-200 bg-sky-50 text-sky-800',
            t === 'internal' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
            t === 'external' && 'border-violet-200 bg-violet-50 text-violet-800',
          )}>
            {row.original.interviewType}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'level',
      header: 'Level',
      size: 72,
      cell: ({ row }) => (
        <Badge variant="outline" className="border-slate-200 bg-slate-100 text-slate-800 font-medium text-xs">
          {row.original.level}
        </Badge>
      ),
    },
    {
      id: 'interviewDate',
      accessorFn: (r) => parseInterviewMs(r.interviewAt ?? ''),
      header: 'Scheduled Date',
      size: 150,
      cell: ({ row }) => (
        <span className="text-slate-600 whitespace-nowrap text-sm">
          {formatInterviewDate(row.original.interviewAt ?? '')}
        </span>
      ),
    },
    {
      id: 'interviewTime',
      header: 'Scheduled Time',
      enableSorting: false,
      size: 130,
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums text-[var(--brand)] text-sm">
          {formatInterviewTime(row.original.interviewAt ?? '')}
        </span>
      ),
    },
    {
      accessorKey: 'recruiterName',
      header: 'Account Manager',
      size: 140,
      cell: ({ row }) => (
        <span className="text-slate-700 text-sm">{row.original.recruiterName}</span>
      ),
    },
    {
      accessorKey: 'feedBack',
      header: 'Status',
      size: 200,
      cell: ({ row }) => (
        <span className="text-slate-700 text-sm line-clamp-2" title={row.original.feedBack}>
          {row.original.feedBack || '—'}
        </span>
      ),
    },
    {
        accessorKey: 'createdBy',
        header: 'Recruiter',
        size: 140,
        cell: ({ row }) => (
          <span className="text-slate-700 text-sm line-clamp-2" title={row.original.createdBy ?? undefined}  >
          {row.original.createdBy || '—'}
        </span>
        ),
    },
    {
      // ── Inline-editable Rejection Reason ─────────────────────────────────
      accessorKey: 'rejectReason',
      header: 'Rejection Reason',
      size: 220,
      cell: ({ row }) => {
        const r = row.original;
        const isRowEditing = editingRowId === r.roundId;
        const isSaving     = savingRowId  === r.roundId;

        if (isSaving) {
          return (
            <div className="flex items-center gap-1.5 text-slate-400 text-sm px-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              <span>Saving…</span>
            </div>
          );
        }

        if (isRowEditing) {
          return (
            <input
              autoFocus
              type="text"
              value={editingValue}
              onChange={(e) => {
                setEditingValue(e.target.value);
                setPendingEdits((prev) => ({
                  ...prev,
                  [r.roundId]: { rejectReason: e.target.value },
                }));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter')  void saveRowEdit();
                if (e.key === 'Escape') discardRowEdit();
              }}
              placeholder="Enter rejection reason…"
              className={cn(
                'w-full rounded-md border border-[var(--brand)rand)]/30 bg-slate-50 px-2 py-1',
                'text-sm text-slate-800 outline-none',
                'focus:ring-2 focus:ring-[var(--brand)]/25 focus:border-[var(--brand)]/50',
                'transition-colors'
              )}
            />
          );
        }

        // ── Read-only display ────────────────────────────────────────────
        return (
          <span
            className="text-rose-600 text-sm line-clamp-2"
            title={r.rejectReason ?? ''}
          >
            {r.rejectReason || <span className="text-slate-400">—</span>}
          </span>
        );
      },
    },
    {
      // ── Actions column ────────────────────────────────────────────────────
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      enableHiding: false,
      size: 80,
      cell: ({ row }) => {
        const r = row.original;
        const isRowEditing = editingRowId === r.roundId;
        const isSavingRow  = savingRowId  === r.roundId;

        if (isRowEditing) {
          return (
            <div className="flex items-center gap-2">
              {/* Cancel */}
              <button
                type="button"
                title="Cancel"
                onClick={discardRowEdit}
                className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-500"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}
                  className="h-3.5 w-3.5">
                  <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
                </svg>
              </button>

              {/* Save */}
              <button
                type="button"
                title={hasUnsavedChanges ? 'Save changes' : 'Make a change first'}
                onClick={() => void saveRowEdit()}
                disabled={isSavingRow || !hasUnsavedChanges}
                className={cn(
                  'p-1 rounded transition-colors',
                  hasUnsavedChanges
                    ? 'text-[var(--brand)] hover:bg-slate-100 cursor-pointer'
                    : 'text-slate-300 cursor-not-allowed'
                )}
              >
                {isSavingRow
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <FaRegSave className="h-3.5 w-3.5" />
                }
              </button>
            </div>
          );
        }

        // ── Normal: Edit button ──────────────────────────────────────────
        return (
          <button
            type="button"
            title="Edit rejection reason"
            disabled={savingRowId != null}
            onClick={() => {
              discardRowEdit();
              startRowEdit(r.roundId, r.rejectReason ?? null);
            }}
            className="p-1 text-slate-500 hover:text-[var(--brand)rand)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <EditIcon className="w-4 h-4 text-blue-500 hover:scale-110 transition-transform" />
          </button>
        );
      },
    },
  ], [
    editingRowId, editingValue, savingRowId,
    pendingEdits, hasUnsavedChanges,
    saveRowEdit, discardRowEdit, startRowEdit,
  ]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Card className={cn(
      'flex flex-col',
      isDashboard
        ? 'h-full min-h-0 mb-0 border border-gray-100 shadow-sm rounded-lg'
        : 'rounded-sm shadow-lg border border-slate-200/80 mb-3',
      className
    )}>
      <CardHeader className={cn(
        'border-b shrink-0',
        isDashboard
          ? 'p-3 border-gray-100 bg-white'
          : 'py-4 px-4 sm:px-6 border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/90'
      )}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            {!isDashboard && (
              <CardDescription className="mt-0.5">
                Interview feedback and rejection reasons for the selected date range, earliest first.
              </CardDescription>
            )}
          </div>
        </div>

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
              placeholder="Filter by candidate, client, recruiter…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(
                'pl-8 bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-[var(--brand)]/25',
                isDashboard && 'h-9 text-xs w-[25rem]'
              )}
              aria-label="Filter feedback rows"
            />
          </div>

            <Badge
              variant="secondary"
              className="bg-white border border-slate-200 text-xs"
              style={{ color: themeColor }}
            >
              {loading ? '…' : `${filtered.length} in view`}
            </Badge>
            <Button type="button" variant="outline" size="sm"
              className={cn('border-slate-200 hover:bg-slate-50 bg-white', isDashboard && 'h-7 px-2 text-xs')}
              style={{ color: themeColor }}
              onClick={load} disabled={loading}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {!isDashboard && <span className="ml-1.5">Refresh</span>}
            </Button>
            <Button type="button" variant="outline" size="sm"
              className={cn('border-slate-200 hover:bg-slate-50 bg-white', isDashboard && 'h-7 px-2 text-xs')}
              style={{ color: themeColor }}
              onClick={exportCsv} disabled={loading || filtered.length === 0}
            >
              <Download className="h-3.5 w-3.5" />
              {!isDashboard && <span className="ml-1.5">Export</span>}
            </Button>
          </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col flex-1 min-h-0 w-full overflow-x-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
            <span className="text-sm">Loading feedback…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 px-4 text-center">
            <p className="text-sm text-destructive max-w-md">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={load} style={{ color: themeColor }}>
              Try again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-sm text-muted-foreground px-4">
            {rows.length === 0 ? 'No feedback records in this date range.' : 'No rows match your filter.'}
          </div>
        ) : (
          <div className={cn('w-full', isDashboard ? 'px-3 py-2' : 'px-4 py-3')}>
            <DataTable<FeedbackRow, unknown>
              columns={columns}
              data={filtered}
              tableName={FEEDBACK_TABLE}
              preferences={preferences}
              initialSorting={[{ id: 'interviewDate', desc: false }]}
              minHeightPx={isDashboard ? 200 : 360}
              scrollMaxHeight={isDashboard ? 'min(480px, 58vh)' : undefined}
              defaultVisibility={{
                serial: true, candidateName: true, clientOrAccountName: true,
                positionName: true, interviewType: true, level: true,
                interviewDate: true, interviewTime: true, dayLabel: true,
                recruiterName: true, feedBack: true, rejectReason: true,
                actions: true,
              }}
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

export default FeedbackTrackerPanel;