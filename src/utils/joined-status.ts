// src/utils/joined-status.ts
export const JOINED_STATUS_LABELS = ['Joined', 'Offered'] as const;

export function isJoinedPipelineStatus(statusName: string): boolean {
  return (JOINED_STATUS_LABELS as readonly string[]).includes(statusName.trim());
}

export function defaultJoiningDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}