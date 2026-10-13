import { Card, CardContent } from '../ui/card';
import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { OptionAvatar } from '../Common/OptionAvatar';
import { Check, ChevronDown, FilterX, CalendarIcon } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { DayPicker, DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import 'react-day-picker/dist/style.css';

interface Filters {
  clientId: number | undefined;
  requirementId: number | undefined;
  statusId: number | undefined;
  userId: number | undefined;
  q: string;
  fromDate: string | undefined;
  toDate: string | undefined;
}

interface SelectOption {
  id: number;
  label: string;
  avatarUserId?: number;
  avatarImageURL?: string;
}

interface Props {
  filters: Filters;
  clientOptions: SelectOption[];
  requirementOptions: SelectOption[];
  statusOptions: SelectOption[];
  userOptions: SelectOption[];
  initDone: boolean;
  onClientChange: (id: number | undefined) => void;
  onRequirementChange: (id: number | undefined) => void;
  onStatusChange: (id: number | undefined) => void;
  onAssignedToChange: (id: number | undefined) => void;
  onDateRangeChange: (fromDate: string | undefined, toDate: string | undefined) => void;
  onClearFilters: () => void;
}

function SearchableSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  placeholder: string;
  options: SelectOption[];
  value: number | undefined;
  onChange: (id: number | undefined) => void;
  badge?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = value !== undefined ? options.find((o) => o.id === value) : undefined;
  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'flex h-9 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm ring-offset-background',
              'hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              value !== undefined ? 'text-slate-900' : 'text-slate-500'
            )}
          >
            <span className="flex items-center gap-2 min-w-0">
              {selectedOption?.avatarUserId !== undefined && (
                <OptionAvatar
                  userId={selectedOption.avatarUserId}
                  imageURL={selectedOption.avatarImageURL}
                  label={selectedOption.label}
                />
              )}
              <span className="truncate">{selectedOption?.label ?? placeholder}</span>
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start" sideOffset={4}>
          <Command>
            <CommandInput placeholder={`Search ${label.toLowerCase()}…`} />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="__all__"
                  onSelect={() => {
                    onChange(undefined);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === undefined ? 'opacity-100' : 'opacity-0')} />
                  {placeholder}
                </CommandItem>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.id}
                    value={opt.label}
                    onSelect={() => {
                      onChange(opt.id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', value === opt.id ? 'opacity-100' : 'opacity-0')} />
                    {opt.avatarUserId !== undefined && (
                      <OptionAvatar userId={opt.avatarUserId} imageURL={opt.avatarImageURL} label={opt.label} />
                    )}
                    <span className={cn('truncate', opt.avatarUserId !== undefined && 'ml-2')}>{opt.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ─── Date range picker (same pattern as SummaryGrid) ───────────────────────
function DateRangeFilter({
  fromDate,
  toDate,
  onChange,
}: {
  fromDate: string | undefined;
  toDate: string | undefined;
  onChange: (from: string | undefined, to: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);

  const toDateObj = (s: string | undefined) => (s ? new Date(`${s}T00:00:00`) : undefined);
  const toDateStr = (d: Date | undefined) => (d ? format(d, 'yyyy-MM-dd') : undefined);

  const committedRange: DateRange | undefined = fromDate
    ? { from: toDateObj(fromDate), to: toDateObj(toDate) }
    : undefined;

  const [tempRange, setTempRange] = useState<DateRange | undefined>(committedRange);

  useEffect(() => {
    if (open) setTempRange(committedRange);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClear = () => {
    setTempRange(undefined);
    onChange(undefined, undefined);
    setOpen(false);
  };

  const handleApply = () => {
    onChange(toDateStr(tempRange?.from), toDateStr(tempRange?.to));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="bg-white text-[#0f2247] hover:bg-gray-100 transition-colors font-medium flex items-center w-full justify-start"
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {committedRange?.from ? (
            committedRange.to ? (
              <span className="truncate">
                {format(committedRange.from, 'MMM dd, yyyy')} - {format(committedRange.to, 'MMM dd, yyyy')}
              </span>
            ) : (
              <span className="truncate">{format(committedRange.from, 'MMM dd, yyyy')}</span>
            )
          ) : (
            <span className="truncate text-slate-500">Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <DayPicker
          mode="range"
          defaultMonth={tempRange?.from || committedRange?.from}
          selected={tempRange}
          onSelect={setTempRange}
          numberOfMonths={2}
          styles={{
            root: {
              fontFamily: 'inherit',
              border: '1px solid #e2e8f0',
              borderRadius: '0.375rem',
              padding: '1rem',
            },
            day: {
              borderRadius: '0rem',
              gap: '3px',
              transition: 'background-color 0.2s ease',
            },
            day_selected: { backgroundColor: '#0f2247', color: 'white' },
            day_range_start: { backgroundColor: '#0f2247', color: 'white' },
            day_range_end: { backgroundColor: '#0f2247', color: 'white' },
            day_range_middle: { backgroundColor: '#eef2ff', color: '#0f2247' },
          }}
        />
        <div className="flex justify-end p-2 border-t">
          <Button
            onClick={handleClear}
            variant="ghost"
            className="text-red-600 hover:bg-red-50"
            disabled={!tempRange && !committedRange}
          >
            Clear Dates
          </Button>
          <Button
            onClick={handleApply}
            className="bg-[var(--brand)] text-white hover:bg-primary-800"
            disabled={!tempRange?.from}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const PipelineFilterBar: React.FC<Props> = ({
  filters,
  clientOptions,
  requirementOptions,
  statusOptions,
  userOptions,
  initDone,
  onClientChange,
  onRequirementChange,
  onStatusChange,
  onAssignedToChange,
  onDateRangeChange,
  onClearFilters,
}) => {
  const hasActiveFilters =
    filters.clientId !== undefined ||
    filters.requirementId !== undefined ||
    filters.statusId !== undefined ||
    filters.userId !== undefined ||
    !!filters.fromDate ||
    !!filters.toDate;

  return (
    <Card className="border border-gray-200 shadow-sm rounded-xl mb-4">
      <CardContent className="px-4 py-3 flex flex-wrap gap-3 items-center">
        <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[160px]">
          <SearchableSelect
            label="Client"
            placeholder="All clients"
            options={clientOptions}
            value={filters.clientId}
            onChange={onClientChange}
          />
        </div>
        <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[160px]">
          <SearchableSelect
            label="Requirement / role"
            placeholder="All requirements"
            options={requirementOptions}
            value={filters.requirementId}
            onChange={onRequirementChange}
            badge={
              filters.clientId !== undefined && requirementOptions.length > 0
                ? String(requirementOptions.length)
                : undefined
            }
            disabled={!initDone}
          />
        </div>
        <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[160px]">
          <SearchableSelect
            label="Status"
            placeholder="All status"
            options={statusOptions}
            value={filters.statusId}
            onChange={onStatusChange}
          />
        </div>
        <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[160px]">
          <SearchableSelect
            label="Assigned To"
            placeholder="All users"
            options={userOptions}
            value={filters.userId}
            onChange={onAssignedToChange}
          />
        </div>
        <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[220px]">
          <DateRangeFilter
            fromDate={filters.fromDate}
            toDate={filters.toDate}
            onChange={onDateRangeChange}
          />
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            title="Clear filters"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-red-200 bg-white text-red-500 shadow-sm hover:bg-red-50 hover:border-red-300"
          >
            <FilterX className="h-4 w-4" />
          </button>
        )}
      </CardContent>
    </Card>
  );
};

export default PipelineFilterBar;