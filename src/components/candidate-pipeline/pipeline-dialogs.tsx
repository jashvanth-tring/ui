import React from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '../ui/dialog';
import { RequirementCard } from '../candidateApplicationHistory';
import type { CandidateStatusListItem } from '../../store/model/candidate-status-list.types';
import type { CandidateStatusHistoryEntry } from '../../store/model/candidate.types';

// ── Types ──────────────────────────────────────────────────────────────────
interface ReassignDialogProps {
  pendingAssign: { row: CandidateStatusListItem; nextId: number; nextLabel: string } | null;
  onCancel: () => void;
  onConfirm: (row: CandidateStatusListItem, nextId: number) => void;
}

interface ProcessHistoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  historyLoading: boolean;
  historyEntries: CandidateStatusHistoryEntry[];
  historyMappings: any[];
  historyCandidateId: number | null;
  historyCandidateName: string;
  historyGroup: {
    requirementId: number;
    clientName: string;
    positionName: string;
    steps: {
      statusName: string | null;
      prevStatusName: string | null;
      changedAt: string;
      changedByName: string | null;
      operation: 'CREATE' | 'UPDATE';
    }[];
  } | null;
  onRequestClose: () => void;
  onAfterStatusChange: () => void;
}

// ── ReassignDialog ─────────────────────────────────────────────────────────
export const ReassignDialog: React.FC<ReassignDialogProps> = ({
  pendingAssign,
  onCancel,
  onConfirm,
}) => {
  if (!pendingAssign) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-gray-900 mb-1">Reassign candidate?</h2>
        <p className="text-sm text-gray-500 mb-5">
          Are you sure you want to assign{' '}
          <span className="font-medium text-gray-800">
            {pendingAssign.row.candidate?.candidateName ?? 'this candidate'}
          </span>{' '}
          to <span className="font-medium text-gray-800">{pendingAssign.nextLabel}</span>?
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--brand)] text-white transition"
            onClick={() => { onConfirm(pendingAssign.row, pendingAssign.nextId); onCancel(); }}
          >
            Yes, reassign
          </button>
        </div>
      </div>
    </div>
  );
};

// ── ProcessHistoryDialog ───────────────────────────────────────────────────
export const ProcessHistoryDialog: React.FC<ProcessHistoryDialogProps> = ({
  isOpen, onOpenChange, historyLoading, historyEntries,
  historyMappings, historyCandidateId, historyCandidateName,
  historyGroup, onRequestClose, onAfterStatusChange,
}) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent
      showCloseButton={false}
      className={[
        'flex max-h-[90vh] w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden p-0',
        'sm:max-w-[min(1100px,calc(100vw-2rem))]',
        '!bg-transparent !border-0 !shadow-none',
      ].join(' ')}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 bg-transparent">
        {historyLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading history…
          </div>
        ) : historyEntries.length === 0 ? (
          <div className="text-sm text-slate-500 py-12 text-center">
            No status history found for this requirement.
          </div>
        ) : historyGroup && historyCandidateId ? (
          <RequirementCard
            group={historyGroup as any}
            defaultExpanded={true}
            candidateId={historyCandidateId}
            candidateName={historyCandidateName}
            candidateMappings={historyMappings}
            focused={true}
            onRequestClose={onRequestClose}
            onAfterStatusChange={onAfterStatusChange}
          />
        ) : null}
      </div>
    </DialogContent>
  </Dialog>
);