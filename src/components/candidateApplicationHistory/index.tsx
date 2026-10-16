import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CandidateProfileHistoryEntry,
  CandidateStatusHistoryEntry,
} from '../../store/model/candidate.types';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../store';
import { RootState } from '../../store/reducers';
import { UpdateCandidateInd } from '../../store/action/candidate.action';
import SearchableSelect from '../form/SearchableSelect';
import { useInterviewSchedule } from '../../hooks/useInterviewSchedule';
import { InterviewScheduleDialog } from '../resume-parser/candidate/InterviewScheduleDialog';
import { X } from 'lucide-react';
import { Roles } from '../../constants/roles';
import { fetchAllUsers } from '../../store/action/users.action';
import { User } from '../../store/model';
import { getUserNameEmail } from '../../utils/user-name';
import type { AppDispatch } from '../../store';
import CommentItem from '../comments/commentItem';
import CommentBox from '../comments/commentBox';
import { getRemarksByTask } from '../../store/services/comments';
import { RejectReasonDialog } from '../resume-parser/candidate/RejectReasonDialog';
import { JoinedDialog } from '../resume-parser/candidate/JoinedDialog';
import { ProfileAvatar } from '@/utils/UserAvatar';
import { PortalPicker } from '../../components/ui/date-time-portal-picker';
// ─── Helpers ──────────────────────────────────────────────────────────────────
const getStatusTextClass = (isActive: boolean, isDone: boolean): string => {
  if (isActive) {
    return 'text-blue-700';
  }

  if (isDone) {
    return 'text-gray-600';
  }

  return 'text-gray-400';
};

const formatDate = (iso: string | Date) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const timeAgo = (iso: string | Date) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};
const getInitials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const avatarColors = [
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
];
const avatarColor = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length];

const clientInitials = (name: string) =>
  name
    ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

// ─── StatusStepper ─────────────────────────────────────────────────────────
// Renders a horizontal stepper of status names, with the last one as current

interface StatusStep {
  statusName: string | null;
  prevStatusName: string | null; // before value for UPDATE events
  changedAt: string | Date;
  changedByName: string | null;
  operation: 'CREATE' | 'UPDATE';
}

const StatusStepper: React.FC<{ steps: StatusStep[] }> = ({ steps }) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const validSteps = steps.filter((s) => s.statusName != null && s.statusName !== '');

  if (validSteps.length === 0) return null;

  // Deduplicate consecutive duplicate statuses
  const deduped = validSteps.reduce<StatusStep[]>((acc, step) => {
    if (acc.length === 0 || acc[acc.length - 1].statusName !== step.statusName) {
      acc.push(step);
    } else {
      // replace with the latest timestamp for this status
      acc[acc.length - 1] = step;
    }
    return acc;
  }, []);

  const activeIdx = deduped.length - 1;

  return (
    <div className="mt-4 overflow-x-auto pb-2">
      <div className="flex items-start min-w-max">
        {deduped.map((step, i) => {
          const isDone = i < activeIdx;
          const isActive = i === activeIdx;
          const label = step.statusName ?? '—';

          return (
            <React.Fragment key={i}>
              {/* Step node */}
              <div
                className="flex flex-col items-center gap-1.5 flex-shrink-0 min-w-[90px] cursor-pointer"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                    isDone
                      ? 'bg-blue-600 border-blue-600'
                      : isActive
                        ? 'bg-white border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.12)]'
                        : 'bg-white border-gray-200'
                  }`}
                >
                  {isDone ? (
                    <svg
                      className="w-4 h-4 text-white"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M3 8l4 4 6-6" />
                    </svg>
                  ) : isActive ? (
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-200" />
                  )}
                </div>

                {/* Label */}
                <p
                  className={`text-[11px] text-center leading-tight max-w-[88px] font-medium ${getStatusTextClass(isActive, isDone)}`}
         
                >
                  {label}
                </p>

                {/* Tooltip on hover */}
                {hovered === i && (
                  <div className="absolute mt-14 z-20 bg-gray-900 text-white text-[11px] rounded-lg px-3 py-2 shadow-xl whitespace-nowrap pointer-events-none">
                    <p className="font-semibold mb-0.5">{label}</p>
                    <p className="text-gray-300">{formatDate(step.changedAt)}</p>
                    {step.changedByName && <p className="text-gray-400">by {step.changedByName}</p>}
                  </div>
                )}
              </div>

              {/* Connector */}
              {i < deduped.length - 1 && (
                <div
                  className={`h-[2px] w-16 flex-shrink-0 mt-4 mx-1 rounded-full transition-colors ${
                    i < activeIdx ? 'bg-blue-400' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ─── ActivityLog (collapsed list of individual changes) ────────────────────

const ActivityLog: React.FC<{ steps: StatusStep[] }> = ({ steps }) => (
  <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
    {[...steps]
      .filter((s) => s.statusName != null && s.statusName !== '')
      .reverse()
      .map((step, i) => {
        const actor = step.changedByName ?? 'System';
        const isCreate = step.operation === 'CREATE';
        const prevStatus = !isCreate ? step.prevStatusName : null;

        return (
          <div
            key={i}
            className="bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-gray-200 hover:shadow-sm transition-all duration-150"
          >
            {/* Top row — operation badge + actor + timestamp */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isCreate
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {isCreate ? '✦ Assigned' : '⟳ Changed'}
                </span>
                <span className="text-[12px] text-gray-500">
                  by{' '}
                  <span className={`font-semibold ${avatarColor(actor).split(' ')[1]}`}>
                    {actor}
                  </span>
                </span>
              </div>
              <div className="flex-shrink-0 text-right">
                <p
                  className="text-[11px] font-medium text-gray-500"
                  title={formatDate(step.changedAt)}
                >
                  {timeAgo(step.changedAt)}
                </p>
                <p className="text-[10px] text-gray-400">{formatDate(step.changedAt)}</p>
              </div>
            </div>

            {/* Status transition arrow */}
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              {isCreate ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-400">Status set to</span>
                  <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] font-semibold rounded-lg">
                    {step.statusName ?? '—'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {prevStatus && (
                    <>
                      <span className="px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-500 text-[12px] font-medium rounded-lg line-through">
                        {prevStatus}
                      </span>
                      <svg
                        className="w-4 h-4 text-gray-400 flex-shrink-0"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 8h10M9 4l4 4-4 4" />
                      </svg>
                    </>
                  )}
                  <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-[12px] font-semibold rounded-lg">
                    {step.statusName ?? '—'}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
  </div>
);

// ─── RequirementCard ───────────────────────────────────────────────────────
// One card per requirementId grouping

const CLIENT_COLORS = [
  'bg-[#1d4ed8]',
  'bg-[#7c3aed]',
  'bg-[#0f766e]',
  'bg-[#b45309]',
  'bg-[#be185d]',
  'bg-[#0369a1]',
];

interface RequirementGroup {
  requirementId: number;
  clientName: string;
  positionName: string;
  steps: StatusStep[];
}

//  1. Define Comment interface (move this OUTSIDE the component, at the top of the file)
interface Comment {
  id: number;
  comment: string;
  created_at: string;
  user: {
    firstName: string;
    lastName: string;
  };
  replies?: Comment[];
}

export type RequirementGroupType = RequirementGroup;

export const RequirementCard: React.FC<{
  group: RequirementGroup;
  defaultExpanded: boolean;
  candidateId: number;
  candidateName?: string;
  candidateMappings?: any[];
  focused?: boolean;
  onAfterStatusChange?: () => void;
  onRequestClose?: () => void;
}> = ({
  group,
  defaultExpanded,
  candidateId,
  candidateName, 
  candidateMappings,
  focused,
  onAfterStatusChange,
  onRequestClose,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showLog, setShowLog] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedNext, setSelectedNext] = useState('');
  const [selectedAssignedUser, setSelectedAssignedUser] = useState('');
  const [sharedDateAnchorEl, setSharedDateAnchorEl] = useState<HTMLElement | null>(null);
  const [editedSharedDate, setEditedSharedDate] = useState<string>('');
  const pickedDateRef = useRef<string>('');
  const [pendingAssign, setPendingAssign] = useState<{
    nextId: number;
    nextLabel: string;
  } | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const { status: allStatuses } = useAppSelector((state: RootState) => state?.statusSelector);
  const { user } = useAppSelector((state: RootState) => state?.authSelector);
  const { users } = useAppSelector((state: RootState) => state?.usersSelector);
  const mappingForReq = useMemo(() => {
    if (!Array.isArray(candidateMappings)) return null;
    return (
      candidateMappings.find(
        (m: any) => Number(m?.requirementDetails?.id ?? m?.requirementId) === group.requirementId
      ) ?? null
    );
  }, [candidateMappings, group.requirementId]);

  const isSuperUser = user?.role?.id === Roles.SUPERUSER;
  const effectiveAssignedToId = selectedAssignedUser
    ? parseInt(selectedAssignedUser, 10)
    : mappingForReq?.assignedTo?.id;
  const isStillAssignedUser = isSuperUser || Number(effectiveAssignedToId) === user?.id;
  const canEdit = isStillAssignedUser;

  const confirmAssignChange = async () => {
    if (!pendingAssign || !candidateId || !user?.id) return;

    setUpdating(true);
    try {
      const payload: any = {
        updatedBy: { id: user.id },
        requirementMappings: [
          {
            requirementId: group.requirementId,
            assignedTo: pendingAssign.nextId,
            ...(clientId ? { clientId } : {}),
          },
        ],
      };

      await (dispatch as any)(UpdateCandidateInd({ id: candidateId, payload })).unwrap();

      setSelectedAssignedUser(String(pendingAssign.nextId)); // update UI
      onAfterStatusChange?.();
    } catch (err) {
      console.error('Assign user failed:', err);
    } finally {
      setUpdating(false);
      setPendingAssign(null);
    }
  };
  const currentStatusId: number | null = useMemo(() => {
    const fromMapping = mappingForReq?.status?.id ?? mappingForReq?.candidateStatus?.id;
    if (fromMapping != null) return Number(fromMapping);

    // Fallback: match by latest status name
    const latestName = group.steps[group.steps.length - 1]?.statusName ?? null;
    if (!latestName) return null;
    const match = (allStatuses ?? []).find((s: any) => s?.statusName === latestName);
    return match?.id != null ? Number(match.id) : null;
  }, [mappingForReq, group.steps, allStatuses]);

  const clientId: number | undefined = useMemo(() => {
    const v =
      mappingForReq?.client?.id ??
      mappingForReq?.requirementDetails?.client?.id ??
      mappingForReq?.requirementDetails?.client?.clientProfile?.id;
    return v != null ? Number(v) : undefined;
  }, [mappingForReq]);

  const pendingMappingRef = useRef<{
    reqKey: string;
    statusId: string;
  } | null>(null);

  const { handleStatusChange, interviewDialogProps, rejectDialogProps, joinedDialogProps}=useInterviewSchedule({
    statuses: allStatuses ?? [],
    onNewStatusChange: () => {},
    onExistingStatusChange: (_reqKey, statusId) => {
      setSelectedNext(String(statusId));
      const next = parseInt(statusId || '', 10);
      if (Number.isNaN(next) || !candidateId || !user?.id) return;
      setUpdating(true);
      (async () => {
        try {
          const payload: any = {
            updatedBy: { id: user.id },
            requirementMappings: [
              {
                requirementId: group.requirementId,
                statusId: next,
                ...(clientId ? { clientId } : {}),
              },
            ],
          };
          await (dispatch as any)(UpdateCandidateInd({ id: candidateId, payload })).unwrap();
          onAfterStatusChange?.();
        } finally {
          setUpdating(false);
        }
      })();
    },
    onConfirmRaw: async (iso: string) => {
      const pending = pendingMappingRef.current;
      if (!pending) return;
      pendingMappingRef.current = null;
      const next = parseInt(pending.statusId || '', 10);
      if (Number.isNaN(next) || !candidateId || !user?.id) return;
      setSelectedNext(pending.statusId);
      setUpdating(true);
      try {
        const payload: any = {
          updatedBy: { id: user.id },
          requirementMappings: [
            {
              requirementId: group.requirementId,
              statusId: next,
              ...(clientId ? { clientId } : {}),
              scheduledInterviewAt: iso,
            },
          ],
        };
        await (dispatch as any)(UpdateCandidateInd({ id: candidateId, payload })).unwrap();
        onAfterStatusChange?.();
      } finally {
        setUpdating(false);
      }
    },
    onConfirmJoined: async (joiningDate: string) => {
      const pending = pendingMappingRef.current;
      if (!pending) return;
      pendingMappingRef.current = null;

      const next = parseInt(pending.statusId || '', 10);
      if (Number.isNaN(next) || !candidateId || !user?.id) return;

      setSelectedNext(pending.statusId);
      setUpdating(true);
      try {
        const payload: any = {
          updatedBy: { id: user.id },
          requirementMappings: [
            {
              requirementId: group.requirementId,
              statusId: next,
              ...(clientId ? { clientId } : {}),
              joiningDate,   // ← the date from JoinedDialog
            },
          ],
        };
        await (dispatch as any)(UpdateCandidateInd({ id: candidateId, payload })).unwrap();
        onAfterStatusChange?.();
      } finally {
        setUpdating(false);
      }
    },    

    onConfirmReject: (reason) => {
      const pending = pendingMappingRef.current;
      if (!pending) return;

      pendingMappingRef.current = null;

      const next = parseInt(pending.statusId || '', 10);
      if (Number.isNaN(next) || !candidateId || !user?.id) return;

      setSelectedNext(pending.statusId);
      setUpdating(true);

      (async () => {
        try {
          const payload: any = {
            updatedBy: { id: user.id },
            requirementMappings: [
              {
                requirementId: group.requirementId,
                statusId: next,
                ...(clientId ? { clientId } : {}),
                rejectReason: reason, //  IMPORTANT
              },
            ],
          };

          await (dispatch as any)(UpdateCandidateInd({ id: candidateId, payload })).unwrap();

          onAfterStatusChange?.();
        } finally {
          setUpdating(false);
        }
      })();
    },
  });

  const statusOptions = useMemo(
    () => (allStatuses ?? []).map((s: any) => ({ value: String(s.id), label: s.statusName })),
    [allStatuses]
  );
  useEffect(() => {
    setEditedSharedDate(mappingForReq?.profileSharedDate ?? '');
  }, [mappingForReq]);

  const saveSharedDate = async (newDate: string) => {
  if (!candidateId || !user?.id || !newDate) return;
  setUpdating(true);
  try {
    const payload: any = {
      updatedBy: { id: user.id },
      requirementMappings: [
        { requirementId: group.requirementId, profileSharedDate: newDate, ...(clientId ? { clientId } : {}) },
      ],
    };
    await (dispatch as any)(UpdateCandidateInd({ id: candidateId, payload })).unwrap();
    setEditedSharedDate(newDate);
    onAfterStatusChange?.();
  } catch (err) {
    console.error('[saveSharedDate] FAILED:', err);
  } finally {
    setUpdating(false);
  }
};
  const userOptions = useMemo(
    () => (users ?? [])
      .filter((u: User) => u.role?.id !== Roles.ACCOUNT_MANAGER)
      .map((u: User) => ({ value: String(u.id), label: getUserNameEmail(u), userId: u.id, imageKey: u.imageURL ?? null,  })),
    [users]
  );
  useEffect(() => {
    setExpanded(defaultExpanded);
  }, [defaultExpanded]);
  // Prefill the dropdown with the current status (if known)
  useEffect(() => {
    if (currentStatusId == null) return;
    setSelectedNext(String(currentStatusId));
  }, [currentStatusId, group.requirementId]);

  // Fetch users and initialize assigned user
  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [dispatch]);

  useEffect(() => {
    if (mappingForReq?.assignedTo?.id) {
      setSelectedAssignedUser(String(mappingForReq.assignedTo.id));
    }
  }, [mappingForReq]);

  const firstDate = group.steps[0]?.changedAt;
  const latestStep = group.steps[group.steps.length - 1];
  const clientColor = CLIENT_COLORS[group.requirementId % CLIENT_COLORS.length];
  const clientLabel = group.clientName || `Client`;
  const posLabel = group.positionName || `Requirement #${group.requirementId}`;

  //  2. Inside your component, replace ALL the currentUser/comments code with this:

  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(true); //  default open
  const fetchComments = async () => {
    try {
      const res = await getRemarksByTask(`${candidateId}_${group.requirementId}`);
      setComments(res.data);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    }
  };

  useEffect(() => {
    if (!group.requirementId) return;
    fetchComments();
  }, [group.requirementId]);
  return (
    <div
      className={`bg-white border rounded-2xl overflow-visible transition-all duration-200 ${
        expanded
          ? 'border-blue-200 shadow-md'
          : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
      }`}
    >
      {/* ── Card header ── */}
      <button
        className="w-full text-left px-5 py-4 flex items-center gap-4"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Client avatar */}
        <div
          className={`w-10 h-10 rounded-full ${clientColor} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
        >
          {clientInitials(clientLabel)}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-gray-900 uppercase tracking-wider leading-tight">
            {clientLabel}
          </p>
          <p className="text-[12px] text-gray-400 truncate mt-0.5">{posLabel}</p>
        {candidateName && (
        <div className="flex items-center gap-1 mt-1">
          <svg
            className="w-3 h-3 text-gray-400"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="8" cy="5" r="3" />
            <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" />
          </svg>
          <span className="text-[12px] font-semibold text-gray-700 truncate">
            {candidateName}
          </span>
        </div>
      )}
    </div>

        {/* Meta chips */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          {firstDate && (
            <span className="text-[11px] text-gray-400">
              Since{' '}
              {new Date(firstDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          )}  
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
            {group.steps.length} event{group.steps.length !== 1 ? 's' : ''}
          </span>
          <div onClick={(e) => e.stopPropagation()}>
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              if (!canEdit || updating) return;
              setSharedDateAnchorEl(sharedDateAnchorEl ? null : (e.currentTarget as unknown as HTMLElement));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!canEdit || updating) return;
                setSharedDateAnchorEl(sharedDateAnchorEl ? null : (e.currentTarget as unknown as HTMLElement));
              }
            }}
            aria-disabled={!canEdit || updating}
            className={`
              inline-flex items-center gap-2
              px-3 py-2
              rounded-lg
              border border-blue-300
              bg-blue-50
              text-xs font-medium text-blue-700
              cursor-pointer
              transition-all duration-150
              hover:bg-blue-100
              hover:border-blue-500
              hover:shadow-sm
              active:scale-[0.98]
            `}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3 w-3 shrink-0">
              <rect x="2" y="3" width="12" height="11" rx="2" /><path d="M5 1v3M11 1v3M2 7h12" />
            </svg>
            {editedSharedDate
              ? `Shared on ${new Date(editedSharedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
              : 'Set shared date'}
          </div>
        </div>
          {latestStep?.changedAt && (
            <div className="flex items-center gap-2">
              {/* Assigned User Dropdown - replaces the "Updated X ago" text */}
              <div
                className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 rounded-xl px-2 py-1 w-[240px]"
                onClick={(e) => e.stopPropagation()}
              >{selectedAssignedUser && (
                  <ProfileAvatar
                    userId={parseInt(selectedAssignedUser, 10)}
                    imageKey={
                      (users ?? []).find((u: User) => String(u.id) === selectedAssignedUser)?.imageURL ?? null
                    }
                    name={
                      (users ?? []).find((u: User) => String(u.id) === selectedAssignedUser)
                        ? getUserNameEmail((users ?? []).find((u: User) => String(u.id) === selectedAssignedUser)!)
                        : null
                    }
                    size="sm"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <SearchableSelect
                    id={`assigned-user-${group.requirementId}`}
                    label=""
                    value={selectedAssignedUser}
                    options={userOptions}
                    placeholder="Assign user"
                    useAccent={false}
                    ghost // ← plain-text look
                    priorityValue={String(user?.id)} // ← current user always first
                    disabled={!canEdit || updating}
                    onChange={(val) => {
                      const nextId = parseInt(val || '', 10);
                      if (!val || Number.isNaN(nextId)) return;
                      if (mappingForReq?.assignedTo?.id === nextId) return;

                      const nextUser = (users ?? []).find((u: User) => u.id === nextId);
                      const nextLabel = nextUser ? getUserNameEmail(nextUser) : `User #${nextId}`;

                      setPendingAssign({
                        nextId,
                        nextLabel,
                      });
                    }}
                    className="w-[190px]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action: change status (searchable dropdown, shows all statuses) */}
        {mappingForReq?.status != null && (
          <div
            className="hidden md:block w-[240px] flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <SearchableSelect
              id={`next-status-${group.requirementId}`}
              label=""
              value={selectedNext}
              options={statusOptions}
              placeholder="Search & select status"
              useAccent={false}
              disabled={!canEdit || updating || !user?.id || statusOptions.length === 0}
              onChange={(val) => {
                if (!val) return;
                if (currentStatusId != null && val === String(currentStatusId)) return;
                setSelectedNext(val);
                pendingMappingRef.current = {
                  reqKey: String(group.requirementId),
                  statusId: val,
                };
                // handleStatusChange will either:
                // - open the interview dialog (if "scheduled" status) → onConfirmRaw fires the API
                // - call onExistingStatusChange directly (non-scheduled) → that fires the API
                handleStatusChange(String(group.requirementId), val, false);
              }}
              className={focused ? 'max-w-full' : ''}
            />
          </div>
        )}

        {onRequestClose && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRequestClose();
            }}
            className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {/* ── Expanded body ── */}
      {expanded && (
        <div className="border-t border-gray-100">
          {/* Status stepper */}
          {mappingForReq?.status != null && (
            <div className="px-5 pt-4 pb-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Recruitment Pipeline
              </p>
              <StatusStepper steps={group.steps} />
            </div>
          )}

          {/*  COMMENTS SECTION (INSERT HERE) */}
          <div className="px-5 py-3 border-t border-gray-50">
            <button
              onClick={() => setShowComments((v) => !v)}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform ${showComments ? 'rotate-180' : ''}`}
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 6l4 4 4-4" />
              </svg>
              {showComments ? 'Hide' : 'Show'} comments ({comments.length})
            </button>

            {showComments && (
              <>
                {/* Comment Input */}
                <CommentBox
                  taskId={`${candidateId}_${group.requirementId}`}
                  refresh={fetchComments}
                />

                {/* Comment List */}
                <div className="mt-3 space-y-3">
                  {comments.length === 0 ? (
                    <p
                      style={{
                        textAlign: 'center',
                        color: '#9ca3af',
                        padding: '12px',
                        fontSize: '12px',
                      }}
                    >
                      🗨️ No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        taskId={`${candidateId}_${group.requirementId}`}
                        refresh={fetchComments}
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Activity log toggle */}
          <div className="px-5 py-3 border-t border-gray-50">
            <button
              onClick={() => setShowLog((v) => !v)}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform ${showLog ? 'rotate-180' : ''}`}
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 6l4 4 4-4" />
              </svg>
              {showLog ? 'Hide' : 'Show'} activity log ({group.steps.length})
            </button>
            {showLog && <ActivityLog steps={group.steps} />}
          </div>
        </div>
      )}
      <InterviewScheduleDialog {...interviewDialogProps} />
      <RejectReasonDialog {...rejectDialogProps} />
      <JoinedDialog {...joinedDialogProps} />
      {sharedDateAnchorEl && (
        <PortalPicker
          type="date"
          value={editedSharedDate ? new Date(editedSharedDate).toISOString().split('T')[0] : ''}
          anchorEl={sharedDateAnchorEl}
          onChange={(val) => {
            pickedDateRef.current = val;
            setEditedSharedDate(val);
          }}
          allowPastDates={true}
          onSave={() => {
            setSharedDateAnchorEl(null);
            const finalDate = pickedDateRef.current || editedSharedDate;
            if (finalDate) saveSharedDate(finalDate);
          }}
          onCancel={() => {
            setSharedDateAnchorEl(null);
            setEditedSharedDate(mappingForReq?.profileSharedDate ?? '');
          }}
        />
      )}
      {pendingAssign && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setPendingAssign(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-gray-900 mb-1">Reassign candidate?</h2>

            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to assign this candidate to{' '}
              <span className="font-medium text-gray-800">{pendingAssign.nextLabel}</span>?
            </p>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                onClick={() => setPendingAssign(null)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--brand)] text-white hover:bg-[#0f2a47] transition"
                onClick={confirmAssignChange}
              >
                Yes, reassign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── StatusHistoryTab ──────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
    <div className="flex gap-4 items-center mb-4">
      <div className="w-10 h-10 bg-gray-100 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-100 rounded w-32" />
        <div className="h-3 bg-gray-100 rounded w-48" />
      </div>
    </div>
    <div className="h-14 bg-gray-50 rounded-xl" />
  </div>
);

interface StatusHistoryTabProps {
  entries: CandidateStatusHistoryEntry[];
  loading: boolean;
  candidateId: number;
  candidateName?: string; 
  candidateMappings?: any[];
  focusedRequirementId?: number | null;
  onAfterStatusChange?: () => void;
}

const StatusHistoryTab: React.FC<StatusHistoryTabProps> = ({
  entries,
  loading,
  candidateId,
  candidateName,
  candidateMappings,
  focusedRequirementId,
  onAfterStatusChange,
}) => {
  if (loading && entries.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!loading && entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <svg
            className="w-5 h-5 text-gray-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p className="text-[13px] text-gray-400">No status history recorded yet.</p>
        <p className="text-[11px] text-gray-300 mt-1">
          Status changes will appear here after the next pipeline update.
        </p>
      </div>
    );
  }

  // Group by requirementId, preserve chronological order within each group
  const groupMap = new Map<number, RequirementGroup>();
  for (const entry of entries) {
    if (!groupMap.has(entry.requirementId)) {
      groupMap.set(entry.requirementId, {
        requirementId: entry.requirementId,
        clientName: entry.clientName || '',
        positionName: entry.positionName || '',
        steps: [],
      });
    }
    const group = groupMap.get(entry.requirementId)!;

    // Always use the latest clientName/positionName (in case early entries were blank)
    if (entry.clientName) group.clientName = entry.clientName;
    if (entry.positionName) group.positionName = entry.positionName;

    const statusName = entry.changedFields?.after?.statusName ?? null;
    const prevStatusName = entry.changedFields?.before?.statusName ?? null;

    const isNullCreate =
      entry.operation === 'CREATE' && statusName === null && entry.changedFields?.before === null;

    if (!isNullCreate) {
      group.steps.push({
        statusName,
        prevStatusName,
        changedAt: entry.changedAt,
        changedByName: entry.changedByName,
        operation: entry.operation,
      });
    }
  }

  const groups = Array.from(groupMap.values());
  const isFocused = focusedRequirementId != null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <h4 className="text-[13px] font-semibold text-gray-600">
          {groups.length} Requirement{groups.length !== 1 ? 's' : ''}
        </h4>
        <span className="text-[11px] text-gray-400">{entries.length} total events</span>
      </div>
      {groups.map((group, i) => (
        <RequirementCard
          key={group.requirementId}
          group={group}
          defaultExpanded={isFocused ? group.requirementId === focusedRequirementId : i === 0}
          candidateId={candidateId}
          candidateName={candidateName}
          candidateMappings={candidateMappings}
          focused={isFocused}
          onAfterStatusChange={onAfterStatusChange}
        />
      ))}
    </div>
  );
};

// ─── ProfileHistoryTab — keeps the timeline view ──────────────────────────

const OperationBadge: React.FC<{ op: string }> = ({ op }) => {
  const map: Record<string, string> = {
    CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
    ARCHIVE: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${map[op] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}
    >
      {op === 'CREATE' && '✦ Created'}
      {op === 'UPDATE' && '⟳ Updated'}
      {op === 'ARCHIVE' && '⊘ Archived'}
    </span>
  );
};

const FIELD_LABELS: Record<string, string> = {
  candidateName: 'Name',
  emailId: 'Email',
  primaryContact: 'Phone',
  candidateLocation: 'Location',
  source: 'Source',
  sourceDate: 'Source Date',
  relExp: 'Rel. Exp',
  totalExp: 'Total Exp',
  skillSet: 'Skills',
  currentSalary: 'Current CTC',
  expectedSalary: 'Expected CTC',
  noticePeriod: 'Notice Period',
  remarks: 'Remarks',
  isArchived: 'Archived',
};

const FieldDiff: React.FC<{
  changedFields: { before: Record<string, any> | null; after: Record<string, any> };
}> = ({ changedFields }) => {
  const { before, after } = changedFields;
  const keys = Object.keys(after);
  if (keys.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {keys.map((key) => {
        const label = FIELD_LABELS[key] ?? key;
        const prev = before ? String(before[key] ?? '—') : null;
        const next = String(after[key] ?? '—');
        return (
          <div key={key} className="flex items-start gap-2 text-[12px]">
            <span className="w-28 flex-shrink-0 text-gray-400 font-medium truncate">{label}</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {prev !== null && (
                <>
                  <span
                    className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded line-through max-w-[150px] truncate"
                    title={prev}
                  >
                    {prev}
                  </span>
                  <svg
                    className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </>
              )}
              <span
                className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold max-w-[150px] truncate"
                title={next}
              >
                {next}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TimelineItem: React.FC<{
  entry: CandidateProfileHistoryEntry;
  isLast: boolean;
}> = ({ entry, isLast }) => {
  const [expanded, setExpanded] = useState(false);
  const actor = entry.changedByName ?? 'System';
  const hasFields = Object.keys(entry.changedFields.after).length > 0;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${avatarColor(actor)}`}
        >
          {getInitials(actor)}
        </div>
        {!isLast && <div className="w-[2px] flex-1 bg-gray-100 my-1" />}
      </div>
      <div className="flex-1 pb-5">
        <div
          className={`bg-white border rounded-xl px-4 py-3 transition-all duration-150 ${
            expanded
              ? 'border-blue-200 shadow-sm'
              : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
          } ${hasFields ? 'cursor-pointer' : ''}`}
          role={hasFields ? 'button' : undefined}
          tabIndex={hasFields ? 0 : undefined}
          onClick={() => {
            if (!hasFields) return;
            setExpanded((v) => !v);
          }}
          onKeyDown={(e) => {
            if (!hasFields) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setExpanded((v) => !v);
            }
          }}
          aria-expanded={hasFields ? expanded : undefined}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <OperationBadge op={entry.operation} />
              <span className="text-[12px] text-gray-500">
                by <span className="font-semibold text-gray-700">{actor}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[11px] text-gray-400" title={formatDate(entry.changedAt)}>
                {timeAgo(entry.changedAt)}
              </span>
              {hasFields && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded((v) => !v);
                  }}
                  className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                  aria-label={expanded ? 'Collapse' : 'Expand'}
                >
                  <svg
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(entry.changedAt)}</p>
          {expanded && hasFields && <FieldDiff changedFields={entry.changedFields} />}
        </div>
      </div>
    </div>
  );
};

interface ProfileHistoryTabProps {
  entries: CandidateProfileHistoryEntry[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

const ProfileHistoryTab: React.FC<ProfileHistoryTabProps> = ({
  entries,
  loading,
  hasMore,
  onLoadMore,
}) => {
  if (loading && entries.length === 0) {
    return (
      <div className="space-y-0">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 pb-5">
              <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 space-y-2">
                <div className="flex gap-2">
                  <div className="h-5 w-20 bg-gray-100 rounded-full" />
                  <div className="h-5 w-32 bg-gray-100 rounded-full" />
                </div>
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (!loading && entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <svg
            className="w-5 h-5 text-gray-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-[13px] text-gray-400">No profile changes recorded yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-0">
        {entries.map((entry, i) => (
          <TimelineItem
            key={entry.id}
            entry={entry}
            isLast={i === entries.length - 1 && !hasMore}
          />
        ))}
      </div>
      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={loading}
          className="w-full mt-2 py-2.5 text-[13px] font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────

type Tab = 'status' | 'profile';

export interface CandidateHistoryPanelProps {
  candidateId: number | null;
  candidateName?: string; 
  focusedRequirementId?: number | null;
  candidateMappings?: any[];
  statusHistory: CandidateStatusHistoryEntry[];
  statusHistoryLoading: boolean;
  statusHistoryHasMore: boolean;
  statusHistoryNextCursor: string | null;
  profileHistory: CandidateProfileHistoryEntry[];
  profileHistoryLoading: boolean;
  profileHistoryHasMore: boolean;
  profileHistoryNextCursor: string | null;
  onLoadMoreStatus: (cursor: string | null) => void;
  onLoadMoreProfile: (cursor: string | null) => void;
  onAfterStatusChange?: () => void;
}

const CandidateHistoryPanel: React.FC<CandidateHistoryPanelProps> = ({
  candidateId,
  candidateName, 
  focusedRequirementId,
  candidateMappings,
  statusHistory,
  statusHistoryLoading,
  profileHistory,
  profileHistoryLoading,
  profileHistoryHasMore,
  profileHistoryNextCursor,
  onLoadMoreProfile,
  onAfterStatusChange,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('status');
  // Count unique requirements for badge
  const uniqueReqs = new Set(statusHistory.map((e) => e.requirementId)).size;
  const focusedStatusEntries =
    focusedRequirementId != null
      ? statusHistory.filter((e) => e.requirementId === focusedRequirementId)
      : statusHistory;

  return (
    <div className="mt-5">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5 w-fit">
        {(['status', 'profile'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-[13px] font-semibold rounded-lg transition-all duration-150 ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'status' ? 'Status Changes' : 'Profile Changes'}
            <span
              className={`ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {tab === 'status' ? uniqueReqs || statusHistory.length : profileHistory.length}
            </span>
          </button>
        ))}
      </div>
      <div className="min-h-[200px]">
        {activeTab === 'status' ? (
          <StatusHistoryTab
            entries={focusedStatusEntries}
            loading={statusHistoryLoading}
            candidateId={candidateId ?? 0}
            candidateName={candidateName}
            candidateMappings={candidateMappings}
            focusedRequirementId={focusedRequirementId}
            onAfterStatusChange={onAfterStatusChange}
          />
        ) : (
          <ProfileHistoryTab
            entries={profileHistory}
            loading={profileHistoryLoading}
            hasMore={profileHistoryHasMore}
            onLoadMore={() => onLoadMoreProfile(profileHistoryNextCursor)}
          />
        )}
      </div>
    </div>
  );
};

export default CandidateHistoryPanel;
