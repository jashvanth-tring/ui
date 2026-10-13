// src/hooks/useInterviewSchedule.ts
import { useState } from 'react';
import {
  defaultSuggestedInterviewDatetimeLocal,
  isInterviewRejectedPipelineStatus,
  isInterviewScheduledPipelineStatus,
} from '../utils/interview-scheduled-status';
import { isJoinedPipelineStatus } from '../utils/joined-status';

export interface InterviewSchedulePrompt {
  requirementIdKey: string;
  statusId: string;
  statusName: string;
}
export interface RejectPrompt {
  requirementIdKey: string;
  statusId: string;
  statusName: string;
}

export interface UseInterviewScheduleOptions {
  statuses: { id: number; statusName: string }[];
  onNewStatusChange: (statusId: string) => void;
  onExistingStatusChange: (requirementIdKey: string, statusId: string) => void;
  onScheduledAtChange?: (isoString: string) => void;
  // ✅ Fixed signatures — only pass what callers need
  onConfirmRaw?: (isoString: string) => void;
  onConfirmReject?: (reason: string) => void;
  onConfirmJoined?: (joiningDateIso: string) => void;
}

export interface UseInterviewScheduleReturn {
  interviewDialogProps: {
    open: boolean;
    prompt: InterviewSchedulePrompt | null;
    scheduleAtLocal: string;
    onScheduleAtChange: (val: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
  };
  rejectDialogProps: {
    open: boolean;
    statusName: string | null;
    rejectReason: string;
    onRejectReasonChange: (val: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
  };
  joinedDialogProps: {
    open: boolean;
    statusName: string | null;
    joiningDate: string;
    onJoiningDateChange: (val: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
  };
  handleStatusChange: (
    requirementIdKey: string,
    statusId: string,
    isNew: boolean,
    existingScheduledAt?: string,
  ) => void;
}

export function useInterviewSchedule({
  statuses,
  onNewStatusChange,
  onExistingStatusChange,
  onScheduledAtChange,
  onConfirmRaw,
  onConfirmReject,
  onConfirmJoined,
}: UseInterviewScheduleOptions): UseInterviewScheduleReturn {
  const [prompt, setPrompt] = useState<InterviewSchedulePrompt | null>(null);
  const [scheduleAtLocal, setScheduleAtLocal] = useState('');
  const [rejectPrompt, setRejectPrompt] = useState<RejectPrompt | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [joinedPrompt, setJoinedPrompt] = useState<RejectPrompt | null>(null);
  const [joiningDate, setJoiningDate] = useState('');

  const handleStatusChange = (
    requirementIdKey: string,
    statusId: string,
    isNew: boolean,
    existingScheduledAt?: string,
  ) => {
    const selectedStatus = statuses.find((s) => String(s.id) === statusId);
    if (!selectedStatus) return;

     if (isInterviewScheduledPipelineStatus(selectedStatus.statusName)) {
      setPrompt({ requirementIdKey, statusId, statusName: selectedStatus.statusName });
      setScheduleAtLocal(
        existingScheduledAt
          ? new Date(existingScheduledAt).toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16)
          : defaultSuggestedInterviewDatetimeLocal()
      );
      return;
    }

    if (isInterviewRejectedPipelineStatus(selectedStatus.statusName)) {
      setRejectPrompt({ requirementIdKey, statusId, statusName: selectedStatus.statusName });
      setRejectReason('');
      return;
    }

    if (isJoinedPipelineStatus(selectedStatus.statusName)) {
      setJoinedPrompt({ requirementIdKey, statusId, statusName: selectedStatus.statusName });
      setJoiningDate('');
      return;
    }

    // No dialog needed
    if (isNew) onNewStatusChange(statusId);
    else onExistingStatusChange(requirementIdKey, statusId);
  };

  const onConfirm = () => {
    if (!prompt || !scheduleAtLocal) return;
    const d = new Date(scheduleAtLocal);
    if (Number.isNaN(d.getTime())) return;

    const { requirementIdKey, statusId } = prompt;
    setPrompt(null);

    if (onConfirmRaw) {
      // ✅ Only pass the ISO string — caller already has statusId/reqKey via closure
      onConfirmRaw(d.toISOString());
      return;
    }

    if (requirementIdKey === '__new__') {
      onNewStatusChange(statusId);
      onScheduledAtChange?.(d.toISOString());
    } else {
      onExistingStatusChange(requirementIdKey, statusId);
    }
  };

  const onRejectConfirm = () => {
    if (!rejectPrompt || !rejectReason.trim()) return;
    const { requirementIdKey, statusId } = rejectPrompt;
    setRejectPrompt(null);
    setRejectReason('');

    if (onConfirmReject) {
      // ✅ Only pass the reason — caller has statusId/reqKey via closure
      onConfirmReject(rejectReason.trim());
      return;
    }

    if (requirementIdKey === '__new__') onNewStatusChange(statusId);
    else onExistingStatusChange(requirementIdKey, statusId);
  };

  const onJoinedConfirm = () => {
    if (!joinedPrompt) return;
   const isoDate = joiningDate
    ? new Date(joiningDate + 'T00:00:00').toISOString()
    : '';
    setJoinedPrompt(null);
    setJoiningDate('');

    if (onConfirmJoined) {
      // ✅ Only pass the ISO date — caller has statusId/reqKey via closure
      onConfirmJoined(isoDate);
      return;
    }

    const { requirementIdKey, statusId } = joinedPrompt;
    if (requirementIdKey === '__new__') onNewStatusChange(statusId);
    else onExistingStatusChange(requirementIdKey, statusId);
  };

  return {
    handleStatusChange,
    interviewDialogProps: {
      open: prompt !== null,
      prompt,
      scheduleAtLocal,
      onScheduleAtChange: setScheduleAtLocal,
      onConfirm,
      onCancel: () => setPrompt(null),
    },
    rejectDialogProps: {
      open: rejectPrompt !== null,
      statusName: rejectPrompt?.statusName ?? null,
      rejectReason,
      onRejectReasonChange: setRejectReason,
      onConfirm: onRejectConfirm,
      onCancel: () => { setRejectPrompt(null); setRejectReason(''); },
    },
    joinedDialogProps: {
      open: joinedPrompt !== null,
      statusName: joinedPrompt?.statusName ?? null,
      joiningDate,
      onJoiningDateChange: setJoiningDate,
      onConfirm: onJoinedConfirm,
      onCancel: () => { setJoinedPrompt(null); setJoiningDate(''); },
    },
  };
}