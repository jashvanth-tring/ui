import { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '../../store';
import { UpdateCandidateProfile } from '../../store/model/candidate.types';
import { UpdateCandidateInd } from '../../store/action/candidate.action';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useSnackbar } from '../../utils/snackbar-function';
import CustomizedSnackbars from '../customized-snackbar';
import { RootState } from '../../store/reducers';
import { fetchAllUsers } from '../../store/action/users.action';
import { fetchAllRequirement } from '../../store/action/requirement-details.action';
import { fetchStatus } from '../../store/action/status.action';
import { RequirementLoop } from '../../store/model/requirement-details.types';
import {
  formatRequirementSelectLabel,
  requirementClientDisplayName,
} from '../../utils/requirement-label';
import SearchableSelect from '../form/SearchableSelect';
import PhoneField from '../form/PhoneField';
import { Roles } from '../../constants';
import { useInterviewSchedule } from '../../hooks/useInterviewSchedule';
import { InterviewScheduleDialog } from '../resume-parser/candidate/InterviewScheduleDialog';
import { RejectReasonDialog } from '../resume-parser/candidate/RejectReasonDialog';
import { format } from 'date-fns';
import { PortalPicker } from '../../components/ui/date-time-portal-picker';
import { cn } from '../../lib/utils';
import { JoinedDialog } from '../resume-parser/candidate/JoinedDialog';
import {
  fetchCandidateResumeFile,
  uploadCandidateResume,
} from '../../store/services/candidate';
import DocumentPreviewDialog from '../documents/DocumentPreviewDialog';
import { ProfileAvatar } from '../../utils/UserAvatar';
import { fetchUpcomingInterviews, updateInterviewDate } from '../../store/services/round';

export interface CandidateEditProps {
  id: number | undefined;
  source: string;
  date: string;
  sourceDate?: string;
  candidateName: string;
  primaryContact: string;
  emailId: string;
  candidateLocation: string;
  totalExp: string;
  relExp: string;
  skillSet: any;
  currentSalary: string;
  expectedSalary: string;
  noticePeriod: string;
  remarks?: string;
  uploadedBy: { id: number };
  scheduledInterviewAt?: string; 
  dateOfJoining?: string;
  resumeS3Key?: string | null;

  // Mappings
  existingMappings?: any[];
  requirementId?: string;
  candidateStatusId?: string;
}

/** Unwrapped PATCH response (axios body): profile in `data`, optional `mappings` at root */
export type UpdateCandidateSuccessPayload = {
  success?: boolean;
  message?: string;
  statusCode?: number;
  data?: Record<string, unknown>;
  mappings?: unknown[];
  // eslint-disable-next-line
  [key: string]: any;
};

interface EditCandidateFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: CandidateEditProps;
  // eslint-disable-next-line
  user: any;
  onSuccess: (apiResponse: UpdateCandidateSuccessPayload) => void;
}
const normalisePhone = (raw: string): string => {
  if (!raw) return '';
  const cleaned = raw.replace(/\s+/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;
  if (/^91\d{10}$/.test(cleaned)) return `+${cleaned}`;
  return `+${cleaned}`;
};

const EditCandidateForm: React.FC<EditCandidateFormProps> = ({
  isOpen,
  onOpenChange,
  candidate,
  user,
  onSuccess,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [editInline, setEditInline] = useState<CandidateEditProps>(candidate);
  const [resumeUploadPending, setResumeUploadPending] = useState(false);
  const [resumeViewerOpen, setResumeViewerOpen] = useState(false);
  const profileBaselineRef = useRef<CandidateEditProps | null>(null);
  const { requirements } = useAppSelector((state: RootState) => state?.requirementsSelector);
  // Read from statusSelector (ta_status) — same source as the create candidate modal
  const { status: statuses } = useAppSelector((state: RootState) => state?.statusSelector);
  const [sourceDateAnchorEl, setSourceDateAnchorEl] = useState<HTMLElement | null>(null);
  const [joiningDateAnchorEl, setJoiningDateAnchorEl] = useState<HTMLElement | null>(null);
  const [salaryMismatch , setSalaryMismatch] = useState(false);
  const editInlineRef = useRef(editInline);
  useEffect(() => { editInlineRef.current = editInline; }, [editInline]);
  const [existingScheduledAtByReqId, setExistingScheduledAtByReqId] = useState<Record<string, string>>({});
  const [profileSharedDateByReqId, setProfileSharedDateByReqId] = useState<Record<string, string>>({});
  const handleSalaryBlur = () => {
    const cur = parseFloat(editInlineRef.current?.currentSalary || '');
    const exp = parseFloat(editInlineRef.current?.expectedSalary || '');
    if (!isNaN(cur) && !isNaN(exp) && exp < cur) {
      setSalaryMismatch(true);
    }
  };
  const initialErrors = {
    source: '',
    date: '',
    candidateName: '',
    primaryContact: '',
    emailId: '',
    candidateLocation: '',
    totalExp: '',
    relExp: '',
    skillSet: [],
    currentSalary: '',
    expectedSalary: '',
    noticePeriod: '',
    remarks: '',
    uploadedBy: '',
    requirementId: '',
    candidateStatusId: '',
  };
  // ── Date picker anchor ────────────────────────────────────────────────────
  const [dateAnchorEl, setDateAnchorEl] = useState<HTMLElement | null>(null);
  const [errors, setErrors] = useState(initialErrors);
  /** requirement id (string) → selected status id (string) for each existing mapping */
  const [existingMappingStatusByReqId, setExistingMappingStatusByReqId] = useState<
    Record<string, string>
  >({});
  const mappingBaselineRef = useRef<any[]>([]);

  const {
    snackbarState,
    handleSnackbarClose,
    showSuccessSnackbar,
    showErrorSnackbar,
  } = useSnackbar();

  /** requirement id (string) → scheduled interview datetime (ISO string) */
  const [scheduledByReqId, setScheduledByReqId] = useState<Record<string, string>>({});

  const mappedRequirementIds = useMemo(
    () =>
      new Set(
        (editInline.existingMappings ?? [])
          .map((m: any) => Number(m?.requirementDetails?.id ?? m.requirementId))
          .filter((id: number) => Number.isFinite(id) && id > 0)
      ),
    [editInline.existingMappings]
  );
  const pendingMappingRef = useRef<{
      reqKey: string;
      statusId: string;
    } | null>(null);

  const {
  handleStatusChange,
  interviewDialogProps,
  rejectDialogProps,
  joinedDialogProps,  
} = useInterviewSchedule({
  statuses: (statuses ?? []).map((s: any) => ({
    id: s.id,
    statusName: s.statusName,
  })),

  // For NEW mapping dropdown
  onNewStatusChange: (statusId) => {
    setEditInline((prev) => ({
      ...prev,
      candidateStatusId: statusId,
    }));
  },

  // For EXISTING mapping
  onExistingStatusChange: (reqKey, statusId) => {
    setExistingMappingStatusByReqId((prev) => ({
      ...prev,
      [reqKey]: statusId,
    }));
  },
  onConfirmJoined: (joiningDate: string) => {
    const pending = pendingMappingRef.current;
    if (!pending) return;
    const { reqKey, statusId } = pending;
    pendingMappingRef.current = null;

    // store joining date under a distinct key
    setScheduledByReqId((prev) => ({
      ...prev,
      [`${reqKey}_joiningDate`]: joiningDate,
    }));

    if (reqKey === '__new__') {
      setEditInline((prev) => ({ ...prev, candidateStatusId: statusId }));
    } else {
      setExistingMappingStatusByReqId((prev) => ({
        ...prev,
        [reqKey]: statusId,
      }));
    }
  },

  // 🔥 MOST IMPORTANT PART
  onConfirmRaw: (iso: string) => {
    const pending = pendingMappingRef.current;
    if (!pending) return;
  
    const { reqKey, statusId } = pending;
    pendingMappingRef.current = null;

     setScheduledByReqId((prev) => ({
      ...prev,
      [reqKey]: iso,
    }));

     if (reqKey === '__new__') {
    //  New mapping
    setEditInline((prev) => ({
      ...prev,
      candidateStatusId: statusId,
      scheduledInterviewAt: iso,
    }));
  } else {
    setExistingMappingStatusByReqId((prev) => ({
      ...prev,
      [reqKey]: statusId,
    }));
  }
  },


  onConfirmReject: (reason: string) => {
    const pending = pendingMappingRef.current;
    if (!pending) return;
    const { reqKey, statusId } = pending;
    pendingMappingRef.current = null;

    if (reqKey === '__new__') {
      setEditInline((prev) => ({ ...prev, candidateStatusId: statusId }));
    } else {
      setExistingMappingStatusByReqId((prev) => ({ ...prev, [reqKey]: statusId }));
    }
    setScheduledByReqId((prev) => ({ ...prev, [`${reqKey}_rejectReason`]: reason }));
  },
});






  const unmappedActiveRequirements = useMemo(
    () =>
      (requirements ?? []).filter(
        (r: any) => r.isActive && !mappedRequirementIds.has(Number(r.id))
      ),
    [requirements, mappedRequirementIds]
  );

  useEffect(() => {
      dispatch(fetchAllUsers());
      dispatch(fetchAllRequirement());
      dispatch(fetchStatus());
    }, [dispatch]);

    useEffect(() => {setEditInline({
      ...candidate,
      primaryContact: normalisePhone(candidate.primaryContact),
    });
  },  [candidate]);
  
  useEffect(() => {
    if (!isOpen) return;
    // Fetch upcoming interviews to get existing scheduled times
    const fetchScheduledTimes = async () => {
      try {
        const [todayRes, upcomingRes, unhandledRes] = await Promise.all([
          fetchUpcomingInterviews({ filter: 'today' }),
          fetchUpcomingInterviews({ filter: 'upcoming' }),
          fetchUpcomingInterviews({ filter: 'unhandled' }),
        ]);

        const allRows = [
          ...(todayRes?.data?.data ?? []),
          ...(upcomingRes?.data?.data ?? []),
          ...(unhandledRes?.data?.data ?? []),
        ];

        // Map by candidateId + positionName → interviewAt
        const scheduled: Record<string, string> = {};
        const baseline = candidate.existingMappings ?? [];
        for (const m of baseline) {
          const reqIdStr = String(m?.requirementDetails?.id ?? m?.requirementId ?? '');
          const candidateId = m?.candidate?.id;
          const positionName = m?.requirementDetails?.positionDetails?.positionName?.toLowerCase();

          const matched = allRows.find((r: any) =>
            r.candidateId === candidateId &&
            r.positionName?.toLowerCase() === positionName
          );

          if (matched?.interviewAt) {
            scheduled[reqIdStr] = matched.interviewAt;
          }
        }
        setExistingScheduledAtByReqId(scheduled);
      } catch (err) {
        console.error('Failed to fetch scheduled times:', err);
      }
    };

    void fetchScheduledTimes();
  }, [isOpen, candidate]);

  useEffect(() => {
    if (isOpen) {
      setEditInline({
    ...candidate,
    primaryContact: normalisePhone(candidate.primaryContact),
    date: candidate.existingMappings?.[0]?.profileSharedDate ?? '', 
  });
      setErrors(initialErrors);
      setSalaryMismatch(false);
      profileBaselineRef.current = candidate;
      const baseline = candidate.existingMappings ? [...candidate.existingMappings] : [];
      mappingBaselineRef.current = baseline;
      const init: Record<string, string> = {};
      for (const m of baseline) {
        const rid = String(m?.requirementDetails?.id ?? m?.requirementId ?? '');
        if (!rid || rid === 'undefined') continue;
        init[rid] = m?.status?.id != null ? String(m.status.id) : '';
      }
      const dateInit: Record<string, string> = {};
      for (const m of baseline) {
        const rid = String(m?.requirementDetails?.id ?? m?.requirementId ?? '');
        if (!rid || rid === 'undefined') continue;
        dateInit[rid] = m?.profileSharedDate
          ? new Date(m.profileSharedDate).toISOString().split('T')[0]
          : '';
      }
      setProfileSharedDateByReqId(dateInit);
      setExistingMappingStatusByReqId(init);
      } else {
    setDateAnchorEl(null); 
      setSourceDateAnchorEl(null);
  setJoiningDateAnchorEl(null);
    }
  }, [isOpen, candidate]);

  useEffect(() => {
    const rid = editInline.requirementId;
    if (!rid) return;
    const n = Number(rid);
    if (mappedRequirementIds.has(n)) {
      setEditInline((prev) => ({
        ...prev,
        requirementId: '',
        candidateStatusId: '',
      }));
    }
  }, [mappedRequirementIds, editInline.requirementId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'primaryContact' && value.length > 10) {
      return;
    }

    setEditInline({
      ...editInline,
      [name]: value,
    });
  };

  const validateField = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (value !== '') {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors = { ...errors };
    let isValid = true;

    if (!editInline.candidateName) {
      newErrors.candidateName = 'Candidate name is required';
      isValid = false;
    }

    if (!editInline.primaryContact) {
      newErrors.primaryContact = 'Phone number is required';
      isValid = false;
    }

    if (!editInline.emailId) {
      newErrors.emailId = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editInline.emailId)) {
      newErrors.emailId = 'Please enter a valid email';
      isValid = false;
    }

    if (!editInline.source) {
      newErrors.source = 'Source is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleEditSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!validateForm()) {
      showErrorSnackbar('Please fill in all required fields');
      return;
    }

    try {
      if (editInline.id === undefined) {
        showErrorSnackbar('Candidate ID is missing');
        return;
      }

      const data: UpdateCandidateProfile = {
        source: editInline.source,
        candidateName: editInline.candidateName,
        primaryContact: editInline.primaryContact,
        emailId: editInline.emailId,
        candidateLocation: editInline.candidateLocation,
        totalExp: editInline.totalExp,
        relExp: editInline.relExp,
        sourceDate: editInline.sourceDate,
        dateOfJoining: editInline.dateOfJoining,
        skillSet:
          typeof editInline.skillSet === 'string'
            ? editInline.skillSet
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
            : editInline.skillSet,
        currentSalary: editInline.currentSalary,
        expectedSalary: editInline.expectedSalary,
        noticePeriod: editInline.noticePeriod,
        remarks: editInline.remarks,
        updatedBy: {
          id: user?.id,
        },
      };

      // Build requirementMappings array:
      // 1. Status updates for existing mappings (any row where status changed — batched in one PATCH)
      // 2. New mapping from the "Map to New Requirement" dropdowns
      const requirementMappings: any[] = [];

      const rescheduleOnlyKeys: string[] = [];
      for (const m of mappingBaselineRef.current) {
      const reqIdStr = String(m?.requirementDetails?.id ?? m?.requirementId ?? '');
      if (!reqIdStr || reqIdStr === 'undefined') continue;

      const prevStatusId = m?.status?.id ?? null;
      const selected = existingMappingStatusByReqId[reqIdStr] ?? '';
      const nextStatusId = selected ? parseInt(selected, 10) : prevStatusId;

      const prevSharedDate = m?.profileSharedDate
        ? new Date(m.profileSharedDate).toISOString().split('T')[0]
        : '';
      const newSharedDate = profileSharedDateByReqId[reqIdStr] ?? '';
      const dateChanged = newSharedDate !== prevSharedDate;
      const statusChanged = selected && !Number.isNaN(nextStatusId) && nextStatusId !== prevStatusId;

      const clientId = m?.client?.id ?? m?.requirementDetails?.client?.id;
      const scheduledTime = scheduledByReqId[reqIdStr];
      const rejectReason = scheduledByReqId[`${reqIdStr}_rejectReason`];
      const joiningDate = scheduledByReqId[`${reqIdStr}_joiningDate`];

      if (statusChanged && scheduledTime && nextStatusId === prevStatusId) {
        rescheduleOnlyKeys.push(reqIdStr);
        continue;
      }

      if (!statusChanged && !dateChanged) continue;

      const entry: any = {
        requirementId: parseInt(reqIdStr, 10),
        ...(statusChanged && { statusId: nextStatusId }),
        ...(dateChanged && { profileSharedDate: newSharedDate || null }),
        ...(scheduledTime && { scheduledInterviewAt: scheduledTime }),
        ...(rejectReason && { rejectReason }),
        ...(joiningDate && { joiningDate }),
      };
      if (clientId) entry.clientId = clientId;
      requirementMappings.push(entry);
    }
      if (editInline.requirementId) {
        const selectedReq = requirements.find(
          (r: any) => r.id === parseInt(editInline.requirementId ?? '0')
        );
        if (selectedReq) {
          const mapping: any = {
            requirementId: parseInt(editInline.requirementId),
            clientId: selectedReq.client?.id ?? selectedReq.client?.clientProfile?.id,
            ...(editInline.scheduledInterviewAt && {
    scheduledInterviewAt: editInline.scheduledInterviewAt,
  }),
          };
          if (editInline.candidateStatusId) {
            mapping.statusId = parseInt(editInline.candidateStatusId);
          }
          requirementMappings.push(mapping);
        }
      }

      if (requirementMappings.length > 0) {
        (data as any).requirementMappings = requirementMappings;
      }
      if (editInline.resumeS3Key?.trim()) {
        data.resumeS3Key = editInline.resumeS3Key.trim();
      }

      // Only call update API if profile fields OR requirement mappings changed.
      const norm = (v: unknown) => String(v ?? '').trim();
      const normSkills = (v: unknown) =>
        (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [])
          .map((s: any) => String(s ?? '').trim())
          .filter(Boolean)
          .join(',');
      const base = profileBaselineRef.current;
      const profileChanged = base
        ? norm(base.source) !== norm(editInline.source) ||
          norm(base.date) !== norm(editInline.date) ||
          norm(base.candidateName) !== norm(editInline.candidateName) ||
          norm(base.primaryContact) !== norm(editInline.primaryContact) ||
          norm(base.emailId) !== norm(editInline.emailId) ||
          norm(base.candidateLocation) !== norm(editInline.candidateLocation) ||
          norm(base.totalExp) !== norm(editInline.totalExp) ||
          norm(base.relExp) !== norm(editInline.relExp) ||
          normSkills(base.skillSet) !== normSkills(editInline.skillSet) ||
          norm(base.currentSalary) !== norm(editInline.currentSalary) ||
          norm(base.expectedSalary) !== norm(editInline.expectedSalary) ||
          norm(base.noticePeriod) !== norm(editInline.noticePeriod) ||
          norm(base.sourceDate) !== norm(editInline.sourceDate) ||
          norm(base.dateOfJoining) !== norm(editInline.dateOfJoining) ||
          norm(base.remarks) !== norm(editInline.remarks) ||
          norm(base.resumeS3Key) !== norm(editInline.resumeS3Key)
        : true;

      const hasOnlyReschedule =
        rescheduleOnlyKeys.length > 0 &&
        requirementMappings.length === 0 &&
        !editInline.requirementId &&
        !profileChanged;

      //  Call rounds API for reschedule-only keys
      if (rescheduleOnlyKeys.length > 0) {
        const roundUpdatePromises = rescheduleOnlyKeys.map(async (reqKey) => {
          const isoDate = scheduledByReqId[reqKey];
          const mapping = mappingBaselineRef.current.find((m: any) =>
            String(m?.requirementDetails?.id ?? m?.requirementId ?? '') === reqKey
          );
          if (!mapping || !isoDate) return;

          try {
            //  Fetch all filters to find the round
            const [todayRes, upcomingRes, unhandledRes] = await Promise.all([
              fetchUpcomingInterviews({ filter: 'today' }),
              fetchUpcomingInterviews({ filter: 'upcoming' }),
              fetchUpcomingInterviews({ filter: 'unhandled' }),
            ]);

            const allRows = [
              ...(todayRes?.data?.data ?? []),
              ...(upcomingRes?.data?.data ?? []),
              ...(unhandledRes?.data?.data ?? []),
            ];

            //  Match by candidateId
            const candidateId = mapping?.candidate?.id;
            const positionName = mapping?.requirementDetails?.positionDetails?.positionName?.toLowerCase();

            const matchedRow = allRows.find((r: any) =>
              r.candidateId === candidateId &&
              r.positionName?.toLowerCase() === positionName
            );

            const roundId = matchedRow?.roundId;
            if (!roundId) {
              console.error('No round found for candidate:', candidateId);
              return;
            }

            await updateInterviewDate(roundId, {
              interviewDate: isoDate,
              updatedBy: { id: user?.id },
            });
          } catch (err) {
            console.error('Failed to update round:', err);
          }
        });
        await Promise.all(roundUpdatePromises);
        setScheduledByReqId({});
      }

      //  Skip candidate update if only rescheduling
      if (hasOnlyReschedule) {
        showSuccessSnackbar('Interview rescheduled successfully');
        onOpenChange(false);
        return;
      }

      // Original no-change check (only reached if no reschedule)
      if (!profileChanged && requirementMappings.length === 0) {
        showSuccessSnackbar('No changes to update');
        onOpenChange(false);
        return;
      }

      const response = await dispatch(
        UpdateCandidateInd({
          id: editInline.id,
          payload: data,
        })
      ).unwrap();

      if (response?.statusCode === 409) {
        showErrorSnackbar(response?.message ?? 'Email or phone already exists for another candidate');
        return;
      }

      if (response?.success && response?.statusCode === 200) {
        showSuccessSnackbar(response?.message ?? 'Candidate updated successfully');
        try {
          onSuccess(response as unknown as UpdateCandidateSuccessPayload);
        } catch (callbackErr) {
          console.error('EditCandidateForm onSuccess:', callbackErr);
        }
        onOpenChange(false);
      } else {
        showErrorSnackbar(response?.message ?? 'Failed to update candidate');
      }
    } catch (error) {
      console.error('Error updating candidate:', error);
      const msg =
        typeof error === 'string'
          ? error
          : error && typeof error === 'object' && 'message' in error && typeof (error as Error).message === 'string'
            ? (error as Error).message
            : 'An error occurred while updating the candidate';
      showErrorSnackbar(msg);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditInline(candidate);
      setErrors(initialErrors);
      setSalaryMismatch(false);
    }
    onOpenChange(open);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
        <DialogContent
           className="dialog-standard flex flex-col gap-0 overflow-hidden p-0"
           aria-describedby={undefined}
        >
          <DialogHeader className="shrink-0 space-y-1 px-4 pb-2 pt-5 text-left sm:px-6 sm:pt-6">
            <DialogTitle className="text-xl font-bold sm:text-2xl">
              Edit Candidate Profile
            </DialogTitle>
          </DialogHeader>
          <form className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 sm:px-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5">
                <div className="space-y-2">
                  <Label htmlFor="candidateName" className='required'>Candidate Name</Label>
                  <Input
                    id="candidateName"
                    name="candidateName"
                    value={editInline?.candidateName || ''}
                    type="text"
                    placeholder="Enter candidate name"
                    onChange={(e) => {
                      handleChange(e);
                      validateField(e);
                    }}
                    className={errors?.candidateName ? 'border-red-500' : ''}
                  />
                  {errors?.candidateName && (
                    <span className="text-red-500 text-sm">{errors.candidateName}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailId" className='required'>Email ID</Label>
                  <Input
                    id="emailId"
                    name="emailId"
                    type="email"
                    value={editInline?.emailId || ''}
                    placeholder="Enter email address"
                    onChange={(e) => {
                      handleChange(e);
                      validateField(e);
                    }}
                    className={errors?.emailId ? 'border-red-500' : ''}
                  />
                  {errors?.emailId && (
                    <span className="text-red-500 text-sm">{errors.emailId}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailId" className='required'>Phone Number</Label>
                  <PhoneField
                    value={editInline?.primaryContact || ''}
                    error={errors?.primaryContact}
                    onChange={(val) => {
                      setEditInline({ ...editInline, primaryContact: val });
                      setErrors((prev) => ({ ...prev, primaryContact: '' }));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source"className='required'>Source</Label>
                  <Input
                    id="source"
                    name="source"
                    type="text"
                    placeholder="Enter the source"
                    value={editInline?.source || ''}
                    onChange={(e) => {
                      handleChange(e);
                      validateField(e);
                    }}
                    className={errors?.source ? 'border-red-500' : ''}
                  />
                  {errors?.source && <span className="text-red-500 text-sm">{errors.source}</span>}
                </div>
                {/* Source Date */}
                <div className="space-y-2">
                  <Label htmlFor="sourceDate" className='required'>Source Date</Label>
                  <button
                    type="button"
                    id="sourceDate"
                    onClick={(e) => setSourceDateAnchorEl(sourceDateAnchorEl ? null : e.currentTarget)}
                    className={cn(
                      'flex items-center w-full h-10 px-3 rounded-md border bg-white text-sm text-left transition-all',
                      sourceDateAnchorEl
                        ? 'border-[var(--brand)] ring-2 ring-[var(--brand)]/20'
                        : 'border-input hover:border-[var(--brand)] hover:bg-slate-50'
                    )}
                    style={{ justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3.5 w-3.5 shrink-0 text-[var(--brand)]">
                        <rect x="2" y="3" width="12" height="11" rx="2"/><path d="M5 1v3M11 1v3M2 7h12"/>
                      </svg>
                      <span className={editInline?.sourceDate ? 'text-slate-700' : 'text-muted-foreground'}>
                        {editInline?.sourceDate ? format(new Date(editInline.sourceDate), 'dd MMM yyyy') : 'Pick a date'}
                      </span>
                    </div>
                    {editInline?.sourceDate && (
                      <span
                        role="button"
                        onClick={(e) => { e.stopPropagation(); setEditInline((prev) => ({ ...prev, sourceDate: '' })); setSourceDateAnchorEl(null); }}
                        style={{ display: 'flex', alignItems: 'center', color: '#9ca3af', lineHeight: 1 }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#9ca3af')}
                      >
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 11, height: 11 }}>
                          <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                        </svg>
                      </span>
                    )}
                  </button>   
                </div>
                <div className="space-y-2">
                  <Label htmlFor="candidateLocation">Current Location</Label>
                  <Input
                    id="candidateLocation"
                    name="candidateLocation"
                    type="text"
                    placeholder="Enter current location"
                    value={editInline?.candidateLocation || ''}
                    onChange={(e) => {
                      handleChange(e);
                      validateField(e);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalExp">Total Exp</Label>
                  <Input
                    id="totalExp"
                    name="totalExp"
                    type="text"
                    placeholder="Enter total experience"
                    value={editInline?.totalExp || ''}
                    onChange={(e) => {
                      handleChange(e);
                      validateField(e);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relExp">Rel Exp</Label>
                  <Input
                    id="relExp"
                    name="relExp"
                    type="text"
                    value={editInline?.relExp || ''}
                    placeholder="Enter relevant experience"
                    onChange={(e) => {
                      handleChange(e);
                      validateField(e);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skillSet">Skill Set</Label>
                  <Input
                    id="skillSet"
                    name="skillSet"
                    type="text"
                    placeholder="Enter skill set (comma separated)"
                    value={
                      Array.isArray(editInline?.skillSet)
                        ? editInline.skillSet.join(', ')
                        : editInline?.skillSet || ''
                    }
                    onChange={(e) => {
                      setEditInline({
                        ...editInline,
                        skillSet: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      });
                      validateField(e);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentSalary" className='required'>Current Salary(CTC)</Label>
                  <Input
                    id="currentSalary"
                    name="currentSalary"
                    type="text"
                    placeholder="Enter current salary"
                    value={editInline?.currentSalary || ''}
                    onChange={(e) => {
                      handleChange(e);
                      validateField(e);
                    }}
                   onBlur = {handleSalaryBlur}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedSalary" >Expected Salary(CTC)</Label>
                  <Input
                    id="expectedSalary"
                    name="expectedSalary"
                    type="text"
                    placeholder="Enter expected salary"
                    value={editInline?.expectedSalary || ''}
                    onChange={(e) => {
                      handleChange(e);
                      validateField(e);
                    }}
                    onBlur={handleSalaryBlur}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noticePeriod" className='required'>Notice Period</Label>
                  <Input
                    id="noticePeriod"
                    name="noticePeriod"
                    type="text"
                    placeholder="Enter notice period"
                    value={editInline?.noticePeriod || ''}
                    onChange={(e) => {
                      handleChange(e);
                      validateField(e);
                    }}
                  />
                </div>
                {/* Date of Joining */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfJoining">Date of Joining</Label>
                  <button
                    type="button"
                    id="dateOfJoining"
                    onClick={(e) => setJoiningDateAnchorEl(joiningDateAnchorEl ? null : e.currentTarget)}
                    className={cn(
                      'flex items-center w-full h-10 px-3 rounded-md border bg-white text-sm text-left transition-all',
                      joiningDateAnchorEl
                        ? 'border-[var(--brand)] ring-2 ring-[var(--brand)]/20'
                        : 'border-input hover:border-[var(--brand)] hover:bg-slate-50'
                    )}
                    style={{ justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3.5 w-3.5 shrink-0 text-[var(--brand)]">
                        <rect x="2" y="3" width="12" height="11" rx="2"/><path d="M5 1v3M11 1v3M2 7h12"/>
                      </svg>
                      <span className={editInline?.dateOfJoining ? 'text-slate-700' : 'text-muted-foreground'}>
                        {editInline?.dateOfJoining ? format(new Date(editInline.dateOfJoining), 'dd MMM yyyy') : 'Pick a date'}
                      </span>
                    </div>
                    {editInline?.dateOfJoining && (
                      <span
                        role="button"
                        onClick={(e) => { e.stopPropagation(); setEditInline((prev) => ({ ...prev, dateOfJoining: '' })); setJoiningDateAnchorEl(null); }}
                        style={{ display: 'flex', alignItems: 'center', color: '#9ca3af', lineHeight: 1 }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#9ca3af')}
                      >
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 11, height: 11 }}>
                          <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                        </svg>
                      </span>
                    )}
                  </button>
                </div>
                {/* Existing Requirements — read-only with editable status for pending ones */}
                {editInline?.existingMappings && editInline.existingMappings.length > 0 && (
                  <div className="col-span-full w-full max-w-full space-y-2">
                    <Label>Already Mapped Requirements</Label>
                    {/* Outer wrapper must allow overflow so dropdowns can escape.
                      Inner wrapper handles horizontal scrolling. */}
                  <div className="overflow-visible rounded-lg border border-gray-200 bg-gray-50 p-3 [scrollbar-gutter:stable]">
                    <div
                      className="flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-visible scroll-smooth"
                      style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                      {editInline.existingMappings.map((mapping: any, idx: number) => {
                        const reqId = mapping?.requirementDetails?.id ?? mapping?.requirementId;
                        const reqName =
                          mapping?.requirementDetails?.positionDetails?.positionName ||
                          mapping?.requirement?.positionDetails?.positionName ||
                          `Req #${reqId}`;
                        const clientName = requirementClientDisplayName(
                          mapping?.requirementDetails?.client ??
                            mapping?.requirement?.client ??
                            mapping?.client
                        );
                        const reqKey = String(reqId);
                        const isSuperUser = user?.role?.id === Roles.SUPERUSER;
                        const isAssignedUser = mapping.assignedTo?.id === user?.id;
                        const canEdit = isSuperUser || isAssignedUser;
                        return (
                          <div
                          key={reqKey || idx}
                          className="flex w-[min(16rem,calc(100vw-4rem))] shrink-0 snap-start flex-col gap-2.5 rounded-md border border-gray-200 bg-white px-3 py-3 shadow-sm sm:w-64"
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col min-w-0 gap-0.5">
                              <span className="text-[13px] font-semibold text-gray-900 leading-snug truncate">{reqName}</span>
                              <span className="text-[11px] text-gray-400 truncate">Client: {clientName}</span>
                            </div>
                            <ProfileAvatar
                              userId={mapping?.assignedTo?.id}
                              imageKey={mapping?.assignedTo?.imageURL}
                              name={`${mapping?.assignedTo?.firstName ?? ''} ${mapping?.assignedTo?.lastName ?? ''}`}
                              size="sm"
                            />
                          </div>

                          <div className="h-px bg-gray-100" />

                          {/* Status */}
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-semibold text-gray-600 tracking-wide">Status</span>
                            <SearchableSelect
                              id={`mapping-status-${reqKey}`}
                              label=""
                              placeholder="Select status"
                              useAccent={false}
                              options={(statuses ?? []).map((s: any) => ({
                                value: String(s.id),
                                label: s.statusName,
                              }))}
                              value={existingMappingStatusByReqId[reqKey] ?? ''}
                              disabled={!canEdit || !(statuses ?? []).length}
                              onChange={(val) => {
                                if (!val) return;
                                setExistingMappingStatusByReqId((prev) => ({ ...prev, [reqKey]: val }));
                                pendingMappingRef.current = { reqKey, statusId: val };
                                const existingScheduledAt =
                                  scheduledByReqId[reqKey] ??
                                  existingScheduledAtByReqId[reqKey] ??
                                  mapping?.scheduledInterviewAt ??
                                  undefined;
                                handleStatusChange(reqKey, val, false, existingScheduledAt);
                              }}
                            />
                          </div>

                          {/* Profile Shared Date */}
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-semibold text-gray-600 tracking-wide">Profile Shared Date</span>
                            <button
                              type="button"
                              disabled={!canEdit}
                              onClick={(e) => {
                                const input = e.currentTarget.nextElementSibling as HTMLInputElement;
                                input?.showPicker?.();
                              }}
                              className={cn(
                                'flex items-center justify-between w-full h-9 px-3 rounded-md border text-xs text-left transition-all bg-white',
                                !canEdit
                                  ? 'opacity-50 cursor-not-allowed border-gray-200'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
                              )}
                            >
                              <div className="flex items-center gap-1.5">
                                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3.5 w-3.5 shrink-0 text-gray-400">
                                  <rect x="2" y="3" width="12" height="11" rx="2"/><path d="M5 1v3M11 1v3M2 7h12"/>
                                </svg>
                                <span className={profileSharedDateByReqId[reqKey] ? 'text-gray-700' : 'text-gray-400'}>
                                  {profileSharedDateByReqId[reqKey]
                                    ? format(new Date(profileSharedDateByReqId[reqKey]), 'dd-MM-yyyy')
                                    : 'Pick a date'}
                                </span>
                              </div>
                              {profileSharedDateByReqId[reqKey] && canEdit && (
                                <span
                                  role="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProfileSharedDateByReqId((prev) => ({ ...prev, [reqKey]: '' }));
                                  }}
                                  className="text-gray-300 hover:text-gray-500 transition-colors"
                                >
                                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 10, height: 10 }}>
                                    <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                                  </svg>
                                </span>
                              )}
                            </button>
                            <input
                              type="date"
                              disabled={!canEdit}
                              value={profileSharedDateByReqId[reqKey] ?? ''}
                              onChange={(e) =>
                                setProfileSharedDateByReqId((prev) => ({ ...prev, [reqKey]: e.target.value }))
                              }
                              className="sr-only"
                            />
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2 [&_[role='combobox']]:h-10 [&_[role='combobox']]:min-h-[40px]">
                <Label htmlFor="requirementId">Requirement</Label>
                <SearchableSelect
                  id="requirementId"
                  label=""
                  placeholder="Search & select requirement"
                  useAccent={false}
                  options={unmappedActiveRequirements.map((r: RequirementLoop) => ({
                    value: String(r?.id),
                    label: formatRequirementSelectLabel(r),
                  }))}
                  value={editInline?.requirementId ?? ''}
                  onChange={(val) =>
                    setEditInline({
                      ...editInline,
                      requirementId: val,
                      candidateStatusId: '',
                    })
                  }
                />
              </div>
              <div className="space-y-2 [&_[role='combobox']]:h-10 [&_[role='combobox']]:min-h-[40px]">
                <Label htmlFor="candidateStatusId">Initial Status</Label>
                <SearchableSelect
                  id="candidateStatusId"
                  label=""
                  placeholder={
                    editInline?.requirementId
                      ? 'Search & select status'
                      : 'Select a requirement first'
                  }
                  useAccent={false}
                  disabled={!editInline?.requirementId}
                  options={(statuses ?? []).map((s: any) => ({
                    value: String(s?.id),
                    label: s?.statusName,
                  }))}
                  value={editInline?.candidateStatusId ?? ''}
                  onChange={(val) => {
                    if (!val) return;
                    pendingMappingRef.current = { reqKey: '__new__', statusId: val };
                    handleStatusChange('__new__', val, true);
                    setEditInline({ ...editInline, candidateStatusId: val });
                  }}
                />
              </div>

              <div className="col-span-full space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <textarea
                  id="remarks"
                  name="remarks"
                  placeholder="Enter remarks (optional)"
                  value={editInline?.remarks || ''}
                  onChange={(e) => handleChange(e)}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 gap-2 border-t bg-background px-4 py-3 sm:px-6 sm:py-4">
            <input
              id="candidate-resume-replace"
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.currentTarget.value = '';
                if (!file) return;
                setResumeUploadPending(true);
                try {
                  const res = await uploadCandidateResume(file);
                  const nextKey = (res.data as any)?.data?.resumeS3Key;
                  if (typeof nextKey === 'string' && nextKey.trim()) {
                    setEditInline((prev) => ({
                      ...prev,
                      resumeS3Key: nextKey.trim(),
                    }));
                    showSuccessSnackbar('Resume uploaded. Save the candidate to apply it.');
                  } else {
                    showErrorSnackbar('Resume upload completed but no S3 key was returned');
                  }
                } catch {
                  showErrorSnackbar('Failed to upload replacement resume');
                } finally {
                  setResumeUploadPending(false);
                }
              }}
            />
            {editInline.resumeS3Key ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setResumeViewerOpen(true)}
              >
                View Resume
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              disabled={resumeUploadPending}
              onClick={() =>
                document.getElementById('candidate-resume-replace')?.click()
              }
            >
              {resumeUploadPending ? 'Uploading Resume…' : 'Replace Resume'}
            </Button>
            <Button onClick={handleEditSubmit} className="w-full sm:w-auto bg-[var(--brand)] text-white hover:bg-var(--brand)" type="button">
              Update Candidate
            </Button>
          </DialogFooter>
        </form>
         {/* ── Date portal picker ── */}
        {dateAnchorEl && (
          <PortalPicker
            type="date"
            value={
              editInline?.date
                ? new Date(editInline.date).toISOString().split('T')[0]
                : ''
            }
            anchorEl={dateAnchorEl}
            onChange={(val) => {
              setEditInline((prev) => ({ ...prev, date: val }));
            }}
            allowPastDates={true}
            onSave={() => setDateAnchorEl(null)}
            onCancel={() => setDateAnchorEl(null)}
          />
        )}
        {sourceDateAnchorEl && (
  <PortalPicker
    type="date"
    value={
      editInline?.sourceDate
        ? new Date(editInline.sourceDate).toISOString().split('T')[0]
        : ''
    }
    anchorEl={sourceDateAnchorEl}
    onChange={(val) => setEditInline((prev) => ({ ...prev, sourceDate: val }))}
    allowPastDates={true}
    onSave={() => setSourceDateAnchorEl(null)}
    onCancel={() => setSourceDateAnchorEl(null)}
  />
)}

    {salaryMismatch && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-xl shadow-xl p-6 w-[90%] max-w-sm flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            The <span className="font-medium text-gray-800">Expected CTC</span> is less
            than the <span className="font-medium text-gray-800">Current CTC</span>. Do
            you want to proceed with this?
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setEditInline((prev) => ({ ...prev, expectedSalary: '' }));
                setSalaryMismatch(false);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300
                rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => setSalaryMismatch(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--brand)]
                rounded-lg hover:opacity-90 transition-all"
            >
              Yes, Proceed
            </button>
          </div>
        </div>
      </div>
    )}

{joiningDateAnchorEl && (
  <PortalPicker
    type="date"
    value={
      editInline?.dateOfJoining
        ? new Date(editInline.dateOfJoining).toISOString().split('T')[0]
        : ''
    }
    anchorEl={joiningDateAnchorEl}
    onChange={(val) => setEditInline((prev) => ({ ...prev, dateOfJoining: val }))}
    allowPastDates={true}
    onSave={() => setJoiningDateAnchorEl(null)}
    onCancel={() => setJoiningDateAnchorEl(null)}
  />
)}
      </DialogContent>
    </Dialog>
    <CustomizedSnackbars
      open={snackbarState.open}
      handleClose={handleSnackbarClose}
      message={snackbarState.message}
      severity={snackbarState.severity}
    />
     <InterviewScheduleDialog {...interviewDialogProps} />
     <RejectReasonDialog {...rejectDialogProps} />
     <JoinedDialog {...joinedDialogProps} /> 
      <DocumentPreviewDialog
        open={resumeViewerOpen}
        onOpenChange={setResumeViewerOpen}
        title={`Resume Preview` + 
          (editInline.candidateName ? ` · ` + editInline.candidateName : '')}
        fileKey={editInline.resumeS3Key ?? null}
        fetchDocument={() => {
          const candidateId = Number(editInline.id);
          if (!Number.isFinite(candidateId)) {
            throw new Error('Candidate ID is missing');
          }
          return fetchCandidateResumeFile(candidateId);
        }}
        showError={showErrorSnackbar}
      />
    </>
  );
};

export default EditCandidateForm;
