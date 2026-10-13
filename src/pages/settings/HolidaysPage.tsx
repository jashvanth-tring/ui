import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { RootState } from '../../store/reducers';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CustomDatePicker } from '../../components/ui/custom-date-picker'; // adjust path
import { CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import CustomizedSnackbars from '../../components/customized-snackbar';
import { useSnackbar } from '../../utils/snackbar-function';
import ConfirmationDialog from '../../components/confirmation-dialog';
import { Pencil, Trash2, Upload, Search, Trash } from 'lucide-react';
import {
  fetchHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  deleteHolidaysByYear,
  uploadHolidayDoc,
} from '../../store/action/holiday.action';
import { Holiday } from '../../store/model/holiday.types';

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear + i - 1));

export default function HolidaysPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { snackbarState, handleSnackbarClose, showSuccessSnackbar, showErrorSnackbar } =
    useSnackbar();

  // ── Redux state ─────────────────────────────────────────────────────────────
  const { holidays, loading, uploading } = useSelector((state: RootState) => state.holidays);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [filterYear, setFilterYear] = useState<string>(String(currentYear));
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [search, setSearch] = useState('');

  // ── Create state ────────────────────────────────────────────────────────────
  const [newDate, setNewDate] = useState('');
  const [newDay, setNewDay] = useState('');
  const [newOccasion, setNewOccasion] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Edit state ──────────────────────────────────────────────────────────────
  const [editId, setEditId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editDay, setEditDay] = useState('');
  const [editOccasion, setEditOccasion] = useState('');

  // ── Delete state ────────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);
  const [deleteYearTarget, setDeleteYearTarget] = useState<number | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  // ── Upload state ────────────────────────────────────────────────────────────
  const [uploadYear, setUploadYear] = useState<string>(String(currentYear));
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // ── Load holidays ────────────────────────────────────────────────────────────
  const loadHolidays = useCallback(() => {
    dispatch(fetchHolidays({ year: filterYear, month: filterMonth }));
  }, [dispatch, filterYear, filterMonth]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  // ── Filtered + searched list ─────────────────────────────────────────────────
  const filteredHolidays = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return holidays;
    return holidays.filter(
      (h: any) =>
        h.occasion.toLowerCase().includes(q) ||
        h.date.includes(q) ||
        h.day.toLowerCase().includes(q)
    );
  }, [holidays, search]);

  // ── Create ───────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newDate || !newDay || !newOccasion.trim()) {
      showErrorSnackbar('Please fill in all fields.');
      return;
    }
    setSaving(true);
    const result = await dispatch(
      createHoliday({ date: newDate, day: newDay, occasion: newOccasion.trim() })
    );
    setSaving(false);
    if (createHoliday.fulfilled.match(result)) {
      showSuccessSnackbar('Holiday created successfully.');
      setNewDate('');
      setNewDay('');
      setNewOccasion('');
      setAddDialogOpen(false);
      loadHolidays();
    } else {
      const msg = (result.payload as { message?: string })?.message ?? 'Failed to create holiday.';
      showErrorSnackbar(msg);
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────────
  const startEdit = (h: Holiday) => {
    setEditId(h.id);
    setEditDate(h.date);
    setEditDay(h.day);
    setEditOccasion(h.occasion);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditDate('');
    setEditDay('');
    setEditOccasion('');
  };

  const saveEdit = async () => {
    if (editId == null) return;
    if (!editDate || !editDay || !editOccasion.trim()) {
      showErrorSnackbar('All fields are required.');
      return;
    }
    const result = await dispatch(
      updateHoliday({
        id: editId,
        payload: { date: editDate, day: editDay, occasion: editOccasion.trim() },
      })
    );
    if (updateHoliday.fulfilled.match(result)) {
      showSuccessSnackbar('Holiday updated.');
      cancelEdit();
      loadHolidays();
    } else {
      showErrorSnackbar('Update failed.');
    }
  };

  // ── Delete single ────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteHoliday(deleteTarget.id));
    if (deleteHoliday.fulfilled.match(result)) {
      showSuccessSnackbar('Holiday deleted.');
      setDeleteTarget(null);
    } else {
      showErrorSnackbar('Delete failed.');
    }
  };

  // ── Delete by year ───────────────────────────────────────────────────────────
  const confirmDeleteYear = async () => {
    if (!deleteYearTarget) return;
    const result = await dispatch(deleteHolidaysByYear(deleteYearTarget));
    if (deleteHolidaysByYear.fulfilled.match(result)) {
      showSuccessSnackbar(`All holidays for ${deleteYearTarget} deleted.`);
      setDeleteYearTarget(null);
    } else {
      showErrorSnackbar('Delete failed.');
    }
  };
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // ── Upload ───────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!uploadFile) {
      showErrorSnackbar('Please select a .doc or .docx file.');
      return;
    }
    if (!uploadYear) {
      showErrorSnackbar('Please select a year.');
      return;
    }
    const result = await dispatch(uploadHolidayDoc({ file: uploadFile, year: Number(uploadYear) }));
    if (uploadHolidayDoc.fulfilled.match(result)) {
      const inserted = (result.payload as { inserted: number })?.inserted ?? 0;
      showSuccessSnackbar(`Successfully uploaded ${inserted} holidays for ${uploadYear}.`);
      setUploadFile(null);
      setUploadDialogOpen(false);
      const input = document.getElementById('holiday-file') as HTMLInputElement;
      if (input) input.value = '';
      loadHolidays();
    } else {
      const msg = (result.payload as { message?: string })?.message ?? 'Upload failed.';
      showErrorSnackbar(msg);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f8fafc]">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="w-full space-y-6 pb-14">
          {/* ── Upload Dialog ── */}
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden">
              {/* Header */}
              <DialogHeader className="px-6 pt-3">
                <DialogTitle className="text-lg font-semibold text-[var(--brand)]">
                  Upload Holiday Document
                </DialogTitle>
              </DialogHeader>

              {/* Body */}
              <div className="px-6 space-y-5">
                {/* Info Box */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900 leading-relaxed">
                  <strong>Format:</strong> <code>.doc / .docx</code>
                  <br />
                  Columns: <strong>S.NO | DATE | DAY | OCCASION</strong>
                  <br />
                </div>

                {/* Year + Upload */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Year */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">Year</Label>
                    <Select value={uploadYear} onValueChange={setUploadYear}>
                      <SelectTrigger className="h-10 border-slate-200">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map((y) => (
                          <SelectItem key={y} value={y}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Upload Box */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">Upload File</Label>

                    <label
                      htmlFor="holiday-file"
                      className="flex items-center justify-center h-10 border border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition text-sm text-slate-500"
                    >
                      📄 Choose file
                      <Input
                        ref={fileInputRef}
                        id="holiday-file"
                        type="file"
                        accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                        onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                </div>

                {/* File Preview */}
                {uploadFile && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      📎
                      <span className="font-medium text-slate-800">{uploadFile.name}</span>
                      <span className="text-xs text-slate-500">
                        ({(uploadFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setUploadFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''; // 🔥 THIS IS THE FIX
                        }
                      }}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <DialogFooter className="px-6 py-4 border-t flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  Cancel
                </Button>

                <Button
                  type="button"
                  className="gap-2 bg-[var(--brand)] hover:bg-[var(--brand)]/90 disabled:opacity-50"
                  onClick={() => void handleUpload()}
                  disabled={uploading || !uploadFile || !uploadYear}
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Uploading…' : 'Upload'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ── Add Holiday Dialog ── */}
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-[var(--brand)]">Add Holiday Manually</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">Date</Label>
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 w-full justify-start gap-2 border-slate-200 bg-white font-normal text-left"
                        >
                            <CalendarIcon className="h-4 w-4 text-slate-400" />
                            {newDate
                            ? new Date(newDate + 'T00:00:00').toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric',
                                })
                            : <span className="text-slate-400">Pick a date</span>
                            }
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <CustomDatePicker
                            value={newDate}
                            onChange={(v:any) => setNewDate(v)}
                            onSave={() => setDatePickerOpen(false)}
                            onCancel={() => setDatePickerOpen(false)}
                            allowPastDates={true}
                        />
                        </PopoverContent>
                    </Popover>
                    </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Day</Label>
                  <Select value={newDay} onValueChange={setNewDay}>
                    <SelectTrigger className="h-10 border-slate-200 bg-white">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-occasion" className="text-xs font-medium text-slate-600">
                    Occasion
                  </Label>
                  <Input
                    id="new-occasion"
                    value={newOccasion}
                    onChange={(e) => setNewOccasion(e.target.value)}
                    placeholder="e.g. PONGAL"
                    className="h-10 border-slate-200 bg-white"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-[var(--brand)] hover:bg-[var(--brand)]/90"
                  onClick={() => void handleCreate()}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Add Holiday'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ── Filters ── */}
          <Card className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center justify-between">
                {/* Left: Title */}
                <CardTitle className="text-base font-semibold text-[var(--brand)]">
                  Filters
                </CardTitle>

                {/* Right: Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    className="h-9 gap-2 bg-[var(--brand)] px-5 hover:bg-[var(--brand)]/90"
                    onClick={() => setUploadDialogOpen(true)}
                  >
                    <Upload className="h-4 w-4" />
                    Bulk Upload
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 gap-2 border-[var(--brand)] px-5 text-[var(--brand)] hover:bg-[var(--brand)]/10"
                    onClick={() => setAddDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add Holiday
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-4 p-5">
              <div className="min-w-[140px] space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Year</Label>
                <Select
                  value={filterYear}
                  onValueChange={(v) => setFilterYear(v === 'all' ? '' : v)}
                >
                  <SelectTrigger className="h-10 border-slate-200 bg-white">
                    <SelectValue placeholder="All years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All years</SelectItem>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[160px] space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Month</Label>
                <Select
                  value={filterMonth || 'all'}
                  onValueChange={(v) => setFilterMonth(v === 'all' ? '' : v)}
                >
                  <SelectTrigger className="h-10 border-slate-200 bg-white">
                    <SelectValue placeholder="All months" />
                  </SelectTrigger>
                  <SelectContent className="h-40">
                    <SelectItem value="all">All months</SelectItem>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[220px] flex-1 space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Search</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by occasion, date, day…"
                    className="h-10 border-slate-200 bg-white pl-9"
                  />
                </div>
              </div>

              {filterYear && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setDeleteYearTarget(Number(filterYear))}
                >
                  <Trash className="h-4 w-4" />
                  Delete all {filterYear} holidays
                </Button>
              )}
            </CardContent>
          </Card>

          {/* ── Table ── */}
          <Card className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 px-5 py-4">
              <CardTitle className="text-base font-semibold text-[var(--brand)]">
                Holidays
                {holidays.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    ({filteredHolidays.length} of {holidays.length})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 bg-slate-50/90 hover:bg-slate-50/90">
                      <TableHead className="w-12 px-5 font-semibold text-[var(--brand)]">
                        S.No
                      </TableHead>
                      <TableHead className="font-semibold text-[var(--brand)]">Date</TableHead>
                      <TableHead className="font-semibold text-[var(--brand)]">Day</TableHead>
                      <TableHead className="font-semibold text-[var(--brand)]">Occasion</TableHead>
                      <TableHead className="w-[220px] text-right font-semibold text-[var(--brand)]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-12 text-center text-sm text-slate-500">
                          <span className="inline-flex items-center gap-2">
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[var(--brand)]" />
                            Loading holidays…
                          </span>
                        </TableCell>
                      </TableRow>
                    ) : filteredHolidays.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-12 text-center text-sm text-slate-500">
                          {holidays.length === 0
                            ? 'No holidays found. Upload a document or add one manually.'
                            : `No holidays match "${search.trim()}".`}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHolidays.map((h: any, idx: number) => (
                        <TableRow key={h.id} className="border-slate-100 hover:bg-slate-50/50">
                          <TableCell className="px-5 text-slate-500">{idx + 1}</TableCell>

                          <TableCell>
                            {editId === h.id ? (
                              <Input
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="w-40 border-slate-200"
                              />
                            ) : (
                              <span className="font-medium text-slate-800">
                                {new Date(h.date).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            )}
                          </TableCell>

                          <TableCell>
                            {editId === h.id ? (
                              <Select value={editDay} onValueChange={setEditDay}>
                                <SelectTrigger className="w-28 border-slate-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {DAYS.map((d) => (
                                    <SelectItem key={d} value={d}>
                                      {d}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-slate-600">{h.day}</span>
                            )}
                          </TableCell>

                          <TableCell>
                            {editId === h.id ? (
                              <Input
                                value={editOccasion}
                                onChange={(e) => setEditOccasion(e.target.value)}
                                className="max-w-xs border-slate-200"
                              />
                            ) : (
                              <span className="font-medium text-slate-900">{h.occasion}</span>
                            )}
                          </TableCell>

                          <TableCell className="text-right">
                            {editId === h.id ? (
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
                                  className="h-9 gap-1.5 px-2.5 font-medium text-[var(--brand)] hover:bg-[var(--brand)]/10"
                                  onClick={() => startEdit(h)}
                                >
                                  <Pencil className="h-4 w-4 shrink-0" />
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 gap-1.5 px-2.5 font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => setDeleteTarget(h)}
                                >
                                  <Trash2 className="h-4 w-4 shrink-0" />
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
        </div>
      </div>

      {/* ── Snackbar ── */}
      <CustomizedSnackbars
        open={snackbarState.open}
        handleClose={handleSnackbarClose}
        message={snackbarState.message}
        severity={snackbarState.severity}
      />

      {/* ── Confirm delete single ── */}
      <ConfirmationDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete holiday?"
        description={
          deleteTarget ? `Remove "${deleteTarget.occasion}" on ${deleteTarget.date}?` : ''
        }
        variant="destructive"
        confirmText="Delete"
        onConfirm={() => void confirmDelete()}
      />

      {/* ── Confirm delete by year ── */}
      <ConfirmationDialog
        open={!!deleteYearTarget}
        onClose={() => setDeleteYearTarget(null)}
        title={`Delete all ${deleteYearTarget} holidays?`}
        description={`This will permanently remove every holiday for ${deleteYearTarget}. This action cannot be undone.`}
        variant="destructive"
        confirmText="Delete All"
        onConfirm={() => void confirmDeleteYear()}
      />
    </div>
  );
}
