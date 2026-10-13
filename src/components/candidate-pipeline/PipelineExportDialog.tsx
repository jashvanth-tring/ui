import { useEffect, useRef, useState } from 'react';
import { exportPipelineData } from '../../utils/export-configs';
import { exportPipeline } from '../../store/services/candidate-status';
import { Upload, FilterX  } from 'lucide-react';
import { fetchFilterOptions } from '../../store/services/candidate-status';
import type { FilterOptionsApiBody } from '../../store/model/candidate-status-list.types';
import { Roles } from '../../constants';
import { getUserNameEmail } from '../../utils/user-name';
import type { User } from '../../store/model';
import { Button } from '../ui/button';
import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

interface SelectOption {
  id: number;
  label: string;
  avatarUserId?: number;
  avatarImageURL?: string;
}

function MultiSelect({
  title,
  options,
  selected,
  setSelected,
  search,
  setSearch,
  placeholder,
  onDeselectExtra,
}: {
  title: string;
  options: SelectOption[];
  selected: number[];
  setSelected: React.Dispatch<React.SetStateAction<number[]>>;
  search: string;
  setSearch: (v: string) => void;
  placeholder: string;
  onDeselectExtra?: () => void;
}) {
  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));
  const allChecked = filtered.length > 0 && filtered.every((o) => selected.includes(o.id));
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{title}</label>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b">
          <svg
            className="w-3.5 h-3.5 text-gray-400 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm bg-transparent outline-none w-full text-gray-700 placeholder:text-gray-400"
          />
        </div>
        <label className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-gray-100">
          <input
            type="checkbox"
            checked={allChecked}
            className="accent-[var(--brand)] w-4 h-4 shrink-0"
            onChange={() => {
              if (allChecked) {
                setSelected((p) => p.filter((id) => !filtered.some((o) => o.id === id)));
                onDeselectExtra?.();
              } else setSelected((p) => [...new Set([...p, ...filtered.map((o) => o.id)])]);
            }}
          />
          <div className="w-7 h-7 rounded-full bg-[var(--brand)] flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-semibold">A</span>
          </div>
          <span className="text-sm font-medium text-gray-700">All {title.toLowerCase()}</span>
        </label>
        <div className="p-3">
          <div className="grid grid-cols-3 gap-2">
            {filtered.slice(0, 6).map((o) => {
              const isChecked = selected.includes(o.id);
              return (
                <label
                  key={o.id}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-all min-h-[44px] ${isChecked ? 'border-[var(--brand)] bg-blue-50' : 'border-gray-200 hover:bg-slate-50'}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    className="accent-[var(--brand)] w-4 h-4 shrink-0"
                    onChange={() => {
                      setSelected((p) =>
                        isChecked ? p.filter((id) => id !== o.id) : [...p, o.id]
                      );
                      if (isChecked) onDeselectExtra?.();
                    }}
                  />
                  <span className="text-sm text-gray-700 font-medium leading-tight truncate">
                    {o.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const PipelineExportDialog = React.memo(function PipelineExportDialog({
  open,
  onClose,
  users,
  showErrorSnackbar,
}: {
  open: boolean;
  onClose: () => void;
  users: any;
  showErrorSnackbar: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [clientOptions, setClientOptions] = useState<SelectOption[]>([]);
  const [requirementOptions, setRequirementOptions] = useState<SelectOption[]>([]);
  const [statusOptions, setStatusOptions] = useState<SelectOption[]>([]);
  const [clientIds, setClientIds] = useState<number[]>([]);
  const [requirementIds, setRequirementIds] = useState<number[]>([]);
  const [statusIds, setStatusIds] = useState<number[]>([]);
  const [userIds, setUserIds] = useState<number[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [requirementSearch, setRequirementSearch] = useState('');
  const [statusSearch, setStatusSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const prevClientIdsLengthRef = useRef(0);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(undefined);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [filterBySourceDate, setFilterBySourceDate] = useState(true);
  const [filterByProfileSharedDate, setFilterByProfileSharedDate] = useState(false);
  useEffect(() => {
    if (!open) {
      setClientOptions([]);
      setRequirementOptions([]);
      setStatusOptions([]);
      return;
    }
    fetchFilterOptions(undefined)
      .then((res) => {
        const body = res.data as FilterOptionsApiBody;
        if (body?.success && body.data) {
          const clients = body.data.clients.map((c) => ({ id: c.id, label: c.clientName }));
          const requirements = body.data.requirements.map((r) => ({
            id: r.id,
            label: r.positionName,
          }));
          const statuses = body.data.statuses.map((s) => ({ id: s.id, label: s.statusName }));
          setClientOptions(clients);
          setRequirementOptions(requirements);
          setStatusOptions(statuses);
          setClientIds(clients.map((c) => c.id));
          setRequirementIds(requirements.map((r) => r.id));
          setStatusIds(statuses.map((s) => s.id));
        }
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const currentLength = clientIds.length;
    const prevLength = prevClientIdsLengthRef.current;
    prevClientIdsLengthRef.current = currentLength;
    if (currentLength === 1 || prevLength === 1) {
      const scopeClientId = currentLength === 1 ? clientIds[0] : undefined;
      fetchFilterOptions(scopeClientId)
        .then((res) => {
          const body = res.data as FilterOptionsApiBody;
          if (body?.success && body.data) {
            const requirements = body.data.requirements.map((r) => ({
              id: r.id,
              label: r.positionName,
            }));
            setRequirementOptions(requirements);
            setRequirementIds(requirements.map((r) => r.id));
          }
        })
        .catch(() => {});
    }
  }, [clientIds, open]);

  useEffect(() => {
    if (!open) return;
    if (userIds.length === 0 && users?.length > 0) {
      setUserIds(
        users.filter((u: User) => u.role?.id !== Roles.ACCOUNT_MANAGER).map((u: User) => u.id)
      );
    }
  }, [open, users]);

  const handleClose = () => {
    setClientIds([]);
    setRequirementIds([]);
    setStatusIds([]);
    setUserIds([]);
    setClientSearch('');
    setRequirementSearch('');
    setStatusSearch('');
    setUserSearch('');
    setDateRange(undefined);
    setTempDateRange(undefined);
    setDateRangeOpen(false);
    setFilterBySourceDate(true);
    setFilterByProfileSharedDate(false);
    onClose();
  };

  const handleExport = async () => {
    if (
      clientIds.length === 0 &&
      requirementIds.length === 0 &&
      statusIds.length === 0 &&
      userIds.length === 0
    ) {
      showErrorSnackbar('Please select at least one filter to export.');
      return;
    }

    setLoading(true);
    try {
      const res = await exportPipeline({
        clientIds: clientIds.length > 0 ? clientIds : undefined,
        requirementIds: requirementIds.length > 0 ? requirementIds : undefined,
        statusIds: statusIds.length > 0 ? statusIds : undefined,
        userIds: userIds.length > 0 ? userIds : undefined,
        fromDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        toDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,   
        filterBySourceDate,
        filterByProfileSharedDate,  
      });

      const body = res.data as any;
      const list = Array.isArray(body?.data) ? body.data : [];

      // ── No data for selected combination ──────────────────────────────────
      if (list.length === 0) {
        showErrorSnackbar('No matching data found for the selected filters.');
        return; // keep dialog open so user can adjust filters
      }

      exportPipelineData(list);
      handleClose();
    } catch {
      showErrorSnackbar('Failed to export pipeline');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const filteredUsers = (users ?? [])
    .filter((u: User) => u.role?.id !== Roles.ACCOUNT_MANAGER)
    .filter((u: User) => getUserNameEmail(u).toLowerCase().includes(userSearch.toLowerCase()));
  const allUserIds = filteredUsers.map((u: User) => u.id);
  const allUsersChecked =
    allUserIds.length > 0 && allUserIds.every((id: number) => userIds.includes(id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-[1000px] flex flex-col max-h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h2 className="text-base font-semibold text-gray-800">Export Master Tracker</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          <p className="text-xs text-gray-500">
            Apply filters or leave empty to export <strong>all records</strong>.
          </p>
          {/* Date pickers — disabled until at least one checkbox is selected */}
          <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-600">Date Range</label>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Checkboxes */}
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filterBySourceDate}
                onChange={(e) => setFilterBySourceDate(e.target.checked)}
                className="accent-[var(--brand)] w-4 h-4"
              />
              <span className="text-sm text-gray-700 whitespace-nowrap">Source Date</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filterByProfileSharedDate}
                onChange={(e) => setFilterByProfileSharedDate(e.target.checked)}
                className="accent-[var(--brand)] w-4 h-4"
              />
              <span className="text-sm text-gray-700 whitespace-nowrap">Profile Shared Date</span>
            </label>

            {/* Divider */}
            <div className="h-5 w-px bg-gray-200 shrink-0" />

            {/* Date picker trigger */}
            <Popover
              open={dateRangeOpen}
              onOpenChange={(open) => {
                setDateRangeOpen(open);
                if (!open) setTempDateRange(dateRange);
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={!filterBySourceDate && !filterByProfileSharedDate}
                  className={`h-8 px-3 justify-start text-sm font-normal transition-opacity ${
                    !filterBySourceDate && !filterByProfileSharedDate ? 'opacity-50' : ''
                  }`}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5 text-gray-400 shrink-0" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <span className="text-gray-700">
                        {format(dateRange.from, 'MMM dd, yyyy')} – {format(dateRange.to, 'MMM dd, yyyy')}
                      </span>
                    ) : (
                      <span className="text-gray-700">{format(dateRange.from, 'MMM dd, yyyy')}</span>
                    )
                  ) : (
                    <span className="text-gray-400">Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <DayPicker
                  mode="range"
                  defaultMonth={tempDateRange?.from ?? dateRange?.from}
                  selected={tempDateRange ?? dateRange}
                  onSelect={setTempDateRange}
                  numberOfMonths={2}
                  styles={{
                    root: {
                      fontFamily: 'inherit',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.375rem',
                      padding: '1rem',
                    },
                    day: { borderRadius: '0rem', transition: 'background-color 0.2s ease' },
                    day_selected: { backgroundColor: 'var(--brand)', color: 'white' },
                    day_range_start: { backgroundColor: 'var(--brand)', color: 'white' },
                    day_range_end: { backgroundColor: 'var(--brand)', color: 'white' },
                    day_range_middle: { backgroundColor: '#eef2ff', color: 'var(--brand)' },
                  }}
                />
                <div className="flex justify-end gap-2 p-2 border-t">
                  <Button
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50 text-sm"
                    disabled={!dateRange && !tempDateRange}
                    onClick={() => {
                      setDateRange(undefined);
                      setTempDateRange(undefined);
                      setDateRangeOpen(false);
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    className="bg-[var(--brand)] text-white hover:bg-[var(--brand)] text-sm"
                    disabled={!tempDateRange}
                    onClick={() => {
                      setDateRange(tempDateRange);
                      setDateRangeOpen(false);
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Clear badge when date is selected */}
            {dateRange?.from && (
          <button
            onClick={() => { setDateRange(undefined); setTempDateRange(undefined); }}
            className="relative inline-flex items-center justify-center w-8 h-8 bg-[var(--brand)] hover:opacity-90 transition-opacity rounded-md"
            title="Clear"
          >
            <FilterX className="w-4 h-4 text-white" />
          </button>
          )}
        </div>

          {filterBySourceDate && filterByProfileSharedDate && (
            <p className="text-[11px] text-gray-400">
              Filters by Source Date range, then only includes candidates whose profile has been shared.
            </p>
          )}
        </div>
          {/* Users */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Assigned To</label>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b">
                <svg
                  className="w-3.5 h-3.5 text-gray-400 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="text-sm bg-transparent outline-none w-full text-gray-700 placeholder:text-gray-400"
                />
              </div>
              <label className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-gray-100">
                <input
                  type="checkbox"
                  checked={allUsersChecked}
                  className="accent-[var(--brand)] w-4 h-4 shrink-0"
                  onChange={() => {
                    if (allUsersChecked)
                      setUserIds((p) => p.filter((id) => !allUserIds.includes(id)));
                    else setUserIds((p) => [...new Set([...p, ...allUserIds])]);
                  }}
                />
                <div className="w-7 h-7 rounded-full bg-[var(--brand)] flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-semibold">A</span>
                </div>
                <span className="text-sm font-medium text-gray-700">All users</span>
              </label>
              <div className="p-3">
                <div className="grid grid-cols-3 gap-2">
                  {filteredUsers.slice(0, 6).map((u: User) => {
                    const label = getUserNameEmail(u);
                    // const isChecked = userIds.includes(u.id);
                    const isChecked = u.id !== undefined && userIds.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${isChecked ? 'border-[var(--brand)] bg-blue-50' : 'border-gray-200 hover:bg-slate-50'}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          className="accent-[var(--brand)] w-4 h-4 shrink-0"
                          onChange={() => {
                            const userId = u.id;
                            if (userId === undefined) return;
                            setUserIds((p) =>
                              isChecked ? p.filter((id) => id !== userId) : [...p, userId]
                            );
                          }}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm text-gray-700 font-medium truncate">
                            {label}
                          </span>
                          <span className="text-xs text-gray-400 truncate">
                            {(u as any).officialEmail ?? ''}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <MultiSelect
            title="Client"
            options={clientOptions}
            selected={clientIds}
            setSelected={setClientIds}
            search={clientSearch}
            setSearch={setClientSearch}
            placeholder="Search clients..."
            onDeselectExtra={() => setRequirementIds([])}
          />
          <MultiSelect
            title="Requirement"
            options={requirementOptions}
            selected={requirementIds}
            setSelected={setRequirementIds}
            search={requirementSearch}
            setSearch={setRequirementSearch}
            placeholder="Search requirements..."
          />
          <MultiSelect
            title="Status"
            options={statusOptions}
            selected={statusIds}
            setSelected={setStatusIds}
            search={statusSearch}
            setSearch={setStatusSearch}
            placeholder="Search statuses..."
          />
        </div>
        <div className="px-5 py-4 border-t shrink-0 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {clientIds.length === 0 &&
            requirementIds.length === 0 &&
            statusIds.length === 0 &&
            userIds.length === 0
              ? 'No filters selected'
              : [
                  userIds.length > 0 && `${userIds.length} user(s)`,
                  clientIds.length > 0 && `${clientIds.length} client(s)`,
                  requirementIds.length > 0 && `${requirementIds.length} requirement(s)`,
                  statusIds.length > 0 && `${statusIds.length} status(es)`,
                ]
                  .filter(Boolean)
                  .join(', ') + ' selected'}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" className="text-sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={
                loading ||
                (clientIds.length === 0 &&
                  requirementIds.length === 0 &&
                  statusIds.length === 0 &&
                  userIds.length === 0)
              }
              className="bg-[var(--brand)] hover:bg-[var(--brand)] text-white text-sm"
            >
              {loading ? (
                'Exporting…'
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-1" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PipelineExportDialog;
