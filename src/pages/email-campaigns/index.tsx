import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import CustomizedSnackbars from '../../components/customized-snackbar';
import { useSnackbar } from '../../utils/snackbar-function';
import {
  defaultAudienceConfig,
  type EmailCampaignAudience,
  type EmailCampaignAudienceConfigMap,
  type EmailCampaignSendLog,
  type EmailCampaignTemplate,
} from '../../store/model/email-campaign.types';
import {
  createEmailCampaignTemplate,
  deleteEmailCampaignTemplate,
  listEmailCampaignLogs,
  listEmailCampaignTemplates,
  previewEmailCampaign,
  sendEmailCampaign,
  updateEmailCampaignTemplate,
} from '../../store/services/email-campaign';
import {
  fetchRequirementDetailsById,
  fetchRequirementsPaged,
} from '../../store/services/requirement';
import { fetchUpcomingInterviews } from '../../store/services/round';
import type { UpcomingInterviewRow } from '../../store/model/round.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Textarea } from '../../components/ui/textarea';
import axios from 'axios';
import ConfirmationDialog from '../../components/confirmation-dialog';
import { MeetStyleRecipientPicker } from '../../components/email-campaign/MeetStyleRecipientPicker';
import type { CampaignPickerRecipient } from '../../store/model/email-campaign-picker.types';
import {
  campaignRecipientsToPayload,
  validatePrimaryRecipients,
} from '../../store/model/email-campaign-picker.types';
import { useDispatch } from '../../store';
import { useAppSelector } from '../../store';
import { fetchClientLocations } from '../../store/action/client-location.action';

const MERGE_REFERENCE = `
Handlebars placeholders (examples):

• {{candidate.candidateName}}  {{candidate.emailId}}  {{candidate.primaryContact}}
• {{candidate.source}}  {{candidate.skillSetDisplay}}  {{candidate.totalExp}}  {{candidate.relExp}}
• {{candidate.currentSalary}}  {{candidate.expectedSalary}}  {{candidate.noticePeriod}}  {{candidate.candidateLocation}}
• {{client.clientName}}  {{client.spocName}}  {{client.emailId}}
• {{user.firstName}}  {{user.officialEmail}}
• {{sender.firstName}}  {{sender.officialEmail}}  (the logged-in sender)
• Root-level keys from template “static merge” (per audience): e.g. {{workLocation}}  {{companyLegalName}}
• Per-send overrides (Send & preview): pick a **requirement** and/or use the **schedule & location** fields — no JSON required. Advanced JSON is optional for extra keys.

You can use #if, #each, and other Handlebars helpers.`;

function readPositionNameFromRequirementRow(pos: unknown): string {
  if (!pos || typeof pos !== 'object') return '';
  const p = pos as Record<string, unknown>;
  const n = p.positionName ?? p.position_name;
  if (typeof n === 'string' && n.trim()) return n.trim();
  const inner = p.positionDetails;
  if (inner && typeof inner === 'object') {
    const q = inner as Record<string, unknown>;
    const n2 = q.positionName ?? q.position_name;
    if (typeof n2 === 'string' && n2.trim()) return n2.trim();
  }
  return '';
}

function getInitials(name?: string) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function RecipientPill({ name, email }: { name?: string; email?: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-full px-2 py-1 text-xs">
      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-medium shrink-0">
        {getInitials(name)}
      </span>
      <span>
        <span className="font-medium text-slate-800 block">{name || '—'}</span>
        <span className="text-slate-500 block">{email || '—'}</span>
      </span>
    </div>
  );
}

function getLocationsForClient(rows: any[], clientId: number) {
  if (!clientId) return [];

  return [
    ...new Set(
      (rows ?? [])
        .filter((r) => r.clientProfile?.id === clientId)
        .map((r) => (r.location ?? '').trim())
        .filter(Boolean)
    ),
  ];
}

function readClientNameFromRequirementRow(client: unknown): string {
  if (!client || typeof client !== 'object') return '';
  const c = client as Record<string, unknown>;
  const n = c.clientName ?? c.client_name;
  return typeof n === 'string' ? n.trim() : '';
}

/** Maps a requirement-details API `data` object into root Handlebars keys used by seeded templates. */
function requirementDetailsToMergeOverrides(d: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  const posName = readPositionNameFromRequirementRow(d.positionDetails);
  if (posName) {
    out.positionTitle = posName;
    out.jobTitle = posName;
  }
  const clientName = readClientNameFromRequirementRow(d.client);
  if (clientName) {
    out.interviewClient = clientName;
  }
  const modeOfWork = typeof d.modeOfWork === 'string' ? d.modeOfWork.trim() : '';
  if (modeOfWork) {
    out.modeOfWork = modeOfWork;
    out.jobMode = modeOfWork;
  }
  const roleType = typeof d.roleType === 'string' ? d.roleType.trim() : '';
  out.jobType = roleType || 'Permanent';

  const pos = d.positionDetails;
  let desc = '';
  if (pos && typeof pos === 'object') {
    const raw = (pos as Record<string, unknown>).description;
    if (typeof raw === 'string') desc = raw.trim();
  }
  const remarks = typeof d.remarks === 'string' ? d.remarks.trim() : '';
  //out.jobDescription = desc || remarks || '';

  const skillSet = d.skillSet;
  let skills = '';
  if (Array.isArray(skillSet)) {
    skills = skillSet.map((x) => String(x).trim()).filter(Boolean).join(', ');
  } else if (typeof skillSet === 'string') {
    skills = skillSet.trim();
  }
  out.jobDescription = desc || skills || remarks || '';
  const rel = d.relExp != null && d.relExp !== '' ? String(d.relExp) : '';
  const qualParts = [skills, rel ? `Relevant exp: ${rel}` : ''].filter(Boolean);
  out.qualificationsText = qualParts.join('\n');
  const location =
    typeof d.workLocation === 'string'
      ? d.workLocation.trim()
      : '';

  if (location) {
    out.workLocation = location;
  }
  return out;
}

function formatMergeInterviewDate(yyyyMmDd: string): string {
  const t = yyyyMmDd.trim();
  if (!t) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (!m) return t;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (Number.isNaN(dt.getTime())) return t;
  return dt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatMergeInterviewTime(hhmm: string): string {
  const t = hhmm.trim();
  if (!t) return '';
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return t;
  const h = Number(m[1]);
  const min = Number(m[2]);
  const dt = new Date(2000, 0, 1, h, min);
  if (Number.isNaN(dt.getTime())) return t;
  return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function manualSendFieldsToMergeOverrides(fields: {
  interviewDateYmd: string;
  interviewTimeHm: string;
  workLocation: string;
  joiningBonus: string;
  interviewClientOverride: string;
}): Record<string, string> {
  const out: Record<string, string> = {};
  const dateStr = formatMergeInterviewDate(fields.interviewDateYmd);
  if (dateStr) out.interviewDate = dateStr;
  const timeStr = formatMergeInterviewTime(fields.interviewTimeHm);
  if (timeStr) out.interviewTime = timeStr;
  const jl = fields.workLocation.trim();
  if (jl) out.workLocation = jl;
  const jb = fields.joiningBonus.trim();
  if (jb) out.joiningBonus = jb;
  const ic = fields.interviewClientOverride.trim();
  if (ic) out.interviewClient = ic;
  return out;
}

function buildSendMergeOverrides(
  requirementBase: Record<string, string>,
  manualFieldMap: Record<string, string>,
  extrasJson: string,
):
  | { ok: true; value: Record<string, string> | undefined }
  | { ok: false; message: string } {
  const out: Record<string, string> = { ...requirementBase, ...manualFieldMap };
  const raw = extrasJson.trim();
  if (raw) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, message: 'Advanced merge JSON must be valid JSON.' };
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        ok: false,
        message: 'Advanced merge JSON must be a single object, e.g. {"customKey":"value"}.',
      };
    }
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (!k) continue;
      if (v === null || v === undefined) continue;
      out[k] = typeof v === 'string' ? v : String(v);
    }
  }
  return { ok: true, value: Object.keys(out).length ? out : undefined };
}

function normRecipientName(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase();
}

function upcomingInterviewRowMs(iso: string): number {
  try {
    return parseISO(iso).getTime();
  } catch {
    return 0;
  }
}

/** Prefer nearest upcoming slot; otherwise earliest row. */
function pickBestScheduledInterviewRow(
  rows: UpcomingInterviewRow[],
  candidateId: number,
  candidateLabel: string,
): UpcomingInterviewRow | null {
  const labelN = normRecipientName(candidateLabel);
  const matches = rows.filter((r) => {
    if (typeof r.candidateId === 'number' && r.candidateId > 0 && r.candidateId === candidateId) {
      return true;
    }
    if ((r.candidateId === undefined || r.candidateId === null) && labelN) {
      return normRecipientName(r.candidateName) === labelN;
    }
    return false;
  });
  if (matches.length === 0) return null;
  const now = Date.now();
  const sorted = [...matches].sort(
    (a, b) => upcomingInterviewRowMs(a.interviewAt) - upcomingInterviewRowMs(b.interviewAt),
  );
  const future = sorted.find((r) => upcomingInterviewRowMs(r.interviewAt) >= now);
  return future ?? sorted[0];
}

function isoToSendInterviewInputs(iso: string): { ymd: string; hm: string } {
  try {
    const d = parseISO(iso);
    return { ymd: format(d, 'yyyy-MM-dd'), hm: format(d, 'HH:mm') };
  } catch {
    return { ymd: '', hm: '' };
  }
}

function inferPreviewEmailFromPrimary(
  r: CampaignPickerRecipient | undefined,
): string {
  if (!r) return '';
  if (r.kind === 'email' && r.email) return r.email.trim();
  return (r.sublabel ?? '').trim();
}

function normalizeAudience(
  raw: EmailCampaignTemplate['audienceConfig'],
): EmailCampaignAudienceConfigMap {
  const d = defaultAudienceConfig();
  if (!raw) return d;
  return {
    candidate: { ...d.candidate, ...raw.candidate },
    client_spoc: { ...d.client_spoc, ...raw.client_spoc },
    user: { ...d.user, ...raw.user },
  };
}

// function AudienceEditorCard(props: {
//   title: string;
//   value: EmailCampaignAudienceSettings;
//   onChange: (next: EmailCampaignAudienceSettings) => void;
//   fieldHint: string;
// }) {
//   const { title, value, onChange, fieldHint } = props;
//   return (
//     <Card className="border-slate-200">
//       <CardHeader className="py-3 px-4">
//         <CardTitle className="text-sm font-semibold text-[var(--brand)]">{title}</CardTitle>
//         <CardDescription className="text-xs">
//           Primary “To” uses the entity field below unless override is set.
//         </CardDescription>
//       </CardHeader>
//       <CardContent className="space-y-3 px-4 pb-4">
//         <div className="flex items-center gap-2">
//           <input
//             id={`en-${title}`}
//             type="checkbox"
//             className="h-4 w-4 rounded border-slate-300"
//             checked={value.enabled}
//             onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
//           />
//           <Label htmlFor={`en-${title}`} className="text-sm cursor-pointer">
//             Enabled for this template
//           </Label>
//         </div>
//         <div>
//           <Label className="text-xs text-slate-600">Primary email field on entity {fieldHint}</Label>
//           <Input
//             className="mt-1 font-mono text-sm"
//             value={value.primaryEmailField}
//             onChange={(e) => onChange({ ...value, primaryEmailField: e.target.value })}
//           />
//         </div>
//         <div>
//           <Label className="text-xs text-slate-600">Override “To” (optional; testing)</Label>
//           <Input
//             className="mt-1 text-sm"
//             placeholder="fixed@inbox.example.com"
//             value={value.toOverride ?? ''}
//             onChange={(e) =>
//               onChange({
//                 ...value,
//                 toOverride: e.target.value.trim() || null,
//               })
//             }
//           />
//         </div>
//         <div>
//           <Label className="text-xs text-slate-600">CC (comma-separated)</Label>
//           <Input
//             className="mt-1 text-sm"
//             value={(value.cc ?? []).join(', ')}
//             onChange={(e) =>
//               onChange({
//                 ...value,
//                 cc: e.target.value
//                   .split(/[,;]/)
//                   .map((s) => s.trim())
//                   .filter(Boolean),
//               })
//             }
//           />
//         </div>
//         <div>
//           <Label className="text-xs text-slate-600">BCC (comma-separated)</Label>
//           <Input
//             className="mt-1 text-sm"
//             value={(value.bcc ?? []).join(', ')}
//             onChange={(e) =>
//               onChange({
//                 ...value,
//                 bcc: e.target.value
//                   .split(/[,;]/)
//                   .map((s) => s.trim())
//                   .filter(Boolean),
//               })
//             }
//           />
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

export default function EmailCampaignsPage() {
  const dispatch = useDispatch();
  const { clientLocations } = useAppSelector((state) => state.clientLocationSelector) || {};
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const workLocations = useMemo(() => {
    return getLocationsForClient(clientLocations, selectedClientId || 0);
  }, [clientLocations, selectedClientId]);
  const { snackbarState, handleSnackbarClose, showSuccessSnackbar, showErrorSnackbar } =
    useSnackbar();

  const [templates, setTemplates] = useState<EmailCampaignTemplate[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState<number | 'new'>('new');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subjectTemplate, setSubjectTemplate] = useState('Hello {{candidate.candidateName}}');
  const [bodyHtml, setBodyHtml] = useState(
    '<p>Hi {{candidate.candidateName}},</p><p>Your application is being reviewed.</p><p>— {{sender.firstName}}</p>',
  );
  const [wrapInLayout, setWrapInLayout] = useState(false);
  const [audienceConfig, setAudienceConfig] = useState<EmailCampaignAudienceConfigMap>(
    defaultAudienceConfig(),
  );

  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [sendTemplateId, setSendTemplateId] = useState<number | ''>('');
  const [sendAudience, setSendAudience] = useState<EmailCampaignAudience>('candidate');
  const [primaryRecipients, setPrimaryRecipients] = useState<CampaignPickerRecipient[]>([]);
  const [ccRecipients, setCcRecipients] = useState<CampaignPickerRecipient[]>([]);
  const [bccRecipients, setBccRecipients] = useState<CampaignPickerRecipient[]>([]);
  const [dryRun] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendInterviewDateYmd, setSendInterviewDateYmd] = useState('');
  const [sendInterviewTimeHm, setSendInterviewTimeHm] = useState('');
  const [sendJobLocation, setSendJobLocation] = useState('');
  const [sendJoiningBonus, setSendJoiningBonus] = useState('');
  const [sendInterviewClientOverride] = useState('');
  const [sendMergeExtrasJson] = useState('');
  const [,setRequirementsListLoading] = useState(false);
  const [sendRequirementId, setSendRequirementId] = useState<number | ''>('');
  const [requirementMergeFromApi, setRequirementMergeFromApi] = useState<Record<string, string>>(
    {},
  );
  const [requirementFetchLoading, setRequirementFetchLoading] = useState(false);
  const [scheduleLookupBusy, setScheduleLookupBusy] = useState(false);
  const scheduleAutofillDoneForKey = useRef<string | null>(null);

  const [previewRecipientEmail, setPreviewRecipientEmail] = useState('');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const [logs, setLogs] = useState<EmailCampaignSendLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // showErrorSn/from useSnackbar are new references every render; do not list them in deps
  // or useCallback + useEffect will retrigger forever and spam the list API.
  const loadTemplates = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await listEmailCampaignTemplates();
      setTemplates(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 403) {
        showErrorSnackbar('Email campaigns are limited to administrators.');
      } else {
        showErrorSnackbar('Could not load templates.');
      }
    } finally {
      setLoadingList(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- snackbar fns are unstable
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    dispatch(fetchClientLocations());
  }, [dispatch]);

  useEffect(() => {
    setPrimaryRecipients([]);
  }, [sendAudience]);

  useEffect(() => {
    if (workLocations.length > 0) {
      const text = workLocations.join(', ');
      setSendJobLocation(text); // ⭐ Autofill happens here
    }
  }, [workLocations]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setRequirementsListLoading(true);

      try {
        const res = await fetchRequirementsPaged(1, 200, '');
        if (cancelled) return;

        const body = res.data as { data?: unknown[] };
        const rows = Array.isArray(body?.data) ? body.data : [];

        const clientMap = new Map<string, string>();
        const posList: { id: number; name: string; clientId: string }[] = [];

        rows.forEach((row) => {
          const r = row as Record<string, any>;

          const id = Number(r.id);
          if (!Number.isFinite(id)) return;

          const clientName = readClientNameFromRequirementRow(r.client);
          const positionName = readPositionNameFromRequirementRow(r.positionDetails);

          const clientId = String(r.client?.id ?? clientName); // fallback

          // store unique clients
          if (clientName) {
            clientMap.set(clientId, clientName);
          }

          // store positions
          posList.push({
            id,
            name: positionName || 'Role',
            clientId,
          });
        });

        if (!cancelled) {
          setClients(
            Array.from(clientMap.entries()).map(([id, name]) => ({ id, name }))
          );
          setPositions(posList);
        }
      } catch {
        if (!cancelled) {
          setClients([]);
          setPositions([]);
        }
      } finally {
        if (!cancelled) setRequirementsListLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (sendRequirementId === '') {
      setRequirementMergeFromApi({});
      return;
    }
    let cancelled = false;
    setRequirementFetchLoading(true);
    void fetchRequirementDetailsById(Number(sendRequirementId))
      .then((res) => {
        if (cancelled) return;
        const body = res.data as {
          success?: boolean;
          data?: Record<string, unknown> | null;
          message?: string;
        };
        if (!body?.success || !body.data) {
          setRequirementMergeFromApi({});
          if (body?.success === false && body.message) {
            showErrorSnackbar(body.message);
          }
          return;
        }
        setRequirementMergeFromApi(requirementDetailsToMergeOverrides(body.data));
      })
      .catch(() => {
        if (!cancelled) {
          setRequirementMergeFromApi({});
          showErrorSnackbar('Could not load requirement.');
        }
      })
      .finally(() => {
        if (!cancelled) setRequirementFetchLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- snackbar fns are unstable
  }, [sendRequirementId]);

  const loadScheduledInterviewIntoFields = useCallback(
    async (opts: { force: boolean }): Promise<void> => {
      if (
        sendAudience !== 'candidate' ||
        primaryRecipients.length !== 1 ||
        primaryRecipients[0].kind !== 'candidate'
      ) {
        if (opts.force) {
          showErrorSnackbar(
            'Add exactly one candidate in To to load the interview from the schedule.',
          );
        }
        return;
      }
      const id = primaryRecipients[0].entityId;
      const label = primaryRecipients[0].label;
      if (typeof id !== 'number' || id <= 0) {
        if (opts.force) {
          showErrorSnackbar('Primary recipient is missing a valid candidate id.');
        }
        return;
      }
      const key = String(id);
      if (!opts.force && scheduleAutofillDoneForKey.current === key) {
        return;
      }

      setScheduleLookupBusy(true);
      try {
        const from = format(new Date(), 'yyyy-MM-dd');
        const to = format(addDays(new Date(), 120), 'yyyy-MM-dd');
        const resp = await fetchUpcomingInterviews({ from, to });
        const body = resp.data as { data?: unknown };
        const list: UpcomingInterviewRow[] = Array.isArray(body?.data)
          ? (body.data as UpcomingInterviewRow[])
          : [];
        const row = pickBestScheduledInterviewRow(list, id, label);
        scheduleAutofillDoneForKey.current = key;
        if (row) {
          const { ymd, hm } = isoToSendInterviewInputs(row.interviewAt);
          setSendInterviewDateYmd(ymd);
          setSendInterviewTimeHm(hm);
          if (row.location) {
            setSendJobLocation(row.location);
          }
          if (opts.force) {
            showSuccessSnackbar('Interview date and time loaded from the schedule.');
          }
        } else if (opts.force) {
          showErrorSnackbar(
            'No scheduled interview found for this candidate in the loaded date range.',
          );
        }
      } catch {
        if (opts.force) {
          showErrorSnackbar('Could not load upcoming interviews.');
        }
      } finally {
        setScheduleLookupBusy(false);
      }
    },
    [sendAudience, primaryRecipients, showErrorSnackbar, showSuccessSnackbar],
  );

  useEffect(() => {
    if (
      sendAudience !== 'candidate' ||
      primaryRecipients.length !== 1 ||
      primaryRecipients[0].kind !== 'candidate'
    ) {
      scheduleAutofillDoneForKey.current = null;
      return;
    }
    void loadScheduledInterviewIntoFields({ force: false });
  }, [sendAudience, primaryRecipients, loadScheduledInterviewIntoFields]);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await listEmailCampaignLogs(undefined, 200);
      const data = res.data as EmailCampaignSendLog[];
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      showErrorSnackbar('Could not load send logs.');
    } finally {
      setLogsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- snackbar fns are unstable
  }, []);

  const resetNewForm = () => {
    setSelectedId('new');
    setName('');
    setDescription('');
    setSubjectTemplate('Hello {{candidate.candidateName}}');
    setBodyHtml(
      '<p>Hi {{candidate.candidateName}},</p><p>Your application is being reviewed.</p><p>— {{sender.firstName}}</p>',
    );
    setWrapInLayout(false);
    setAudienceConfig(defaultAudienceConfig());
  };

  const applyTemplate = (t: EmailCampaignTemplate) => {
    setSelectedId(t.id);
    setName(t.name);
    setDescription(t.description ?? '');
    setSubjectTemplate(t.subjectTemplate);
    setBodyHtml(t.bodyHtml);
    setWrapInLayout(!!t.wrapInLayout);
    setAudienceConfig(normalizeAudience(t.audienceConfig));
  };

  const savePayload = useMemo(
    () => ({
      name: name.trim(),
      description: description.trim() || null,
      subjectTemplate: subjectTemplate.trim(),
      bodyHtml,
      wrapInLayout,
      audienceConfig,
    }),
    [name, description, subjectTemplate, bodyHtml, wrapInLayout, audienceConfig],
  );

  const handleSave = async () => {
    if (!savePayload.name) {
      showErrorSnackbar('Template name is required.');
      return;
    }
    if (!savePayload.subjectTemplate || !savePayload.bodyHtml) {
      showErrorSnackbar('Subject and body are required.');
      return;
    }
    setSaving(true);
    try {
      if (selectedId === 'new') {
        const res = await createEmailCampaignTemplate(savePayload);
        showSuccessSnackbar('Template created.');
        await loadTemplates();
        applyTemplate(res.data);
      } else {
        await updateEmailCampaignTemplate(selectedId, savePayload);
        showSuccessSnackbar('Template saved.');
        await loadTemplates();
      }
    } catch (e) {
      const msg =
        axios.isAxiosError(e) && e.response?.data?.message
          ? String(e.response.data.message)
          : 'Save failed.';
      showErrorSnackbar(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (selectedId === 'new') return;
    try {
      await deleteEmailCampaignTemplate(selectedId);
      showSuccessSnackbar('Template deleted.');
      setDeleteOpen(false);
      resetNewForm();
      await loadTemplates();
    } catch {
      showErrorSnackbar('Delete failed.');
    }
  };

  const handlePreview = async () => {
    if (sendTemplateId === '') {
      showErrorSnackbar('Choose a template.');
      return;
    }
    if (sendRequirementId !== '' && requirementFetchLoading) {
      showErrorSnackbar('Wait for the requirement to finish loading.');
      return;
    }
    const raw =
      previewRecipientEmail.trim() ||
      (primaryRecipients.length === 1
        ? inferPreviewEmailFromPrimary(primaryRecipients[0])
        : '');
    if (!raw) {
      showErrorSnackbar(
        'Enter a recipient email for preview, or add exactly one primary recipient (we use their email).',
      );
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
      showErrorSnackbar('Enter a valid email address for preview.');
      return;
    }
    const manualMerge = manualSendFieldsToMergeOverrides({
      interviewDateYmd: sendInterviewDateYmd,
      interviewTimeHm: sendInterviewTimeHm,
      workLocation: sendJobLocation,
      joiningBonus: sendJoiningBonus,
      interviewClientOverride: sendInterviewClientOverride,
    });
    const mo = buildSendMergeOverrides(
      requirementMergeFromApi,
      manualMerge,
      sendMergeExtrasJson,
    );
    if (!mo.ok) {
      showErrorSnackbar(mo.message);
      return;
    }
    try {
      const res = await previewEmailCampaign({
        templateId: Number(sendTemplateId),
        audienceType: sendAudience,
        recipientEmail: raw,
        ccRecipients: campaignRecipientsToPayload(ccRecipients),
        bccRecipients: campaignRecipientsToPayload(bccRecipients),
        mergeOverrides: mo.value,
      });
      setPreviewHtml(res.data.html);
      const cc = res.data.ccResolved?.length
        ? ` · CC: ${res.data.ccResolved.join(', ')}`
        : '';
      const bcc = res.data.bccResolved?.length
        ? ` · BCC: ${res.data.bccResolved.join(', ')}`
        : '';
      showSuccessSnackbar(`Preview To: ${res.data.to}${cc}${bcc}`);
    } catch (e) {
      const msg =
        axios.isAxiosError(e) && e.response?.data?.message
          ? String(e.response.data.message)
          : 'Preview failed.';
      showErrorSnackbar(msg);
      setPreviewHtml(null);
    }
  };
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [positions, setPositions] = useState<{ id: number; name: string; clientId: string }[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<number | ''>('');
  const filteredPositions = positions.filter(
      (p) => p.clientId === selectedClient
    );
  const handleSend = async () => {
    if (sendTemplateId === '') {
      showErrorSnackbar('Select a template.');
      return;
    }
    const primaryErr = validatePrimaryRecipients(sendAudience, primaryRecipients);
    if (primaryErr) {
      showErrorSnackbar(primaryErr);
      return;
    }
    const ids = primaryRecipients
      .map((r) => r.entityId)
      .filter((id): id is number => typeof id === 'number' && id > 0);
    if (ids.length === 0) {
      showErrorSnackbar('Add at least one primary recipient from search.');
      return;
    }
    if (sendRequirementId !== '' && requirementFetchLoading) {
      showErrorSnackbar('Wait for the requirement to finish loading.');
      return;
    }
    const manualMerge = manualSendFieldsToMergeOverrides({
      interviewDateYmd: sendInterviewDateYmd,
      interviewTimeHm: sendInterviewTimeHm,
      workLocation: sendJobLocation,
      joiningBonus: sendJoiningBonus,
      interviewClientOverride: sendInterviewClientOverride,
    });
    const mo = buildSendMergeOverrides(
      requirementMergeFromApi,
      manualMerge,
      sendMergeExtrasJson,
    );
    if (!mo.ok) {
      showErrorSnackbar(mo.message);
      return;
    }
    setSending(true);
    try {
      const res = await sendEmailCampaign({
        templateId: Number(sendTemplateId),
        audienceType: sendAudience,
        entityIds: ids,
        ccRecipients: campaignRecipientsToPayload(ccRecipients),
        bccRecipients: campaignRecipientsToPayload(bccRecipients),
        dryRun,
        mergeOverrides: mo.value,
      });
      const failed = res.data.results.filter((r) => r.status === 'failed').length;
      if (dryRun) {
        showSuccessSnackbar(`Dry run OK for ${res.data.results.length} recipient(s).`);
      } else if (failed === 0) {
        showSuccessSnackbar(`Sent ${res.data.results.length} message(s).`);
      } else {
        showErrorSnackbar(`${failed} failed, ${res.data.results.length - failed} sent.`);
      }
      loadLogs();
    } catch (e) {
      const msg =
        axios.isAxiosError(e) && e.response?.data?.message
          ? String(e.response.data.message)
          : 'Send failed.';
      showErrorSnackbar(msg);
    } finally {
      setSending(false);
    }
  };
  useEffect(() => {
    if (requirementMergeFromApi.workLocation) {
      setSendJobLocation(requirementMergeFromApi.workLocation);
    }
  }, [requirementMergeFromApi]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f8fafc] pt-10">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="w-full px-4 py-8 pb-14 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <Tabs
            defaultValue="templates"
            className="w-full"
            onValueChange={(v) => {
              if (v === 'logs') loadLogs();
            }}
          >
            <div className="mb-6" role="banner">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--brand)]">Email campaigns</h1>
            </div>

            <TabsList className="flex h-auto w-full flex-wrap items-end justify-start gap-10 rounded-none border-0 border-b border-slate-200 bg-transparent p-0 !shadow-none">
              <TabsTrigger
                value="templates"
                className="-mb-px rounded-none border-0 border-b-[3px] border-transparent !bg-transparent px-0 pb-3 pt-1 text-sm font-normal text-slate-500 !shadow-none ring-offset-0 transition-colors hover:text-slate-700 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-b-[var(--brand)] data-[state=active]:!bg-transparent data-[state=active]:font-semibold data-[state=active]:text-[var(--brand)] data-[state=active]:!shadow-none"
              >
                Templates
              </TabsTrigger>
              <TabsTrigger
                value="send"
                className="-mb-px rounded-none border-0 border-b-[3px] border-transparent !bg-transparent px-0 pb-3 pt-1 text-sm font-normal text-slate-500 !shadow-none ring-offset-0 transition-colors hover:text-slate-700 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-b-[var(--brand)] data-[state=active]:!bg-transparent data-[state=active]:font-semibold data-[state=active]:text-[var(--brand)] data-[state=active]:!shadow-none"
              >
                Send & preview
              </TabsTrigger>
              <TabsTrigger
                value="logs"
                className="-mb-px rounded-none border-0 border-b-[3px] border-transparent !bg-transparent px-0 pb-3 pt-1 text-sm font-normal text-slate-500 !shadow-none ring-offset-0 transition-colors hover:text-slate-700 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-b-[var(--brand)] data-[state=active]:!bg-transparent data-[state=active]:font-semibold data-[state=active]:text-[var(--brand)] data-[state=active]:!shadow-none"
              >
                Activity
              </TabsTrigger>
            </TabsList>

          <TabsContent value="templates" className="mt-2 space-y-6 focus-visible:outline-none">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <Card className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm lg:col-span-4">
                <CardHeader className="border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base font-semibold text-[var(--brand)]">Library</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-200"
                      onClick={resetNewForm}
                    >
                      New
                    </Button>
                  </div>
                  <CardDescription className="text-xs text-slate-500">
                    {loadingList ? 'Loading…' : `${templates.length} template(s)`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[280px] overflow-y-auto pr-1 lg:h-[520px]">
                    <ul className="space-y-1 px-4 pb-4 pt-2">
                      <li>
                        <button
                          type="button"
                          onClick={resetNewForm}
                          className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                            selectedId === 'new'
                              ? 'bg-slate-50 font-semibold text-[var(--brand)]'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          + New template
                        </button>
                      </li>
                      {templates.map((t) => (
                        <li key={t.id}>
                          <button
                            type="button"
                            onClick={() => applyTemplate(t)}
                            className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                              selectedId === t.id
                                ? 'bg-slate-50 font-semibold text-[var(--brand)]'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <span className="block truncate">{t.name}</span>
                            <span className="block text-xs text-slate-500 truncate">
                              Updated {new Date(t.updatedAt).toLocaleString()}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6 lg:col-span-8">
                <Card className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
                  <CardHeader className="border-b border-slate-100 px-5 py-4">
                    <CardTitle className="text-base font-semibold text-[var(--brand)]">
                      {selectedId === 'new' ? 'New template' : `Edit template - ${name}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-slate-600">Name</Label>
                        <Input
                          className="h-10 border-slate-200 bg-white"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-slate-600">Description</Label>
                        <Input
                          className="h-10 border-slate-200 bg-white"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-600">Subject template</Label>
                      <Input
                        className="h-10 border-slate-200 bg-white font-mono text-sm"
                        value={subjectTemplate}
                        onChange={(e) => setSubjectTemplate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-600">HTML body</Label>
                      <Textarea
                        className="min-h-[180px] border-slate-200 bg-white font-mono text-xs leading-relaxed"
                        value={bodyHtml}
                        onChange={(e) => setBodyHtml(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="wrap"
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300"
                        checked={wrapInLayout}
                        onChange={(e) => setWrapInLayout(e.target.checked)}
                      />
                      <Label htmlFor="wrap" className="cursor-pointer text-sm">
                        Wrap in branded email layout (header/footer/base)
                      </Label>
                    </div>

                    {/* <div className="grid md:grid-cols-3 gap-3">
                      <AudienceEditorCard
                        title="Candidates"
                        fieldHint="(e.g. emailId)"
                        value={audienceConfig.candidate}
                        onChange={(v) => updateAudience('candidate', v)}
                      />
                      <AudienceEditorCard
                        title="Client SPOC"
                        fieldHint="(e.g. emailId)"
                        value={audienceConfig.client_spoc}
                        onChange={(v) => updateAudience('client_spoc', v)}
                      />
                      <AudienceEditorCard
                        title="Users"
                        fieldHint="(e.g. officialEmail)"
                        value={audienceConfig.user}
                        onChange={(v) => updateAudience('user', v)}
                      />
                    </div> */}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        className="h-10 bg-[var(--brand)] px-6 hover:bg-[var(--brand)]"
                        disabled={saving}
                        onClick={handleSave}
                      >
                        {saving ? 'Saving…' : 'Save template'}
                      </Button>
                      {selectedId !== 'new' && (
                        <Button variant="destructive" type="button" onClick={() => setDeleteOpen(true)}>
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
                  <CardHeader className="border-b border-slate-100 px-5 py-4">
                    <CardTitle className="text-base font-semibold text-[var(--brand)]">Merge reference</CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Handlebars fields you can use in subject and body.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5">
                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-600">
                      {MERGE_REFERENCE}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="send" className="mt-2 space-y-6 focus-visible:outline-none">
            <Card className="w-full overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 px-5 py-4">
                <CardTitle className="text-base font-semibold text-[var(--brand)]">Campaign options</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Template</Label>
                  <div className="relative">
                    <select
                      className="h-10 w-full appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-8 text-sm shadow-sm focus:outline-none"
                      value={sendTemplateId === '' ? '' : String(sendTemplateId)}
                      onChange={(e) => setSendTemplateId(e.target.value ? Number(e.target.value) : '')}
                    >
                      <option value="">Select…</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Primary audience (To)</Label>
                  <div className="relative">
                    <select
                      className="h-10 w-full appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-8 text-sm shadow-sm focus:outline-none"
                      value={sendAudience}
                      onChange={(e) => setSendAudience(e.target.value as EmailCampaignAudience)}
                    >
                      <option value="candidate">Candidates</option>
                      <option value="client_spoc">Clients / SPOC</option>
                      <option value="user">Internal users</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 sm:col-span-2">
                  {/* CLIENT SELECT */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">Client</Label>
                    <div className="relative">
                      <select
                        className="h-10 w-full appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-8 text-sm shadow-sm focus:outline-none"
                        value={selectedClient}
                        onChange={(e) => {
                          setSelectedClient(e.target.value);
                          setSelectedClientId(e.target.value ? Number(e.target.value) : null);
                          setSelectedPosition('');
                          setSendRequirementId('');
                        }}
                      >
                        <option value="">Select...</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* POSITION SELECT */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">Position</Label>
                    <div className="relative">
                      <select
                        className="h-10 w-full appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-8 text-sm shadow-sm disabled:opacity-60 focus:outline-none"
                        value={selectedPosition === '' ? '' : String(selectedPosition)}
                        disabled={!selectedClient}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : '';
                          setSelectedPosition(val);
                          setSendRequirementId(val);
                        }}
                      >
                        <option value="">{!selectedClient ? 'Select client' : 'Select position'}</option>
                        {filteredPositions.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <MeetStyleRecipientPicker
              title="Primary recipients (To)"
              mode="primary"
              primaryAudience={sendAudience}
              selected={primaryRecipients}
              onChange={setPrimaryRecipients}
              selectedClientId={selectedClientId}
              selectedRequirementId={sendRequirementId || null}
            />
            {/* {isInterviewTemplate && ( */}
            <Card className="w-full overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 px-5 py-4">
                <CardTitle className="text-base font-semibold text-[var(--brand)]">
                  Interview and merge fields for this send
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
                {primaryRecipients.length === 0 ? (
                  <p className="text-sm text-slate-600 sm:col-span-2">
                    Add at least one recipient, then set interview details.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                      {sendAudience === 'candidate' &&
                        primaryRecipients.length === 1 &&
                        primaryRecipients[0].kind === 'candidate' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-slate-200"
                            disabled={scheduleLookupBusy}
                            onClick={() => void loadScheduledInterviewIntoFields({ force: true })}
                          >
                            {scheduleLookupBusy ? 'Loading…' : 'Load from schedule'}
                          </Button>
                        )}
                      {sendAudience === 'candidate' &&
                        primaryRecipients.length === 1 &&
                        primaryRecipients[0].kind === 'candidate' && (
                          <p className="text-[11px] text-slate-500">
                            Uses upcoming interviews with status &quot;scheduled&quot; for this candidate.
                          </p>
                        )}
                      {(sendAudience !== 'candidate' || primaryRecipients.length !== 1) && (
                        <p className="text-[11px] text-slate-500">
                          For multiple To recipients, enter the shared interview slot (or leave blank
                          if your template does not need it).
                        </p>
                      )}
                    </div>
                    <div className="space-y-3 border-t border-slate-100 pt-4 sm:col-span-2">
                      <p className="text-xs font-semibold text-[var(--brand)]">Schedule and location</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-slate-600">Interview date</Label>
                          <Input
                            type="date"
                            className="h-10 border-slate-200 bg-slate-100 cursor-not-allowed"
                            value={sendInterviewDateYmd}
                            disabled
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-slate-600">Interview time</Label>
                          <Input
                            type="time"
                            className="h-10 border-slate-200 bg-slate-100 cursor-not-allowed"
                            value={sendInterviewTimeHm}
                            disabled
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className="text-xs font-medium text-slate-600">Job location</Label>
                          <Input
                            className="h-10 border-slate-200 bg-white"
                            value={sendJobLocation}
                            onChange={(e) => setSendJobLocation(e.target.value)}
                            placeholder="e.g. Bangalore / Hybrid"
                            disabled 
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className="text-xs font-medium text-slate-600">Joining bonus</Label>
                          <Input
                            className="h-10 border-slate-200 bg-white"
                            value={sendJoiningBonus}
                            onChange={(e) => setSendJoiningBonus(e.target.value)}
                            placeholder="e.g. Yes / No"
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className="text-xs font-medium text-slate-600">Job description / Skills</Label>
                          {requirementMergeFromApi.jobDescription ? (
                            <div className="min-h-[40px] rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 whitespace-pre-wrap cursor-not-allowed">
                              {requirementMergeFromApi.jobDescription}
                            </div>
                          ) : (
                            <div className="h-10 rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-400 cursor-not-allowed">
                              {sendRequirementId === '' ? 'Select a position above to load' : requirementFetchLoading ? 'Loading…' : '—'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <Button
                        disabled={
                          sending || (sendRequirementId !== '' && requirementFetchLoading)
                        }
                        className="h-10 bg-[var(--brand)] px-6 hover:bg-[var(--brand)]"
                        type="button"
                        onClick={handleSend}
                      >
                        {sending ? 'Working…' : dryRun ? 'Run dry send' : 'Send'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            {/* )} */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start">
              <MeetStyleRecipientPicker 
                title="CC (optional)"
                mode="cc"
                primaryAudience={null}
                selected={ccRecipients}
                onChange={setCcRecipients}
              />
              <MeetStyleRecipientPicker
                title="BCC (optional)"
                mode="bcc"
                primaryAudience={null}
                selected={bccRecipients}
                onChange={setBccRecipients}
              />
            </div>

            <Card className="w-full overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 px-5 py-4">
                <CardTitle className="text-base font-semibold text-[var(--brand)]">Quick preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[200px] flex-1 space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">Preview recipient email</Label>
                    <Input
                      type="email"
                      className="h-10 border-slate-200 bg-white"
                      autoComplete="off"
                      placeholder={
                        primaryRecipients.length === 1
                          ? inferPreviewEmailFromPrimary(primaryRecipients[0]) || 'name@company.com'
                          : 'name@company.com'
                      }
                      value={previewRecipientEmail}
                      onChange={(e) => setPreviewRecipientEmail(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    type="button"
                    disabled={sendRequirementId !== '' && requirementFetchLoading}
                    onClick={handlePreview}
                    className='bg-[var(--brand)] hover:bg-[var(--brand)] text-white'
                  >
                    Preview HTML
                  </Button>
                </div>
                {previewHtml !== null && (
                  <div className="h-[min(400px,50vh)] rounded-md border border-slate-200 bg-white p-3">
                    <iframe
                      title="preview"
                      sandbox="allow-same-origin"
                      srcDoc={previewHtml}
                      className="h-full w-full border-0"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="mt-2 focus-visible:outline-none">
            <Card className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
                <div>
                  <CardTitle className="text-base font-semibold text-[var(--brand)]">Send activity</CardTitle>
                  <CardDescription className="text-sm text-slate-600">
                    Latest 200 events across templates.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-slate-200"
                  onClick={loadLogs}
                  disabled={logsLoading}
                >
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {logsLoading ? (
                  <p className="px-5 py-8 text-sm text-slate-500">Loading…</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-200 bg-slate-50/90 hover:bg-slate-50/90">
                          <TableHead className="whitespace-nowrap px-5 font-semibold text-[var(--brand)]">
                            When
                          </TableHead>
                          <TableHead className="font-semibold text-[#14385f]">Template</TableHead>
                          <TableHead className="font-semibold text-[#14385f]">Audience</TableHead>
                          <TableHead className="font-semibold text-[#14385f]">To</TableHead>
                          <TableHead className="font-semibold text-[#14385f]">Status</TableHead>
                          <TableHead className="pr-5 font-semibold text-[#14385f]">Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((row) => (
                          <TableRow key={row.id} className="border-slate-100 hover:bg-slate-50/50">
                            <TableCell className="whitespace-nowrap px-5 text-xs text-slate-700">
                              {new Date(row.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-xs text-slate-700">{row.templateName}</TableCell>
                            <TableCell className="text-xs text-slate-700">{row.audienceType}</TableCell>
                            <TableCell className="max-w-[200px]">
                              <div className="flex flex-wrap gap-1">
                                {Array.isArray(row) ? (
                                  row.map((r, i) => (
                                    <RecipientPill key={i} name={r.recipientName ?? undefined} email={r.recipientEmail ?? undefined} />
                                  ))
                                ) : (
                                  <RecipientPill name={row.recipientName ?? undefined} email={row.recipientEmail ?? undefined} />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-slate-700">{row.status}</TableCell>
                            <TableCell className="max-w-[200px] truncate pr-5 text-xs text-red-600">
                              {row.errorMessage ?? '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>

      <CustomizedSnackbars
        open={snackbarState.open}
        handleClose={handleSnackbarClose}
        message={snackbarState.message}
        severity={snackbarState.severity}
      />

      <ConfirmationDialog
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onClose={() => setDeleteOpen(false)}
        title="Delete template"
        description="This cannot be undone. Continue?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
