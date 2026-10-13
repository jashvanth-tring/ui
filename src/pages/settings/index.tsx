import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import CustomizedSnackbars from '../../components/customized-snackbar';
import { useSnackbar } from '../../utils/snackbar-function';
import { Roles } from '../../constants/roles';
import { AppDispatch, useAppSelector } from '../../store';
import { RootState } from '../../store/reducers';
import { fetchStatus, createStatus, updateStatus, deleteStatus } from '../../store/action/status.action';
import type { StatusData } from '../../store/model/status-category.types';
import {
  fetchGapCategoryMappings,
  fetchPipelineCountsByStatus,
  saveGapCategoryMappings,
  type GapCategoryMappingRow,
  type GapCategoryOption,
  type GapCategoryGroup,
} from '../../store/services/settings';
import axios from 'axios';
import ConfirmationDialog from '../../components/confirmation-dialog';
import SearchableSelect from '../../components/form/SearchableSelect';
import { Pencil, Search, Trash2 } from 'lucide-react';
import HolidaysPage from './HolidaysPage';

function thunkRejectMessage(e: unknown, fallback: string): string {
  if (typeof e === 'string' && e.trim()) return e.trim();
  if (e && typeof e === 'object' && 'message' in e) {
    const m = (e as { message: unknown }).message;
    if (typeof m === 'string' && m.trim()) return m.trim();
  }
  return fallback;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const user = useAppSelector((s: RootState) => s.authSelector.user);
  const statuses = useAppSelector((s: RootState) => s.statusSelector.status ?? []);
  const { snackbarState, handleSnackbarClose, showSuccessSnackbar, showErrorSnackbar } =
    useSnackbar();

  const [newStatusName, setNewStatusName] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<StatusData | null>(null);
  const [statusTableSearch, setStatusTableSearch] = useState('');
  const [pipelineCountsByStatus, setPipelineCountsByStatus] = useState<
    Record<number, number>
  >({});

  const [gapRows, setGapRows] = useState<GapCategoryMappingRow[]>([]);
  const [gapCategories, setGapCategories] = useState<GapCategoryOption[]>([]);
  const [gapCategoryGroups, setGapCategoryGroups] = useState<GapCategoryGroup[]>([]);
  const [gapLoading, setGapLoading] = useState(false);
  const [selectedGapCategoryId, setSelectedGapCategoryId] = useState<number | ''>('');
  const [selectedStatusIds, setSelectedStatusIds] = useState<number[]>([]);
  const [savingGap, setSavingGap] = useState(false);

  const filteredStatuses = useMemo(() => {
    const list = statuses as StatusData[];
    const q = statusTableSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.statusName.toLowerCase().includes(q) || String(s.id).includes(q),
    );
  }, [statuses, statusTableSearch]);

  const displayCategoryGroups = useMemo((): GapCategoryGroup[] => {
    if (gapCategoryGroups.length > 0) return gapCategoryGroups;
    return [
      {
        key: 'all',
        analysisType: null,
        label: 'All categories',
        description:
          'Your API did not return grouped categories; showing a single list. Update the API for Gap 1–3 tabs.',
        categories: gapCategories,
      },
    ];
  }, [gapCategoryGroups, gapCategories]);

  const gapCategoryOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    for (const group of displayCategoryGroups) {
      for (const c of group.categories) {
        opts.push({
          value: String(c.id),
          label: `${c.name}`,
        });
      }
    }
    return opts;
  }, [displayCategoryGroups]);

  useEffect(() => {
    if (!user?.role || user.role.id !== Roles.SUPERUSER) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    void dispatch(fetchStatus());
  }, [dispatch]);

  const loadGapMappings = useCallback(async () => {
    setGapLoading(true);
    try {
      const res = await fetchGapCategoryMappings();
      const body = res.data;
      if (body?.success && Array.isArray(body.data)) {
        setGapRows(body.data);
        setGapCategories(body.categories ?? []);
        setGapCategoryGroups(
          Array.isArray(body.categoryGroups) ? body.categoryGroups : [],
        );
      } else {
        setGapRows([]);
        setGapCategoryGroups([]);
      }
    } catch (e) {
      const msg =
        axios.isAxiosError(e) && e.response?.data?.message
          ? String(e.response.data.message)
          : 'Could not load gap mappings.';
      showErrorSnackbar(msg);
    } finally {
      setGapLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- showErrorSnackbar changes every render
  }, []);

  const loadPipelineCounts = useCallback(async () => {
    try {
      const res = await fetchPipelineCountsByStatus();
      const body = res.data;
      if (body?.success && body.data && typeof body.data === 'object') {
        const map: Record<number, number> = {};
        for (const [k, v] of Object.entries(body.data)) {
          map[Number(k)] = Number(v);
        }
        setPipelineCountsByStatus(map);
      } else {
        setPipelineCountsByStatus({});
      }
    } catch {
      setPipelineCountsByStatus({});
    }
  }, []);

  const superuserRoleId = user?.role?.id;
  useEffect(() => {
    if (superuserRoleId !== Roles.SUPERUSER) return;
    void loadGapMappings();
    void loadPipelineCounts();
  }, [superuserRoleId, loadGapMappings, loadPipelineCounts]);

  useEffect(() => {
    if (selectedGapCategoryId === '') {
      setSelectedStatusIds([]);
      return;
    }
    setSelectedStatusIds(
      gapRows
        .filter((r) => r.categoryIds.includes(selectedGapCategoryId))
        .map((r) => r.statusId),
    );
  }, [selectedGapCategoryId, gapRows]);

  const handleCreateStatus = async () => {
    const name = newStatusName.trim();
    if (!name) {
      showErrorSnackbar('Enter a status name.');
      return;
    }
    const actorId = user?.id;
    if (!actorId || actorId < 1) {
      showErrorSnackbar('Missing user id.');
      return;
    }
    setSavingStatus(true);
    try {
      const res = await dispatch(
        createStatus({ statusName: name, createdBy: { id: actorId } })
      ).unwrap();
      showSuccessSnackbar(res?.message ?? 'Status created.');
      setNewStatusName('');
      void dispatch(fetchStatus());
      void loadGapMappings();
      void loadPipelineCounts();
    } catch (e) {
      showErrorSnackbar(thunkRejectMessage(e, 'Create failed.'));
    } finally {
      setSavingStatus(false);
    }
  };

  const startEdit = (s: StatusData) => {
    setEditId(s.id);
    setEditName(s.statusName);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName('');
  };

  const saveEdit = async () => {
    if (editId == null) return;
    const name = editName.trim();
    if (!name) {
      showErrorSnackbar('Status name required.');
      return;
    }
    const actorId = user?.id;
    if (!actorId || actorId < 1) return;
    try {
      await dispatch(
        updateStatus({ statusId: editId, payload: { statusName: name, updatedBy: { id: actorId } } })
      ).unwrap();
      showSuccessSnackbar('Status updated.');
      cancelEdit();
      void dispatch(fetchStatus());
      void loadGapMappings();
      void loadPipelineCounts();
    } catch (e) {
      showErrorSnackbar(thunkRejectMessage(e, 'Update failed.'));
    }
  };

  const confirmDelete = async () => {
    const t = deleteTarget;
    if (!t) return;
    try {
      await dispatch(deleteStatus(t.id)).unwrap();
      showSuccessSnackbar('Status deleted.');
      setDeleteTarget(null);
      void dispatch(fetchStatus());
      void loadGapMappings();
      void loadPipelineCounts();
    } catch (e) {
      showErrorSnackbar(
        thunkRejectMessage(e, 'Delete failed (status may be in use).'),
      );
    }
  };

  const toggleStatus = (statusId: number) => {
    setSelectedStatusIds((prev) =>
      prev.includes(statusId)
        ? prev.filter((x) => x !== statusId)
        : [...prev, statusId].sort((a, b) => a - b),
    );
  };

  const saveGapMapping = async () => {
    if (selectedGapCategoryId === '') {
      showErrorSnackbar('Select a category.');
      return;
    }
    const categoryId = selectedGapCategoryId as number;
    const updates = gapRows
      .map((row) => {
        const has = row.categoryIds.includes(categoryId);
        const shouldHave = selectedStatusIds.includes(row.statusId);
        if (has === shouldHave) return null;
        let categoryIds = [...row.categoryIds];
        if (shouldHave) categoryIds.push(categoryId);
        else categoryIds = categoryIds.filter((id) => id !== categoryId);
        return {
          statusId: row.statusId,
          categoryIds: categoryIds.sort((a, b) => a - b),
        };
      })
      .filter((u): u is { statusId: number; categoryIds: number[] } => u != null);

    if (updates.length === 0) {
      showSuccessSnackbar('No changes to save.');
      return;
    }

    setSavingGap(true);
    try {
      await saveGapCategoryMappings(updates);
      showSuccessSnackbar('Gap mapping saved.');
      await loadGapMappings();
    } catch (e) {
      const msg =
        axios.isAxiosError(e) && e.response?.data?.message
          ? String(e.response.data.message)
          : 'Save failed.';
      showErrorSnackbar(msg);
    } finally {
      setSavingGap(false);
    }
  };

  const selectedCategoryMeta = useMemo(() => {
    if (selectedGapCategoryId === '') return undefined;
    const cat = gapCategories.find((c) => c.id === selectedGapCategoryId);
    const mapped = gapRows.filter((r) => r.categoryIds.includes(selectedGapCategoryId));
    const withOverride = mapped.filter((r) => r.hasDatabaseOverride);
    return { name: cat?.name ?? `Category ${selectedGapCategoryId}`, mapped, withOverride };
  }, [selectedGapCategoryId, gapCategories, gapRows]);

  if (!user?.role || user.role.id !== Roles.SUPERUSER) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f8fafc] pt-10">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="w-full px-4 py-8 pb-14 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <Tabs defaultValue="statuses" className="w-full">
            {/* Use div not <header>: global index.css makes every header { position: sticky } */}
            <div className="mb-6" role="banner">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--brand)]">Settings</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
                Superuser tools for pipeline statuses and how they roll up into gap analytics. Gap
                mappings can follow built-in defaults or your own database overrides.
              </p>
            </div>

            {/* Full-width hairline; active tab = bold + thick underline sitting on that rule */}
            <TabsList className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 p-2 h-auto">
              <TabsTrigger
                value="statuses"
                className="rounded-lg px-4 py-2 text-sm font-normal text-slate-500 transition-colors
                  data-[state=active]:bg-[var(--brand)] data-[state=active]:text-white data-[state=active]:font-semibold
                  data-[state=inactive]:bg-transparent data-[state=inactive]:hover:bg-indigo-100
                  !shadow-none border-0 focus-visible:ring-0"
              >
                Statuses
              </TabsTrigger>
              <TabsTrigger
                value="gap-mapping"
                className="rounded-lg px-4 py-2 text-sm font-normal text-slate-500 transition-colors
                  data-[state=active]:bg-[var(--brand)] data-[state=active]:text-white data-[state=active]:font-semibold
                  data-[state=inactive]:bg-transparent data-[state=inactive]:hover:bg-indigo-100
                  !shadow-none border-0 focus-visible:ring-0"
              >
                Gap analysis mapping
              </TabsTrigger>
              <TabsTrigger
                value="holidays"
                className="rounded-lg px-4 py-2 text-sm font-normal text-slate-500 transition-colors
                  data-[state=active]:bg-[var(--brand)] data-[state=active]:text-white data-[state=active]:font-semibold
                  data-[state=inactive]:bg-transparent data-[state=inactive]:hover:bg-indigo-100
                  !shadow-none border-0 focus-visible:ring-0"
              >
                Tringapps Holidays
              </TabsTrigger>
            </TabsList>

            <TabsContent value="statuses" className="mt-0 space-y-6 focus-visible:outline-none">
              <Card className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
                <CardHeader className="border-b border-slate-100 px-5 py-4">
                  <CardTitle className="text-base font-semibold text-[var(--brand)]">Create status</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:flex-wrap sm:items-end">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Label htmlFor="new-status" className="text-xs font-medium text-slate-600">
                      Status name
                    </Label>
                    <Input
                      id="new-status"
                      value={newStatusName}
                      onChange={(e) => setNewStatusName(e.target.value)}
                      placeholder="e.g. Interview Scheduled R5"
                      className="h-10 border-slate-200 bg-white"
                    />
                  </div>
                  <Button
                    type="button"
                    className="h-10 shrink-0 bg-[var(--brand)] px-6 hover:bg-[var(--brand)]"
                    onClick={() => void handleCreateStatus()}
                    disabled={savingStatus}
                  >
                    {savingStatus ? 'Saving…' : 'Create'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
                <CardHeader className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <CardTitle className="text-base font-semibold text-[var(--brand)]">All statuses</CardTitle>
                  <div className="relative w-full sm:max-w-[280px]">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    />
                    <Input
                      type="search"
                      value={statusTableSearch}
                      onChange={(e) => setStatusTableSearch(e.target.value)}
                      placeholder="Search by name or ID..."
                      className="h-10 border-slate-200 bg-white pl-10"
                      aria-label="Search statuses"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-200 bg-slate-50/90 hover:bg-slate-50/90">
                          <TableHead className="w-16 px-5 font-semibold text-[var(--brand)]">ID</TableHead>
                          <TableHead className="font-semibold text-[var(--brand)]">Name</TableHead>
                          <TableHead className="w-28 text-center font-semibold text-[var(--brand)]">
                            Count
                          </TableHead>
                          <TableHead className="w-[200px] text-right font-semibold text-[var(--brand)]">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStatuses.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="py-12 text-center text-sm text-slate-500"
                            >
                              {(statuses as StatusData[]).length === 0
                                ? 'No statuses yet. Create one above.'
                                : `No statuses match "${statusTableSearch.trim()}".`}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredStatuses.map((s) => (
                            <TableRow
                              key={s.id}
                              className="border-slate-100 hover:bg-slate-50/50"
                            >
                              <TableCell className="px-5 tabular-nums text-slate-500">{s.id}</TableCell>
                              <TableCell className="font-medium text-slate-900">
                                {editId === s.id ? (
                                  <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="max-w-md border-slate-200"
                                  />
                                ) : (
                                  s.statusName
                                )}
                              </TableCell>
                              <TableCell className="text-center tabular-nums text-slate-700">
                                {pipelineCountsByStatus[s.id] ?? 0}
                              </TableCell>
                              <TableCell className="text-right">
                                {editId === s.id ? (
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="border-slate-200"
                                      onClick={cancelEdit}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="bg-[var(--brand)] hover:bg-[var(--brand)]"
                                      onClick={() => void saveEdit()}
                                    >
                                      Save
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-9 gap-1.5 px-2.5 font-medium text-[var(--brand)] hover:bg-[var(--brand)]/10 hover:text-[var(--brand)]"
                                      onClick={() => startEdit(s)}
                                    >
                                      <Pencil className="h-4 w-4 shrink-0" aria-hidden />
                                      Edit
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-9 gap-1.5 px-2.5 font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                                      onClick={() => setDeleteTarget(s)}
                                    >
                                      <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                                      Delete
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gap-mapping" className="mt-0 focus-visible:outline-none">
              <Card className="overflow-hidden rounded-xl border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                  <CardTitle className="text-lg text-[var(--brand)]">Gap category mapping</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Pick a gap category, then choose which pipeline statuses count toward it.{' '}
                    <strong>Save mapping</strong> updates every status whose mapping changed.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-5 sm:p-6">
                  {gapLoading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span
                        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[var(--brand)]"
                        aria-hidden
                      />
                      Loading mappings…
                    </div>
                  ) : (
                    <>
                      <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/60 p-4 shadow-sm sm:p-5">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
                          <div className="min-w-0 flex-1 lg:max-w-xl">
                            <SearchableSelect
                              id="gap-category-select"
                              label="Gap category"
                              placeholder="Search or select a category…"
                              value={
                                selectedGapCategoryId === ''
                                  ? ''
                                  : String(selectedGapCategoryId)
                              }
                              options={gapCategoryOptions}
                              onChange={(v) =>
                                setSelectedGapCategoryId(v === '' ? '' : Number(v))
                              }
                              useAccent={false}
                              className="w-full"
                            />
                          </div>
                          <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              className="bg-[var(--brand)] hover:bg-[var(--brand)]"
                              disabled={savingGap || selectedGapCategoryId === ''}
                              onClick={() => void saveGapMapping()}
                            >
                              {savingGap ? 'Saving…' : 'Save mapping'}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-slate-600"
                              onClick={() => void loadGapMappings()}
                            >
                              Refresh
                            </Button>
                          </div>
                        </div>

                        {selectedCategoryMeta ? (
                          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-4">
                            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Currently mapped
                            </span>
                            <Badge
                              variant="outline"
                              className="border-slate-300 bg-white font-medium text-slate-700"
                            >
                              {selectedCategoryMeta.mapped.length} status
                              {selectedCategoryMeta.mapped.length === 1 ? '' : 'es'}
                            </Badge>
                            {selectedCategoryMeta.withOverride.length > 0 ? (
                              <span className="text-xs text-slate-500">
                                {selectedCategoryMeta.withOverride.length} with saved overrides
                              </span>
                            ) : null}
                          </div>
                        ) : selectedGapCategoryId === '' ? (
                          <p className="mt-4 border-t border-slate-200/80 pt-4 text-sm text-slate-500">
                            Select a category to choose which pipeline statuses use it.
                          </p>
                        ) : null}
                      </div>

                      {selectedGapCategoryId === '' ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center text-sm text-slate-500">
                          Choose a gap category above to map pipeline statuses.
                        </div>
                      ) : (
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                          <div className="border-b border-slate-100 bg-slate-50/30 px-4 py-3 sm:px-5">
                            <p className="text-xs font-semibold text-[var(--brand)]">
                              {selectedCategoryMeta?.name ?? 'Category'}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
                              Check each pipeline status that should include this category in gap
                              analysis.
                            </p>
                          </div>
                          <div className="max-h-[min(420px,55vh)] overflow-y-auto p-3 sm:p-4">
                            {gapRows.length === 0 ? (
                              <p className="text-sm text-slate-500">No pipeline statuses found.</p>
                            ) : (
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {gapRows.map((row) => {
                                  const checked = selectedStatusIds.includes(row.statusId);
                                  const pipelineCount = pipelineCountsByStatus[row.statusId];
                                  return (
                                    <label
                                      key={row.statusId}
                                      title={`Status id ${row.statusId}`}
                                      className={[
                                        'flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                                        checked
                                          ? 'border-[var(--brand)]/35 bg-[var(--brand)]/[0.07]'
                                          : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/80',
                                      ].join(' ')}
                                    >
                                      <input
                                        type="checkbox"
                                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)] focus:ring-offset-0"
                                        checked={checked}
                                        onChange={() => toggleStatus(row.statusId)}
                                      />
                                      <span className="min-w-0 flex-1 leading-snug text-slate-800">
                                        <span className="font-medium">{row.statusName}</span>
                                        {pipelineCount != null && pipelineCount > 0 ? (
                                          <span className="ml-1 text-xs text-slate-500">
                                            ({pipelineCount} in pipeline)
                                          </span>
                                        ) : null}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="holidays" className="mt-0 focus-visible:outline-none">
              <HolidaysPage />
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
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete status?"
        description={
          deleteTarget
            ? `Remove "${deleteTarget.statusName}"? This may fail if candidates still use it.`
            : ''
        }
        variant="destructive"
        confirmText="Delete"
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
