import { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Upload } from 'lucide-react';
import { CustomDatePicker } from '../../components/ui/custom-date-picker';
import toast from 'react-hot-toast';
import 'react-day-picker/dist/style.css';
import { LayoutContainer } from '../../styles/LayoutContainer';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea';
import { ChevronDown, Users } from 'lucide-react';

import {
  connectDailyTrackerStream,
  DailyTrackerData,
  exportDailyTracker,
  fetchDailyTracker,
  updateDailyTracker,
} from '../../store/services/daily-tracker';
import { useAppSelector } from '../../store';
import { RootState } from '../../store/reducers';

type TabKey = 'profiles' | 'interviews' | 'offers';
type SectionKey = 'profiles' | 'interviews' | 'offers';

type ColumnConfig = {
  key: string;
  label: string;
  min: number;
  width: number;
  align?: 'left' | 'center';
};

type GridCell = {
  content: React.ReactNode;
  colSpan?: number;
  rowSpan?: number;
  align?: 'left' | 'center';
  className?: string;
};

type ResizableGridProps = {
  title: string;
  accent: 'yellow' | 'blue' | 'green';
  sectionKey: SectionKey;
  columns: ColumnConfig[];
  headerRows?: GridCell[][];
  rows: GridCell[][];
  footerRows?: GridCell[][];
};

type EditableCellProps = {
  value: string;
  editing: boolean;
  multiline?: boolean;
  isSaving: boolean;
  onActivate: () => void;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
};

const ACCENT_STYLES: Record<
  ResizableGridProps['accent'],
  {
    banner: string;
    head: string;
    border: string;
    tab: string;
  }
> = {
  yellow: {
    banner: 'bg-[#fff200] text-slate-900',
    head: 'bg-[#fff200] text-slate-900',
    border: 'border-[#2f2f2f]',
    tab: 'data-[state=active]:bg-[#fff7bf]',
  },
  blue: {
    banner: 'bg-[#6d9eeb] text-slate-900',
    head: 'bg-[#6d9eeb] text-slate-900',
    border: 'border-[#2f2f2f]',
    tab: 'data-[state=active]:bg-[#dce9ff]',
  },
  green: {
    banner: 'bg-[#93c47d] text-slate-900',
    head: 'bg-[#93c47d] text-slate-900',
    border: 'border-[#2f2f2f]',
    tab: 'data-[state=active]:bg-[#e0f0d7]',
  },
};

const makeLocalYmd = (date: Date) => format(date, 'yyyy-MM-dd');

const parseLocalYmd = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatProfileCount = (value?: number | null) => {
  if (value == null) return '-';  
  if (value === 0) return 0;       
  return value;                   
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

function EditableCell({
  value,
  editing,
  multiline = true,
  isSaving,
  onActivate,
  onChange,
  onCommit,
  onCancel,
}: EditableCellProps) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!editing || !inputRef.current) return;
    inputRef.current.focus();
    const length = inputRef.current.value.length;
    inputRef.current.setSelectionRange(length, length);
  }, [editing]);

  if (editing) {
    return (
      <div className="relative">
        <Textarea
          ref={inputRef}
          value={value}
          rows={multiline ? 3 : 1}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              onCommit();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              onCancel();
            }
          }}
          className="min-h-[68px] resize-y rounded-sm border-slate-300 bg-white text-[12px] leading-5 shadow-none focus-visible:ring-1 focus-visible:ring-[var(--brand)]"
        />
        {isSaving ? (
          <span className="pointer-events-none absolute right-2 top-2 text-[10px] font-medium text-slate-500">
            Saving...
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onActivate}
      className="block min-h-[52px] w-full rounded-sm border border-transparent px-2 py-2 text-left text-[12px] leading-5 text-slate-700 transition hover:border-slate-300 hover:bg-white"
    >
      {value?.trim() ? value : <span className="text-slate-400">Click to edit</span>}
    </button>
  );
}

function ResizableGrid({
  title,
  accent,
  sectionKey,
  columns,
  headerRows,
  rows,
  footerRows = [],
}: ResizableGridProps) {
  const [widths, setWidths] = useState<Record<string, number>>(() =>
    Object.fromEntries(columns.map((column) => [column.key, column.width])),
  );

  useEffect(() => {
    setWidths((prev) => ({
      ...Object.fromEntries(columns.map((column) => [column.key, prev[column.key] ?? column.width])),
    }));
  }, [columns]);

  const startResize = (key: string, min: number, startX: number, startWidth: number) => {
    const handleMove = (event: MouseEvent) => {
      const next = Math.max(min, startWidth + event.clientX - startX);
      setWidths((prev) => ({ ...prev, [key]: next }));
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const palette = ACCENT_STYLES[accent];
  const resolvedHeaderRows: GridCell[][] =
    headerRows ??
    [
      columns.map((column) => ({
        content: column.label,
        align: column.align,
      })),
    ];

  return (
    <section className="space-y-0">
      <div
        className={`rounded-t-[18px] border-x border-t px-4 py-2 text-center text-[13px] font-semibold ${palette.banner} ${palette.border}`}
      >
        {title}
      </div>
      <div className={`rounded-b-[18px] border ${palette.border} bg-white shadow-sm overflow-hidden`}>
        <div className="overflow-x-auto overflow-y-hidden">
          <table
            className="w-max min-w-full border-collapse text-[12px]"
            style={{ tableLayout: 'fixed' }}
            data-section={sectionKey}
          >
            <colgroup>
              {columns.map((column) => (
                <col key={column.key} style={{ width: widths[column.key] }} />
              ))}
            </colgroup>
            <thead>
              {resolvedHeaderRows.map((row, rowIndex) => (
                <tr key={`header-${rowIndex}`} className={palette.head}>
                  {row.map((cell, cellIndex) => {
                    const columnIndex = rowIndex === 0 ? cellIndex : null;
                    const baseColumn = columnIndex !== null ? columns[columnIndex] : undefined;
                    return (
                      <th
                        key={`header-cell-${rowIndex}-${cellIndex}`}
                        colSpan={cell.colSpan}
                        rowSpan={cell.rowSpan}
                        className={`relative border border-[#2f2f2f] px-2 py-2 font-semibold ${
                          cell.align === 'left' ? 'text-left' : 'text-center'
                        } ${cell.className ?? ''}`}
                      >
                        <div className={baseColumn ? 'pr-3' : ''}>{cell.content}</div>
                        {baseColumn ? (
                          <button
                            type="button"
                            aria-label={`Resize ${baseColumn.label}`}
                            onMouseDown={(event) =>
                              startResize(
                                baseColumn.key,
                                baseColumn.min,
                                event.clientX,
                                widths[baseColumn.key],
                              )
                            }
                            className="absolute right-0 top-0 h-full w-2 cursor-col-resize bg-transparent"
                          />
                        ) : null}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={`row-${index}`}
                  className="bg-[#f7f7f7] even:bg-white hover:bg-[#f3f4f6]"
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`cell-${index}-${cellIndex}`}
                      colSpan={cell.colSpan}
                      rowSpan={cell.rowSpan}
                      className={`border border-[#2f2f2f] px-2 py-1.5 align-top ${
                        cell.align === 'left' ? 'text-left' : cell.align === 'center' ? 'text-center' : ''
                      } ${cell.className ?? ''}`}
                    >
                      {cell.content}
                    </td>
                  ))}
                </tr>
              ))}
              {footerRows.map((row, index) => (
                <tr key={`footer-${index}`} className="bg-[#f1f1f1] font-semibold">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`footer-cell-${index}-${cellIndex}`}
                      colSpan={cell.colSpan}
                      rowSpan={cell.rowSpan}
                      className={`border border-[#2f2f2f] px-2 py-1.5 align-top ${
                        cell.align === 'left' ? 'text-left' : cell.align === 'center' ? 'text-center' : ''
                      } ${cell.className ?? ''}`}
                    >
                      {cell.content}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default function DailyTrakerPage() {
  const currentUser = useAppSelector((state: RootState) => state.authSelector.user);
  const [selectedDate, setSelectedDate] = useState<string>(makeLocalYmd(new Date()));
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('profiles');
  const [tracker, setTracker] = useState<DailyTrackerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [editDrafts, setEditDrafts] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [userFilterOpen, setUserFilterOpen] = useState(false);
  const allTaUsersRef = useRef<Array<{ id: number; label: string }>>([]);

  useEffect(() => {
    let cancelled = false;

    const loadTracker = async () => {
      try {
        setLoading(true);
        const response = await fetchDailyTracker(
          selectedDate,
          selectedUserIds.length > 0 &&
          selectedUserIds.length < allTaUsersRef.current.length
            ? selectedUserIds         
            : undefined,               
        );
        setTracker(response.data);
        setEditDrafts(response.data.edits ?? {});
        setEditingKey(null);
        if (response.data.taUsers?.length) {
        allTaUsersRef.current = response.data.taUsers;
        setSelectedUserIds((prev) =>
          prev.length === 0
            ? response.data.taUsers.map((user) => user.id)
            : prev
        );
      }
      } catch {
        if (!cancelled) {
          toast.error('Failed to load daily tracker');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadTracker();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, selectedUserIds]);

  useEffect(() => {
    const source = connectDailyTrackerStream(selectedDate, async (payload) => {
      if (payload.type !== 'daily-tracker.updated') return;

      try {
        const response = await fetchDailyTracker(
          selectedDate,
          selectedUserIds.length > 0 &&
          selectedUserIds.length < allTaUsersRef.current.length
            ? selectedUserIds          
            : undefined,               
        );
        setTracker(response.data);
        setEditDrafts(response.data.edits ?? {});

        if (payload.actorUserId && payload.actorUserId !== currentUser?.id) {
          const actor = taUsers.find((u) => String(u.id) === String(payload.actorUserId));
          const name = actor?.label ?? 'A team member';
          toast(`Daily tracker updated by ${name}`, {
            duration: 3000,
            position: 'bottom-right',
          });
        }
      } catch (error) {
        console.error('Failed to refresh tracker from stream', error);
      }
    });

    return () => {
      source?.close();
    };
  }, [currentUser?.id, selectedDate]);

  const taUsers = useMemo(
    () => tracker?.taUsers ?? [],
    [tracker]
  );
  const displayDate = useMemo(() => parseLocalYmd(selectedDate), [selectedDate]);

  const currentCellValue = (key: string, fallbackValue: string) =>
    editDrafts[key] ?? tracker?.edits?.[key] ?? fallbackValue;

  const handleEditChange = (key: string, value: string) => {
    setEditDrafts((prev) => ({ ...prev, [key]: value }));
  };

  const commitEdit = async (key: string, fallbackValue: string) => {
    const nextValue = currentCellValue(key, fallbackValue);
    const currentValue = tracker?.edits?.[key] ?? fallbackValue;
    setEditingKey((prev) => (prev === key ? null : prev));
    if (currentValue === nextValue) return;

    try {
      setSavingKey(key);
      const response = await updateDailyTracker(selectedDate, { [key]: nextValue });
      setTracker(response.data);
      setEditDrafts(response.data.edits ?? {});
      toast.success('Tracker updated');
    } catch {
      toast.error('Failed to save tracker update');
      setEditDrafts((prev) => ({ ...prev, [key]: currentValue }));
    } finally {
      setSavingKey(null);
    }
  };

  const cancelEdit = (key: string, fallbackValue: string) => {
    setEditingKey(null);
    setEditDrafts((prev) => ({
      ...prev,
      [key]: tracker?.edits?.[key] ?? fallbackValue,
    }));
  };

  const editableCell = (key: string, fallbackValue: string) => (
    <EditableCell
      value={currentCellValue(key, fallbackValue)}
      editing={editingKey === key}
      isSaving={savingKey === key}
      onActivate={() => setEditingKey(key)}
      onChange={(value) => handleEditChange(key, value)}
      onCommit={() => void commitEdit(key, fallbackValue)}
      onCancel={() => cancelEdit(key, fallbackValue)}
    />
  );


  const handleExport = async () => {
      try {
        setExporting(true);

        const response = await exportDailyTracker(
          selectedDate,
          'xlsx',
          selectedUserIds.length > 0 ? selectedUserIds : undefined, // ← always passes if any selected
        );

      downloadBlob(response.data, `daily-tracker-${selectedDate}.xlsx`);
    } catch {
      toast.error('Failed to export XLSX');
    } finally {
      setExporting(false);
    }
  };

  const profileColumns: ColumnConfig[] = useMemo(
    () => [
      { key: 'client', label: 'Client', min: 120, width: 150, align: 'left' },
      { key: 'position', label: 'POSITION', min: 150, width: 185, align: 'left' },
      {
        key: 'totalProfilesShared',
        label: 'No. of profiles shared',
        min: 100,
        width: 120,
      },
      ...allTaUsersRef.current.map((user) => ({
        key: `ta-${user.id}`,
        label: user.label,
        min: 95,
        width: 110,
        isUnselected: !selectedUserIds.includes(user.id),
      })),
      { key: 'reqRemarks', label: 'Req Remarks', min: 220, width: 260, align: 'left' },
      { key: 'reqChallenges', label: 'Req Challenges', min: 220, width: 260, align: 'left' },
    ],
    [taUsers],
  );

  const interviewColumns: ColumnConfig[] = useMemo(
    () => [
      { key: 'client', label: 'Client', min: 120, width: 150, align: 'left' },
      { key: 'position', label: 'Position', min: 150, width: 185, align: 'left' },
      {
        key: 'interviewScheduled',
        label: 'No. of interview scheduled',
        min: 110,
        width: 130,
      },
      {
        key: 'interviewHappened',
        label: 'No. of interview happened',
        min: 110,
        width: 130,
      },
      ...taUsers.map((user) => ({
        key: `interview-ta-${user.id}`,
        label: user.label,
        min: 95,
        width: 110,
      })),
      {
        key: 'interviewRemarks',
        label: 'Interview Remarks',
        min: 220,
        width: 260,
        align: 'left',
      },
      {
        key: 'taExecutiveRemarks',
        label: 'TA Executive Remarks',
        min: 220,
        width: 260,
        align: 'left',
      },
    ],
    [taUsers],
  );

  const offerColumns: ColumnConfig[] = [
    { key: 'candidateName', label: 'Cand. Name', min: 180, width: 220, align: 'left' },
    { key: 'clientName', label: 'Client', min: 150, width: 170, align: 'left' },
    { key: 'positionName', label: 'Position', min: 180, width: 220, align: 'left' },
    { key: 'status', label: 'Status', min: 160, width: 180, align: 'left' },
    { key: 'doj', label: 'DOJ', min: 120, width: 140, align: 'left' },
  ];

  return (
    <LayoutContainer>
      <main>
        <div className="flex items-center justify-between mb-4">
          <div>
          <h1 className="text-xl font-semibold text-[var(--brand)]">Daily Tracker</h1>
          <p className="text-xs text-slate-400 mt-0.5">Click Remarks and Challenges to edit</p>
          </div>
  <div className="flex items-center gap-3">
    <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="min-w-[14rem] justify-start border-slate-300 bg-white text-[#0f2247] hover:bg-slate-50"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(displayDate, 'MMM dd, yyyy')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-xl border-slate-200 p-0 shadow-lg" align="end">
        <CustomDatePicker
          value={selectedDate}
          onChange={(v) => {
            setSelectedDate(v);
          }}
          onSave={() => {
            setDatePopoverOpen(false);
          }}
          onCancel={() => {
            setDatePopoverOpen(false);
          }}
          allowPastDates={true}
          maxDate={makeLocalYmd(new Date())}  
        />
      </PopoverContent>
    </Popover>

    {allTaUsersRef.current.length > 0 && activeTab !== 'offers' && (
    <Popover open={userFilterOpen} onOpenChange={setUserFilterOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="min-w-[10rem] justify-between border-slate-300 bg-white text-[#0f2247] hover:bg-slate-50"
        >
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {selectedUserIds.length === 0
              ? 'All TAs'
              : `${selectedUserIds.length} TA${selectedUserIds.length > 1 ? 's' : ''} selected`}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 rounded-xl border-slate-200 p-2 shadow-lg" align="end">
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 pb-1 border-b border-slate-100 mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Filter by TA
            </span>
            <button
              type="button"
              onClick={() =>
                selectedUserIds.length === allTaUsersRef.current.length
                  ? setSelectedUserIds([])
                  : setSelectedUserIds(allTaUsersRef.current.map((u) => u.id))
              }
              className="text-xs text-[var(--brand)] hover:underline"
            >
              {selectedUserIds.length === allTaUsersRef.current.length ? 'List all' : ''}
            </button>
          </div>

          {allTaUsersRef.current.map((user) => {
            const checked = selectedUserIds.includes(user.id);
            return (
              <label
                key={user.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    setSelectedUserIds((prev) =>
                      checked
                        ? prev.filter((id) => id !== user.id)
                        : [...prev, user.id],
                    );
                  }}
                  className="h-4 w-4 rounded border-slate-300 accent-[var(--brand)]"
                />
                {user.label}
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  )}

    <Button
      className="bg-[var(--brand)] hover:bg-[var(--brand)] text-white"
      disabled={exporting || loading}
      onClick={() => void handleExport()}
    >
      {exporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Upload className="mr-2 h-4 w-4" />
      )}
      Export
    </Button>
  </div>
</div>

        <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-[var(--brand)]" />
              </div>
            ) : !tracker ? (
              <div className="py-16 text-center text-slate-500">No tracker data available.</div>
            ) : (
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)}>
                <TabsList className="mb-5 h-auto rounded-xl bg-[#eef2f7] p-1 shadow-inner">
                  <TabsTrigger
                    value="profiles"
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 data-[state=active]:bg-white data-[state=active]:text-[var(--brand)] data-[state=active]:shadow-sm"
                  >
                    Profiles Shared
                  </TabsTrigger>
                  <TabsTrigger
                    value="interviews"
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 data-[state=active]:bg-white data-[state=active]:text-[var(--brand)] data-[state=active]:shadow-sm"
                  >
                    Interviews
                  </TabsTrigger>
                  <TabsTrigger
                    value="offers"
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 data-[state=active]:bg-white data-[state=active]:text-[var(--brand)] data-[state=active]:shadow-sm"
                  >
                    Offers & Joiners
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profiles" className="mt-0 space-y-4">
                  <ResizableGrid
                    title={format(displayDate, 'dd/MMM/yyyy')}
                    accent="yellow"
                    sectionKey="profiles"
                    headerRows={[
                      [
                        { content: 'Client', rowSpan: taUsers.length > 0 ? 2 : 1, align: 'left' },
                        { content: 'POSITION', rowSpan: taUsers.length > 0 ? 2 : 1, align: 'left' },
                        { content: 'No. of profiles shared', rowSpan: taUsers.length > 0 ? 2 : 1 },
                        ...(taUsers.length > 0
                          ? [{ content: 'No of profiles shared by TA', colSpan: taUsers.length }]
                          : []),
                        { content: 'Req Remarks', rowSpan: taUsers.length > 0 ? 2 : 1, align: 'left' },
                        { content: 'Req Challenges', rowSpan: taUsers.length > 0 ? 2 : 1, align: 'left' },
                      ],
                      ...(taUsers.length > 0
                        ? [taUsers.map((user) => ({ content: user.label }))]
                        : []),
                    ]}
                    columns={profileColumns}
                    rows={tracker.profileSharedTable.rows.map((row) => [
                      { content: row.clientName, align: 'left' },
                      { content: row.positionName, align: 'left' },
                      { content: <div className="text-center">{formatProfileCount(row.totalProfilesShared)}</div> },
                      ...taUsers.map((user) => (
                        {
                          content: (
                            <div key={`${row.rowKey}-${user.id}`} className="text-center">
                              {formatProfileCount(row.taCounts[String(user.id)])}
                            </div>
                          ),
                        }
                      )),
                      {
                        content: editableCell(
                          `profileShared.rows.${row.rowKey}.reqRemarks`,
                          row.reqRemarks,
                        ),
                      },
                      {
                        content: editableCell(
                          `profileShared.rows.${row.rowKey}.reqChallenges`,
                          row.reqChallenges,
                        ),
                      },
                    ])}
                    footerRows={[
                      [
                        { content: 'No of Profiles shared by TA', colSpan: 2, align: 'left' },
                        {
                          content: (
                            <div className="text-center">
                              {formatProfileCount(tracker.profileSharedTable.totals.totalProfilesShared)}
                            </div>
                          ),
                        },
                        ...taUsers.map((user) => (
                          {
                            content: (
                              <div key={`profile-total-${user.id}`} className="text-center">
                                {formatProfileCount(tracker.profileSharedTable.totals.taCounts[String(user.id)])}
                              </div>
                            ),
                          }
                        )),
                        { content: '' },
                        { content: '' },
                      ],
                      [
                        { content: 'TA Remarks', colSpan: 2, align: 'left' },
                        { content: '' },
                        ...taUsers.map((user) =>
                          ({
                            content: editableCell(
                              `profileShared.taRemarks.user:${user.id}`,
                              tracker.profileSharedTable.taRemarks[String(user.id)] ?? '',
                            ),
                          })
                        ),
                        { content: '' },
                        { content: '' },
                      ],
                    ]}
                  />
                </TabsContent>

                <TabsContent value="interviews" className="mt-0 space-y-4">
                  <ResizableGrid
                    title={`Daily 1st round Interviewed list: ${format(displayDate, 'dd/MMM/yyyy')}`}
                    accent="blue"
                    sectionKey="interviews"
                    headerRows={[
                      [
                        { content: 'Client', colSpan: 2, align: 'left' },
                        { content: 'No. of interview scheduled', rowSpan: taUsers.length > 0 ? 2 : 1 },
                        { content: 'No. of interview happened', rowSpan: taUsers.length > 0 ? 2 : 1 },
                        ...(taUsers.length > 0
                          ? [{ content: 'No of Interview happened by TA', colSpan: taUsers.length }]
                          : []),
                        { content: 'Interview Remarks', rowSpan: taUsers.length > 0 ? 2 : 1, align: 'left' },
                        { content: 'TA Executive Remarks', rowSpan: taUsers.length > 0 ? 2 : 1, align: 'left' },
                      ],
                      ...(taUsers.length > 0
                        ? [[
                            { content: '' },
                            { content: 'Position', align: 'left' as const },
                            ...taUsers.map((user) => ({ content: user.label })),
                          ]]
                        : []),
                    ]}
                    columns={interviewColumns}
                    rows={tracker.interviewTable.rows.map((row) => [
                      { content: row.clientName, align: 'left' },
                      { content: row.positionName, align: 'left' },
                      { content: <div className="text-center">{row.interviewScheduled}</div> },
                      { content: <div className="text-center">{row.interviewHappened}</div> },
                      ...taUsers.map((user) => (
                        {
                          content: (
                            <div key={`${row.rowKey}-interview-${user.id}`} className="text-center">
                              {row.taCounts[String(user.id)] || 0}
                            </div>
                          ),
                        }
                      )),
                      {
                        content: editableCell(
                          `interviews.rows.${row.rowKey}.interviewRemarks`,
                          row.interviewRemarks,
                        ),
                      },
                      {
                        content: editableCell(
                          `interviews.rows.${row.rowKey}.taExecutiveRemarks`,
                          row.taExecutiveRemarks,
                        ),
                      },
                    ])}
                    footerRows={[
                      [
                        { content: 'Total', colSpan: 2, align: 'left' },
                        {
                          content: (
                            <div className="text-center">
                              {tracker.interviewTable.totals.interviewScheduled}
                            </div>
                          ),
                        },
                        {
                          content: (
                            <div className="text-center">
                              {tracker.interviewTable.totals.interviewHappened}
                            </div>
                          ),
                        },
                        ...taUsers.map((user) => (
                          {
                            content: (
                              <div key={`interview-total-${user.id}`} className="text-center">
                                {tracker.interviewTable.totals.taCounts[String(user.id)] ?? '-'}
                              </div>
                            ),
                          }
                        )),
                        { content: '' },
                        { content: '' },
                      ],
                    ]}
                  />
                </TabsContent>

                <TabsContent value="offers" className="mt-0 space-y-4">
                  <ResizableGrid
                    title="Offered & Joiners List - Status update"
                    accent="green"
                    sectionKey="offers"
                    headerRows={[
                      [
                        { content: 'CAND. NAME', align: 'left' },
                        { content: 'Client & Position', colSpan: 2, align: 'left' },
                        { content: 'Status', align: 'left' },
                        { content: 'DOJ', align: 'left' },
                      ],
                    ]}
                    columns={offerColumns}
                    rows={
                      tracker.offerJoinerTable.rows.length > 0
                        ? tracker.offerJoinerTable.rows.map((row) => [
                            { content: row.candidateName, align: 'left' },
                            { content: row.clientName, align: 'left' },
                            { content: row.positionName, align: 'left' },
                            { content: row.status, align: 'left' },
                            { content: row.doj, align: 'left' },
                          ])
                        : [[
                            {
                              content: (
                                <div key="empty" className="py-6 text-center text-slate-500">
                                  No offered or joined candidates found for this date.
                                </div>
                              ),
                              colSpan: 5,
                            },
                          ]]
                    }
                  />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {savingKey ? (
          <div className="text-xs text-slate-500">
            Saving change for <span className="font-medium">{savingKey}</span>
          </div>
        ) : null}
      </main>
    </LayoutContainer>
  );
}
