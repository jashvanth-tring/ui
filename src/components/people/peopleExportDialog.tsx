import { useState } from 'react';
import { Upload, SearchIcon, FilterX } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import 'react-day-picker/dist/style.css';
import { ExportCandidatesSP } from '../../store/services/candidate';
import { exportCandidates } from '../../utils/export-configs';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  officialEmail: string;
}

interface PeopleExportDialogProps {
  open: boolean;
  onClose: () => void;
  allUsers: User[];
  currentUserId: number;
  showErrorSnackbar: (msg: string) => void;
}

export default function PeopleExportDialog({
  open,
  onClose,
  allUsers,
  currentUserId,
  showErrorSnackbar,
}: PeopleExportDialogProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>(() =>
    allUsers.map((u) => u.id)
  );
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(undefined);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);

  const handleClose = () => {
    setSelectedUserIds([]);
    setUserSearchQuery('');
    setDateRange(undefined);
    setTempDateRange(undefined);
    setDateRangeOpen(false);
    onClose();
  };

  const doExport = async () => {
    setExportLoading(true);
    try {
      const filterUserIds =
        selectedUserIds.length === allUsers.length ? [] : selectedUserIds;

      const res = await ExportCandidatesSP(
        currentUserId,
        filterUserIds.length ? filterUserIds : undefined,
        dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      );

      const body = res.data as any;
      const list = Array.isArray(body?.data) ? body.data : [];

      if (list.length === 0) {
        showErrorSnackbar('Candidates not found!');
        handleClose();
        return;
      }

      exportCandidates(list);
      handleClose();
    } catch {
      showErrorSnackbar('Failed to export candidates');
    } finally {
      setExportLoading(false);
    }
  };

  if (!open) return null;

  const filteredUsers = allUsers.filter((u) => {
    const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.officialEmail;
    return name.toLowerCase().includes(userSearchQuery.toLowerCase());
  });

  const allChecked =
    allUsers.length > 0 && allUsers.every((u) => selectedUserIds.includes(u.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-[900px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-800">Export Candidates</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-xs text-gray-500 mb-3">
            Select users to export their candidates.
          </p>

          {/* Date Range — inline row */}
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs font-medium text-gray-600">Date Range</label>
            <div className="flex items-center gap-3">
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
                    className="h-8 px-3 justify-start text-sm font-normal"
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 text-gray-400 shrink-0" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <span className="text-gray-700">
                          {format(dateRange.from, 'MMM dd, yyyy')} –{' '}
                          {format(dateRange.to, 'MMM dd, yyyy')}
                        </span>
                      ) : (
                        <span className="text-gray-700">
                          {format(dateRange.from, 'MMM dd, yyyy')}
                        </span>
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

              {dateRange?.from && (
                <button
                  onClick={() => { setDateRange(undefined); setTempDateRange(undefined); }}
                  className="relative inline-flex items-center justify-center w-8 h-8 bg-[var(--brand)] hover:opacity-90 transition-opacity rounded-md"
                  title="Clear date filter"
                >
                  <FilterX className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Users list */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
              <SearchIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="text-sm bg-transparent outline-none w-full text-gray-700 placeholder:text-gray-400"
              />
            </div>

            {/* Select All */}
            <label className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-gray-100">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={() =>
                  allChecked
                    ? setSelectedUserIds([])
                    : setSelectedUserIds(allUsers.map((u) => u.id))
                }
                className="accent-[var(--brand)] w-4 h-4 shrink-0"
              />
              <div className="w-7 h-7 rounded-full bg-[var(--brand)] flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-semibold">A</span>
              </div>
              <span className="text-sm font-medium text-gray-700">All users</span>
            </label>

            {/* Grid */}
            <div className="overflow-y-auto p-3" style={{ maxHeight: '240px' }}>
              <div className="grid grid-cols-3 gap-2">
                {filteredUsers.map((u) => {
                  const name =
                    `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.officialEmail;
                  const isChecked = selectedUserIds.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[var(--brand)] bg-blue-50'
                          : 'border-gray-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          setSelectedUserIds((prev) =>
                            isChecked
                              ? prev.filter((id) => id !== u.id)
                              : [...prev, u.id]
                          )
                        }
                        className="accent-[var(--brand)] w-4 h-4 shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm text-gray-700 font-medium truncate">
                          {name}
                        </span>
                        <span className="text-xs text-gray-400 truncate">
                          {u.officialEmail}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex items-center justify-between border-t">
          <span className="text-xs text-slate-400">
            {allChecked || selectedUserIds.length === 0
              ? 'All records will be exported'
              : `${selectedUserIds.length} of ${allUsers.length} user(s) selected`}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="text-sm">
              Cancel
            </Button>
            <Button
              onClick={doExport}
              disabled={exportLoading || selectedUserIds.length === 0}
              className="bg-[var(--brand)] hover:bg-[var(--brand)] text-white text-sm"
            >
              {exportLoading ? (
                'Exporting…'
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-1" /> Export
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}