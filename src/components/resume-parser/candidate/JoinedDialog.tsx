import React, { useState, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { CustomDatePicker } from '../../../components/ui/custom-date-picker';
import { CalendarIcon } from 'lucide-react';

interface Props {
  open: boolean;
  statusName: string | null;
  joiningDate: string;           // 'YYYY-MM-DD'
  onJoiningDateChange: (val: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const JoinedDialog: React.FC<Props> = ({
  open, statusName, joiningDate, onJoiningDateChange, onConfirm, onCancel,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftDate, setDraftDate] = useState('');

  const openPicker = () => { setDraftDate(joiningDate); setPickerOpen(true); };

const handleDateSave = useCallback((newDate?: string) => {
  onJoiningDateChange(newDate ?? draftDate);
  setPickerOpen(false);
}, [draftDate, onJoiningDateChange]);

  const displayDate = joiningDate
    ? new Date(joiningDate + 'T00:00').toLocaleDateString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      })
    : 'Pick a date';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="sm:max-w-2xl overflow-hidden" showCloseButton>
        <div className="flex gap-0">

          {/* ── LEFT: form ── */}
          <div className="flex flex-col w-64 shrink-0 pr-6">
            <DialogHeader>
              <DialogTitle className="text-[var(--brand)]">
                Joining date
              </DialogTitle>
              <DialogDescription className="text-sm">
                {statusName
                  ? `You selected "${statusName}". Choose the candidate's date of joining.`
                  : ''}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4 flex-1">
              <div className="space-y-1">
                <Label className="text-slate-700 text-xs font-medium">Date of Joining</Label>
                <button
                  type="button"
                  onClick={openPicker}
                  className={`
                    flex items-center gap-2 w-full px-3 py-2 rounded-md border text-sm
                    bg-white text-left transition-colors
                    ${pickerOpen
                      ? 'border-[var(--brand)] ring-2 ring-[var(--brand)]/20 text-slate-800'
                      : joiningDate
                        ? 'border-slate-300 text-slate-800'
                        : 'border-slate-200 text-slate-400'}
                    hover:border-[var(--brand)]
                  `}
                >
                  <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{displayDate}</span>
                </button>
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 pt-2">
              <Button
                type="button"
                className="w-full bg-[var(--brand)] hover:bg-[var(--brand)] text-white"
                onClick={onConfirm}
              >
                Save status
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
                Cancel
              </Button>
            </DialogFooter>
          </div>

          {/* ── DIVIDER ── */}
          {pickerOpen && <div className="w-px bg-slate-100 mx-2 self-stretch" />}

          {/* ── RIGHT: date picker ── */}
          {pickerOpen && (
            <div className="flex-1 flex items-start justify-center pt-1">
              <CustomDatePicker
                value={draftDate}
                onChange={(v) => { setDraftDate(v); handleDateSave(v); }}
  onSave={() => {}}
  onCancel={() => setPickerOpen(false)}
  allowPastDates={true}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};