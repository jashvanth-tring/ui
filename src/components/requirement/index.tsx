import { LayoutContainer } from "../../styles/LayoutContainer";
'use client';
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useAppSelector } from '../../store';
import { RootState } from '../../store/reducers';
import { useSnackbar } from '../../utils/snackbar-function';
import { Card, CardContent } from '../ui/card';
import ResumeParser from '../resume-parser';
import { FetchAllClients } from '../../store/action/client.action';
import { fetchClientLocations } from '../../store/action/client-location.action';
import type { Clients } from '../../store/model/client.types';
import { fetchTablePreference } from '../../store/action/table-preference.action';
import CustomizedSnackbars from '../customized-snackbar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { DataTable } from '../customized-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AppDispatch } from '../../store';
import { useDispatch as useReduxDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import AddClientWithRequirementStepper from '../client/AddClientWithRequirementStepper';
import {
  requirementSkillsDisplay,
  requirementSkillsToArray,
} from '../../utils/requirement-skill-set';
import { fetchRequirementsPaged } from '../../store/services/requirement';
import { updateRequirementJrfKey } from '../../store/action/requirement-details.action';
import { PlusIcon, SearchIcon, EditIcon, FileText, Upload } from 'lucide-react';
import { fetchRequirementJrfFile, uploadJD  } from '../../store/services/requirement';
import DocumentPreviewDialog from '../documents/DocumentPreviewDialog';
import { Dialog, DialogContent } from '../ui/dialog';
import EditRequirementForm from './edit-requirement';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { TableContentLoader } from '../table-content-loader';
import { parseDateForSort } from '../../utils/name-format';
import type { ColumnDef } from '@tanstack/react-table';
import { Roles } from '../../constants/roles';
import { updateRequirement } from "@/store/action/requirement-details.action";
import { cn } from '../../lib/utils';
import { fetchRequirementStatuses } from '../../store/action/requirement-details.action';
import { exportRequirements } from '../../utils/export-configs';
const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

/** Table display: API/DB often stores names in lowercase; capitalize each word for readability. */
function toDisplayTitleCase(value: unknown): string {
  if (value == null || value === '') return '';
  const s = String(value).trim();
  if (!s) return '';
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function clientIdFromSearchParams(sp: URLSearchParams): number | undefined {
  const raw = sp.get('clientId');
  if (raw == null || raw === '') return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.trunc(n);
}

const RequirementsManagement = () => {
  // FIXED: just useDispatch typed as AppDispatch, same as candidate table
  const dispatch = useReduxDispatch<AppDispatch>();
  const [searchParams, setSearchParams] = useSearchParams();
  /** Read from URL every render so deep links like ?clientId= are applied before the first fetch (no useState race). */
  const clientFilterId = clientIdFromSearchParams(searchParams);

  const setClientFilter = (id: number | undefined) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id == null) next.delete('clientId');
        else next.set('clientId', String(id));
        return next;
      },
      { replace: true }
    );
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [requirementsLoading, setRequirementsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null);
  const [selectedRequirementForCandidate, setSelectedRequirementForCandidate] = useState<any>(null);
  const [previewRequirement, setPreviewRequirement] = useState<{
    id: number;
    roleName: string;
    fileKey: string | null;
  } | null>(null);

  const {
    snackbarState,
    handleSnackbarClose,
    showSuccessSnackbar,
    showWarningSnackbar,
    showErrorSnackbar,
  } = useSnackbar();
  const { clients } = useAppSelector((state: RootState) => state.clientsSelector) || {
    clients: [],
  };
  const { preferences } = useAppSelector((state: RootState) => state.tablePreference);
  const { clientLocations } =
    useAppSelector((state: RootState) => state.clientLocationSelector) || {};

  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const requirementsPrefFetchStartedRef = useRef(false);
  const { user } = useAppSelector((state: RootState) => state.authSelector) || {};

  const locationsForProfile = (profileId: number | undefined) => {
    if (profileId == null) return '-';
    const locs = (clientLocations ?? [])
      .filter((row: Clients) => row.clientProfile?.id === profileId)
      .map((row: Clients) => (row.location ?? '').trim())
      .filter(Boolean);
    const unique = [...new Set(locs)];
    return unique.length ? unique.join(', ') : '-';
  };

  const clientsLen = Array.isArray(clients) ? clients.length : 0;
  const locationsLen = Array.isArray(clientLocations) ? clientLocations.length : 0;
  const requirementsPrefKeyCount = preferences?.['requirements']
    ? Object.keys(preferences['requirements']).length
    : 0;

  useEffect(() => {
    if (clientsLen === 0) {
      dispatch(FetchAllClients());
    }
    if (locationsLen === 0) {
      dispatch(fetchClientLocations());
    }
    if (requirementsPrefKeyCount === 0) {
      if (!requirementsPrefFetchStartedRef.current) {
        requirementsPrefFetchStartedRef.current = true;
        dispatch(fetchTablePreference('requirements'));
      }
    } else {
      requirementsPrefFetchStartedRef.current = false;
    }
    dispatch(fetchRequirementStatuses());
  }, [dispatch, clientsLen, locationsLen, requirementsPrefKeyCount]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadPage1 = async (q: string, clientId: number | undefined, signal?: AbortSignal) => {
    setRequirementsLoading(true);
    try {
      const res = await fetchRequirementsPaged(1, PAGE_SIZE, q, clientId, signal);
      if (signal?.aborted) return;
      const body = res.data as any;
      const data = Array.isArray(body?.data) ? body.data : [];
      setRows(data);
      setHasMore(Boolean(body?.pagination?.hasMore));
      setPage(2);
    } catch (err) {
      if (axios.isCancel(err) || (err as { code?: string })?.code === 'ERR_CANCELED') return;
      setRows([]);
      setHasMore(false);
      setPage(1);
      showErrorSnackbar('Failed to load requirements');
    } finally {
      if (!signal?.aborted) setRequirementsLoading(false);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    loadPage1(debouncedQ, clientFilterId, ac.signal);
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, clientFilterId]);

  const fetchNextPage = async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const res = await fetchRequirementsPaged(page, PAGE_SIZE, debouncedQ, clientFilterId);
      const body = res.data as any;
      const data = Array.isArray(body?.data) ? body.data : [];
      setRows((prev) => [...prev, ...data]);
      setHasMore(Boolean(body?.pagination?.hasMore));
      setPage((p) => p + 1);
    } catch {
      /* keep rows */
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const root = tableScrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchNextPage();
      },
      { root, rootMargin: '120px', threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, page, debouncedQ, clientFilterId]);

  const safeClients = Array.isArray(clients) ? clients : [];
  const clientOptions = [...safeClients].sort((a: any, b: any) =>
    String(a?.clientName ?? '').localeCompare(String(b?.clientName ?? ''), undefined, {
      sensitivity: 'base',
    })
  );

  const handleEdit = (requirement: any) => {
    setSelectedRequirement(requirement);
    setIsEditOpen(true);
  };

  const IcoAddCandidate = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"
      />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 8v6M22 11h-6" />
    </svg>
  );

  const refetchRequirements = () => {
    loadPage1(debouncedQ, clientFilterId);
  };
const handleExport = () => {
  if (!rows || rows.length === 0) {
    showErrorSnackbar('No records to export');
    return;
  }
  exportRequirements(rows);
};

  /** Scalar values for TanStack sorting (accessorKey was wrong: e.g. `client` is an object, `role` is not on the row). */
  const roleSortKey = (row: any) => {
    const raw =
      row?.positionDetails?.positionName ??
      row?.positionDetails?.positionDetails?.positionName ??
      '';
    return String(raw ?? '')
      .trim()
      .toLowerCase();
  };

  const clientSortKey = (row: any) => {
    const raw = row?.client?.clientName || row?.client?.clientProfile?.clientName || '';
    return String(raw).trim().toLowerCase();
  };

  const columns: ColumnDef<any, any>[] = [
    {
      id: 'role',
      accessorFn: (row: any) => roleSortKey(row),
      header: 'Role',
      enableHiding: false,
      cell: ({ row }: any) => {
        const raw =
          row.original?.positionDetails?.positionName ??
          row.original?.positionDetails?.positionDetails?.positionName ??
          '';
        return raw ? toDisplayTitleCase(raw) : '-';
      },
    },
    {
      id: 'client',
      accessorFn: (row: any) => clientSortKey(row),
      header: 'Client Name',
      enableHiding: false,
      cell: ({ row }: any) => {
        const raw =
          row.original?.client?.clientName || row.original?.client?.clientProfile?.clientName || '';
        return raw ? toDisplayTitleCase(raw) : '-';
      },
    },
    {
      id: 'positions',
      accessorFn: (row: any) => {
        const total = Number(row?.noOfPosition);
        return Number.isFinite(total) ? total : 0;
      },
      sortingFn: 'basic',
      header: 'Positions',
      cell: ({ row }: any) => {
        const total = Number(row.original?.noOfPosition);
        const safeTotal = Number.isFinite(total) ? total : 0;
        const filled = Number(row.original?.filledPositions);
        const safeFilled = Number.isFinite(filled) ? filled : 0;


        return (
          <div className="flex flex-col gap-0.5 text-xs">
            <span className="font-medium text-slate-800">
              {safeFilled} / {safeTotal} Closed
            </span>
          </div>
        );
      },
    },
    {
      id: 'location',
      accessorFn: (row: any) => {
        const s = locationsForProfile(row?.client?.id);
        return s === '-' ? '' : s.trim().toLowerCase();
      },
      header: 'Location',
      cell: ({ row }: any) => (
        <span className="max-w-[220px] inline-block text-sm text-gray-700 line-clamp-2">
          {locationsForProfile(row.original?.client?.id)}
        </span>
      ),
    },
    {
      id: 'experience',
      accessorFn: (row: any) => {
        const n = Number(row?.relExp ?? 0);
        return Number.isFinite(n) ? n : 0;
      },
      sortingFn: 'basic',
      header: 'Experience',
      cell: ({ row }: any) => `${row.original?.relExp ?? 0} yrs`,
    },
    {
      id: 'uploadedBy',
      accessorFn: (row: any) => {
        const user = row?.createdBy;
        if (!user) return '';
        return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim().toLowerCase();
      },
      header: 'Uploaded By',
      cell: ({ row }: any) => {
        const user = row.original?.createdBy;
        return user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '-';
      },
    },
    {
  id: 'skills',
  accessorFn: (row: any) =>
    (requirementSkillsDisplay(row?.skillSet) || '').trim().toLowerCase(),

  header: 'Skills',

  cell: ({ row }: any) => {
  const skills = requirementSkillsToArray(row.original?.skillSet);
  const display = requirementSkillsDisplay(row.original?.skillSet);

  const preview =
    skills.length > 3
      ? skills.slice(0, 3).join(', ') + '...'
      : display || '-';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="
              bg-gray-100 px-3 py-1 rounded-lg
              text-xs font-medium text-gray-700
              cursor-pointer truncate max-w-[220px]
            "
          >
            {preview}
          </div>
        </TooltipTrigger>

        <TooltipContent
          side="right"
          className="max-w-sm bg-white border shadow-xl rounded-xl p-3"
        >
          <div className="flex flex-wrap gap-2">
            {skills.map((skill: string, index: number) => (
              <span
                key={index}
                className="
                  px-2 py-1 text-xs
                  bg-blue-50 text-blue-700
                  rounded-md font-medium
                "
              >
                {skill}
              </span>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
},
},
    {
      id: 'date',
      header: 'Date',
      accessorFn: (row: any) => {
        const open = row?.openDate;
        const close = row?.closeDate;
        if (!open && !close) return '';
        const format = (date: string) => {
          const d = new Date(date);
          const day = String(d.getDate()).padStart(2, '0');
          const year = d.getFullYear();
          const month = d.toLocaleString('en-US', { month: 'short' });
          return `${month}-${day}-${year}`;
        };
        if (open && close) return `${format(open)} - ${format(close)}`;
        if (open) return `${format(open)} - Ongoing`;
        if (close) return `Until ${format(close)}`;
        return '';
      },
      sortingFn: (rowA: any, rowB: any, columnId: string) => {
        void columnId;
        const a = parseDateForSort(rowA.original?.openDate ? String(rowA.original.openDate) : '');
        const b = parseDateForSort(rowB.original?.openDate ? String(rowB.original.openDate) : '');
        return a - b;
      },
      cell: ({ row }: any) => {
        const open = row.original?.openDate;
        const close = row.original?.closeDate;
        if (!open && !close) return '-';
        const format = (date: string) => {
          const d = new Date(date);
          const day = String(d.getDate()).padStart(2, '0');
          const year = d.getFullYear();
          const month = d.toLocaleString('en-US', { month: 'short' });
          return `${month}-${day}-${year}`;
        };
        if (open && close) {
          return `${format(open)} - ${format(close)}`;
        }
        if (open) {
          return `${format(open)} - Ongoing`;
        }
        if (close) {
          return `Until ${format(close)}`;
        }
        return '-';
      },
    },
    {
      id: 'status',
      accessorFn: (row: any) =>
        String(row?.status?.statusName ?? '').trim().toLowerCase(),
      header: 'Status',
      cell: ({ row }: any) => {
        const [saving, setSaving] = useState(false);
        const status = row.original?.status?.statusName;
        const statusId = row.original?.status?.id ?? row.original?.statusId;

        const { statuses: requirementStatuses } = useAppSelector(
          (state: RootState) => state?.requirementsSelector
        ) || { statuses: [] };

        const getStyle = (s: string) => {
          if (!s) return 'border-gray-200 bg-gray-50 text-gray-600';
          if (s === 'Active') return 'border-green-200 bg-green-50 text-green-700';
          if (s.includes('Closed')) return 'border-red-200 bg-red-50 text-red-600';
          if (s.includes('Hold')) return 'border-yellow-200 bg-yellow-50 text-yellow-700';
          return 'border-gray-200 bg-gray-50 text-gray-600';
        };

        const handleChange = async (newStatusId: string) => {
          if (newStatusId === String(statusId)) return;
          setSaving(true);
          try {
            const r = row.original;
            const payload = {
              noOfPosition: parseInt(r.noOfPosition, 10),
              positionDetails: { id: r.positionDetails?.id },
              relExp: parseFloat(r.relExp ?? 0),
              client: { id: r.client?.id },
              skillSet: requirementSkillsToArray(r.skillSet),
              isActive: Boolean(r.isActive),
              updatedBy: { id: user?.id ?? 0 },
              statusId: parseInt(newStatusId, 10),  // ← updated
              priority: r.priority || undefined,
            };

            const response = await dispatch(
              updateRequirement({ id: r.id, payload })
            ).unwrap();

            if (response.statusCode === 200) {
              showSuccessSnackbar('Status updated successfully!');
              refetchRequirements();
            } else {
              showErrorSnackbar(response.message || 'Failed to update status');
            }
          } catch {
            showErrorSnackbar('An error occurred while updating status');
          } finally {
            setSaving(false);
          }
        };

        return (
          <Select
            value={statusId ? String(statusId) : ''}
            onValueChange={handleChange}
            disabled={saving}
          >
            <SelectTrigger
              className={cn(
                'h-7 min-w-0 w-fit rounded-md border px-3 text-[11px] font-semibold shadow-none focus:ring-0 focus:ring-offset-0 transition-all',
                '[&>svg]:ml-1 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-60',
                getStyle(status ?? '')
              )}
            >
              {/* Show status name directly instead of relying on SelectValue matching */}
              <span>{status || '-'}</span>
            </SelectTrigger>

            <SelectContent align="center" className="min-w-[8rem]">
              {(requirementStatuses ?? []).map((s: { id: number; statusName: string }) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.statusName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
    {
      id: 'roleType',
      accessorFn: (row: any) => String(row?.roleType ?? '').trim().toLowerCase(),
      header: 'Role Type',
      cell: ({ row }: any) => row.original?.roleType || '-',
    },
    {
      id: 'modeOfWork',
      accessorFn: (row: any) => String(row?.modeOfWork ?? '').trim().toLowerCase(),
      header: 'Mode of Work',
      cell: ({ row }: any) => row.original?.modeOfWork || '-',
    },
    {
      id: 'modeOfInterview',
      accessorFn: (row: any) => String(row?.modeOfInterview ?? '').trim().toLowerCase(),
      header: 'Mode of Interview',
      cell: ({ row }: any) => row.original?.modeOfInterview || '-',
    },
    {
      id: 'salaryBudget',
      accessorFn: (row: any) => String(row?.salaryBudget ?? '').trim().toLowerCase(),
      header: 'Salary Budget',
      cell: ({ row }: any) => row.original?.salaryBudget || '-',
    },
    {
      id: 'accountManager',
      accessorFn: (row: any) => String(row?.accountManager ?? '').trim().toLowerCase(),
      header: 'Account Manager',
      cell: ({ row }: any) => row.original?.accountManager || '-',
    },
    {
      id: 'approvedBy',
      accessorFn: (row: any) => String(row?.approvedBy ?? '').trim().toLowerCase(),
      header: 'Approved By',
      cell: ({ row }: any) => row.original?.approvedBy || '-',
    },
    {
      id: 'reportingManager',
      accessorFn: (row: any) => String(row?.reportingManager ?? '').trim().toLowerCase(),
      header: 'Reporting Manager',
      cell: ({ row }: any) => row.original?.reportingManager || '-',
    },
    {
      id: 'priority',
      accessorFn: (row: any) => String(row?.priority ?? '').trim().toLowerCase(),
      header: 'Todays Priority',
      cell: ({ row }: any) => {
        const [saving, setSaving] = useState(false);
        const priority = row.original?.priority;

        const handleChange = async (newPriority: string) => {
          if (newPriority === priority) return;
          setSaving(true);
          try {
            const r = row.original;
            const payload = {
              noOfPosition: parseInt(r.noOfPosition, 10),
              positionDetails: { id: r.positionDetails?.id },
              relExp: parseFloat(r.relExp ?? 0),
              client: { id: r.client?.id },
              skillSet: requirementSkillsToArray(r.skillSet),
              isActive: Boolean(r.isActive),
              updatedBy: { id: user?.id ?? 0 },
              statusId: r.status?.id ?? r.statusId,
              priority: newPriority,
            };

            const response = await dispatch(
              updateRequirement({ id: r.id, payload })
            ).unwrap();

            if (response.statusCode === 200) {
              showSuccessSnackbar('Priority updated successfully!');
              refetchRequirements();
            } else {
              showErrorSnackbar(response.message || 'Failed to update priority');
            }
          } catch {
            showErrorSnackbar('An error occurred while updating priority');
          } finally {
            setSaving(false);
          }
        };

        return (
          <Select
            value={priority ?? ''}
            onValueChange={handleChange}
            disabled={saving}
          >
            <SelectTrigger
              className={cn(
                'h-7 min-w-0 w-fit rounded-md border px-3 text-[11px] font-semibold shadow-none focus:ring-0 focus:ring-offset-0 transition-all',
                '[&>svg]:ml-1 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-60',

                priority === 'Yes' &&
                  'border-green-200 bg-green-50 text-green-700 hover:bg-green-100',

                priority === 'No' &&
                  'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
                // priority === 'Low' &&
                //   'border-green-200 bg-green-50 text-green-700 hover:bg-green-100',

                !priority &&
                  'border-slate-200 bg-slate-50 text-slate-500'
              )}
            >
              <SelectValue placeholder="-" />
            </SelectTrigger>

            <SelectContent align="center"  className="min-w-[6rem]">
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
              {/* <SelectItem value="Low">Low</SelectItem> */}
            </SelectContent>
          </Select>
        );
      },
    },
    {
  id: 'positionType',
  accessorFn: (row: any) => String(row?.positionType ?? '').trim().toLowerCase(),
  header: 'Position Type',
  cell: ({ row }: any) => {
    const positionType = row.original?.positionType;
    const getStyle = (type: string) => {
      if (!type) return 'bg-gray-100 text-gray-600';
      if (type === 'New') return 'bg-blue-100 text-blue-700';
      if (type === 'Replacement') return 'bg-purple-100 text-purple-700';
      return 'bg-gray-100 text-gray-600';
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${getStyle(positionType)}`}>
        {positionType || '-'}
      </span>
    );
  },
},
    {
      id: 'actions',
      header: 'Actions',
      enableHiding: false,
      cell: ({ row }: any) => {
        const r = row.original;
        const hasJrf = Boolean(r?.jrfS3Key);
        return (
          <div className="flex items-center gap-2">
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-3 px-2">
              {hasJrf ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FileText
                      className="w-4 h-4 text-slate-600 cursor-pointer hover:scale-110 transition-transform"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setPreviewRequirement({
                          id: r.id,
                          roleName:
                            r?.positionDetails?.positionName ??
                            r?.positionDetails?.positionDetails?.positionName ??
                            'Requirement',
                          fileKey: r?.jrfS3Key ?? null,
                        });
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top"><p>View JRF</p></TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <label
                      className="cursor-pointer inline-flex"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Upload className="w-4 h-4 text-gray-400 hover:text-blue-500 hover:scale-110 transition cursor-pointer" />
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.currentTarget.value = '';
                          if (!file) return;
                          try {
                            const res = await uploadJD(file);
                            const nextKey = (res.data as any)?.data?.jrfS3Key;
                            if (typeof nextKey === 'string' && nextKey.trim()) {
                              const updateRes = await dispatch(
                                updateRequirementJrfKey({
                                  id: r.id,
                                  payload: {
                                    jrfS3Key: nextKey.trim(),
                                    updatedBy: { id: user?.id },
                                  },
                                })
                              ).unwrap();
                              if (updateRes?.success) {
                                showSuccessSnackbar('JRF uploaded successfully');
                                setRows((prev) =>
                                  prev.map((row) =>
                                    row.id === r.id
                                      ? { ...row, jrfS3Key: nextKey.trim() }
                                      : row
                                  )
                                );
                              } else {
                                showErrorSnackbar('Failed to save JRF');
                              }
                            } else {
                              showErrorSnackbar('Upload completed but no S3 key returned');
                            }
                          } catch {
                            showErrorSnackbar('Failed to upload JRF');
                          }
                        }}
                      />
                    </label>
                  </TooltipTrigger>
                  <TooltipContent side="top"><p>Upload JRF</p></TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <EditIcon
                    className="w-4 h-4 text-blue-500 cursor-pointer hover:scale-110 transition-transform"
                    onClick={() => handleEdit(r)}
                  />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Edit</p>
                </TooltipContent>
              </Tooltip>

              {user?.role?.id !== Roles.ACCOUNT_MANAGER && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <IcoAddCandidate
                      className="w-4 h-4 text-green-500 cursor-pointer hover:scale-110 transition-transform"
                      onClick={() => {
                        setSelectedRequirementForCandidate(r);
                        setIsAddCandidateOpen(true);
                      }}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Add Candidate</p>
                </TooltipContent>
              </Tooltip>
            )}
            </div>
          </TooltipProvider>
          </div>
        );
      },
    },
  ];

  return (
    <LayoutContainer>
      <main>
        <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-[var(--brand)]">Requirement Management</h1>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Role, client, skills, status, uploader…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>

          <Select
            value={clientFilterId == null ? 'all' : String(clientFilterId)}
            onValueChange={(v) => setClientFilter(v === 'all' ? undefined : Number(v))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              {clientOptions.map((c: any) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {toDisplayTitleCase(c.clientName ?? '') || `Client ${c.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
            {/* ── Export button ── */}
          <Button
            onClick={handleExport}
            className="bg-[var(--brand)] hover:bg-text-white"
          >
            <Upload className="mr-2 h-4 w-4" /> Export
          </Button>

          <Button
            onClick={() => {
              setIsAddOpen(true);
            }}
            className="bg-[var(--brand)] hover:bg-text-white"
          >
            <PlusIcon className="mr-2 h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <TableContentLoader loading={requirementsLoading} label="Loading requirements…">
            <DataTable
              columns={columns}
              data={rows}
              tableName="requirements"
              preferences={preferences}
              defaultVisibility={{  
                role:             true,
                client:           true,
                positions:        true,
                location:         true,
                experience:       true,
                skills:           true,
                date:             true,
                status:           true,
                uploadedBy:       true,
                actions:          true,
                roleType:         false,
                modeOfWork:       false,
                modeOfInterview:  false,
                salaryBudget:     false,
                accountManager:   false,
                approvedBy:       false,
                reportingManager: false,
                priority:         false,
                positionType:     false,
              }}
              scrollContainerRef={(el) => {
                tableScrollRef.current = el;
              }}
              afterTableContent={
                <div>
                  <div
                    ref={(el) => {
                      sentinelRef.current = el;
                    }}
                    className="h-1"
                  />
                  {loadingMore && (
                    <div className="py-3 text-center text-xs text-slate-500">Loading more…</div>
                  )}
                  {!hasMore && rows.length > 0 && !requirementsLoading && (
                    <div className="py-3 text-center text-xs text-slate-400">
                      All {rows.length} record{rows.length !== 1 ? 's' : ''} loaded.
                    </div>
                  )}
                </div>
              }
            />
          </TableContentLoader>
        </CardContent>
      </Card>
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-7xl p-0">
          <AddClientWithRequirementStepper
            isOpen={isAddOpen}
            onClose={() => {
              setIsAddOpen(false);
              refetchRequirements();
            }}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={isAddCandidateOpen} onOpenChange={setIsAddCandidateOpen}>
        <DialogContent className="max-w-6xl">
          <ResumeParser
            open={isAddCandidateOpen}
            requirement={selectedRequirementForCandidate}
            onClose={() => setIsAddCandidateOpen(false)}
            onRequirementUpdate={refetchRequirements}
          />
        </DialogContent>
      </Dialog>

      {selectedRequirement && (
        <EditRequirementForm
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedRequirement(null);
          }}
          requirement={selectedRequirement}
          showSuccessSnackbar={showSuccessSnackbar}
          showWarningSnackbar={showWarningSnackbar}
          showErrorSnackbar={showErrorSnackbar}
          refetchRequirements={refetchRequirements}
        />
      )}

      <DocumentPreviewDialog
        open={Boolean(previewRequirement)}
        onOpenChange={(open) => {
          if (!open) setPreviewRequirement(null);
        }}
        title={
          previewRequirement
            ? `JRF Preview${previewRequirement.roleName ? ` · ${toDisplayTitleCase(previewRequirement.roleName)}` : ''}`
            : 'JRF Preview'
        }
        fileKey={previewRequirement?.fileKey}
        fetchDocument={() => {
          if (!previewRequirement) {
            throw new Error('No requirement selected for preview');
          }
          return fetchRequirementJrfFile(previewRequirement.id);
        }}
        showError={showErrorSnackbar}
      />

      <CustomizedSnackbars {...snackbarState} handleClose={handleSnackbarClose} />
    </main>
    </LayoutContainer>

  );
};

export default RequirementsManagement;
