import { useEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useDispatch, useAppSelector } from '../../store';
import { RootState } from '../../store/reducers';
import {
  fetchRequirementStatuses,
  parseJD,
  updateRequirement,
} from '../../store/action/requirement-details.action';
import { FetchAllClients } from '../../store/action/client.action';
import { fetchClientLocations } from '../../store/action/client-location.action';
import { RequirementDetails, UpdateRequirement } from '../../store/model/requirement-details.types';
import SkillInput from '../form/SkillInput';
import { requirementSkillsToArray } from '../../utils/requirement-skill-set';
import { useScrollToError } from '../../hooks/useScrollToError';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Clients } from '../../store/model/client.types';
import { fetchRequirementJrfFile } from '../../store/services/requirement';
import { cn } from '../../lib/utils';
import { PortalPicker } from '../ui/date-time-portal-picker';
import DocumentPreviewDialog from '../documents/DocumentPreviewDialog';

function toDateInputValue(value: string | Date | undefined | null): string {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return '';
}

function locationsListForProfile(
  rows: Clients[] | undefined,
  profileId: number | null | undefined,
): string[] {
  if (profileId == null) return [];
  const locs = (rows ?? [])
    .filter((row) => row.clientProfile?.id === profileId)
    .map((row) => (row.location ?? '').trim())
    .filter(Boolean);
  return [...new Set(locs)];
}

/** Job board / listing visibility: off for clearly closed-type statuses */
function jobBoardActiveFromStatusName(statusName: string | undefined): boolean {
  if (!statusName) return true;
  const n = statusName.toLowerCase();
  return !/\bclosed\b|inactive|cancelled/.test(n);
}

interface EditRequirementFormProps {
  isOpen: boolean;
  onClose: () => void;
  requirement: RequirementDetails;
  showSuccessSnackbar: (message: string) => void;
  showWarningSnackbar: (message: string) => void;
  showErrorSnackbar: (message: string) => void;
  refetchRequirements: () => void;
}

interface FormData {
  position: string;
  skills: string[];
  position_detail_id: string;
  client_id: string;
  experience: string;
  openDate: string;
  closeDate: string;
  remarks: string;
  status_id: string;
  salaryBudget: string;
  roleType: string;
  modeOfWork: string;
  modeOfInterview: string;
  accountManager: string;
  approvedBy: string;
  reportingManager: string;
  priority: string;
  positionType: string;
  positionName: string;
}

type RequirementStatusRow = { id: number; statusName: string };
// ADD this before the EditRequirementForm component
function CalIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}
      className="h-3.5 w-3.5 shrink-0 text-[var(--brand)]">
      <rect x="2" y="3" width="12" height="11" rx="2"/>
      <path d="M5 1v3M11 1v3M2 7h12"/>
    </svg>
  );
}

const EditRequirementForm = ({
  isOpen,
  onClose,
  requirement,
  showSuccessSnackbar,
  showErrorSnackbar,
  refetchRequirements,
}: EditRequirementFormProps) => {
  const dispatch = useDispatch();
  const initialSnapshotRef = useRef<string>('');
  const [pendingJrfS3Key, setPendingJrfS3Key] = useState<string | null>(
    requirement?.jrfS3Key ?? null,
  );
  const [jrfUploadPending, setJrfUploadPending] = useState(false);
  const [jrfViewerOpen, setJrfViewerOpen] = useState(false);
  const { scrollToError } = useScrollToError();

  const [selectedClient, setSelectedClient] = useState<string>('');
  const [, setSelectedPosition] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    position: '',
    skills: [],
    position_detail_id: '',
    client_id: '',
    experience: '',
    openDate: '',
    closeDate: '',
    remarks: '',
    status_id: '',
    salaryBudget: '',
    roleType: '',
    modeOfWork: '',
    modeOfInterview: '',
    accountManager: '',
    approvedBy: '',
    reportingManager: '',
    priority: '',
    positionType: '',
    positionName: '',
  });
  const [errors, setErrors] = useState({
    position: '',
    skills: '',
    position_detail_id: '',
    client_id: '',
    experience: '',
    openDate: '',
    closeDate: '',
    remarks: '',
    status_id: '',
  });
    // ── PortalPicker anchor state ─────────────────────────────────────────────
  const [openDateAnchorEl,  setOpenDateAnchorEl ] = useState<HTMLElement | null>(null);
  const [closeDateAnchorEl, setCloseDateAnchorEl] = useState<HTMLElement | null>(null);
  const { user } = useAppSelector((state: RootState) => state?.authSelector) || {};
  const { clientLocations } =
    useAppSelector((state: RootState) => state?.clientLocationSelector) || {};
  const { statuses: requirementStatuses } =
    useAppSelector((state: RootState) => state?.requirementsSelector) || { statuses: [] };

  const locationTags = useMemo(
    () =>
      locationsListForProfile(
        clientLocations as Clients[] | undefined,
        Number(selectedClient || formData.client_id) || null
      ),
    [clientLocations, selectedClient, formData.client_id]
  );
  useEffect(() => {
    if (requirement && requirementStatuses?.length && isOpen) {
      const statusId = requirement.status?.id ?? requirement.statusId ?? '';

      setFormData((prev) => ({
        ...prev,
        status_id: statusId ? String(statusId) : '',
      }));
    }
  }, [requirementStatuses, requirement, isOpen]);

  useEffect(() => {
    if (requirement && isOpen) {
      setPendingJrfS3Key(requirement.jrfS3Key ?? null);
      const statusId = requirement.status?.id ?? requirement.statusId ?? '';
      setFormData({
        position: String(requirement.noOfPosition ?? ''),
        skills: requirementSkillsToArray(requirement.skillSet),
        position_detail_id: requirement.positionDetails.id.toString(),
        client_id: requirement.client.id.toString(),
        experience: String(requirement.relExp ?? ''),
        openDate: toDateInputValue(requirement.openDate as string | Date | undefined),
        closeDate: toDateInputValue(requirement.closeDate as string | Date | undefined),
        remarks: requirement.remarks ?? '',
        status_id: statusId !== '' && statusId != null ? String(statusId) : '',
        salaryBudget: requirement.salaryBudget ?? '',
        roleType: requirement.roleType ?? '',
        modeOfWork: requirement.modeOfWork ?? '',
        modeOfInterview: requirement.modeOfInterview ?? '',
        accountManager: requirement.accountManager ?? '',
        approvedBy: requirement.approvedBy ?? '',
        reportingManager: requirement.reportingManager ?? '',
        priority: requirement.priority || '',
        positionType: requirement.positionType || '',
        positionName: String(requirement.positionDetails?.positionName ?? ''),
      });
      setSelectedClient(requirement.client.id.toString());
      setSelectedPosition(requirement.positionDetails.id.toString());

      // Capture a normalized baseline snapshot for "no-op" update detection.
      initialSnapshotRef.current = JSON.stringify({
        noOfPosition: Number(requirement.noOfPosition ?? ''),
        positionDetailId: Number(requirement.positionDetails?.id ?? ''),
        clientId: Number(requirement.client?.id ?? ''),
        relExp: String(requirement.relExp ?? ''),
        openDate: toDateInputValue(requirement.openDate as any),
        closeDate: toDateInputValue(requirement.closeDate as any),
        remarks: String(requirement.remarks ?? ''),
        statusId: Number(requirement.status?.id ?? requirement.statusId ?? ''),
        skills: requirementSkillsToArray(requirement.skillSet)
          .map((s) => String(s ?? '').trim())
          .filter(Boolean)
          .sort(),
      });
    }
  }, [requirement, isOpen]);
  // Close pickers when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setOpenDateAnchorEl(null);
      setCloseDateAnchorEl(null);
    }
  }, [isOpen]);
 

  useEffect(() => {
    if (isOpen) {
      dispatch(FetchAllClients());
      dispatch(fetchClientLocations());
      dispatch(fetchRequirementStatuses());
    }
  }, [dispatch, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSelectStatus = (value: string) => {
    setFormData((prev) => ({ ...prev, status_id: value }));
    setErrors((prev) => ({ ...prev, status_id: '' }));
  };
  const isSuperUser = user?.role?.id === 1;
  // Form validation
  const validateForm = () => {
    const newErrors = {
      position: '',
      skills: '',
      position_detail_id: '',
      client_id: '',
      experience: '',
      openDate: '',
      closeDate: '',
      remarks: '',
      status_id: '',
    };

    if (!formData.position) {
      newErrors.position = 'Number of positions is required';
    }
    if (!formData.skills?.length) {
      newErrors.skills = 'Please add at least one skill';
    }
    if (!formData.position_detail_id) {
      newErrors.position_detail_id = 'Position is required';
    }
     if (!formData.experience) {
      newErrors.experience = 'Experience is required';
    }
    if (!formData.client_id) {
      newErrors.client_id = 'Client is required';
    }
    if (!formData.status_id) {
      newErrors.status_id = 'Status is required';
    }
    if (!formData.experience) {
      newErrors.experience = 'Experience is required';
    } else if (/[a-zA-Z]/.test(formData.experience)) {
      newErrors.experience = 'Experience must not contain letters';  
    }
    setErrors(newErrors);
    scrollToError(newErrors);
    return newErrors;
  };

  const validateField = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (value !== '') {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();

    if (Object.values(validationErrors).some((error) => error !== '')) {
      return;
    }

    const selectedStatus = (requirementStatuses ?? []).find(
      (s: RequirementStatusRow) => String(s.id) === formData.status_id
    );

    const payload: UpdateRequirement = {
       noOfPosition: parseInt(formData.position, 10),
        ...(isSuperUser
          ? { position: formData.positionName }                               // super user → name
          : { positionDetails: { id: requirement.positionDetails.id } }      // others → id
        ),
      relExp: formData.experience,
      client: {
        id: parseInt(formData.client_id, 10),
      },
      skillSet: formData.skills,
      isActive: jobBoardActiveFromStatusName(selectedStatus?.statusName),
      updatedBy: {
        id: user?.id ?? 0,
      },
      statusId: parseInt(formData.status_id, 10),
      salaryBudget: formData.salaryBudget || undefined,
      roleType: formData.roleType || undefined,
      modeOfWork: formData.modeOfWork || undefined,
      modeOfInterview: formData.modeOfInterview || undefined,
      accountManager: formData.accountManager || undefined,
      approvedBy: formData.approvedBy || undefined,
      reportingManager: formData.reportingManager || undefined,
      priority: formData.priority || undefined,
      positionType: formData.positionType || undefined,
    };
    if (formData.openDate) payload.openDate = formData.openDate;
    if (formData.closeDate) payload.closeDate = formData.closeDate;
    if (formData.remarks !== undefined) payload.remarks = formData.remarks;
    if (pendingJrfS3Key?.trim()) payload.jrfS3Key = pendingJrfS3Key.trim();

    // Only call update API if something changed (ignore updatedBy/isActive derivation).
    const currentSnapshot = JSON.stringify({
      noOfPosition: Number(payload.noOfPosition ?? ''),
      positionDetailId: Number(payload.positionDetails?.id ?? ''),
      clientId: Number(payload.client?.id ?? ''),
      relExp: String(payload.relExp ?? ''),
      openDate: String(payload.openDate ?? ''),
      closeDate: String(payload.closeDate ?? ''),
      remarks: String(payload.remarks ?? ''),
      statusId: Number(payload.statusId ?? ''),
      salaryBudget: String(payload.salaryBudget ?? ''),
      roleType: String(payload.roleType ?? ''),
      modeOfWork: String(payload.modeOfWork ?? ''),
      modeOfInterview: String(payload.modeOfInterview ?? ''),
      accountManager: String(payload.accountManager ?? ''),
      approvedBy: String(payload.approvedBy ?? ''),
      reportingManager: String(payload.reportingManager ?? ''),
      skills: (payload.skillSet ?? [])
        .map((s) => String(s ?? '').trim())
        .filter(Boolean)
        .sort(),
    });
    if (initialSnapshotRef.current && currentSnapshot === initialSnapshotRef.current) {
      showSuccessSnackbar('No changes to update');
      onClose();
      return;
    }

    try {
      if (requirement.id === null || requirement.id === undefined) {
        showErrorSnackbar('Requirement ID is missing');
        return;
      }

      const response = await dispatch(
        updateRequirement({
          id: requirement.id as number,
          payload,
        })
      ).unwrap();

      if (response.statusCode === 200) {
        showSuccessSnackbar('Requirement updated successfully!');
        refetchRequirements();
        onClose();
      } else {
        showErrorSnackbar(response.message || 'Failed to update requirement');
      }
    } catch (error) {
      console.error('Error updating requirement:', error);
      showErrorSnackbar('An error occurred while updating the requirement');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent  className="dialog-standard flex flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 space-y-1 px-4 pb-2 pt-5 text-left sm:px-6 sm:pt-6">
          <DialogTitle className="text-xl font-bold sm:text-2xl">
            Edit Requirement
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 sm:px-6">
          <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-3 md:gap-x-6 md:gap-y-4">
            <p className="col-span-full text-[12px] font-extrabold uppercase tracking-wide text-[var(--brand)] pt-2">
              Client &amp; role
            </p>

            <div className="space-y-1">
              <Label htmlFor="client_id" className='required'>
                Client
              </Label>
              <Input
                value={requirement.client?.clientName ?? ''}
                disabled
                className="h-10 text-sm bg-slate-100 cursor-not-allowed"
              />
              {errors.client_id && <p className="text-xs text-red-600">{errors.client_id}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="position_detail_id" className='required'>
                Position
              </Label>
              <Input
                value={formData.positionName}
                disabled={!isSuperUser}
                readOnly={!isSuperUser}
                onChange={isSuperUser ? (e) =>
                  setFormData((prev) => ({ ...prev, positionName: e.target.value }))
                : undefined}
                className={`h-10 text-sm ${
                  !isSuperUser
                    ? 'bg-slate-50 opacity-70 cursor-not-allowed border-slate-200'
                    : 'border-slate-200'
                }`}
              />
              {errors.position_detail_id && (
                <p className="text-xs text-red-600">{errors.position_detail_id}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="position" className='required'>
                Number of positions
              </Label>
              <Input
                id="position"
                name="position"
                type="number"
                min={1}
                value={formData.position}
                placeholder="e.g. 1"
                onChange={(e) => {
                  handleChange(e);
                  validateField(e);
                }}
                className={`h-10 text-sm ${errors.position ? 'border-red-500' : 'border-slate-200'}`}
              />
              {errors.position && <p className="text-xs text-red-600">{errors.position}</p>}
            </div>

            <div className="space-y-1.5 md:col-span-full">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <Label className='required'>Office locations</Label>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50/60 px-2.5 py-2">
                {locationTags.length === 0 ? (
                  <p className="text-xs text-slate-500">None for this client.</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {locationTags.map((loc) => (
                      <Badge
                        key={loc}
                        variant="secondary"
                        className="border-slate-200 bg-white px-1.5 py-0 text-[11px] font-normal text-slate-800"
                      >
                        {loc}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <p className="text-[12px] font-extrabold uppercase tracking-wide text-[var(--brand)] md:col-span-full pt-1">
              Requirement details
            </p>

            <div className="space-y-1">
              <Label htmlFor="experience" className='required'>
                Experience (years)
              </Label>
              <Input
                id="experience"
                name="experience"
                type="text"
                min={0}
                step={0.5}
                value={formData.experience}
                placeholder="e.g. 3 or 8+"
                onChange={(e) => {
                  handleChange(e);
                  validateField(e);
                }}
                className={`h-10 text-sm ${errors.experience ? 'border-red-500' : 'border-slate-200'}`}
              />
              {errors.experience && <p className="text-xs text-red-600">{errors.experience}</p>}
            </div>

                          {/* ── Open date ── */}
              <div className="space-y-1">
                <Label>Open date</Label>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setCloseDateAnchorEl(null); setOpenDateAnchorEl(openDateAnchorEl ? null : e.currentTarget); }}
                  className={cn(
                    'flex items-center w-full h-10 px-3 rounded-md border bg-white text-sm text-left transition-all',
                    errors.openDate ? 'border-red-500' : openDateAnchorEl ? 'border-[var(--brand)] ring-2 ring-[var(--brand)]/20' : 'border-slate-200 hover:border-[var(--brand)] hover:bg-slate-50'
                  )}
                  style={{ justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CalIcon />
                    <span className={formData.openDate ? 'text-slate-700' : 'text-slate-400'}>
                      {formData.openDate ? format(parseISO(formData.openDate), 'dd MMM yyyy') : 'Pick date'}
                    </span>
                  </div>
                  {formData.openDate && (
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); setFormData((prev) => ({ ...prev, openDate: '' })); setOpenDateAnchorEl(null); }}
                      style={{ display: 'flex', alignItems: 'center', color: '#9ca3af', lineHeight: 1 }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#9ca3af')}
                    >
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 11, height: 11 }}>
                        <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                      </svg>
                    </span>
                  )}
                </button>
                {errors.openDate && <p className="text-xs text-red-600">{errors.openDate}</p>}
              </div>
 
              {/* ── Close date ── */}
              <div className="space-y-1">
                <Label>Close date</Label>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpenDateAnchorEl(null); setCloseDateAnchorEl(closeDateAnchorEl ? null : e.currentTarget); }}
                className={cn(
                  'flex items-center w-full h-10 px-3 rounded-md border bg-white text-sm text-left transition-all',
                  errors.closeDate ? 'border-red-500' : closeDateAnchorEl ? 'border-[var(--brand)] ring-2 ring-[var(--brand)]/20' : 'border-slate-200 hover:border-[var(--brand)] hover:bg-slate-50'
                )}
                style={{ justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CalIcon />
                  <span className={formData.closeDate ? 'text-slate-700' : 'text-slate-400'}>
                    {formData.closeDate ? format(parseISO(formData.closeDate), 'dd MMM yyyy') : 'Pick date'}
                  </span>
                </div>
                {formData.closeDate && (
                  <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); setFormData((prev) => ({ ...prev, closeDate: '' })); setCloseDateAnchorEl(null); }}
                    style={{ display: 'flex', alignItems: 'center', color: '#9ca3af', lineHeight: 1 }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#9ca3af')}
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 11, height: 11 }}>
                      <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                    </svg>
                  </span>
                )}
              </button>
                {errors.closeDate && <p className="text-xs text-red-600">{errors.closeDate}</p>}
              </div>
 
            <div className="space-y-1">
              <Label >Salary Budget</Label>
              <Input
                name="salaryBudget"
                value={formData.salaryBudget}
                onChange={handleChange}
                className="h-10 text-sm"
                placeholder="e.g. 10-15 LPA"
              />
            </div>

            {/* Account Manager */}
            <div className="space-y-1">
              <Label >Account Manager</Label>
              <Input
                name="accountManager"
                value={formData.accountManager}
                onChange={handleChange}
                className="h-10 text-sm"
              />
            </div>

            {/* Approved By */}
            <div className="space-y-1">
              <Label >Approved By</Label>
              <Input
                name="approvedBy"
                value={formData.approvedBy}
                onChange={handleChange}
                className="h-10 text-sm"
              />
            </div>

            {/* Reporting Manager */}
            <div className="space-y-1">
              <Label>Reporting Manager in Tringapps</Label>
              <Input
                name="reportingManager"
                value={formData.reportingManager}
                onChange={handleChange}
                className="h-10 text-sm"
              />
            </div>

            {/* Role Type */}
            <div className="space-y-1">
              <Label>Role Type</Label>
              <Select
                value={formData.roleType}
                onValueChange={(val) =>
                  setFormData((p) => ({ ...p, roleType: val }))
                }
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Select role type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full Time">Full Time</SelectItem>
                  <SelectItem value="Freelancing">Freelancing</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Part Time">Part Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mode of Work */}
            <div className="space-y-1">
              <Label>Mode of Work</Label>
              <Select
                value={formData.modeOfWork}
                onValueChange={(val) =>
                  setFormData((p) => ({ ...p, modeOfWork: val }))
                }
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Select mode of work" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WFH">WFH</SelectItem>
                  <SelectItem value="WFO">WFO</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                  <SelectItem value="Remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mode of Interview */}
            <div className="space-y-1">
              <Label>Mode of Interview</Label>
              <Select
                value={formData.modeOfInterview}
                onValueChange={(val) =>
                  setFormData((p) => ({ ...p, modeOfInterview: val }))
                }
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Select interview mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Virtual">Virtual</SelectItem>
                  <SelectItem value="In Person">In Person</SelectItem>
                  <SelectItem value="Telephonic">Telephonic</SelectItem>
                  <SelectItem value="Face to Face">Face to Face</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(val) => setFormData((p) => ({ ...p, priority: val }))}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="First">First</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Position Type */}
            <div className="space-y-1">
              <Label>Position Type</Label>
              <Select
                value={formData.positionType}
                onValueChange={(val) => setFormData((p) => ({ ...p, positionType: val }))}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Select position type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Replacement">Replacement</SelectItem>
                </SelectContent>
              </Select>
            </div>
           

            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 md:col-span-full pt-1">
              Status
            </p>

            <div className="space-y-1 md:col-span-full md:grid md:grid-cols-3 md:gap-x-4 md:items-start">
              <div className="space-y-1 md:col-span-1">
                <Label>
                  Requirement status
                </Label>
                <Select value={formData.status_id} onValueChange={handleSelectStatus}>
                  <SelectTrigger
                    id="status_id"
                    className={`h-9 w-full text-sm ${errors.status_id ? 'border-red-500' : 'border-slate-200'}`}
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {(requirementStatuses ?? []).map((s: RequirementStatusRow) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.statusName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.status_id && <p className="text-xs text-red-600">{errors.status_id}</p>}
              </div>
            </div>

            <p className="text-[12px] font-extrabold uppercase tracking-wide text-[var(--brand)] md:col-span-full pt-1">
              Skills &amp; notes
            </p>

            <div className="space-y-1 md:col-span-full">
               <div className="space-y-1 md:col-span-full">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider required">
        Skill Set
      </label>
              <SkillInput
                skills={formData.skills}
                error={errors.skills}
                onAdd={(skill) => {
                  setFormData((prev) => ({
                    ...prev,
                    skills: prev.skills.includes(skill) ? prev.skills : [...prev.skills, skill],
                  }));
                  setErrors((prev) => ({ ...prev, skills: '' }));
                }}
                onRemove={(skill) => {
                  setFormData((prev) => ({
                    ...prev,
                    skills: prev.skills.filter((s) => s !== skill),
                  }));
                }}
              />
            </div>
            {/* Remarks */}
            <div className="space-y-1 md:col-span-full">
              <Label>Remarks</Label>
              <Textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                placeholder="Optional"
                rows={2}
                onChange={(e) => {
                  handleChange(e);
                  validateField(e);
                }}
                className="min-h-[52px] resize-y border-slate-200 text-sm"
              />
            </div>
            </div>
          </div> {/* closes grid grid-cols-1 */}
          </div> {/* closes overflow-y-auto */}
          <DialogFooter className="shrink-0 gap-2 border-t bg-background px-4 py-3 sm:px-6 sm:py-4">
            <input
              id="requirement-jrf-replace"
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.currentTarget.value = '';
                if (!file) return;
                setJrfUploadPending(true);
                try {
                  const res = await dispatch(parseJD(file)).unwrap();
                  const nextKey =
                    typeof res?.jrfS3Key === 'string' ? res.jrfS3Key.trim() : '';
                  if (nextKey) {
                    setPendingJrfS3Key(nextKey);
                    showSuccessSnackbar('JRF uploaded. Save the requirement to apply it.');
                  } else {
                    showErrorSnackbar('JRF upload completed but no S3 key was returned');
                  }
                } catch {
                  showErrorSnackbar('Failed to upload replacement JRF');
                } finally {
                  setJrfUploadPending(false);
                }
              }}
            />
            {requirement.jrfS3Key ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mr-auto"
                onClick={() => setJrfViewerOpen(true)}
              >
                View JRF
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={jrfUploadPending}
              onClick={() => document.getElementById('requirement-jrf-replace')?.click()}
            >
              {jrfUploadPending ? 'Uploading JRF…' : 'Replace JRF'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="w-full sm:w-auto bg-[var(--brand)] text-white hover:bg-[var(--brand)]"
            >
              Update
            </Button>
          </DialogFooter>

        </form>  {/* ← form closes here */}

        {/* ── Pickers INSIDE DialogContent ── */}
        {openDateAnchorEl && (
          <PortalPicker
            type="date"
            value={formData.openDate}
            anchorEl={openDateAnchorEl}
            onChange={(val) => {
              setFormData((prev) => ({ ...prev, openDate: val }));
              setErrors((prev) => ({ ...prev, openDate: '' }));
            }}
            allowPastDates={true}
            onSave={() => setOpenDateAnchorEl(null)}
            onCancel={() => setOpenDateAnchorEl(null)}
          />
        )}

        {closeDateAnchorEl && (
          <PortalPicker
            type="date"
            value={formData.closeDate}
            anchorEl={closeDateAnchorEl}
            onChange={(val) => {
              setFormData((prev) => ({ ...prev, closeDate: val }));
              setErrors((prev) => ({ ...prev, closeDate: '' }));
            }}
            allowPastDates={true}
            onSave={() => setCloseDateAnchorEl(null)}
            onCancel={() => setCloseDateAnchorEl(null)}
          />
        )}
        <DocumentPreviewDialog
          open={jrfViewerOpen}
          onOpenChange={setJrfViewerOpen}
          title={`JRF Preview` +(requirement.positionDetails?.positionName ? ` · ` + requirement.positionDetails.positionName : '')}
          fileKey={pendingJrfS3Key ?? requirement.jrfS3Key ?? null}
          fetchDocument={() => {
            const rid = requirement.id != null ? Number(requirement.id) : NaN;
            if (!Number.isFinite(rid)) {
              throw new Error('Requirement ID is missing');
            }
            return fetchRequirementJrfFile(rid);
          }}
          showError={showErrorSnackbar}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditRequirementForm;