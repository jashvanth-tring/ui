// src/components/candidate/InterviewScheduleDialog.tsx
import React, { useState, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { CustomDatePicker } from '../../../components/ui/custom-date-picker';
import { CustomTimePicker } from '../../../components/ui/custom-time-picker';
import type { InterviewSchedulePrompt } from '../../../hooks/useInterviewSchedule';
import { CalendarIcon, ClockIcon } from 'lucide-react';

interface Props {
  open: boolean;
  prompt: InterviewSchedulePrompt | null;
  scheduleAtLocal: string;
  onScheduleAtChange: (val: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function splitDateTime(val: string) {
  if (!val) return { date: '', time: '' };
  const [date = '', time = ''] = val.split('T');
  return { date, time };
}

function mergeDateTime(date: string, time: string) {
  if (!date && !time) return '';
  return `${date}T${time}`;
}

export const InterviewScheduleDialog: React.FC<Props> = ({
  open, prompt, scheduleAtLocal, onScheduleAtChange, onConfirm, onCancel,
}) => {
  const { date, time } = splitDateTime(scheduleAtLocal);
  const [activePicker, setActivePicker] = useState<'date' | 'time' | null>(null);
  const [draftDate, setDraftDate] = useState('');
  const [draftTime, setDraftTime] = useState('');

  const openDatePicker = () => { setDraftDate(date); setActivePicker('date'); };
  const openTimePicker = () => { setDraftTime(time); setActivePicker('time'); };

const handleDateSave = useCallback((newDate?: string) => {
  onScheduleAtChange(mergeDateTime(newDate ?? draftDate, time));
  setActivePicker(null);
}, [draftDate, time, onScheduleAtChange]);

const handleTimeSave = useCallback((newTime?: string) => {
  onScheduleAtChange(mergeDateTime(date, newTime ?? draftTime));
  setActivePicker(null);
}, [date, draftTime, onScheduleAtChange]);

  const handlePickerCancel = useCallback(() => setActivePicker(null), []);

  const displayDate = date
    ? new Date(date + 'T00:00').toLocaleDateString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      })
    : 'Pick a date';

  const displayTime = time
    ? new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit',
      })
    : 'Pick a time';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent
        className="sm:max-w-2xl overflow-hidden"
        showCloseButton
      >
        <div className="flex gap-0">

          {/* ── LEFT: form ── */}
          <div className="flex flex-col w-64 shrink-0 pr-6">
            <DialogHeader>
              <DialogTitle className="text-[var(--brand)]">
                Interview date &amp; time
              </DialogTitle>
              <DialogDescription className="text-sm">
                {prompt
                  ? `You selected "${prompt.statusName}". Choose when the interview is scheduled.`
                  : ''}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4 flex-1">
              {/* Date button */}
              <div className="space-y-1">
                <Label className="text-slate-700 text-xs font-medium">Date</Label>
                <button
                  type="button"
                  onClick={openDatePicker}
                  className={`
                    flex items-center gap-2 w-full px-3 py-2 rounded-md border text-sm
                    bg-white text-left transition-colors
                    ${activePicker === 'date'
                      ? 'border-[var(--brand)] ring-2 ring-[var(--brand)]/20 text-slate-800'
                      : date
                        ? 'border-slate-300 text-slate-800'
                        : 'border-slate-200 text-slate-400'}
                    hover:border-[var(--brand)]
                  `}
                >
                  <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{displayDate}</span>
                </button>
              </div>

              {/* Time button */}
              <div className="space-y-1">
                <Label className="text-slate-700 text-xs font-medium">Time</Label>
                <button
                  type="button"
                  onClick={openTimePicker}
                  className={`
                    flex items-center gap-2 w-full px-3 py-2 rounded-md border text-sm
                    bg-white text-left transition-colors
                    ${activePicker === 'time'
                      ? 'border-[var(--brand)] ring-2 ring-[var(--brand)]/20 text-slate-800'
                      : time
                        ? 'border-slate-300 text-slate-800'
                        : 'border-slate-200 text-slate-400'}
                    hover:border-[var(--brand)]
                  `}
                >
                  <ClockIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{displayTime}</span>
                </button>
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 pt-2">
              <Button
                type="button"
                className="w-full bg-[var(--brand)] hover:bg-[var(--brand)] text-white"
                disabled={!date || !time}
                onClick={onConfirm}
              >
                Save
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
                Cancel
              </Button>
            </DialogFooter>
          </div>

          {/* ── DIVIDER ── */}
          {activePicker && (
            <div className="w-px bg-slate-100 mx-2 self-stretch" />
          )}

          {/* ── RIGHT: picker rendered directly — no portal, no positioning ── */}
          {activePicker === 'date' && (
            <div className="flex-1 flex items-start justify-center pt-1">
              <CustomDatePicker
                value={draftDate}
                onChange={(v) => { setDraftDate(v); handleDateSave(v); }}
                onSave={() => {}}   // no-op: save is now triggered via onChange
                onCancel={handlePickerCancel}
                allowPastDates={true}
              />
            </div>
          )}

          {activePicker === 'time' && (
            <div className="flex-1 flex items-start justify-center pt-1">
              <CustomTimePicker
               value={draftTime}
              onChange={(v) => { setDraftTime(v); }}
              onSave={() => { handleTimeSave(); }}
              onCancel={handlePickerCancel}
              disablePastTimes={false}
              />
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
};