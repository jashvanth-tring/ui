import { exportToXlsx, ExportColumn } from './export-xlsx';

// ─── Candidates page ──────────────────────────────────────────
export const candidateExportColumns: ExportColumn[] = [
  { header: 'Name',            accessor: (c) => c.candidate_name },
  { header: 'Email',           accessor: (c) => c.email_id },
  { header: 'Phone',           accessor: (c) => c.primary_contact },
  { header: 'Location',        accessor: (c) => c.candidate_location },
  { header: 'Source',          accessor: (c) => c.source },
  { header: 'Source Date',     accessor: (c) => c.source_date ? new Date(c.source_date).toLocaleDateString() : '-' },
  { header: 'Profile Shared Date',  accessor: (c) => c.profile_shared_date ? new Date(c.profile_shared_date).toLocaleDateString() : '-' },
  { header: 'Relevant Exp',    accessor: (c) => c.rel_exp ? `${c.rel_exp} ` : '-' },
  { header: 'Total Exp',       accessor: (c) => c.total_exp ? `${c.total_exp} ` : '-' },
  { header: 'Notice Period',   accessor: (c) => c.notice_period },
  { header: 'Current Salary',  accessor: (c) => c.current_salary },
  { header: 'Expected Salary', accessor: (c) => c.expected_salary },
  { header: 'Remarks',         accessor: (c) => c.remarks },
  { header: 'Uploaded By',     accessor: (c) => c.uploaded_by_name },
  { header: 'Assigned To',     accessor: (c) => c.assigned_to_name },
  { header: 'Created At',      accessor: (c) => c.created_at ? new Date(c.created_at).toLocaleDateString() : '-' },
];

// ─── Master Tracker (Pipeline) ────────────────────────────────
export const pipelineExportColumns: ExportColumn[] = [
  { header: 'S. No',                    accessor: (r) => r.s_no },
  { header: 'Source',                   accessor: (r) => r.source ?? '-' },
  { header: 'SOURCE DATE', accessor: (r) => r.source_date ?? '-' },
  {
  header: 'LAST UPDATED',
  accessor: (r) =>
    r.last_updated_date
      ? String(r.last_updated_date).split(' ')[0]
      : '-',
},
  { header: 'Submitted to Client- Date', accessor: (r) => r.submitted_to_client_date ?? '-' },
  { header: 'CANDIDATE NAME',           accessor: (r) => r.candidate_name },
  { header: 'PHONE NO.',                accessor: (r) => r.phone_no ?? '-' },
  { header: 'EMAIL ID',                 accessor: (r) => r.email_id },
  { header: 'CURRENT LOCATION',         accessor: (r) => r.current_location ?? '-' },
  { header: 'TOTAL EXP',                accessor: (r) => r.total_exp ? `${r.total_exp} ` : '-' },
  { header: 'REL EXP',                  accessor: (r) => r.rel_exp ? `${r.rel_exp} ` : '-' },
  { header: 'SKILL SET',                accessor: (r) => {
    if (!r.skill_set) return '-';
    try {
      const parsed = typeof r.skill_set === 'string' ? JSON.parse(r.skill_set) : r.skill_set;
      return Array.isArray(parsed) ? parsed.join(', ') : String(r.skill_set);
    } catch { return String(r.skill_set); }
  }},
  { header: 'CLIENT NAME',              accessor: (r) => r.client_name },
  { header: 'POSITION',                 accessor: (r) => r.position_name },
  { header: 'CANDIDATE STATUS',         accessor: (r) => r.status_name },
  { header: 'CURRENT CTC',              accessor: (r) => r.current_ctc ?? '-' },
  { header: 'EXPECTED CTC',             accessor: (r) => r.expected_ctc ?? '-' },
  { header: 'NOTICE PERIOD',            accessor: (r) => r.notice_period ?? '-' },
  { header: 'Remarks',                  accessor: (r) => r.req_remarks ?? '-' },
];

// ─── Requirements page ────────────────────────────────────────
export const requirementExportColumns: ExportColumn[] = [
  { header: 'Role',              accessor: (r) => r?.positionDetails?.positionName },
  { header: 'Client',            accessor: (r) => r?.client?.clientName },
  { header: 'Total Positions',   accessor: (r) => r?.noOfPosition },
  { header: 'Filled Positions',  accessor: (r) => r?.filledPositions ?? 0 },
  { header: 'Experience',        accessor: (r) => r?.relExp != null ? `${r.relExp} ` : '-' },
  { header: 'Skills',            accessor: (r) => Array.isArray(r?.skillSet) ? r.skillSet.join(', ') : r?.skillSet },
  { header: 'Status',            accessor: (r) => r?.status?.statusName },
  { header: 'Priority',          accessor: (r) => r?.priority },
  { header: 'Role Type',         accessor: (r) => r?.roleType },
  { header: 'Mode of Work',      accessor: (r) => r?.modeOfWork },
  { header: 'Mode of Interview', accessor: (r) => r?.modeOfInterview },
  { header: 'Salary Budget',     accessor: (r) => r?.salaryBudget },
  { header: 'Account Manager',   accessor: (r) => r?.accountManager },
  { header: 'Approved By',       accessor: (r) => r?.approvedBy },
  { header: 'Reporting Manager', accessor: (r) => r?.reportingManager },
  { header: 'Position Type',     accessor: (r) => r?.positionType },
  { header: 'Open Date',         accessor: (r) => r?.openDate ? new Date(r.openDate).toLocaleDateString() : '-' },
  { header: 'Close Date',        accessor: (r) => r?.closeDate ? new Date(r.closeDate).toLocaleDateString() : '-' },
  { header: 'Remarks',           accessor: (r) => r?.remarks },
  { header: 'Uploaded By',       accessor: (r) => r?.createdBy ? `${r.createdBy.firstName ?? ''} ${r.createdBy.lastName ?? ''}`.trim() : '-' },
];

// ─── Analysis page ────────────────────────────────────────────
// Analysis uses CSV (already working) — no change needed there.

// ─── Helper functions — call these directly in each page ──────

export function exportCandidates(data: any[]) {
  exportToXlsx({
    filename: 'Candidates',
    sheetName: 'Candidates',
    columns: candidateExportColumns,
    data,
  });
}

export function exportPipelineData(data: any[]) {
  exportToXlsx({
    filename: 'Master_Tracker_Export',
    sheetName: 'Master Tracker',
    columns: pipelineExportColumns,
    data,
  });
}

export function exportRequirements(data: any[]) {
  exportToXlsx({
    filename: 'Requirements_Export',
    sheetName: 'Requirements',
    columns: requirementExportColumns,
    data,
  });
}