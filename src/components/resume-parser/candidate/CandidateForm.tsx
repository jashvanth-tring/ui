import React, { useMemo, useRef } from 'react';
import { useInterviewSchedule } from '../../../hooks/useInterviewSchedule';
import { useScrollToError } from '../../../hooks/useScrollToError';
import { RequirementLoop } from '../../../store/model/requirement-details.types';
import { blockNonAlpha, blockNumbers, toPascalCase } from '../../../utils/name-format';
import { formatRequirementSelectLabel, requirementClientDisplayName } from '../../../utils/requirement-label';
import InputField from '../../form/InputField';
import PhoneField from '../../form/PhoneField';
import SearchableSelect from '../../form/SearchableSelect';
import SkillInput from '../../form/SkillInput';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import type { ParsedResume } from '../types';
import type { CandidateFormErrors } from './CandidateFormContainer';
import { InterviewScheduleDialog } from './InterviewScheduleDialog';
import { RejectReasonDialog } from './RejectReasonDialog';
import DateField from '../../form/DateField';
import { ProfileAvatar } from '../../../utils/UserAvatar';
 
interface Props {
  form: ParsedResume;
  parsed: boolean;
  errors: CandidateFormErrors;
  submitting: boolean;
  requirements: RequirementLoop[];
  statuses: { id: number; statusName: string }[];
  existingMappingStatusByReqId: Record<string, string>;
  scheduledByReqId: Record<string, string>;
  onScheduledByReqIdChange: (scheduledByReqId: Record<string, string>) => void;
  onExistingMappingStatusChange: (requirementIdKey: string, statusId: string) => void;
  onChange: (key: keyof ParsedResume, val: string) => void;
  onSubmit: (scrollToError: (errors: Record<string, any>) => void) => void;
  onClear: () => void;
}

const CandidateForm: React.FC<Props> = ({
  form,
  parsed,
  errors,
  submitting,
  requirements,
  statuses,
  existingMappingStatusByReqId,
  scheduledByReqId,
  onScheduledByReqIdChange,
  onExistingMappingStatusChange,
  onChange,
  onSubmit,
  onClear,
}) => {
  const { registerField, scrollToError } = useScrollToError();

  const pendingMappingRef = useRef<{
    reqKey: string;
    statusId: string;
  } | null>(null);


  const { handleStatusChange, interviewDialogProps, rejectDialogProps } = useInterviewSchedule({
    statuses,
    onNewStatusChange: (statusId) => onChange('candidateStatusId', statusId),
    onExistingStatusChange: (key, statusId) => onExistingMappingStatusChange(key, statusId),
    onConfirmRaw: (iso: string) => {
      const pending = pendingMappingRef.current;
      if (!pending) return;

      const { reqKey, statusId } = pending;
      pendingMappingRef.current = null;

      onScheduledByReqIdChange({
        ...scheduledByReqId,
        [reqKey]: iso,
      });

      if (reqKey === '__new__') {
        onChange('candidateStatusId', statusId);
        onChange('scheduledInterviewAt' as keyof ParsedResume, iso);
      } else {
        onExistingMappingStatusChange(reqKey, statusId);
      }
    },
    onConfirmReject: (reason: string) => {
      const pending = pendingMappingRef.current;
      if (!pending) return;

      const { reqKey, statusId } = pending;
      pendingMappingRef.current = null;
      if (reqKey === '__new__') {
        onChange('candidateStatusId', statusId);
        onChange('rejectReason' as keyof ParsedResume, reason); // if field exists
      } else {
        onExistingMappingStatusChange(reqKey, statusId);
      }
    },
  });
 // ── Select option arrays (used by SearchableSelect) ──────────────────────
  const mappedRequirementIds = useMemo(
    () =>
      new Set(
        (form.existingMappings ?? [])
          .map((m: any) => Number(m?.requirementDetails?.id ?? m?.requirementId))
          .filter((id: number) => Number.isFinite(id) && id > 0),
      ),
    [form.existingMappings],
  );
  const FormLabel = ({ children, required }: any) => (
  <span className={required ? "required" : ""}>{children}</span>
);

  const requirementOptions = requirements
    .filter((r) => r.isActive && !mappedRequirementIds.has(Number(r.id)))
    .map((r) => ({
      value: String(r.id),
      label: formatRequirementSelectLabel(r),
    }));
    const [salaryMismatch, setSalaryMismatch] = React.useState(false);
    const handleSalaryBlur = () => {
      const current  = (form.currentSalary  as string) ?? '';
      const expected = (form.expectedSalary as string) ?? '';
      const cur = parseFloat(current);
      const exp = parseFloat(expected);
      if (!isNaN(cur) && !isNaN(exp) && exp < cur) {
        setSalaryMismatch(true);
      }
    };
const statusOptions = statuses.map((s) => ({
  value: String(s.id),
  label: s.statusName,
}));
  // ── Input fields config ───────────────────────────────────────────────
  const inputFields: {
    id: keyof ParsedResume;
    label: string;
    type?: string;
    required?: boolean;
    placeholder?: string;
    autofilled?: boolean;
  }[] = [
    {
      id: 'candidateName',
      label: 'Candidate Name',
      required: true,
      placeholder: 'e.g. John Smith',
      autofilled: true,
    },
    {
      id: 'email',
      label: 'Email Address',
      required: true,
      placeholder: 'e.g. john@email.com',
      type: 'email',
      autofilled: true,
    },
    {
      id: 'location',
      label: 'Current Location',
      required: false,
      placeholder: 'e.g. Chennai, Tamil Nadu',
      autofilled: true,
    },
    {
      id: 'totalExperience',
      label: 'Total Experience',
      required: false,
      placeholder: 'e.g. 3 years',
      autofilled: true,
    },
    {
      id: 'relevantExperience',
      label: 'Relevant Experience',
      required: false,
      placeholder: 'e.g. 1 year 6 months',
      autofilled: true,
    },
    { id: 'source', label: 'Source', required: true, placeholder: 'e.g. LinkedIn, Naukri' },
    { id: 'sourceDate', label: 'Source Date', required: true, type: 'date' },
    { id: 'date', label: 'Profile Shared Date',required:false, type: 'date' },
    { id: 'currentSalary', label: 'Current Salary (CTC)',required: true, placeholder: 'e.g. 30000' },
    { id: 'expectedSalary', label: 'Expected Salary (CTC)', required: false, placeholder: 'e.g. 50000' },
    { id: 'noticePeriod', label: 'Notice Period (days)', required: true, placeholder: 'e.g. 30' },
    // { id: "dateOfJoining",       label: "Date of Joining",       type: "date"                            },
  ];

  return (
    <>
    <section className="flex min-w-0 flex-col gap-4 overflow-y-auto pr-1 h-full">
      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
                  {/* Name + Email — first two input fields */}
        {inputFields.slice(0, 2).map((field) => (
          <div key={field.id} ref={registerField(field.id)}>
          <InputField
            key={field.id}
            id={field.id}
            label={
        <span className={field.required ? "required" : ""}>
    {field.label}
      </span>
    }
            type={field.type}
            placeholder={field.placeholder}
            value={(form[field.id] as string) ?? ''}
            error={errors[field.id as keyof CandidateFormErrors]}
            autofilled={field.autofilled && !!(form[field.id] as string) && parsed}
            onKeyDown={field.id === 'candidateName' ? blockNumbers : undefined}
            onChange={(val) =>
              field.id === 'candidateName'
                ? onChange(field.id, toPascalCase(val))
                : onChange(field.id, val)
            }
          />
          </div>
        ))}
          {/* Phone — special component */}
          <div ref={registerField('phone')} className="flex flex-col gap-1.5">
  <Label htmlFor="phone" className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 required">
    Phone Number
  </Label>
          <PhoneField
            value={form.phone}
            error={errors.phone}
            autofilled={parsed}
            onChange={(val) => onChange('phone', val)}
          />
          </div>
          {/* Location + Exp fields */}
          {inputFields.slice(2, 5).map((field) => (
            <InputField
              key={field.id}
              id={field.id}
              label={field.label}
              type={field.type}
              placeholder={field.placeholder}
              value={(form[field.id] as string) ?? ''}
              error={errors[field.id as keyof CandidateFormErrors]}
              autofilled={field.autofilled && !!(form[field.id] as string) && parsed}
              onKeyDown={field.id === 'location' ? blockNonAlpha : undefined}
              onChange={(val) =>
                field.id === 'location'
                  ? onChange(field.id, toPascalCase(val))
                  : onChange(field.id, val)
              }
            />
          ))}
          {/* Skill Set — full width after exp */}
          <div className="col-span-2">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
        Skill Set
      </label>
            <SkillInput
              skills={form.skillSet}
              error={errors.skillSet}
              onAdd={(skill) => onChange('skillSet', [...form.skillSet, skill].join(',,,'))}
              onRemove={(skill) =>
                onChange('skillSet', form.skillSet.filter((s) => s !== skill).join(',,,'))
              }
            />
          </div>
          {/* Remaining input fields — source, date, salary, notice */}
          {inputFields.slice(5).map((field) => {
          if (field.id === 'source') {
            return (
              <div key={field.id} ref={registerField('source')}>
              <SearchableSelect
              key={field.id}
              id="source"
              label={<FormLabel required>Source</FormLabel>}
              placeholder="Select or type source..."
              allowCustomValue
              useAccent={false}
              options={[
                { value: 'Naukri',   label: 'Naukri'   },
                { value: 'LinkedIn', label: 'LinkedIn'  },
                { value: 'Referral', label: 'Referral'  },
                { value: 'Walkin',   label: 'Walkin'    },
              ]}
              value={(form.source as string) ?? ''}
              error={errors.source}
              onChange={(val) => onChange('source', val)}
            />
            </div>
            );
          }

            //   this block for sourceDate and date fields
          if (field.type === 'date') {
            return (
              <div key={field.id} ref={registerField(field.id)} style={{ position: 'relative' }}>
                <DateField
                  id={field.id}
                  label={
                  <span className={field.required ? "required" : ""}>
          {field.label}
        </span>
                }
                  value={(form[field.id] as string) ?? ''}
                  error={errors[field.id as keyof CandidateFormErrors]}
                  onChange={(val) => onChange(field.id, val)}
                />
              </div>
            );
          }
            return (
              <div key={field.id} ref={registerField(field.id)}>
                <InputField
                  key={field.id}
                  id={field.id}
                  label={
                    <span className={field.required ? "required" : ""}>
                      {field.label}
                    </span>
                  }
                  type={field.type}
                  placeholder={field.placeholder}
                  value={(form[field.id] as string) ?? ''}
                  error={errors[field.id as keyof CandidateFormErrors]}
                  autofilled={field.autofilled && !!(form[field.id] as string) && parsed}
                  onChange={(val) => onChange(field.id, val)}
                  // ── only salary fields get onBlur check ──
                  onBlur={
                    field.id === 'currentSalary' || field.id === 'expectedSalary'
                      ? () => handleSalaryBlur()
                      : undefined
                  }
                />
              </div>
            );
        })}

          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="remarks-create" className="text-sm font-medium text-gray-700">
              Remarks
            </Label>
            <Textarea
              id="remarks-create"
              placeholder="Optional notes about the candidate"
              value={form.remarks ?? ''}
              onChange={(e) => onChange('remarks', e.target.value)}
              rows={3}
              className="resize-y min-h-[72px] border-gray-200"
            />
          </div>

          {/* Existing mappings — status editable (syncs on submit when updating existing candidate) */}
          {form.existingMappings && form.existingMappings.length > 0 && (
            <div className="col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Already Mapped Requirements
              </label>
              {/* Match Edit Candidate UI: outer overflow-visible + inner horizontal scroll */}
              <div className="overflow-visible rounded-lg border border-gray-200 bg-gray-50 p-3 [scrollbar-gutter:stable]">
                <div
                  className="flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-visible scroll-smooth"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  {form.existingMappings.map((mapping: any, idx: number) => {
                    const reqId = mapping?.requirementDetails?.id ?? mapping?.requirementId;
                    const reqKey = String(reqId);
                    const reqName =
                      mapping?.requirementDetails?.positionDetails?.positionName ||
                      mapping?.requirement?.positionDetails?.positionName ||
                      `Req #${mapping.requirementId}`;
                    const clientName = requirementClientDisplayName(
                      mapping?.requirementDetails?.client ?? mapping?.requirement?.client
                    );

                    const fallbackStatusId =
                      mapping?.status?.id != null ? String(mapping.status.id) : '';

                    return (
                      <div
                        key={reqKey || idx}
                        className="flex w-[min(16rem,calc(100vw-4rem))] shrink-0 snap-start flex-col gap-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm sm:w-64"
                      >
                        <div className="flex items-start justify-between mb-1">
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-gray-900 truncate">{reqName}</span>
                                <span className="text-gray-500 truncate">Client: {clientName}</span>
                              </div>
                              <ProfileAvatar
                                userId={mapping?.assignedTo?.id}
                                imageKey={mapping?.assignedTo?.imageURL}
                                name={`${mapping?.assignedTo?.firstName ?? ''} ${mapping?.assignedTo?.lastName ?? ''}`}
                                size="sm"
                              />
                            </div>
                        <div className="mt-1 min-w-0">
                          <SearchableSelect
                            id={`mapping-status-${reqKey}`}
                            label="Status"
                            placeholder="Select status"
                            useAccent={false}
                            options={statusOptions}
                            value={existingMappingStatusByReqId[reqKey] ?? fallbackStatusId}
                            onChange={(val) => {
                              if (!val) return;
                              pendingMappingRef.current = {
                                reqKey,
                                statusId: val,
                              };
                              handleStatusChange(reqKey, val, false);
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Select below to map to an additional requirement
              </p>
            </div>
          )}

          {/* Requirement + Status — searchable dropdowns */}
          <SearchableSelect
            id="requirementId"
            label="Requirement"
            placeholder="Search & select requirement"
            useAccent={false}
            options={requirementOptions}
            value={(form.requirementId as string) ?? ''}
            error={errors.requirementId}
            onChange={(val) => {
              if (!val) onChange('candidateStatusId', '');
              onChange('requirementId', val);
            }}
          />

          <SearchableSelect
            id="candidateStatusId"
            label="Candidate Status"
            placeholder={
              form.requirementId ? 'Search & select status' : 'Select a requirement first'
            }
            useAccent={false}
            options={statusOptions}
            value={(form.candidateStatusId as string) ?? ''}
            error={errors.candidateStatusId}
            disabled={!form.requirementId}
            onChange={(val) => {
              if (!val) return;
              pendingMappingRef.current = {
                reqKey: '__new__',
                statusId: val,
              };
              handleStatusChange('__new__', val, true);
            }}
          />

          {salaryMismatch && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-xl shadow-xl p-6 w-[90%] max-w-sm flex flex-col gap-4">
                <p className="text-sm text-gray-600">
                  The <span className="font-medium text-gray-800">Expected CTC</span> is less than the{' '}
                  <span className="font-medium text-gray-800">Current CTC</span>. Do you want to proceed
                  with this?
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      // Cancel — clear the expected salary field
                      onChange('expectedSalary', '');
                      setSalaryMismatch(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300
                      rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setSalaryMismatch(false)} // OK — keep the value as-is
                    className="px-4 py-2 text-sm font-medium text-white bg-[var(--brand)]
                      rounded-lg hover:opacity-90 transition-all"
                  >
                    Yes, Proceed
                  </button>
                </div>
              </div>
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <DateField
              id="dateOfJoining"
              label="Date of Joining"
              value={form.dateOfJoining ?? ''}
              error={errors.dateOfJoining}
              onChange={(val) => onChange('dateOfJoining', val)}
            />
        </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1 flex-shrink-0">
        <button
          onClick={onClear}
          className="flex-1 py-2.5 bg-white border border-gray-300 hover:border-gray-400
            hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-xl transition-all"
        >
          Clear All
        </button>
        <button
          onClick={() => onSubmit(scrollToError)}
          disabled={submitting}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-white
            text-sm font-semibold rounded-xl transition-all shadow-sm
            ${submitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-[var(--brand)] hover:bg-[var(--brand)]'}`}
        >
          {submitting && (
            <div className="w-4 h-4 border-2 border-white rounded-full animate-spin" />
          )}
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
      </div>
    </section>

   <InterviewScheduleDialog {...interviewDialogProps} />
   <RejectReasonDialog {...rejectDialogProps} />
   </>
  );
};

export default CandidateForm;
