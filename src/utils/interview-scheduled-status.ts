/** Must match `INTERVIEW_SCHEDULED_STATUS_TO_ROUND` in tatrack_api interview-scheduled-round-sync.service.ts */
export const INTERVIEW_SCHEDULED_STATUS_LABELS = [
  'Interview Scheduled R1',
  'Interview Scheduled R2',
  'Interview Scheduled R3',
  'Interview Scheduled R4',
  'Interview Scheduled Internally',
] as const;

export const INTERVIEW_REJECTED_STATUS_LABELS = [
  'Interview Rejected R1',
  'Interview Rejected R2',
  'Interview Rejected R3',
  'Interview Rejected R4',
] as const;


export function isInterviewScheduledPipelineStatus(statusName: string): boolean {
  const t = statusName.trim();
  return (INTERVIEW_SCHEDULED_STATUS_LABELS as readonly string[]).includes(t);
}

export function isInterviewRejectedPipelineStatus(statusName: string): boolean {
  const t = statusName.trim();
  return (INTERVIEW_REJECTED_STATUS_LABELS as readonly string[]).includes(t);
}

/** `datetime-local` value in local timezone (YYYY-MM-DDTHH:mm). */
export function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Default suggestion: top of next hour. */
export function defaultSuggestedInterviewDatetimeLocal(): string {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return toDatetimeLocalValue(d);
}
