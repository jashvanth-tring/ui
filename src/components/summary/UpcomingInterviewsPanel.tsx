import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import { Loader2, SearchIcon, Upload } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { fetchUpcomingInterviews , updateInterviewDate } from '../../store/services/round';
import type { UpcomingInterviewRow } from '../../store/model/round.types';
import { RootState } from '../../store/reducers';
import { AppDispatch, useAppSelector } from '../../store';
import { fetchTablePreference } from '../../store/action/table-preference.action';
import { cn } from '../../lib/utils';
import { DataTable } from '../customized-table';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { PortalPicker } from '../ui/date-time-portal-picker';
import { FaRegSave } from 'react-icons/fa';
import {  EditIcon,  } from 'lucide-react';
import { toPascalCase } from '../../utils/name-format';
function formatInterviewTime(iso: string): string {
  try {
    return format(parseISO(iso), 'h:mm a');
  } catch {
    return '—';
  }
}

function formatInterviewDate(iso: string): string {
  try {
    return format(parseISO(iso), 'EEE, MMM d, yyyy');
  } catch {
    return '—';
  }
}

function parseInterviewMs(iso: string): number {
  try {
    return parseISO(iso).getTime();
  } catch {
    return 0;
  }
}

 
/** Convert ISO string → "yyyy-MM-dd" for <input type="date"> */
function toDateInputValue(iso: string): string {
  try {
    return format(parseISO(iso), 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

function isPastTwoHours(iso: string): boolean {
  try {
    const iv = parseISO(iso).getTime();
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    return iv < twoHoursAgo;
  } catch {
    return false;
  }
}
 
/** Convert ISO string → "HH:mm" for <input type="time"> */
function toTimeInputValue(iso: string): string {
  try {
    return format(parseISO(iso), 'HH:mm');
  } catch {
    return '';
  }
}
 
/** Merge a new date string (yyyy-MM-dd) into an existing ISO, keeping the time part */
function mergeDateIntoIso(existingIso: string, newDate: string): string {
  try {
    const existing = parseISO(existingIso);
    const [y, m, d] = newDate.split('-').map(Number);
    existing.setFullYear(y, m - 1, d);
    return existing.toISOString();
  } catch {
    return existingIso;
  }
}
 
/** Merge a new time string (HH:mm) into an existing ISO, keeping the date part */
function mergeTimeIntoIso(existingIso: string, newTime: string): string {
  try {
    const existing = parseISO(existingIso);
    const [h, m] = newTime.split(':').map(Number);
    existing.setHours(h, m, 0, 0);
    return existing.toISOString();
  } catch {
    return existingIso;
  }
}

function InterviewTypeBadge({ value }: { value: string }) {
  const t = String(value ?? '').trim().toLowerCase();
  if (t === 'internal') {
    return (
      <Badge
        variant="outline"
        className="text-xs font-medium border-emerald-200 bg-emerald-50 text-emerald-900 font-medium"
      >
        Internal
      </Badge>
    );
  }
  if (t === 'client') {
    return (
      <Badge
        variant="outline"
        className="border-sky-200 bg-sky-50 text-sky-900 font-medium"
      >
        Client
      </Badge>
    );
  }
  if (t === 'external') {
    return (
      <Badge
        variant="outline"
        className="border-violet-200 bg-violet-50 text-violet-900 font-medium"
      >
        External
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground font-normal">
      {value?.trim() || '—'}
    </Badge>
  );
}

function LevelBadge({ level }: { level: string }) {
  const text = String(level ?? '').trim() || '—';
  return (
    <Badge
      variant="outline"
      className="border-slate-200 bg-slate-100 text-slate-800 font-medium text-xs rounded-md"
    >
      {text}
    </Badge>
  );
}

export type UpcomingInterviewsPanelVariant = 'page' | 'dashboard';
export type InterviewFilter = 'today' | 'upcoming' | 'unhandled';

export interface UpcomingInterviewsPanelProps {
  /** `dashboard` fits the home TA-TRACKER left column (scroll inside card). */
  variant?: UpcomingInterviewsPanelVariant;
  className?: string;
  /** Headings / table accent (dashboard uses `var(--brand)`). */
  themeColor?: string;
}

const UPCOMING_INTERVIEWS_TABLE = 'upcomingInterviews';

export const UpcomingInterviewsPanel: React.FC<UpcomingInterviewsPanelProps> = ({
  variant = 'page',
  className,
  themeColor: themeColorProp,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const preferences = useAppSelector((s: RootState) => s?.tablePreference?.preferences ?? {});
  const themeColor = themeColorProp ?? (variant === 'dashboard' ? 'var(--brand)' : 'var(--brand)');
  const isDashboard = variant === 'dashboard';
  const filterInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<UpcomingInterviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeFilter, setActiveFilter] = useState<InterviewFilter>('today');
  // ── Inline edit state ─────────────────────────────────────────────────────
  // key: `${rowId}-date` | `${rowId}-time`
 const [editingRowId, setEditingRowId] = useState<string | number | null>(null);
const [editingCell, setEditingCell] = useState<'date' | 'time' | null>(null);
const [editingValue, setEditingValue] = useState<string>('');
const [savingCell, setSavingCell] = useState<string | null>(null);
const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
const [pendingEdits, setPendingEdits] = useState<Record<string | number, { interviewAt: string }>>({});
const hasUnsavedChanges = editingRowId != null && pendingEdits[editingRowId] != null;
// ── From/To date picker state ─────────────────────────────────────────────
const [fromAnchorEl, setFromAnchorEl] = useState<HTMLElement | null>(null);
const [toAnchorEl,   setToAnchorEl]   = useState<HTMLElement | null>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      dispatch(fetchTablePreference(UPCOMING_INTERVIEWS_TABLE));
    });
    return () => cancelAnimationFrame(id);
  }, [dispatch]);

  const load = useCallback(async () => {
  setError(null);
  setLoading(true);
  try {
    const { data: res } = await fetchUpcomingInterviews({
        filter: activeFilter,
        ...(dateFrom && { from: dateFrom }),
        ...(dateTo   && { to: dateTo }),
      });
      const data = res?.data;
      const list = Array.isArray(data) ? data : [];
      // unhandled → most recent missed first; others → soonest first
      list.sort((a, b) => {
        const diff = parseInterviewMs(a.interviewAt) - parseInterviewMs(b.interviewAt);
        return activeFilter === 'unhandled' ? -diff : diff;
      });
      setRows(list);
    } catch {
      setRows([]);
      setError('Could not load upcoming interviews. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, activeFilter]); 

  useEffect(() => {
    void load();
  }, [load]);
  const editingValueRef = useRef<string>('');
  const setEditingValueSync = (v: string) => {
    editingValueRef.current = v;
    setEditingValue(v);
  };
  const { user } = useAppSelector((s: RootState) => s?.authSelector);
    // ── Inline edit handlers ──────────────────────────────────────────────────
 const startEdit = (_rowId: string | number, field: 'date' | 'time', currentIso: string, e: React.MouseEvent<HTMLButtonElement>) => {
  setEditingCell(field);
  setEditingValueSync(field === 'date' ? toDateInputValue(currentIso) : toTimeInputValue(currentIso));
    const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();

  // Reuse or create proxy
  let proxy = document.getElementById('__picker-anchor-proxy__') as HTMLElement | null;
  if (!proxy) {
    proxy = document.createElement('div');
    proxy.id = '__picker-anchor-proxy__';
    proxy.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: -1;
      width: ${rect.width}px;
      height: ${rect.height}px;
    `;
    document.body.appendChild(proxy);
  }

  proxy.style.top  = `${rect.top}px`;
  proxy.style.left = `${rect.left}px`;
  proxy.style.width  = `${rect.width}px`;
  proxy.style.height = `${rect.height}px`;

  setAnchorEl(proxy);  // ← store the button element directly
};
  const removeProxy = () => {
  const proxy = document.getElementById('__picker-anchor-proxy__');
  if (proxy) proxy.remove();
};

const cancelEdit = () => {
  editingValueRef.current = '';
  setEditingCell(null);
  setEditingValue('');
  setAnchorEl(null);  // ← was setPickerPos(null)
  removeProxy();  
};

const discardRowEdit = useCallback(() => {
  if (editingRowId) {
    // Revert optimistic UI changes for the abandoned row
    setPendingEdits((prev) => {
      const next = { ...prev };
      delete next[editingRowId];
      return next;
    });
    // Revert the row display back to original server data
    setRows((prev) =>
      prev.map((r) => {
        // We need to reload original — simplest: just reload from server on discard
        // OR store originals. For now, we skip revert (pending edit is just cleared)
        return r;
      })
    );
  }
  setEditingRowId(null);
  setEditingCell(null);
  editingValueRef.current = '';
  setEditingValue('');
  setAnchorEl(null)
   removeProxy();
}, [editingRowId, pendingEdits]);

const saveRowEdit = useCallback(async () => {
  const rowId = editingRowId;

  setEditingRowId(null);
  setEditingCell(null);
  setEditingValue('');
  setAnchorEl(null)
  removeProxy();

  if (!rowId || !pendingEdits[rowId]) return;

  const { interviewAt: newIso } = pendingEdits[rowId];
  const row = rows.find((r) => String(r.roundId) === String(rowId));
  if (!row) return;

  setPendingEdits((prev) => {
    const next = { ...prev };
    delete next[rowId];
    return next;
  });

  setSavingCell(String(rowId));
  try {
    await updateInterviewDate(row.roundId, {
      interviewDate: newIso,
      updatedBy: { id: user?.id },
    });
    void load();
  } catch {
    setRows((prev) =>
      prev.map((r) =>
        r.roundId === row.roundId ? { ...r, interviewAt: row.interviewAt } : r
      )
    );
  } finally {
    setSavingCell(null);
  }
}, [editingRowId, pendingEdits, rows, user, load]);
 
  const commitEdit = (row: UpcomingInterviewRow, field: 'date' | 'time') => {
    const val = editingValueRef.current;
  if (!val) { cancelEdit(); return; }

  // Use already-pending ISO if user edited both date and time
  const currentIso = pendingEdits[row.roundId]?.interviewAt ?? row.interviewAt;
  const newIso = field === 'date'
    ? mergeDateIntoIso(currentIso, val)
    : mergeTimeIntoIso(currentIso, val);

  // Store for single API call on Done
  setPendingEdits((prev) => ({
    ...prev,
    [row.roundId]: { interviewAt: newIso },
  }));

  cancelEdit();
};

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.candidateName,
        r.clientOrAccountName,
        r.positionName,
        r.interviewType,
        r.level,
        formatInterviewDate(r.interviewAt),
        r.recruiterName,
        r.createdBy,
        formatInterviewTime(r.interviewAt),
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [rows, query]);

  const columns = useMemo<ColumnDef<UpcomingInterviewRow>[]>(
    () => [
      {
        id: 'serial',
        header: 'S.No',
        enableSorting: false,
        enableHiding: false,
        size: 60,
         cell: ({ row, table }) => {
        // Get the actual position from the sorted+filtered rows TanStack is rendering
        const sortedRows = table.getSortedRowModel().rows;
        const position = sortedRows.findIndex((r) => r.id === row.id);
        return (
          <span className="text-muted-foreground tabular-nums text-sm">
            {position + 1}
          </span>
        );
      }
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
        header: 'Client Name ',
        size: 120,
        cell: ({ row }) => {
          const v = row.original.clientOrAccountName;
          return (
            <span title={v} className="text-slate-700 text-sm">
              {v ? toPascalCase(v) : '—'}
            </span>
          );
        },
      },
      {
        accessorKey: 'positionName',
        header: 'Position',
        size: 160,
        cell: ({ row }) => {
          const v = row.original.positionName;
          return (
            <span title={v} className="text-slate-700 text-sm">
              {v ? toPascalCase(v) : '—'}
            </span>
          );
        },
      },
      {
        accessorKey: 'recruiterName',
        header: 'Account Manager',
        size: 140,
        cell: ({ row }) => (
          <span title={row.original.createdBy} className="text-slate-700 text-sm">
            {row.original.recruiterName}
          </span>
        ),
      },
      {
        accessorKey: 'interviewType',
        header: 'Interview',
        size: 100,
        cell: ({ row }) => <InterviewTypeBadge value={row.original.interviewType} />,
      },
      {
        accessorKey: 'level',
        header: 'Level',
        size: 72,
        cell: ({ row }) => <LevelBadge level={row.original.level} />,
      },
     
      {
        // ── Inline-editable Date column ───────────────────────────────────
        id: 'interviewDate',
        accessorFn: (row) => parseInterviewMs(row.interviewAt),
        header: 'Scheduled Date',
        size: 150,
        cell: ({ row }) => {
          const r = row.original;
          const isRowEditing = editingRowId === r.roundId;
          const isSaving = savingCell === `${r.roundId}-date`;
           return (
            <button
              type="button"
              title={isRowEditing ? 'Click to edit date' : 'Enable edit mode from Actions column'}
              onClick={(e) => startEdit(r.roundId, 'date', r.interviewAt, e)}
               className={cn(
              'group flex items-center gap-1.5 whitespace-nowrap w-full text-left rounded px-2 transition-colors',  // ← px-2, remove -mx-1
              isRowEditing
              ? 'text-slate-700 text-sm hover:bg-slate-50 hover:text-slate-900 cursor-pointer ring-1 ring-[var(--brand)rand)]/20 rounded-md bg-slate-50'
              : 'text-slate-600 cursor-default pointer-events-none'
            )}
            >
              {/* Calendar icon */}
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className={cn('h-3.5 w-3.5 shrink-0', isRowEditing ? 'text-[var(--brand)]' : 'text-slate-400')}>
                <rect x="2" y="3" width="12" height="11" rx="2" />
                <path d="M5 1v3M11 1v3M2 7h12" />
              </svg>

              <span>{formatInterviewDate(pendingEdits[r.roundId]?.interviewAt ?? r.interviewAt)}</span>

          
              {isSaving && <Loader2 className="h-3 w-3 animate-spin shrink-0 text-[var(--brand)]" />}
            </button>
          );
 
        }
      },  
              {
              // ── Inline-editable Time column ───────────────────────────────────
                id: 'interviewTime',
                header: 'Scheduled Time',
                enableSorting: true,
                size: 130,
                cell: ({ row }) => {
                  const r = row.original;
                  const isRowEditing = editingRowId === r.roundId;
                  const isSaving = savingCell === `${r.roundId}-time`;


                return (
                  <button
                    type="button"
                    title={isRowEditing ? 'Click to edit time' : 'Enable edit mode from Actions column'}
                    onClick={(e) => startEdit(r.roundId, 'time', r.interviewAt, e)}
                    className={cn(
                      'group flex items-center gap-1.5 font-medium tabular-nums whitespace-nowrap w-full text-left rounded px-2 transition-colors',
                      isRowEditing
                        ? 'text-[var(--brand)] hover:bg-slate-50 cursor-pointer ring-1 ring-[var(--brand)]/20 rounded-md bg-slate-50'
                        : 'text-[var(--brand)rand)rand)] cursor-default pointer-events-none'
                    )}
                  >
                    {/* Clock icon */}
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}
                      className={cn('h-3.5 w-3.5 shrink-0', isRowEditing ? 'text-[var(--brand)]' : 'text-slate-400')}>
                      <circle cx="8" cy="8" r="6"/>
                      <path d="M8 5v3.5l2.5 1.5"/>
                    </svg>

                    <span>{formatInterviewTime(pendingEdits[r.roundId]?.interviewAt ?? r.interviewAt)}</span>
                    {isSaving && <Loader2 className="h-3 w-3 animate-spin shrink-0 text-[var(--brand)]"/>}
                  </button>
                );
               },
              },
      {
        accessorKey: 'Recruiter',
        header: 'Recruiter',
        size: 140,
        cell: ({ row }) => (
          <span title={row.original.createdBy} className="text-slate-700 text-sm">
            {row.original.createdBy}
          </span>
        ),
      },
          {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        enableHiding: false,
        size: 72,
        cell: ({ row }) => {
          const r = row.original;
          const isRowEditing = editingRowId === r.roundId;

// CHANGE the isRowEditing return block in actions cell:
          if (isRowEditing) {
            const isSavingRow = savingCell === String(r.roundId);
            return (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="Cancel"
                  onClick={() => discardRowEdit()}
                  className="p-1 hover:bg-slate-100 rounded transition-colors"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}
                    className="h-3.5 w-3.5">
                    <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/>
                  </svg>
                </button>
                <button
                  type="button"
                  title={hasUnsavedChanges ? 'Save changes' : 'Make a change first'}
                  onClick={() => void saveRowEdit()}
                  disabled={isSavingRow || !hasUnsavedChanges}
                  className={cn(
                  'p-1 transition-colors',
                  hasUnsavedChanges
                    ? 'text-[var(--brand)] hover:text-[#253750] cursor-pointer'
                    : 'text-slate-300 cursor-not-allowed'
                )}
                >
                  {isSavingRow ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FaRegSave className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            );
          }

          return (
            <button
              type="button"
              title="Edit"
              disabled={hasUnsavedChanges}  // ← disabled when another row has unsaved changes
              onClick={() => {
                discardRowEdit();
                setEditingRowId(r.roundId);
              }}
              className="p-1 text-slate-500 hover:text-[var(--brand)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <EditIcon
                      className="w-4 h-4 cursor-pointer text-blue-500 hover:scale-110 transition-transform"
                    />
            </button>
          );
        },
      },
    ],
    [editingCell, editingValue, savingCell, editingRowId, pendingEdits, saveRowEdit, discardRowEdit]
  );

  const exportCsv = () => {
    const headers = [
      'S.No',
      'Candidate Name',
      'Client',
      'Position',
      'Interview',
      'Level',
      'Scheduled Date',
      'Scheduled Time',
      'Recruiter',
    ];
    const data = [...filtered].sort(
      (a, b) => parseInterviewMs(a.interviewAt) - parseInterviewMs(b.interviewAt)
    );
    let n = 1;
    const lines = data.map((r) =>
      [
        n++,
        r.candidateName,
        r.clientOrAccountName,
        r.positionName,
        r.interviewType,
        r.level,
        formatInterviewDate(r.interviewAt),
        formatInterviewTime(r.interviewAt),
        r.recruiterName,
      ]
        .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = `${headers.join(',')}\n${lines.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `upcoming-interviews-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const [filterDropdownAnchor, setFilterDropdownAnchor] = useState<HTMLElement | null>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
  const today = new Date().toISOString().slice(0, 10);
    if (activeFilter === 'today') {
      setDateFrom(today);
      setDateTo(today);
    } else {
      setDateFrom('');
      setDateTo('');
    }
  }, [activeFilter]);
  // Close on outside click
  useEffect(() => {
    if (!filterDropdownAnchor) return;
    const handler = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setFilterDropdownAnchor(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filterDropdownAnchor]);
  const isDisabled = activeFilter === 'today';

  return (
    <Card
      className={cn(
        'flex flex-col overflow-hidden',
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
          : 'py-3 px-4 sm:px-6 border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/90'
      )}
    >
      {/* ── Filters row ── */}
      <div className={cn('flex flex-wrap items-end gap-2', isDashboard ? 'mt-2' : 'mt-3')}>
        <div className="flex items-end gap-2">
          {/* From date */}
          <div className="space-y-1">
            <span className="text-xs font-medium block" style={{ color: themeColor }}>
              From
            </span>
            {/* From date */}
            <button
              type="button"
              onClick={(e) => {
                if (isDisabled) return;
                setToAnchorEl(null);
                setFromAnchorEl(fromAnchorEl ? null : e.currentTarget);
              }}
              className={cn(
                'flex items-center gap-1.5 w-[11rem] h-9 px-3 rounded-md border border-slate-200 bg-white text-sm transition-all text-left',
                isDisabled
                  ? 'opacity-40 cursor-not-allowed pointer-events-none'
                  : 'text-slate-700 hover:border-[var(--brand)] hover:bg-slate-50 cursor-pointer'
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

          {/* To date */}
          <div className="space-y-1">
            <span className="text-xs font-medium block" style={{ color: themeColor }}>
              To
            </span>
            <button
              type="button"
              onClick={(e) => {
                if (isDisabled) return;
                setFromAnchorEl(null);
                setToAnchorEl(toAnchorEl ? null : e.currentTarget);
              }}
              className={cn(
                'flex items-center gap-1.5 w-[11rem] h-9 px-3 rounded-md border border-slate-200 bg-white text-sm transition-all text-left',
                isDisabled
                  ? 'opacity-40 cursor-not-allowed pointer-events-none'
                  : 'text-slate-700 hover:border-[var(--brand)] hover:bg-slate-50 cursor-pointer'
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
        {/* ── Filter dropdown ── */}        {/* ← INSERT HERE */}
        <div className="relative" ref={filterDropdownRef}>
          <button
            type="button"
            onClick={(e) => {
              setFilterDropdownAnchor(filterDropdownAnchor ? null : e.currentTarget);
            }}
            className="flex items-center gap-2 h-9 pl-3 pr-2.5 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}
              className="h-3.5 w-3.5 shrink-0 text-[var(--brand)]">
              <rect x="2" y="3" width="12" height="11" rx="2"/>
              <path d="M5 1v3M11 1v3M2 7h12"/>
            </svg>
            <span>
              Filter:{' '}
              <span className="text-slate-800 font-semibold">
                {activeFilter === 'today' ? 'Today' : activeFilter === 'upcoming' ? 'Upcoming' : 'Unhandled'}
              </span>
            </span>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}
              className={cn('h-3.5 w-3.5 text-slate-400 transition-transform', filterDropdownAnchor && 'rotate-180')}>
              <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {filterDropdownAnchor && (
            <div className="absolute left-0 top-full mt-1 z-50 w-40 rounded-lg border border-slate-200 bg-white shadow-lg py-1 overflow-hidden">
              {(
                [
                  { key: 'today',     label: 'Today',     dot: 'bg-blue-500'    },
                  { key: 'upcoming',  label: 'Upcoming',  dot: 'bg-emerald-500' },
                  { key: 'unhandled', label: 'Unhandled', dot: 'bg-red-500'     },
                ] as { key: InterviewFilter; label: string; dot: string }[]
              ).map(({ key, label, dot }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setActiveFilter(key);
                    setDateFrom('');
                    setDateTo('');
                    setFilterDropdownAnchor(null);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left',
                    activeFilter === key
                      ? 'bg-[var(--brand)]/8 text-[var(--brand)] font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', activeFilter === key ? 'bg-[var(--brand)]' : dot)} />
                  {label}
                  {activeFilter === key && (
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5}
                      className="ml-auto h-3 w-3 shrink-0">
                      <path d="M3 8l3.5 3.5L13 4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

    {/* ── From date picker ── */}
    {fromAnchorEl && (
      <PortalPicker
        type="date"
        value={dateFrom}
        anchorEl={fromAnchorEl}
        onChange={setDateFrom}
        allowPastDates={true}
         minDate={
          activeFilter === 'upcoming'
            ? new Date(Date.now() + 86400000).toISOString().slice(0, 10) 
            : undefined
        }
        maxDate={
          activeFilter === 'unhandled'
            ? new Date(Date.now() - 86400000).toISOString().slice(0, 10) 
            : dateTo || undefined
        }
        onSave={() => setFromAnchorEl(null)}
        onCancel={() => setFromAnchorEl(null)}
      />
    )}

    {/* ── To date picker ── */}
    {toAnchorEl && (
      <PortalPicker
        type="date"
        value={dateTo}
        anchorEl={toAnchorEl}
        onChange={setDateTo}
        allowPastDates={true}
        minDate={
          activeFilter === 'upcoming'
            ? dateFrom || new Date(Date.now() + 86400000).toISOString().slice(0, 10) 
            : undefined
        }
        maxDate={
          activeFilter === 'unhandled'
            ? new Date(Date.now() - 86400000).toISOString().slice(0, 10) 
            : undefined
        }
        onSave={() => setToAnchorEl(null)}
        onCancel={() => setToAnchorEl(null)}
      />
    )}
        <div className="relative flex-1 min-w-[180px]">
          <SearchIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            ref={filterInputRef}
            placeholder="Filter by candidate, client, position, recruiter…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={cn(
                'pl-8 bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-offset-0',
                isDashboard && 'h-9 text-xs w-[25rem]'
              )}
            aria-label="Filter upcoming interviews"
          />
        </div>
        <div className="flex justify-end gap-2 flex-wrap">
          <Badge
            variant="secondary"
            className="bg-white border border-slate-200 text-xs"
            style={{ color: themeColor }}
          >
            {loading ? '…' : `${filtered.length} in view`}
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
                'border-slate-200 bg-white hover:bg-slate-50',
                isDashboard && 'h-7 px-2 text-xs'
              )}
              style={{ color: themeColor }}
            onClick={exportCsv}
            disabled={loading || filtered.length === 0}
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="ml-2">Export</span>
          </Button>
        </div>
      </div>
    </CardHeader>

      <CardContent
        className={cn('p-0 flex flex-col flex-1 min-h-0 w-full overflow-x-auto', isDashboard && 'min-h-0')}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin text-[var(--brand)]" />
            <span className="text-sm">Loading schedule…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 px-4 text-center">
            <p className="text-sm text-destructive max-w-md">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void load()}
              style={{ color: themeColor }}
            >
              Try again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-sm text-muted-foreground px-4">
            {rows.length === 0
              ? activeFilter === 'today'
                ? 'No interviews scheduled for today.'
                : activeFilter === 'upcoming'
                ? 'No upcoming interviews found.'
                : 'No unhandled interviews found.'
              : 'No rows match your filter.'}
          </div>
        ) : (
          <div
            className={cn(
              'w-full',
              isDashboard ? 'px-3 py-2' : 'px-4 py-3'
            )}
          >
            <DataTable<UpcomingInterviewRow, unknown>
              columns={columns}
              data={filtered}
              tableName={UPCOMING_INTERVIEWS_TABLE}
              preferences={preferences}
              initialSorting={[{ id: 'interviewDate', desc: false }]}
              getRowClassName={(row) => {
                if (activeFilter === 'today' && isPastTwoHours(row.interviewAt)) {
                  return 'overdue-row bg-[rgb(254,234,231)] hover:bg-[rgb(254,234,232)]';  // ← updated
                }
                return '';
              }}
              defaultVisibility={{
                serial: true,
                candidateName: true,
                clientOrAccountName: true,
                positionName: true,
                interviewType: true,
                level: true,
                interviewDate: true,
                interviewTime: true,
                recruiterName: true,
                actions: true,
              }}
              minHeightPx={isDashboard ? 220 : 360}
              scrollMaxHeight={isDashboard ? 'min(520px, 62vh)' : undefined}
              afterTableContent={
                <div className="py-2 text-center text-xs text-slate-400 border-t border-gray-100 bg-white">
                  All {filtered.length} record{filtered.length !== 1 ? 's' : ''} loaded.
                </div>
              }
            />
          </div>
        )}
      </CardContent>
       {/* ── Floating portal picker — renders outside the table overflow ── */}
      {editingCell && anchorEl && editingRowId && (
        <PortalPicker
          type={editingCell}
          value={editingValue}
          anchorEl={anchorEl}
          onChange={(v) => {
            editingValueRef.current = v;
            setEditingValue(v);
          }}
          selectedDate={
            // Get the date part from the current row's interviewAt
            (() => {
              const row = rows.find((r) => String(r.roundId) === String(editingRowId));
              const iso = pendingEdits[editingRowId]?.interviewAt ?? row?.interviewAt ?? '';
              return iso ? new Date(iso).toLocaleDateString('en-CA') : '';
            })()
          }
          allowPastDates={true}     
          onSave={() => {
            const row = rows.find((r) => String(r.roundId) === String(editingRowId));
            if (row) commitEdit(row, editingCell);
          }}
          onCancel={cancelEdit}
        />
      )}
    </Card>
  );
};

export default UpcomingInterviewsPanel;
