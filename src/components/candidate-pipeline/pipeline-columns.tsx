import { toPascalCase } from '../../utils/name-format';
import { Building2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { AggregateItem, CandidateStatusListItem } from '../../store/model/candidate-status-list.types';
import type { User } from '../../store/model';
import { Roles } from '../../constants';
import { getUserNameEmail } from '../../utils/user-name';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import SearchableSelectCombobox from '../form/SearchableSelect';
import {
  isInterviewScheduledPipelineStatus,
  isInterviewRejectedPipelineStatus,
} from '../../utils/interview-scheduled-status';
import { isJoinedPipelineStatus } from '../../utils/joined-status';
import React from 'react';

// ── Helpers ────────────────────────────────────────────────────────────────
export function formatShortDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatActorName(actor?: { firstName?: string; lastName?: string } | null): string {
  if (!actor) return '';
  return `${actor.firstName ?? ''} ${actor.lastName ?? ''}`.trim();
}

// ── Aggregate Columns (static — no runtime deps) ───────────────────────────
export const aggregateColumns: ColumnDef<AggregateItem, any>[] = [
  {
    accessorKey: 'positionName',
    header: 'Requirement',
    enableHiding: false,
    size: 130,
    cell: ({ row }: any) => (
      <span
        className="block text-sm text-slate-700 truncate max-w-[180px]"
        title={row.original?.positionName ?? ''}
      >
        {row.original?.positionName ? toPascalCase(row.original.positionName) : '—'}
      </span>
    ),
  },
  {
    accessorKey: 'clientName',
    header: 'Client Name',
    enableHiding: false,
    size: 120,
    cell: ({ row }: any) => (
      <span className="flex items-center gap-1.5 text-sm min-w-0">
        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <span className="truncate max-w-[120px]" title={row.original?.clientName ?? ''}>
          {row.original?.clientName ? toPascalCase(row.original.clientName) : '—'}
        </span>
      </span>
    ),
  },
  {
    accessorKey: 'count',
    header: 'Count',
    size: 70,
    cell: ({ row }: any) => (
      <span className="block text-center font-semibold tabular-nums text-[#2a4365]">
        {row.original?.count ?? 0}
      </span>
    ),
  },
];

// ── Assignment Columns (factory — needs runtime values) ────────────────────
export function buildAssignmentColumns({
  user,
  allStatuses,
  users,
  pendingRowRef,
  handleStatusChangeTrigger,
  handleRowStatusChange,
  setPendingAssign,
  openEditCandidate,
}: {
  user: any;
  allStatuses: any[];
  users: User[];
  pendingRowRef: React.MutableRefObject<any>;
  handleStatusChangeTrigger: (key: string, val: string, isNew: boolean) => void;
  handleRowStatusChange: (r: CandidateStatusListItem, nextId: number, nextName: string) => void;
  setPendingAssign: (v: any) => void;
  openEditCandidate: (id: number | undefined) => void;
}): ColumnDef<CandidateStatusListItem, any>[] {
  return [
    {
      accessorKey: 'updatedAt',
      header: 'Last updated',
      size: 170,
      cell: ({ row }: any) => {
        const r: CandidateStatusListItem = row.original;
        return (
          <div className="text-sm text-slate-600">
            <div className="whitespace-nowrap font-medium text-slate-800">
              {formatShortDate(r.updatedAt)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 max-w-[150px] truncate"
              title={formatActorName(r.updatedBy)}>
              {formatActorName(r.updatedBy)}
            </div>
          </div>
        );
      },
    },
    {
      id: 'candidate',
      header: 'Candidate Name',
      enableHiding: false,
      accessorFn: (r: CandidateStatusListItem) =>
        r.candidate?.candidateName ? toPascalCase(r.candidate.candidateName) : '',
      size: 220,
      cell: ({ row }: any) => {
        const r: CandidateStatusListItem = row.original;
        return (
          <div>
            <button type="button"
              className="font-medium text-slate-900 hover:underline text-left"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditCandidate(r.candidate?.id); }}
            >
              {r.candidate?.candidateName ? toPascalCase(r.candidate.candidateName) : '—'}
            </button>
            <div className="text-xs text-slate-500 truncate max-w-[200px]">
              {r.candidate?.emailId || '—'}
            </div>
          </div>
        );
      },
    },
    {
      id: 'client',
      header: 'Client Name',
      accessorFn: (r: CandidateStatusListItem) => r.client?.clientName ?? '',
      size: 140,
      cell: ({ row }: any) => (
        <span className="block truncate max-w-[140px]" title={row.original?.client?.clientName || ''}>
          {row.original?.client?.clientName ? toPascalCase(row.original.client.clientName) : '—'}
        </span>
      ),
    },
    {
      id: 'requirement',
      header: 'Requirement',
      accessorFn: (r: CandidateStatusListItem) =>
        r.requirementDetails?.positionDetails?.positionName ?? '',
      size: 170,
      cell: ({ row }: any) => {
        const raw = row.original?.requirementDetails?.positionDetails?.positionName;
        const v = raw ? toPascalCase(raw) : '—';
        return (
          <span className="block truncate max-w-[170px]" title={v !== '—' ? v : ''}>{v}</span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      accessorFn: (r: CandidateStatusListItem) => r.status?.statusName ?? '',
      size: 190,
      cell: ({ row }: any) => {
        const r: CandidateStatusListItem = row.original;
        const canEdit = user?.role?.id === Roles.SUPERUSER || r.assignedTo?.id === user?.id;
        const currentId = r.status?.id != null ? String(r.status.id) : '';
        return (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="min-w-[180px]" onClick={(e) => e.stopPropagation()}>
                  <SearchableSelectCombobox
                    id={`pipeline-status-${r.id}`}
                    label=""
                    value={currentId}
                    options={(allStatuses ?? []).map((s: any) => ({ value: String(s.id), label: s.statusName }))}
                    placeholder="Search & select status"
                    useAccent={false}
                    disabled={!canEdit || !allStatuses || allStatuses.length === 0 || !user?.id || user.id < 1}
                    onChange={(val) => {
                      const nextId = parseInt(val || '', 10);
                      if (!val || Number.isNaN(nextId)) return;
                      if (r.status?.id != null && nextId === r.status.id) return;
                      const nextName = (allStatuses ?? []).find((s: any) => Number(s.id) === nextId)?.statusName ?? '';
                      if (isInterviewScheduledPipelineStatus(nextName) || isInterviewRejectedPipelineStatus(nextName) || isJoinedPipelineStatus(nextName)) {
                        pendingRowRef.current = { row: r, nextId, nextName };
                        handleStatusChangeTrigger('__pipeline__', String(nextId), true);
                        return;
                      }
                      void handleRowStatusChange(r, nextId, nextName);
                    }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px] text-center">
                <p className="text-xs font-medium">{r.status?.statusName ?? 'Not set'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      id: 'profileSharedDate',
      header: 'Profile Shared Date',
      accessorFn: (r: CandidateStatusListItem) => r.profileSharedDate ?? '',
      size: 150,
      cell: ({ row }: any) => {
        const r: CandidateStatusListItem = row.original;
        return (
          <span className="text-sm text-slate-600 whitespace-nowrap">
            {r.profileSharedDate ? formatShortDate(r.profileSharedDate) : '—'}
          </span>
        );
      },
    },
    {
      id: 'phone',
      header: 'Phone Number',
      accessorFn: (r: CandidateStatusListItem) => r.candidate?.primaryContact ?? '',
      size: 130,
      cell: ({ row }: any) => row.original?.candidate?.primaryContact || '—',
    },
    {
      id: 'assignedTo',
      header: 'Assigned To',
      accessorFn: (r: CandidateStatusListItem) => r.assignedTo?.id ?? '',
      size: 180,
      cell: ({ row }: any) => {
        const r: CandidateStatusListItem = row.original;
        const currentId = r.assignedTo?.id != null ? String(r.assignedTo.id) : '';
        return (
          <div className="min-w-[180px]" onClick={(e) => e.stopPropagation()}>
            <SearchableSelectCombobox
              id={`pipeline-assignedTo-${r.id}`}
              label=""
              value={currentId}
              options={(users ?? [])
                .filter((u: User) => u.role?.id !== Roles.ACCOUNT_MANAGER)
                .map((u: User) => ({ value: String(u.id), label: getUserNameEmail(u) }))}
              placeholder="Search & select user"
              useAccent={false}
              disabled={!users || users.length === 0 || !user?.id || user.id < 1}
              onChange={(val) => {
                const nextId = parseInt(val || '', 10);
                if (!val || Number.isNaN(nextId)) return;
                if (r.assignedTo?.id != null && nextId === r.assignedTo.id) return;
                const nextUser = (users ?? []).find((u: User) => u.id === nextId);
                const nextLabel = nextUser ? getUserNameEmail(nextUser) : `User #${nextId}`;
                setPendingAssign({ row: r, nextId, nextLabel });
              }}
            />
          </div>
        );
      },
    },
  ];
}