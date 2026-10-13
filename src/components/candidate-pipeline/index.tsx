import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutContainer } from '../../styles/LayoutContainer';
import axios from 'axios';
import { Loader2, Users, Briefcase, X, Upload } from 'lucide-react';
import { fetchCandidateStatuses, fetchCandidateAggregates, fetchFilterOptions } from '../../store/services/candidate-status';
import type { CandidateStatusListItem, CandidateStatusListApiBody, AggregatesApiBody, AggregateItem, FilterOptionsApiBody } from '../../store/model/candidate-status-list.types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { RejectReasonDialog } from '../resume-parser/candidate/RejectReasonDialog';
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '../../store';
import { RootState } from '../../store/reducers';
import { fetchStatus } from '../../store/action/status.action';
import { UpdateCandidateInd } from '../../store/action/candidate.action';
import { DataTable } from '../customized-table';
import { fetchTablePreference } from '../../store/action/table-preference.action';
import EditCandidateForm, { CandidateEditProps } from '../people/edit-people';
import { fetchCandidateMappings } from '../../store/action/candidate.action';
import { getCandidateByIds, getCandidateMappings, getCandidateStatusHistoryApi } from '../../store/services/candidate';
import type { CandidateStatusHistoryEntry } from '../../store/model/candidate.types';
import { useInterviewSchedule } from '../../hooks/useInterviewSchedule';
import { InterviewScheduleDialog } from '../resume-parser/candidate/InterviewScheduleDialog';
import { useSnackbar } from '../../utils/snackbar-function';
import CustomizedSnackbars from '../customized-snackbar';
import { Roles } from '../../constants';
import { fetchAllUsers } from '../../store/action/users.action';
import { getUserNameEmail } from '../../utils/user-name';
import type { User } from '../../store/model';
import PipelineFilterBar from './PipelineFilterBar';
import { JoinedDialog } from '../resume-parser/candidate/JoinedDialog';
import { Button } from '../ui/button';
import React from 'react';
import PipelineExportDialog from './PipelineExportDialog';
import { aggregateColumns, buildAssignmentColumns } from './pipeline-columns';
import { ReassignDialog, ProcessHistoryDialog } from './pipeline-dialogs';
// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;
const TABLE_SCROLL_MAX = 'min(520px, calc(100vh - 300px))';

// ─── SearchableSelect ─────────────────────────────────────────────────────────
// A reusable Popover+Command combobox (search input + filtered dropdown)
interface SelectOption {
  id: number;
  label: string;
  avatarUserId?: number;
  avatarImageURL?: string;
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Filters {
  clientId: number | undefined;
  requirementId: number | undefined;
  statusId: number | undefined;
  userId: number | undefined;
  q: string;
  fromDate: string | undefined;
  toDate: string | undefined;
}

export default function CandidatePipeline() {
  // ── Grid state ─────────────────────────────────────────────────────────────
  const [rows, setRows] = useState<CandidateStatusListItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAssign, setPendingAssign] = useState<{
    row: CandidateStatusListItem;
    nextId: number;
    nextLabel: string;
  } | null>(null);
  // ── Aggregates (left panel) ────────────────────────────────────────────────
  const [aggregates, setAggregates] = useState<AggregateItem[]>([]);
  const [aggLoading, setAggLoading] = useState(false);

  // ── Filter dropdown options ────────────────────────────────────────────────
  const [clientOptions, setClientOptions] = useState<SelectOption[]>([]);
  const [requirementOptions, setRequirementOptions] = useState<SelectOption[]>([]);

  // ── Active filters ─────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<Filters>({
    clientId: undefined,
    requirementId: undefined,
    statusId: undefined,
    userId: undefined,
    q: '',
    fromDate: undefined,
    toDate: undefined,
  });
  // Debounced version of search text — only triggers API after user stops typing
  const [debouncedQ, setDebouncedQ] = useState('');
  // ── Refs ───────────────────────────────────────────────────────────────────
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Guard: prevent StrictMode double-invocation from firing duplicate API calls
  const initDone = useRef(false);
  // Track latest filter snapshot for infinite scroll (avoids stale closures)
  const filtersRef = useRef<Filters>(filters);
  const debouncedQRef = useRef(debouncedQ);
  const pendingRowRef = useRef<{
    row: CandidateStatusListItem;
    nextId: number;
    nextName: string;
  } | null>(null);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    debouncedQRef.current = debouncedQ;
  }, [debouncedQ]);

  const dispatch = useDispatch<AppDispatch>();
  // Status master list comes from Redux (ALL statuses, not just ones in ta_candidate_status)
  const { status: allStatuses } = useAppSelector((state: RootState) => state?.statusSelector);
  const { user } = useAppSelector((state: RootState) => state?.authSelector);
  const { users } = useAppSelector((state: RootState) => state?.usersSelector);
  const {
    handleStatusChange: _unused,
    interviewDialogProps,
    rejectDialogProps,
    joinedDialogProps,
  } = useInterviewSchedule({
    statuses: (allStatuses ?? []).map((s: any) => ({ id: s.id, statusName: s.statusName })),
    onNewStatusChange: () => {}, // not used in pipeline mode
    onExistingStatusChange: () => {}, // not used in pipeline mode
    onConfirmRaw: (iso) => {
      if (!pendingRowRef.current) return;
      const { row, nextId, nextName } = pendingRowRef.current;
      pendingRowRef.current = null;
      void handleRowStatusChange(row, nextId, nextName, iso);
    },
    onConfirmReject: (reason) => {
      if (!pendingRowRef.current) return;
      const { row, nextId, nextName } = pendingRowRef.current;
      pendingRowRef.current = null;
      void handleRowStatusChange(row, nextId, nextName, undefined, undefined, reason);
    },
    onConfirmJoined: (joiningDateIso) => {
      if (!pendingRowRef.current) return;
      const { row, nextId, nextName } = pendingRowRef.current;
      pendingRowRef.current = null;
      void handleRowStatusChange(row, nextId, nextName, undefined, joiningDateIso);
    },
  });
  const tablePrefState = useAppSelector((state: RootState) => state?.tablePreference);
  // const preferences = tablePrefState?.preferences || {};
  // Fix preferences reference instability
  const preferences = useMemo(
    () => tablePrefState?.preferences || {},
    [tablePrefState?.preferences]
  );

  // ── Edit candidate modal (reuses the same modal as Candidate Management) ───
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editCandidate, setEditCandidate] = useState<CandidateEditProps | null>(null);
  // ── Process history modal (requirement-focused) ────────────────────────────
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<CandidateStatusHistoryEntry[]>([]);
  const [historyMappings, setHistoryMappings] = useState<any[]>([]);
  const [historyCandidateId, setHistoryCandidateId] = useState<number | null>(null);
  const [historyRequirementId, setHistoryRequirementId] = useState<number | null>(null);
  const [historyCandidateName, setHistoryCandidateName] = useState<string>('');
  // ── Status dropdown options derived from Redux master list ────────────────
  const statusOptions: SelectOption[] = (allStatuses ?? []).map((s: any) => ({
    id: s.id,
    label: s.statusName,
  }));
  const userOptions: SelectOption[] = (users ?? [])
    .filter((u: User) => u.role?.id !== Roles.ACCOUNT_MANAGER)
    .map((u: User) => ({
      id: u.id,
      label: getUserNameEmail(u),
      avatarUserId: u.id,
      avatarImageURL: u.imageURL ?? undefined,
    }));
  const handleAssignedToChange = (id: number | undefined) => {
    setFilters((f) => ({ ...f, userId: id }));
  };
  const [pipelineExportOpen, setPipelineExportOpen] = useState(false);
  const init = useCallback(async () => {
    if (initDone.current) return;
    initDone.current = true;

    // 1. Status master list (independent — all statuses regardless of pipeline)
    dispatch(fetchStatus());
    dispatch(fetchAllUsers());
    // Table prefs (column visibility + resizes are client-side)
    dispatch(fetchTablePreference('pipeline_aggregates'));
    dispatch(fetchTablePreference('pipeline_assignments'));

    // 2. Client + requirement filter options (no clientId scope = all)
    try {
      const res = await fetchFilterOptions(undefined);
      const body = res.data as FilterOptionsApiBody;
      if (body?.success && body.data) {
        setClientOptions(body.data.clients.map((c) => ({ id: c.id, label: c.clientName })));
        setRequirementOptions(
          body.data.requirements.map((r) => ({ id: r.id, label: r.positionName }))
        );
      }
    } catch {
      /* non-critical */
    }

    // 3. Initial grid page
    await loadPage1Internal(undefined, undefined, undefined, undefined, '', undefined, undefined);

    // 4. Initial aggregates
    await loadAggregatesInternal(undefined, undefined, undefined, undefined, '', undefined, undefined);
  }, [dispatch]);

  useEffect(() => {
    init();
  }, [init]);

  // ─────────────────────────────────────────────────────────────────────────
  // When client changes → re-scope the requirements dropdown
  // ─────────────────────────────────────────────────────────────────────────
  const prevClientIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!initDone.current) return; // skip until after init
    if (prevClientIdRef.current === filters.clientId) return;
    prevClientIdRef.current = filters.clientId;

    fetchFilterOptions(filters.clientId)
      .then((res) => {
        const body = res.data as FilterOptionsApiBody;
        if (body?.success && body.data) {
          setRequirementOptions(
            body.data.requirements.map((r) => ({ id: r.id, label: r.positionName }))
          );
        }
      })
      .catch(() => {});
  }, [filters.clientId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Debounce: search text → debouncedQ
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(filters.q), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [filters.q]);

  // ─────────────────────────────────────────────────────────────────────────
  // Re-fetch page 1 whenever any filter (or debounced search) changes
  // (skips the very first render — init() already handles that)
  // ─────────────────────────────────────────────────────────────────────────
  const isFirstFilterRun = useRef(true);

  useEffect(() => {
    if (!initDone.current) return;
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false;
      return;
    }

    loadPage1Internal(
      filters.clientId, filters.requirementId, filters.statusId, filters.userId,
      debouncedQ, filters.fromDate, filters.toDate
    );
    loadAggregatesInternal(
      filters.clientId, filters.requirementId, filters.statusId, filters.userId,
      debouncedQ, filters.fromDate, filters.toDate
    );
  }, [
    filters.clientId, filters.requirementId, filters.statusId, filters.userId,
    filters.fromDate, filters.toDate, debouncedQ,
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // Grid fetchers (plain async functions — no hooks, avoids callback dep hell)
  // ─────────────────────────────────────────────────────────────────────────
  async function loadPage1Internal(
    clientId: number | undefined,
    requirementId: number | undefined,
    statusId: number | undefined,
    userId: number | undefined,
    q: string,
    fromDate?: string,
    toDate?: string
  ) {
    setLoading(true);
    setError(null);
    setRows([]);
    setPage(1);
    setHasMore(false);
    setTotal(0);

    try {
      const res = await fetchCandidateStatuses(1, PAGE_SIZE, {
        clientId, requirementId, statusId, userId,
        q: q || undefined,
        fromDate, toDate,
      });
      const body = res.data as CandidateStatusListApiBody;
      if (!body?.success || !Array.isArray(body.data)) {
        setError(body?.message || 'Unexpected response from server');
        return;
      }
      // setRows(body.data);
      setRows(body.data.filter((item: CandidateStatusListItem) => item.requirementDetails?.id));
      setTotal(
        body.data.filter((item: CandidateStatusListItem) => item.requirementDetails?.id).length ?? 0
      );
      setHasMore(body.pagination?.hasMore ?? false);
      setPage(2);
    } catch (e: unknown) {
      let msg = 'Failed to load candidate pipeline';
      if (axios.isAxiosError(e)) {
        const d = e.response?.data as { message?: string } | undefined;
        msg = d?.message || e.message || msg;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function loadAggregatesInternal(
    clientId: number | undefined,
    requirementId: number | undefined,
    statusId: number | undefined,
    userId: number | undefined,
    q: string,
    fromDate?: string,
    toDate?: string
  ) {
    setAggLoading(true);
    try {
      const res = await fetchCandidateAggregates({
        clientId, requirementId, statusId, userId,
        q: q || undefined,
        fromDate, toDate,
      });
      const body = res.data as AggregatesApiBody;
      if (body?.success) setAggregates(body.data ?? []);
    } finally {
      setAggLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Infinite scroll — fetch next page
  // ─────────────────────────────────────────────────────────────────────────
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(false);
  const pageRef = useRef(2);

  // Keep scroll refs in sync with state
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const fetchNextPage = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const f = filtersRef.current;
      const q = debouncedQRef.current;
      const res = await fetchCandidateStatuses(pageRef.current, PAGE_SIZE, {
        clientId: f.clientId,
        requirementId: f.requirementId,
        statusId: f.statusId,
        userId: f.userId,
        q: q || undefined,
        fromDate: f.fromDate,
        toDate: f.toDate,
      });
      const body = res.data as CandidateStatusListApiBody;
      if (body?.success && Array.isArray(body.data)) {
        setRows((prev) => [...prev, ...body.data]);
        setHasMore(body.pagination?.hasMore ?? false);
        pageRef.current = pageRef.current + 1;
        setPage(pageRef.current);
      }
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  // IntersectionObserver — fires fetchNextPage when sentinel enters viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchNextPage();
      },
      { root: tableScrollRef.current, rootMargin: '80px', threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage]);

  // ─────────────────────────────────────────────────────────────────────────
  // Filter change handlers
  // ─────────────────────────────────────────────────────────────────────────
  const handleClientChange = (id: number | undefined) => {
    setFilters({
      clientId: id,
      requirementId: undefined,
      statusId: undefined,
      userId: undefined,
      q: filters.q,
      fromDate: undefined,
      toDate: undefined,
    });
  };

  const handleRequirementChange = (id: number | undefined) => {
    setFilters((f) => ({ ...f, requirementId: id, statusId: undefined }));
  };

  const handleStatusChange = (id: number | undefined) => {
    setFilters((f) => ({ ...f, statusId: id }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Optimistic inline status update
  // ─────────────────────────────────────────────────────────────────────────
  const { snackbarState, showErrorSnackbar, handleSnackbarClose } = useSnackbar();
  const handleRowStatusChange = useCallback(
    async (
      r: CandidateStatusListItem,
      newStatusId: number,
      newStatusName: string,
      scheduledInterviewAtIso?: string,
      joiningDateIso?: string,
      rejectReason?: string
    ) => {
      const JOINED_STATUS_ID = 63;
      const candidateId = r.candidate?.id;
      const actorId = user?.id;

      if (!candidateId || candidateId < 1) {
        return;
      }
      if (!actorId || actorId < 1) {
        return;
      }

      // Optimistic update
      setRows((prev) =>
        prev.map((row) =>
          row.id === r.id ? { ...row, status: { id: newStatusId, statusName: newStatusName } } : row
        )
      );

      try {
        const response = await dispatch(
          UpdateCandidateInd({
            id: candidateId,
            payload: {
              updatedBy: { id: actorId },
              requirementMappings: [
                {
                  requirementId: r.requirementDetails?.id,
                  clientId: r.client?.id,
                  statusId: newStatusId,
                  ...(scheduledInterviewAtIso
                    ? { scheduledInterviewAt: scheduledInterviewAtIso }
                    : {}),
                  ...(joiningDateIso ? { joiningDate: joiningDateIso } : {}),
                  ...(rejectReason ? { rejectReason } : {}),
                },
              ],
            } as any,
          })
        ).unwrap();
        // ← Permission denied (403)
        if (response.statusCode === 403) {
          const res = response as any;
          const errorMsg = res.mappingResult?.errors?.[0] ?? res.message ?? 'Permission Denied';

          showErrorSnackbar(errorMsg);
          setRows((prev) =>
            prev.map((row) => (row.id === r.id ? { ...row, status: r.status } : row))
          );
          return;
        }

        if (response.statusCode !== 200) {
          showErrorSnackbar(response.message || 'Failed to update status');
          // Revert on failure
          setRows((prev) =>
            prev.map((row) => (row.id === r.id ? { ...row, status: r.status } : row))
          );
        } else {
          const prevStatusId = r.status?.id;
          const isJoinedChange =
            newStatusId === JOINED_STATUS_ID || prevStatusId === JOINED_STATUS_ID;

          if (isJoinedChange) {
            await loadAggregatesInternal(
              filtersRef.current.clientId,
              filtersRef.current.requirementId,
              filtersRef.current.statusId,
              filtersRef.current.userId,
              debouncedQRef.current,
              filtersRef.current.fromDate,  
              filtersRef.current.toDate 
            );
            await loadPage1Internal(
              filtersRef.current.clientId,
              filtersRef.current.requirementId,
              filtersRef.current.statusId,
              filtersRef.current.userId,
              debouncedQRef.current,
              filtersRef.current.fromDate,  
              filtersRef.current.toDate 
            );
          }
        }
      } catch {
        showErrorSnackbar('An error occurred while updating status');
        // Revert on error
        setRows((prev) =>
          prev.map((row) => (row.id === r.id ? { ...row, status: r.status } : row))
        );
      }
    },
    [dispatch, user, showErrorSnackbar] // ← add showErrorSnackbar to deps
  );

  const handleRowAssignedToChange = useCallback(
    async (r: CandidateStatusListItem, newAssignedToId: number) => {
      const candidateId = r.candidate?.id;
      const actorId = user?.id;

      if (!candidateId || candidateId < 1) {
        return;
      }
      if (!actorId || actorId < 1) {
        return;
      }

      // Optimistic update
      setRows((prev) =>
        prev.map((row) => (row.id === r.id ? { ...row, assignedTo: { id: newAssignedToId } } : row))
      );

      try {
        const response = await dispatch(
          UpdateCandidateInd({
            id: candidateId,
            payload: {
              updatedBy: { id: actorId },
              requirementMappings: [
                {
                  requirementId: r.requirementDetails?.id,
                  clientId: r.client?.id,
                  assignedTo: newAssignedToId,
                },
              ],
            } as any,
          })
        ).unwrap();

        if (response.statusCode === 403) {
          const res = response as any;
          const errorMsg = res.mappingResult?.errors?.[0] ?? res.message ?? 'Permission Denied';

          showErrorSnackbar(errorMsg);
          setRows((prev) =>
            prev.map((row) => (row.id === r.id ? { ...row, assignedTo: r.assignedTo } : row))
          );
          return;
        }

        if (response.statusCode !== 200) {
          showErrorSnackbar(response.message || 'Failed to update assigned user');
          // Revert on failure
          setRows((prev) =>
            prev.map((row) => (row.id === r.id ? { ...row, assignedTo: r.assignedTo } : row))
          );
        } else {
          // Full refresh after assignedTo update (safest - no stale state possible)
          await Promise.all([
            loadAggregatesInternal(
              filtersRef.current.clientId,
              filtersRef.current.requirementId,
              filtersRef.current.statusId,
              filtersRef.current.userId,
              debouncedQRef.current,
              filtersRef.current.fromDate,  
              filtersRef.current.toDate 
            ),
            loadPage1Internal(
              filtersRef.current.clientId,
              filtersRef.current.requirementId,
              filtersRef.current.statusId,
              filtersRef.current.userId,
              debouncedQRef.current,
              filtersRef.current.fromDate,  
              filtersRef.current.toDate 
            ),
          ]);
        }
      } catch {
        showErrorSnackbar('An error occurred while updating assigned user');
        // Revert on error
        setRows((prev) =>
          prev.map((row) => (row.id === r.id ? { ...row, assignedTo: r.assignedTo } : row))
        );
      }
    },
    [dispatch, user, showErrorSnackbar]
  );

  const openEditCandidate = useCallback(
    async (candidateId: number | undefined) => {
      if (!candidateId) return;
      try {
        const [candidateRes, mappingsRes] = await Promise.all([
          getCandidateByIds(candidateId),
          dispatch(fetchCandidateMappings({ id: candidateId }))
            .unwrap()
            .catch(() => ({ data: [] })),
        ]);

        const body = candidateRes?.data as any;
        const c = body?.data ?? body ?? {};
        const existingMappings = (mappingsRes as any)?.data ?? [];

        const safeCandidate: CandidateEditProps = {
          id: c?.id ?? candidateId,
          source: c?.source ?? '',
          date: c?.date ?? '',
          sourceDate: c?.sourceDate ?? '',       
          dateOfJoining: c?.dateOfJoining ?? '',  
          candidateName: c?.candidateName ?? '',
          primaryContact: c?.primaryContact ?? '',
          emailId: c?.emailId ?? '',
          candidateLocation: c?.candidateLocation ?? '',
          totalExp: c?.totalExp ?? '',
          relExp: c?.relExp ?? '',
          skillSet: c?.skillSet ?? [],
          currentSalary: c?.currentSalary ?? '',
          expectedSalary: c?.expectedSalary ?? '',
          noticePeriod: c?.noticePeriod ?? '',
          remarks: c?.remarks ?? '',
          uploadedBy: { id: c?.uploadedBy?.id ?? user?.id ?? 0 },
          existingMappings: Array.isArray(existingMappings) ? existingMappings : [],
          requirementId: '',
          candidateStatusId: '',
        };

        setEditCandidate(safeCandidate);
        setIsEditFormOpen(true);
      } catch {
        // Silently fail; edit modal requires a full candidate payload.
      }
    },
    [dispatch, user?.id]
  );

  const openProcessHistory = useCallback(async (r: CandidateStatusListItem) => {
    const candidateId = r?.candidate?.id;
    const requirementId = r?.requirementDetails?.id;
    if (!candidateId || !requirementId) return;

    setIsHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryEntries([]);
    setHistoryMappings([]);
    setHistoryCandidateId(candidateId);
    setHistoryRequirementId(requirementId);
    setHistoryCandidateName(r?.candidate?.candidateName ?? '');

    try {
      const [histRes, mapRes] = await Promise.all([
        getCandidateStatusHistoryApi(candidateId, 200),
        getCandidateMappings(candidateId),
      ]);

      const histBody = histRes?.data as any;
      const histData: CandidateStatusHistoryEntry[] = Array.isArray(histBody?.data)
        ? histBody.data
        : Array.isArray(histBody)
          ? histBody
          : [];
      setHistoryEntries(histData.filter((e) => e.requirementId === requirementId));

      const mapBody = mapRes?.data as any;
      setHistoryMappings(Array.isArray(mapBody?.data) ? mapBody.data : []);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const refreshHistory = useCallback(async () => {
    if (!historyCandidateId || !historyRequirementId) return;
    try {
      const [histRes, mapRes] = await Promise.all([
        getCandidateStatusHistoryApi(historyCandidateId, 200),
        getCandidateMappings(historyCandidateId),
      ]);
      const histBody = histRes?.data as any;
      const histData: CandidateStatusHistoryEntry[] = Array.isArray(histBody?.data)
        ? histBody.data
        : Array.isArray(histBody)
          ? histBody
          : [];
      setHistoryEntries(histData.filter((e) => e.requirementId === historyRequirementId));
      const mapBody = mapRes?.data as any;
      setHistoryMappings(Array.isArray(mapBody?.data) ? mapBody.data : []);
    } catch {
      // keep current view
    }
  }, [historyCandidateId, historyRequirementId]);

  const historyGroup = useCallback(() => {
    if (!historyRequirementId) return null;
    if (!historyEntries.length) return null;

    const steps = historyEntries.map((entry) => ({
      statusName: entry.changedFields?.after?.statusName ?? null,
      prevStatusName: entry.changedFields?.before?.statusName ?? null,
      changedAt: entry.changedAt,
      changedByName: entry.changedByName,
      operation: entry.operation as 'CREATE' | 'UPDATE',
    }));

    const latest = historyEntries[historyEntries.length - 1];
    return {
      requirementId: historyRequirementId,
      clientName: latest?.clientName ?? '',
      positionName: latest?.positionName ?? '',
      steps,
    };
  }, [historyEntries, historyRequirementId]);
  const filteredRows = useMemo(
    () =>
      filters.userId !== undefined ? rows.filter((r) => r.assignedTo?.id === filters.userId) : rows,
    [rows, filters.userId]
  );
  const isValidAgg = (agg: AggregateItem) => {
    const pos = agg.positionName?.trim();
    const client = agg.clientName?.trim();
    return pos && pos !== '—' && client && client !== '—';
  };
  const filteredAggregates = useMemo(
    () =>
      filters.userId !== undefined
        ? aggregates
            .filter(isValidAgg)
            .filter((agg) =>
              filteredRows.some(
                (r) =>
                  r.requirementDetails?.positionDetails?.positionName?.toLowerCase() ===
                    agg.positionName?.toLowerCase() &&
                  r.client?.clientName?.toLowerCase() === agg.clientName?.toLowerCase()
              )
            )
            .map((agg) => ({
              ...agg,
              count: filteredRows.filter(
                (r) =>
                  r.requirementDetails?.positionDetails?.positionName?.toLowerCase() ===
                    agg.positionName?.toLowerCase() &&
                  r.client?.clientName?.toLowerCase() === agg.clientName?.toLowerCase()
              ).length,
            }))
        : aggregates.filter(isValidAgg),
    [aggregates, filteredRows, filters.userId]
  );
  const assignmentColumns = useMemo(
    () =>
      buildAssignmentColumns({
        user,
        allStatuses: allStatuses ?? [],
        users: users ?? [],
        pendingRowRef,
        handleStatusChangeTrigger: _unused,
        handleRowStatusChange,
        setPendingAssign,
        openEditCandidate,
      }),
    [user, allStatuses, users, handleRowStatusChange, openEditCandidate]
  );
  const handleDateRangeChange = (fromDate: string | undefined, toDate: string | undefined) => {
    setFilters((prev) => ({ ...prev, fromDate, toDate }));
  };
  const handleClearFilters = () => {
  setFilters({
    clientId: undefined,
    requirementId: undefined,
    statusId: undefined,
    userId: undefined,
    q: filters.q, 
    fromDate: undefined,
    toDate: undefined,
  });
};
  // Render
  return (
    <LayoutContainer>
      <main>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-[var(--brand)]">Master Tracker</h1>
          <div className="flex items-center gap-3">
            {/* Free-text search */}
            <div className="relative">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>

              <Input
                className="bg-white pl-8 pr-8 w-[300px]"
                placeholder="Search name, email, client, role…"
                value={filters.q}
                onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              />

              {filters.q && (
                <button
                  type="button"
                  onClick={() => setFilters((f) => ({ ...f, q: '' }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Export Button */}
            <Button
              onClick={() => setPipelineExportOpen(true)}
              className="bg-[var(--brand)] hover:bg-[var(--brand)] text-white whitespace-nowrap"
            >
              <Upload className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
        {/* Filter bar */}
        <PipelineFilterBar
          filters={filters}
          clientOptions={clientOptions}
          requirementOptions={requirementOptions}
          statusOptions={statusOptions}
          userOptions={userOptions}
          initDone={initDone.current}
          onClientChange={handleClientChange}
          onRequirementChange={handleRequirementChange}
          onStatusChange={handleStatusChange}
          onAssignedToChange={handleAssignedToChange}
          onDateRangeChange={handleDateRangeChange}
          onClearFilters={handleClearFilters}
        />
        {/* Error */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 text-red-900 text-sm px-4 py-3">
            {error}
          </div>
        )}
        {/* Two-panel layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-start min-h-0 pt-2 m-1 ">
          {/* Left: Aggregates */}
          <Card className="lg:col-span-1 border-slate-200 shadow-[0_0_2px_rgba(0,0,0,0.15)] flex flex-col min-h-0 min-w-0">
            <CardHeader className="px-4 sm:px-5 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#2a4365]" />
                <CardTitle className="text-base font-medium">Candidates per requirement</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-5 pb-4 pt-0 flex-1 min-h-0 flex flex-col">
              {aggLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : aggregates.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">
                  No rows match the current filters.
                </p>
              ) : (
                <div className="rounded-md border border-slate-200 bg-white min-h-0">
                  <DataTable
                    tableName="pipeline_aggregates"
                    preferences={preferences}
                    minHeightPx={280}
                    scrollMaxHeight={TABLE_SCROLL_MAX}
                    initialSorting={[{ id: 'count', desc: true }]}
                    // columns={aggregateColumns}
                    columns={aggregateColumns}
                    data={filteredAggregates}
                  />
                </div>
              )}
            </CardContent>
          </Card>
          {/* Right: Candidate assignments (infinite scroll) */}
          <Card className="lg:col-span-2 border-slate-200 shadow-[0_0_2px_rgba(0,0,0,0.15)] flex flex-col min-h-0 min-w-0">
            <CardHeader className="px-4 sm:px-5 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#2a4365]" />
                <CardTitle className="text-base font-medium">Candidate assignments</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-5 pb-4 pt-0 flex-1 min-h-0 flex flex-col">
              {loading && rows.length === 0 ? (
                <div className="flex items-center justify-center py-24 text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin mr-2" />
                  Loading…
                </div>
              ) : (
                <div className="rounded-md border border-slate-200 bg-white min-h-0">
                  <DataTable
                    tableName="pipeline_assignments"
                    preferences={preferences}
                    initialSorting={[{ id: 'updatedAt', desc: true }]}
                    scrollMaxHeight={TABLE_SCROLL_MAX}
                    onRowClick={(r: CandidateStatusListItem) => {
                      openProcessHistory(r);
                    }}
                    scrollContainerRef={(el) => {
                      (tableScrollRef as React.MutableRefObject<HTMLDivElement | null>).current =
                        el;
                    }}
                    afterTableContent={
                      <div>
                        <div ref={sentinelRef} className="h-1" />
                        {loadingMore && (
                          <div className="flex items-center justify-center py-4 text-slate-400">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            <span className="text-sm">Loading more…</span>
                          </div>
                        )}
                        {!hasMore && rows.length > 0 && !loading && (
                          <p className="text-center text-xs text-slate-400 py-3">
                            {filters.userId !== undefined
                              ? `Showing ${rows.filter((r) => r.assignedTo?.id === filters.userId).length} of ${total} record${total !== 1 ? 's' : ''}`
                              : `All ${total} record${total !== 1 ? 's' : ''} loaded.`}
                          </p>
                        )}
                      </div>
                    }
                    // columns={assignmentColumns}
                    columns={assignmentColumns}
                    data={filteredRows}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {editCandidate && user && (
          <EditCandidateForm
            isOpen={isEditFormOpen}
            onOpenChange={setIsEditFormOpen}
            candidate={editCandidate}
            user={user}
            onSuccess={(apiResponse) => {
              const updated = (apiResponse as any)?.data as any;
              if (!updated?.id) return;
              setRows((prev) =>
                prev.map((row) =>
                  row?.candidate?.id === updated.id
                    ? {
                        ...row,
                        candidate: {
                          ...row.candidate,
                          candidateName: updated.candidateName ?? row.candidate?.candidateName,
                          emailId: updated.emailId ?? row.candidate?.emailId,
                          primaryContact: updated.primaryContact ?? row.candidate?.primaryContact,
                          candidateLocation:
                            updated.candidateLocation ?? row.candidate?.candidateLocation,
                          relExp: updated.relExp ?? row.candidate?.relExp,
                          totalExp: updated.totalExp ?? row.candidate?.totalExp,
                        },
                      }
                    : row
                )
              );
              const mappings = (apiResponse as any)?.mappings;
              setEditCandidate((cur) =>
                cur && cur.id === updated.id
                  ? {
                      ...cur,
                      ...updated,
                      existingMappings: Array.isArray(mappings) ? mappings : cur.existingMappings,
                      requirementId: '',
                      candidateStatusId: '',
                    }
                  : cur
              );
            }}
          />
        )}
        <ProcessHistoryDialog
          isOpen={isHistoryOpen}
          onOpenChange={(open) => {
            setIsHistoryOpen(open);
            if (!open) {
              setHistoryEntries([]);
              setHistoryMappings([]);
              setHistoryCandidateId(null);
              setHistoryRequirementId(null);
              setHistoryCandidateName('');
            }
          }}
          historyLoading={historyLoading}
          historyEntries={historyEntries}
          historyMappings={historyMappings}
          historyCandidateId={historyCandidateId}
          historyCandidateName={historyCandidateName}
          historyGroup={historyGroup()}
          onRequestClose={() => setIsHistoryOpen(false)}
          onAfterStatusChange={() => {
            refreshHistory();
            void loadPage1Internal(
              filtersRef.current.clientId,
              filtersRef.current.requirementId,
              filtersRef.current.statusId,
              filtersRef.current.userId,
              debouncedQRef.current,
              filtersRef.current.fromDate,
              filtersRef.current.toDate
            );
            void loadAggregatesInternal(
              filtersRef.current.clientId,
              filtersRef.current.requirementId,
              filtersRef.current.statusId,
              filtersRef.current.userId,
              debouncedQRef.current,
              filtersRef.current.fromDate,
              filtersRef.current.toDate
            );
          }}
        />
        <CustomizedSnackbars
          open={snackbarState.open}
          handleClose={handleSnackbarClose}
          message={snackbarState.message}
          severity={snackbarState.severity}
        />
        <InterviewScheduleDialog {...interviewDialogProps} />
        <RejectReasonDialog {...rejectDialogProps} />
        <JoinedDialog {...joinedDialogProps} />
        <ReassignDialog
          pendingAssign={pendingAssign}
          onCancel={() => setPendingAssign(null)}
          onConfirm={(row, nextId) => handleRowAssignedToChange(row, nextId)}
        />
        <PipelineExportDialog
          open={pipelineExportOpen}
          onClose={() => setPipelineExportOpen(false)}
          users={users}
          showErrorSnackbar={showErrorSnackbar}
        />
      </main>
    </LayoutContainer>
  );
}
