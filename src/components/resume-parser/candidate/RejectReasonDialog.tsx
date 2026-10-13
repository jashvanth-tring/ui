import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';


interface Props {
  open: boolean;
  statusName: string | null;
  rejectReason: string;
  onRejectReasonChange: (val: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}


export const RejectReasonDialog: React.FC<Props> = ({
  open, statusName, rejectReason, onRejectReasonChange, onConfirm, onCancel,
}) => (
  <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-[var(--brand)]">Rejection Reason</DialogTitle>
        <DialogDescription>
          {statusName
            ? `You selected "${statusName}". Please provide a reason for rejection.`
            : ''}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2 py-2">
        <Label htmlFor="reject-reason" className="text-slate-700">
          Reason <span className="text-red-500">*</span>
        </Label>
        <textarea
          id="reject-reason"
          rows={4}
          placeholder="Enter rejection reason..."
          value={rejectReason}
          onChange={(e) => onRejectReasonChange(e.target.value)}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          type="button"
          className="bg-red-600 hover:bg-red-700 text-white"
          disabled={!rejectReason.trim()}
          onClick={onConfirm}
        >
          Confirm Rejection
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

