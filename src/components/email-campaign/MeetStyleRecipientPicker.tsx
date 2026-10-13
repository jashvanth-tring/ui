import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mail, MessageSquare, Search, User, Users, X, Building2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import type { EmailCampaignAudience } from '../../store/model/email-campaign.types';
import type { CampaignPickerRecipient } from '../../store/model/email-campaign-picker.types';
import { makeRecipientKey } from '../../store/model/email-campaign-picker.types';
import { fetchCandidatesPaged } from '../../store/services/candidate';
import { FetchAllClient } from '../../store/services/client';
import { getAllUsers } from '../../store/services/users';
import type { client } from '../../store/model/client.types';
import type { User as AppUser } from '../../store/model/user.types';
import { fetchCandidateStatuses } from '../../store/services/candidate-status';

type PickerMode = 'primary' | 'cc' | 'bcc';

const KIND_BADGE: Record<
  CampaignPickerRecipient['kind'],
  { label: string; className: string }
> = {
  candidate: { label: 'Candidate', className: 'bg-emerald-100 text-emerald-800' },
  client_spoc: { label: 'Client', className: 'bg-violet-100 text-violet-800' },
  user: { label: 'User', className: 'bg-sky-100 text-sky-800' },
  email: { label: 'Email', className: 'bg-slate-200 text-slate-700' },
};

function avatarHue(label: string): string {
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h + label.charCodeAt(i) * 17) % 360;
  return `hsl(${h} 55% 42%)`;
}

function clientEmail(c: client): string {
  const raw = (c as { emailId?: string }).emailId ?? c.email_id ?? '';
  return String(raw).trim();
}

const BULK_CONFIRM_THRESHOLD = 150;

function mergeNewRecipients(
  existing: CampaignPickerRecipient[],
  additions: Omit<CampaignPickerRecipient, 'key'>[],
): CampaignPickerRecipient[] {
  const keys = new Set(existing.map((s) => s.key));
  const out = [...existing];
  for (const row of additions) {
    const key = makeRecipientKey(row);
    if (keys.has(key)) continue;
    keys.add(key);
    out.push({ ...row, key });
  }
  return out;
}

interface MeetStyleRecipientPickerProps {
  title: string;
  description?: string;
  mode: PickerMode;
  /** Primary "To" column: only this kind (no raw emails). CC/BCC: pass null to allow all + emails */
  primaryAudience: EmailCampaignAudience | null;
  selected: CampaignPickerRecipient[];
  onChange: (next: CampaignPickerRecipient[]) => void;
  selectedClientId?: number | null;
  selectedRequirementId?: number | null;
}

export function MeetStyleRecipientPicker({
  title,
  description,
  mode,
  primaryAudience,
  selected,
  onChange,
  selectedClientId,
  selectedRequirementId,
}: MeetStyleRecipientPickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<client[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [candidates, setCandidates] = useState<
    { id: number; candidateName: string; emailId: string }[]
  >([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const allowEmail = mode !== 'primary';
  const restrictKind = mode === 'primary' ? primaryAudience : null;

  const canShowKind = (kind: CampaignPickerRecipient['kind']) => {
    if (kind === 'email') return allowEmail;
    if (!restrictKind) return true;
    return kind === restrictKind;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cr, ur, candRes] = await Promise.all([
          FetchAllClient(),
          getAllUsers(),
          fetchCandidatesPaged(1, 100, ''),
        ]);
        if (cancelled) return;

        const crRaw = cr.data;
        const crData = Array.isArray(crRaw) ? crRaw : (crRaw as any)?.data;
        setClients(Array.isArray(crData) ? crData : []);

        const urRaw = ur.data;
        const urData = Array.isArray(urRaw) ? urRaw : (urRaw as any)?.data;
        setUsers(Array.isArray(urData) ? urData : []);

        const body = candRes.data as any;
        const rows = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
        setCandidates(
          rows.map((row: any) => {
            const id = typeof row.id === 'number' ? row.id : Number(row.id);
            if (!id) return null;
            return { id, candidateName: String(row.candidateName ?? ''), emailId: String(row.emailId ?? '') };
          }).filter(Boolean) as { id: number; candidateName: string; emailId: string }[]
        );
      } catch {
        if (!cancelled) { setClients([]); setUsers([]); setCandidates([]); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) return; // don't clear — keep pre-fetched candidates
    let cancelled = false;
    setLoading(true);
    const t = window.setTimeout(() => {
      fetchCandidatesPaged(1, 40, q)
        .then((res) => {
          if (cancelled) return;
          const body = res.data as any;
          const rows = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
          setCandidates(
            rows.map((row: any) => {
              const id = typeof row.id === 'number' ? row.id : Number(row.id);
              if (!id) return null;
              return { id, candidateName: String(row.candidateName ?? ''), emailId: String(row.emailId ?? '') };
            }).filter(Boolean) as { id: number; candidateName: string; emailId: string }[]
          );
        })
        .catch(() => { if (!cancelled) setCandidates([]); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 280);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const qLower = query.trim().toLowerCase();

  const filteredClients = useMemo(() => {
    if (!qLower) return [] as client[];
    return clients
      .filter((c) => {
        const id = c.id;
        if (id == null) return false;
        const name = (c.clientName ?? '').toLowerCase();
        const em = clientEmail(c).toLowerCase();
        return name.includes(qLower) || em.includes(qLower);
      })
      .slice(0, 40);
  }, [clients, qLower]);

  const filteredUsers = useMemo(() => {
    if (!qLower) return [] as AppUser[];
    return users
      .filter((u) => {
        const id = u.id;
        if (id == null) return false;
        const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase();
        const em = (u.officialEmail ?? '').toLowerCase();
        return name.includes(qLower) || em.includes(qLower);
      })
      .slice(0, 40);
  }, [users, qLower]);

  const selectedKeys = useMemo(() => new Set(selected.map((s) => s.key)), [selected]);

  const applyBulk = useCallback(
    (additions: Omit<CampaignPickerRecipient, 'key'>[], confirmLabel: string) => {
      if (additions.length === 0) return;
      if (
          additions.length >= BULK_CONFIRM_THRESHOLD &&
          !window.confirm(
            `Add ${additions.length} ${confirmLabel}? Large sends may take time.`,
          )
        ) {
          return;
        }
      onChange(mergeNewRecipients(selected, additions));
      setBulkError(null);
      setQuery('');
      setOpen(false);
    },
    [selected, onChange],
  );

  const handleAddAllUsers = useCallback(() => {
    setBulkError(null);
    const rows: Omit<CampaignPickerRecipient, 'key'>[] = [];
    for (const u of users) {
      const id = u.id;
      if (id == null) continue;
      const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.officialEmail;
      rows.push({
        kind: 'user',
        entityId: id,
        label: name,
        sublabel: u.officialEmail,
      });
    }
    if (rows.length === 0) {
      setBulkError('No users loaded.');
      return;
    }
    applyBulk(rows, 'users');
  }, [users, applyBulk]);

  const handleAddAllClients = useCallback(() => {
    setBulkError(null);
    const rows: Omit<CampaignPickerRecipient, 'key'>[] = [];
    for (const c of clients) {
      const id = c.id;
      if (id == null) continue;
      rows.push({
        kind: 'client_spoc',
        entityId: id,
        label: c.clientName || `Client #${id}`,
        sublabel: clientEmail(c) || undefined,
      });
    }
    if (rows.length === 0) {
      setBulkError('No clients loaded.');
      return;
    }
    applyBulk(rows, 'clients');
  }, [clients, applyBulk]);

  const handleAddAllCandidates = useCallback(async () => {
    setBulkError(null);
    if (!selectedClientId || !selectedRequirementId) {
      setBulkError('Please select client and position first.');
      return;
    }
    setBulkBusy(true);
    try {
      const res = await fetchCandidateStatuses(1, 1000, {
        clientId: selectedClientId,
        requirementId: selectedRequirementId,
      });
      const body = res.data as any;
      const rows = Array.isArray(body?.data) ? body.data : [];
      const mapped: Omit<CampaignPickerRecipient, 'key'>[] = rows
        .map((item: any) => {
          const c = item.candidate;
          if (!c?.id) return null;
          return {
            kind: 'candidate',
            entityId: c.id,
            label: c.candidateName || `Candidate #${c.id}`,
            sublabel: c.emailId || undefined,
          };
        })
        .filter(Boolean);

      if (mapped.length === 0) {
        setBulkError('No candidates found for selected client & position.');
        return;
      }
      applyBulk(mapped, 'filtered candidates');
    } catch (err) {
      setBulkError('Failed to fetch filtered candidates.');
    } finally {
      setBulkBusy(false);
    }
  }, [selectedClientId, selectedRequirementId, applyBulk]);

  const searchMatchRows = useMemo((): Omit<CampaignPickerRecipient, 'key'>[] => {
    const rows: Omit<CampaignPickerRecipient, 'key'>[] = [];
    if (canShowKind('candidate')) {
      for (const c of candidates) {
        rows.push({
          kind: 'candidate',
          entityId: c.id,
          label: c.candidateName || `Candidate #${c.id}`,
          sublabel: c.emailId || undefined,
        });
      }
    }
    if (canShowKind('client_spoc')) {
      for (const c of filteredClients) {
        const id = c.id!;
        rows.push({
          kind: 'client_spoc',
          entityId: id,
          label: c.clientName || `Client #${id}`,
          sublabel: clientEmail(c) || undefined,
        });
      }
    }
    if (canShowKind('user')) {
      for (const u of filteredUsers) {
        const id = u.id!;
        const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.officialEmail;
        rows.push({
          kind: 'user',
          entityId: id,
          label: name,
          sublabel: u.officialEmail,
        });
      }
    }
    return rows;
  }, [candidates, filteredClients, filteredUsers, allowEmail, restrictKind]);

  const addRecipient = useCallback(
    (row: Omit<CampaignPickerRecipient, 'key'>) => {
      const key = makeRecipientKey(row);
      if (selectedKeys.has(key)) return;
      onChange([...selected, { ...row, key }]);
      setQuery('');
      setOpen(false);
    },
    [selected, selectedKeys, onChange],
  );

  const removeRecipient = useCallback(
    (key: string) => {
      onChange(selected.filter((s) => s.key !== key));
    },
    [selected, onChange],
  );

  // More lenient email check for typing
  const looksLikeEmail = allowEmail && query.trim().includes('@');

  const summaryParts: string[] = [];
  if (selected.length) {
    const byKind = selected.reduce(
      (acc, s) => {
        acc[s.kind] = (acc[s.kind] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    if (byKind.candidate) summaryParts.push(`${byKind.candidate} candidate(s)`);
    if (byKind.client_spoc) summaryParts.push(`${byKind.client_spoc} client(s)`);
    if (byKind.user) summaryParts.push(`${byKind.user} user(s)`);
    if (byKind.email) summaryParts.push(`${byKind.email} email(s)`);
  }

  return (
    <div
      ref={wrapRef}
      className="rounded-xl border border-slate-200/90 bg-white shadow-sm"
    >
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-[var(--brand)]">{title}</h3>
            {description && (
              <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{description}</p>
            )}
          </div>
          <div className="flex shrink-0 gap-1.5 text-slate-400">
            <MessageSquare className="h-4 w-4 text-[#14385f]/60" />
            <Mail className="h-4 w-4 text-[#14385f]/60" />
          </div>
        </div>
        {selected.length > 0 && (
          <p className="mt-2 text-xs text-slate-600">
            <span className="font-semibold text-[#14385f]">{selected.length}</span> recipient{selected.length !== 1 ? 's' : ''}
            {summaryParts.length ? ` · ${summaryParts.join(' · ')}` : ''}
          </p>
        )}
      </div>

      <div className="space-y-3 px-5 py-4">
        <div className="relative">
          <Label className="sr-only">Search to add</Label>
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400 transition-colors focus-within:text-[#14385f]" />
            <Input
              className="h-10 w-full border-slate-200 bg-white pl-9 pr-3 focus-visible:ring-[#14385f] focus-visible:border-[#14385f] transition-all"
              placeholder={
                mode === 'primary'
                  ? `Search ${restrictKind === 'candidate' ? 'candidates' : restrictKind === 'client_spoc' ? 'clients' : 'users'}…`
                  : 'Search by name or email Id'
              }
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
            />
          </div>

          {open && (
            <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-[min(400px,60vh)] overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
              {searchMatchRows.length > 0 && query.trim().length > 0 && (
                <div className="sticky top-0 z-[1] -mt-1 border-b border-slate-100 bg-white/95 px-3 py-2.5 backdrop-blur-sm">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-8.5 w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-[#14385f] border border-slate-200"
                    onClick={() => applyBulk(searchMatchRows, 'matches from this search')}
                  >
                    Add all {searchMatchRows.length} shown below
                  </Button>
                </div>
              )}
              
              {loading && (
                <div className="flex items-center gap-2 px-4 py-3 text-xs text-slate-500 italic">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                  Searching local & database…
                </div>
              )}

              {looksLikeEmail && (
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50/80 group transition-colors"
                  onClick={() =>
                    addRecipient({
                      kind: 'email',
                      email: query.trim(),
                      label: query.trim(),
                      sublabel: 'Custom external address',
                    })
                  }
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 group-hover:bg-[#14385f] group-hover:text-white transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block font-semibold text-slate-900 truncate">Add &quot;{query.trim()}&quot;</span>
                    <span className="block text-[11px] text-slate-500 font-medium">Add as direct email address</span>
                  </div>
                </button>
              )}

              {canShowKind('candidate') &&
                candidates.map((c) => (
                  <button
                    key={`c-${c.id}`}
                    type="button"
                    disabled={selectedKeys.has(makeRecipientKey({ kind: 'candidate', entityId: c.id, label: '' }))}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors disabled:opacity-40"
                    onClick={() =>
                      addRecipient({
                        kind: 'candidate',
                        entityId: c.id,
                        label: c.candidateName || `Candidate #${c.id}`,
                        sublabel: c.emailId || undefined,
                      })
                    }
                  >
                    <div className="relative shrink-0">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: avatarHue(c.candidateName || String(c.id)) }}
                      >
                        {(c.candidateName || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 border-2 border-white text-[8px] text-white">
                        ✓
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="truncate font-semibold text-slate-900">{c.candidateName || `Candidate #${c.id}`}</span>
                        <span className="bg-emerald-50 text-emerald-700 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                          Candidate
                        </span>
                      </div>
                      {c.emailId && <span className="block truncate text-xs text-slate-500 font-medium">{c.emailId}</span>}
                    </div>
                  </button>
                ))}

              {canShowKind('client_spoc') &&
                filteredClients.map((c) => {
                  const id = c.id!;
                  const em = clientEmail(c);
                  return (
                    <button
                      key={`cl-${id}`}
                      type="button"
                      disabled={selectedKeys.has(makeRecipientKey({ kind: 'client_spoc', entityId: id, label: '' }))}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors disabled:opacity-40"
                      onClick={() =>
                        addRecipient({
                          kind: 'client_spoc',
                          entityId: id,
                          label: c.clientName || `Client #${id}`,
                          sublabel: em || undefined,
                        })
                      }
                    >
                      <div className="relative shrink-0">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                          style={{ backgroundColor: avatarHue(c.clientName || String(id)) }}
                        >
                          {(c.clientName || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 border-2 border-white text-[8px] text-white">
                          ✓
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="truncate font-semibold text-slate-900">{c.clientName}</span>
                          <span className="bg-violet-50 text-violet-700 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                            Client
                          </span>
                        </div>
                        {em && <span className="block truncate text-xs text-slate-500 font-medium">{em}</span>}
                      </div>
                    </button>
                  );
                })}

              {canShowKind('user') &&
                filteredUsers.map((u) => {
                  const id = u.id!;
                  const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.officialEmail;
                  return (
                    <button
                      key={`u-${id}`}
                      type="button"
                      disabled={selectedKeys.has(makeRecipientKey({ kind: 'user', entityId: id, label: '' }))}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors disabled:opacity-40"
                      onClick={() =>
                        addRecipient({
                          kind: 'user',
                          entityId: id,
                          label: name,
                          sublabel: u.officialEmail,
                        })
                      }
                    >
                      <div className="relative shrink-0">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                          style={{ backgroundColor: avatarHue(name) }}
                        >
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 border-2 border-white text-[8px] text-white">
                          ✓
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="truncate font-semibold text-slate-900">{name}</span>
                          <span className="bg-sky-50 text-sky-700 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                            User
                          </span>
                        </div>
                        <span className="block truncate text-xs text-slate-500 font-medium">{u.officialEmail}</span>
                      </div>
                    </button>
                  );
                })}

              {!loading &&
                query.trim().length > 0 &&
                !looksLikeEmail &&
                candidates.length === 0 &&
                filteredClients.length === 0 &&
                filteredUsers.length === 0 && (
                  <div className="px-5 py-6 text-center">
                    <p className="text-sm font-medium text-slate-600">No results found for &quot;{query}&quot;</p>
                    <p className="mt-1 text-xs text-slate-400">Try searching by name or full email address.</p>
                  </div>
                )}
            </div>
          )}
        </div>

        {(canShowKind('candidate') || canShowKind('client_spoc') || canShowKind('user')) && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Bulk
            </span>
            {canShowKind('candidate') && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 border-slate-200 text-xs"
                disabled={bulkBusy}
                onClick={() => void handleAddAllCandidates()}
              >
                <Users className="h-3.5 w-3.5" aria-hidden />
                {bulkBusy ? 'Loading…' : 'Add all candidates'}
              </Button>
            )}
            {canShowKind('user') && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 border-slate-200 text-xs"
                disabled={bulkBusy}
                onClick={handleAddAllUsers}
              >
                Add all users
              </Button>
            )}
            {canShowKind('client_spoc') && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 border-slate-200 text-xs"
                disabled={bulkBusy}
                onClick={handleAddAllClients}
              >
                Add all clients
              </Button>
            )}
          </div>
        )}

        {bulkError && <p className="text-xs text-red-600">{bulkError}</p>}

        {selected.length > 0 && (
          <ul className="max-h-[220px] space-y-1 overflow-y-auto pr-1">
            {selected.map((s) => (
              <li
                key={s.key}
                className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: avatarHue(s.label) }}
                >
                  {s.kind === 'email' ? (
                    <Mail className="h-4 w-4 text-white opacity-90" />
                  ) : (
                    s.label.charAt(0).toUpperCase()
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-slate-900">{s.label}</span>
                    <span
                      className={
                        KIND_BADGE[s.kind].className + ' rounded px-1.5 py-0 text-[10px] font-medium'
                      }
                    >
                      {KIND_BADGE[s.kind].label}
                    </span>
                  </div>
                  {s.sublabel && (
                    <span className="block truncate text-xs text-slate-500">{s.sublabel}</span>
                  )}
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                  aria-label={`Remove ${s.label}`}
                  onClick={() => removeRecipient(s.key)}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {selected.length === 0 && (
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <User className="h-3.5 w-3.5 shrink-0" />
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            No one added yet. Use search or bulk add.
          </p>
        )}
      </div>
    </div>
  );
}
