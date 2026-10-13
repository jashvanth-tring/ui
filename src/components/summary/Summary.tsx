/* eslint-disable @typescript-eslint/no-explicit-any */
import { LayoutContainer } from "../../styles/LayoutContainer";
import React, { useEffect, useState } from 'react';
import { DataTable } from '../customized-table';
import type { ColumnDef } from '@tanstack/react-table';
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '../../store';
import { RootState } from '../../store/reducers';
import { fetchAllUsers } from '../../store/action/users.action';
import { User } from '../../store/model';
import { Roles } from '../../constants/roles';
import {
  fetchGapAnalysisOne,
  fetchGapAnalysisTwo,
  fetchGapAnalysisThree,
  fetchWeeklyData,
  fetchDailyData,
  fetchClientWiseData,
} from '../../store/action/gap-analysis.action';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import {
  ChevronDownIcon,
  UserRound,
  SearchIcon,
  CalendarIcon,
  Loader2,
  Upload,
} from 'lucide-react';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { OptionAvatar } from '../Common/OptionAvatar';
import { Checkbox } from '@mui/material';
interface ReportTabItem {
  id: number;
  name: string;
}

interface ResultItem {
  [key: string]: any;
}

// Uppercase categories for internal matching
const categoryOrder = [
  'NO OF PROFILES SHARED',
  'INTERVIEW SCHEDULED',
  'INTERVIEW HAPPENED',
  'YET TO SCHEDULE',
  'SELECTED',
  'OFFERED',
  'JOINED',
];

// Mapping from internal names to display names
const categoryDisplayNames: Record<string, string> = {
  // Weekly data (row-wise)
  'NO OF PROFILES SHARED': 'NO OF PROFILES SHARED',
  'INTERVIEW SCHEDULED': 'INTERVIEW SCHEDULED',
  'INTERVIEW HAPPENED': 'INTERVIEW HAPPENED',
  'YET TO SCHEDULE': 'YET TO SCHEDULE',
  SELECTED: 'SELECTED',
  OFFERED: 'OFFERED',
  JOINED: 'JOINED',

  // Gap Analysis 1 categories (client-wise)
  'No Of Profiles Shared': 'NO OF PROFILES SHARED',
  'No Of Profiles Not Scheduled': 'NO OF PROFILES NOT SCHEDULED',
  'Profile Rejects': 'NO OF PROFILE REJECTS',
  Duplicate: 'DUPLICATE',
  'Feedback Pending From Clients': 'FEEDBACK PENDING FROM CLIENTS',
  'Candidate Dropped Out': 'CANDIDATE DROPPED OUT',
  'Interview Slot Issues': 'INTERVIEW SLOT ISSUES',
  'Position Freeze': 'POSITION FREEZE/LOST',

  // Gap Analysis 2 categories
  'No Of Interview Selects': 'NO OF INTERVIEW SELECTS',
  'Not Offered': 'NOT OFFERED',
  'On Progress': 'IN PROGRESS',
  'Yet To Offer': 'YET TO OFFER',
  'Second Level Reject': '2ND LEVEL REJECT',
  'Final Level Reject': 'FINAL LEVEL REJECT',
  'HR Reject': 'HR REJECT',
  'Negotiation Failure': 'NEGOTIATION FAILURE',
  'Other Reasons': 'OTHER REASONS',

  // Gap Analysis 3 categories
  Offered: 'NO OF OFFERS',
  'Yet To Join': 'YET TO JOIN',
  Joined: 'JOINED',
  'No Of Candidates Not Joined': 'NO OF CANDIDATES NOT JOINED',
  'Got Another Offer': 'GOT ANOTHER OFFER',
  'Not Happy With The Company': 'NOT HAPPY WITH THE COMPANY',
  'Not Happy With Client': 'NOT HAPPY WITH CLIENT',
  'Location Constraint': 'LOCATION CONSTRAINT',
  'Notice Period Constraint': 'NOTICE PERIOD CONSTRAINT',
  'Salary Issue': 'SALARY ISSUE',
  'Other Reasons Gap3': 'OTHER REASONS',
};

const staticFieldsToHighlight = [
  'No Of Profiles Not Scheduled',
  'Not Offered',
  'No Of Candidates Not Joined',
];

const reportsTab: ReportTabItem[] = [
  { id: 1, name: 'Weekly Data' },
  { id: 6, name: 'Daily Data' },
  { id: 2, name: 'Client Wise Data' },
  { id: 3, name: 'Gap Analysis 1' },
  { id: 4, name: 'Gap Analysis 2' },
  { id: 5, name: 'Gap Analysis 3' },
];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

const processWeeklyData = (data: any): { columns: string[]; rows: ResultItem[] } => {
  if (!data?.data) return { columns: [], rows: [] };

  const rows = data.data.map((week: any) => {
    const row: any = {
      id: `${week.weekStart}_${week.weekEnd}`,
      'DATE (FROM & TO)': `${formatDate(week.weekStart)} - ${formatDate(week.weekEnd)}`,
    };

    categoryOrder.forEach((cat: string) => {
      row[cat] = 0;
    });

    week.categories?.forEach((cat: any) => {
      const upperName = cat.categoryName?.toUpperCase();
      if (categoryOrder.includes(upperName)) {
        row[upperName] = cat.count || 0;
      }
    });

    return row;
  });

  const columns = ['DATE (FROM & TO)', ...categoryOrder];

  // Add Total row at the end
  if (rows.length > 0) {
    const totalRow: ResultItem = { id: 'total', 'DATE (FROM & TO)': 'Total' };
    categoryOrder.forEach((cat) => {
      totalRow[cat] = rows.reduce((sum: number, r: any) => sum + (Number(r[cat]) || 0), 0);
    });
    rows.push(totalRow);
  }

  return { columns, rows };
};

const processDailyData = (data: any): { columns: string[]; rows: ResultItem[] } => {
  if (!data?.data) return { columns: [], rows: [] };

  const rows = data.data.map((day: any) => {
    const row: any = {
      id: day.weekStart,
      DATE: formatDate(day.weekStart),
    };

    categoryOrder.forEach((cat: string) => {
      row[cat] = 0;
    });

    day.categories?.forEach((cat: any) => {
      const upperName = cat.categoryName?.toUpperCase();
      if (categoryOrder.includes(upperName)) {
        row[upperName] = cat.count || 0;
      }
    });

    return row;
  });

  const columns = ['DATE', ...categoryOrder];

  // Add Total row at the end
  if (rows.length > 0) {
    const totalRow: ResultItem = { id: 'total', DATE: 'Total' };
    categoryOrder.forEach((cat) => {
      totalRow[cat] = rows.reduce((sum: number, r:any) => sum + (Number(r[cat]) || 0), 0);
    });
    rows.push(totalRow);
  }

  return { columns, rows };
};

const transformDataToTableFormat = (data: any): { columns: string[]; rows: ResultItem[] } => {
  if (!data?.data || !Array.isArray(data.data)) return { columns: [], rows: [] };

  const rows: any[] = [];

  // ── FIXED columns (same as weekly/daily) ──────────────────────────────────
  const fixedCategories = [
    'NO OF PROFILES SHARED',
    'INTERVIEW SCHEDULED',
    'INTERVIEW HAPPENED',
    'YET TO SCHEDULE',
    'SELECTED',
    'OFFERED',
    'JOINED',
  ];

  // ── Build rows per client ─────────────────────────────────────────────────
  data.data.forEach((week: any) => {
    week.clients?.forEach((client: any) => {
      client.positions?.forEach((position: any) => {

        const row: any = {
          id: `${client.clientId}-${position.positionId}`,
          'Client Name': client.clientName,
          'Position Name': position.positionName,
        };

        // ── Initialize all fixed columns to 0 ────────────────────────────
        fixedCategories.forEach((cat) => {
          row[cat] = 0;
        });

        // ── Fill values from API — match by uppercase categoryName ────────
        position.categories?.forEach((category: any) => {
          const upperName = category.categoryName?.toUpperCase();
          if (fixedCategories.includes(upperName)) {
            row[upperName] = category.count || 0; // ← only fill if in fixed list
          }
        });

        rows.push(row);
      });
    });

    if (!week.clients || week.clients.length === 0) {
      rows.push({
        id: week.weekStart || 'no-data',
        'Client Name': 'No data found',
        'Position Name': '-',
      });
    }
  });

  // ── Fixed column order ────────────────────────────────────────────────────
  const columns = ['Client Name', 'Position Name', ...fixedCategories];

  // ── Total row ─────────────────────────────────────────────────────────────
  if (rows.length > 0) {
    const totalRow: ResultItem = {
      id: 'total',
      'Client Name': 'Total',
      'Position Name': '',
    };

    fixedCategories.forEach((cat) => {
      totalRow[cat] = rows.reduce((sum, r) => sum + (Number(r[cat]) || 0), 0);
    });

    rows.push(totalRow);
  }

  return { columns, rows };
};

const gapAnalysis = (data: any): { columns: string[]; rows: ResultItem[] } => {
  if (!data?.data || !Array.isArray(data.data)) return { columns: [], rows: [] };

  const rows: any[] = [];
  const allColumns = new Set<string>(['Client Name']);

  // First pass to collect all possible columns (categories only)
  data.data.forEach((week: any) => {
    week.clients?.forEach((client: any) => {
      client.categories?.forEach((category: any) => {
        allColumns.add(category.categoryName);
      });
    });
  });

  // Second pass to create rows
  data.data.forEach((week: any) => {
    // Add a row for each client in the week
    week.clients?.forEach((client: any) => {
      const row: any = {
        id: `${client.clientId}`,
        'Client Name': client.clientName,
      };

      // Initialize all category columns with 0
      Array.from(allColumns).forEach((col) => {
        if (!row[col]) row[col] = 0;
      });

      // Fill in category (summary) values only
      client.categories?.forEach((category: any) => {
        row[category.categoryName] = category.count || 0;
      });

      rows.push(row);
    });

    // Add a summary row for weeks with no clients
    if (!week.clients || week.clients.length === 0) {
      rows.push({
        id: `no-data-${week.weekStart}`,
        'Client Name': 'No data found this week',
      });
    }
  });

  const columns = Array.from(allColumns);

  // Add grand Total row for numeric columns
  if (rows.length > 0) {
    const totalRow: ResultItem = { id: 'total' };

    columns.forEach((col, index) => {
      const sampleValue = rows.find((r) => typeof r[col] === 'number')?.[col];
      if (typeof sampleValue === 'number') {
        totalRow[col] = rows.reduce((sum, r) => sum + (Number(r[col]) || 0), 0);
      } else if (index === 0) {
        totalRow[col] = 'Total';
      } else {
        totalRow[col] = '';
      }
    });

    rows.push(totalRow);
  }

  return { columns, rows };
};

const SummaryGrid: React.FC = () => {
  const [isDisabled, setIsDisabled] = useState(false);
  const [customRows, setCustomRows] = useState<any[]>([]);
  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState('Weekly Data');
  const [searchQuery, setSearchQuery] = useState('');       
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [userFilterMode, setUserFilterMode] = useState<'all' | 'custom'>('all');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [analysisDropdownOpen, setAnalysisDropdownOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(undefined);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { users } = useAppSelector((state: RootState) => state?.usersSelector);

  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [dispatch]);

  const formatDate = (date: Date | undefined) => {
    return date ? format(date, 'yyyy-MM-dd') : '';
  };

  const currentReport = reportsTab.find((r) => r.name === currentAnalysis);

  const fetchData = React.useCallback(async () => {

    if (userFilterMode === 'custom' && selectedUserIds.length === 0) {
      setCustomColumns([]);
      setCustomRows([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (dateRange?.from) queryParams.append('from', formatDate(dateRange.from));
      if (dateRange?.to) queryParams.append('to', formatDate(dateRange.to));
      if (userFilterMode === 'custom' && selectedUserIds.length > 0) {
        queryParams.append('assignedTo', selectedUserIds.join(','));
      }

      const headers = {
        'user-id': selectedUserIds.length === 1 ? selectedUserIds[0].toString() : '',
      };

      let response: any;
      let processedData: { columns: string[]; rows: any[] };

      const currentReport = reportsTab.find((r) => r.name === currentAnalysis);
      if (!currentReport) return;

      switch (currentReport.id) {
        case 1:
          response = await dispatch(
            fetchWeeklyData({ params: queryParams.toString(), headers })
          ).unwrap();
          processedData = processWeeklyData(response);
          break;
        case 6:
          response = await dispatch(
            fetchDailyData({ params: queryParams.toString(), headers })
          ).unwrap();
          processedData = processDailyData(response);
          break;
        case 2:
          response = await dispatch(
            fetchClientWiseData({ params: queryParams.toString(), headers })
          ).unwrap();
          processedData = transformDataToTableFormat(response);
          break;
        case 3:
          response = await dispatch(
            fetchGapAnalysisOne({ params: queryParams.toString(), headers })
          ).unwrap();
          processedData = gapAnalysis(response);
          break;
        case 4:
          response = await dispatch(
            fetchGapAnalysisTwo({ params: queryParams.toString(), headers })
          ).unwrap();
          processedData = gapAnalysis(response);
          break;
        case 5:
          response = await dispatch(
            fetchGapAnalysisThree({ params: queryParams.toString(), headers })
          ).unwrap();
          processedData = gapAnalysis(response);
          break;
        default:
          processedData = { columns: [], rows: [] };
      }

      setCustomColumns(processedData.columns || []);
      setCustomRows(processedData.rows || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentAnalysis, dateRange, dispatch, selectedUserIds, userFilterMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    setIsDisabled(true);
    setTimeout(() => setIsDisabled(false), 2000);

    // Use display names for exported CSV headers
    const headers = customColumns.map((col) => categoryDisplayNames[col] || col).join(',');
    const rows = customRows
      .map((row) => customColumns.map((col) => `"${row[col] ?? ''}"`).join(','))
      .join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${currentAnalysis}-${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = Array.isArray(users)
  ? users.filter((user: User) => {
      if (user.role?.id === Roles.ACCOUNT_MANAGER) return false;
      return true; 
    })
  : [];

  const allEligibleUsers = Array.isArray(users)
  ? users.filter((u: User) => u.role?.id !== Roles.ACCOUNT_MANAGER)
  : [];

    const toggleUserSelection = (userId: number) => {
      if (userFilterMode === 'all') {
        const allIds = allEligibleUsers
          .map((u: User) => u.id)
          .filter((id): id is number => id !== undefined && id !== userId);
        setSelectedUserIds(allIds);
        setUserFilterMode('custom');
        return;
      }

      setSelectedUserIds((prev) => {
        const next = prev.includes(userId)
          ? prev.filter((id) => id !== userId)
          : [...prev, userId];

        // If every eligible user ends up selected, collapse back to "all" mode
        const allEligibleIds = allEligibleUsers
        .map((u: User) => u.id)
        .filter((id): id is number => id !== undefined);

        if (next.length === allEligibleIds.length && allEligibleIds.every((id) => next.includes(id))) {
          setUserFilterMode('all');
          return [];
        }

        return next;
      });
    };

    const toggleAllUsers = () => {
      if (userFilterMode === 'all') {
        setUserFilterMode('custom');
        setSelectedUserIds([]);
      } else {
        // Currently custom (partial or empty) → check "All" → back to all mode
        setUserFilterMode('all');
        setSelectedUserIds([]);
      }
    };

  const handleClearDates = () => {
    setDateRange(undefined);
    setTempDateRange(undefined);
    //fetchData();
  };

  const isUserChecked = (userId: number) =>
    userFilterMode === 'all' || selectedUserIds.includes(userId);

  const handleAnalysisSelection = (_analysisId: number, name: string) => {
    setCurrentAnalysis(name);
    setAnalysisDropdownOpen(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const filteredRows = customRows.filter((row) => {
    return Object.values(row).some((value) =>
      value?.toString().toLowerCase().includes(searchQuery)
    );
  });

  const toPascalCase = (str: string) => {
    if (!str) return str;
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Function to get display name for a column
  const getDisplayName = (column: string) => {
    const displayName = categoryDisplayNames[column] || column;
    return toPascalCase(displayName);
  };

  return (
    <LayoutContainer>
    <main>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-[var(--brand)]">{currentAnalysis}</h1>
        <div className="flex items-center gap-3 flex-wrap">

          <div className="relative w-64">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              onChange={handleSearchChange}
              className="pl-9 bg-white"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
          <DropdownMenu open={userDropdownOpen} onOpenChange={setUserDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button className="bg-white text-[#0f2247] hover:bg-gray-100 transition-colors font-medium flex items-center gap-2 w-full md:w-auto">
                <UserRound className="h-4 w-4" />
                <span className="truncate max-w-[140px]">
                  {userFilterMode === 'all'
                    ? 'All Users'
                    : selectedUserIds.length === 0
                    ? 'No User Selected'
                    : selectedUserIds.length === 1
                    ? (() => {
                        const u = filteredUsers.find((u: User) => u.id === selectedUserIds[0]);
                        return u
                          ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.officialEmail
                          : '1 Selected';
                      })()
                    : `${selectedUserIds.length} Users Selected`}
                </span>
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-64 overflow-auto max-h-72 p-1"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <div
                className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-100 rounded text-sm"
                onClick={toggleAllUsers}
              >
                <Checkbox
                  checked={userFilterMode === 'all'}
                  onChange={toggleAllUsers}
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    color: 'var(--brand) !important',
                    '&.Mui-checked': { color: 'var(--brand) !important' },
                  }}
                />
                <span>All</span>
              </div>
              {filteredUsers.map((user: User) => {
                if (user.id === undefined) return null;
                const userId = user.id;

                const label =
                  `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                  user.officialEmail ||
                  'U';
                return (
                  <div
                    key={userId}
                    className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-100 rounded"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleUserSelection(userId);
                    }}
                  >
                    <Checkbox
                      checked={isUserChecked(userId)}
                      onChange={() => toggleUserSelection(userId)}
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        color: 'var(--brand) !important',
                        '&.Mui-checked': { color: 'var(--brand) !important' },
                      }}
                    />
                    <OptionAvatar userId={userId} imageURL={user.imageURL} label={label} />
                    <span className="truncate text-sm">{label}</span>
                  </div>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

            <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-white text-[#0f2247] hover:bg-gray-100 transition-colors font-medium flex items-center w-full md:min-w-[15rem] justify-start"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'MMM dd, yyyy')} -{' '}
                        {format(dateRange.to, 'MMM dd, yyyy')}
                      </>
                    ) : (
                      format(dateRange.from, 'MMM dd, yyyy')
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <DayPicker
                  mode="range"
                  defaultMonth={tempDateRange?.from || dateRange?.from}
                  selected={tempDateRange || dateRange}
                  onSelect={setTempDateRange}
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
                    day_selected: {
                      backgroundColor: '#0f2247',
                      color: 'white',
                    },
                    day_range_start: {
                      backgroundColor: '#0f2247',
                      color: 'white',
                    },
                    day_range_end: {
                      backgroundColor: '#0f2247',
                      color: 'white',
                    },
                    day_range_middle: {
                      backgroundColor: '#eef2ff',
                      color: '#0f2247',
                    },
                  }}
                />
                <div className="flex justify-end p-2 border-t">
                  <Button
                    onClick={handleClearDates}
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                    disabled={!dateRange && !tempDateRange}
                  >
                    Clear Dates
                  </Button>
                  <Button
                    onClick={() => {
                      setDateRange(tempDateRange);
                      setDateRangeOpen(false);
                      //fetchData();
                    }}
                    className="bg-[var(--brand)] text-white hover:bg-primary-800"
                    disabled={!tempDateRange}
                  >
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu open={analysisDropdownOpen} onOpenChange={setAnalysisDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button className="bg-white text-[#0f2247] hover:bg-gray-100 transition-colors font-medium flex items-center w-full md:min-w-[12rem]">
                  {currentAnalysis}
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60">
                {reportsTab.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={async () => await handleAnalysisSelection(item.id, item.name)}
                    className="cursor-pointer"
                    
                  >
                    {item.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={handleExport}
              disabled={isDisabled || isLoading}
              className="flex items-center space-x-2 bg-[var(--brand)] text-[white] hover:bg-[var(--brand)]"
            >
              <Upload className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

 
        <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
            </div>
          ) : userFilterMode === 'custom' && selectedUserIds.length === 0 ? (
        <div className="flex flex-col justify-center items-center py-16 text-slate-500">
          <p className="text-sm font-medium">No user selected</p>
          <p className="text-xs text-slate-400 mt-1">
            Select at least one user to view data
          </p>
        </div>
        ): customRows.length > 0 ? (
      <DataTable
        columns={
          customColumns.map((col, index): ColumnDef<any, any> => ({
            accessorKey: col,
                header: ({ column: _column }) => {
      const isHighlighted = staticFieldsToHighlight.includes(col);
      return (
        <span className={isHighlighted ? 'text-blue-700 font-semibold' : ''}>
          {getDisplayName(col)}
        </span>
      );
    },
            size: index === 0 ? 200 : 150,
              meta: {
      isHighlighted: staticFieldsToHighlight.includes(col),
    },
             cell: ({ row }: any) => {
      const value = row.original[col] ?? '-';
      const isTotal = row.original.id === 'total';
      const isHighlighted = staticFieldsToHighlight.includes(col);
      return (
        <span
          className={`
            ${isTotal ? 'text-white font-semibold' : ''}
            ${!isTotal && isHighlighted ? 'text-blue-700 font-medium' : ''}
          `}
        >
          {value}
        </span>
      );
    },
  }))
}
        data={filteredRows}
        tableName={`analysis_grid_${currentReport?.id ?? currentAnalysis}`}
        preferences={{}}
        minHeightPx={100}
      />
    ) : (
      <div className="flex flex-col justify-center items-center py-16 text-slate-500">
        <p className="text-sm font-medium">No data found</p>
        <p className="text-xs text-slate-400 mt-1">
          Select a different analysis or try again later
        </p>
      </div>
    )}
  </CardContent>
  
</Card>
    
    </main>
    </LayoutContainer>
  );
};

export default SummaryGrid;
