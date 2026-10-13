import React from 'react';
import InputField from '../form/InputField';
import SkillInput from '../form/SkillInput';
import SelectField from '../form/SelectField';
import ResumePreview from '../resume-parser/ResumePreview';
import {
  RequirementFormData,
  RequirementFormErrors,
} from './requirementForm.types';
import DateField from '../form/DateField';
import ResizableSplitPane from '../ui/ResizableSplitPane';

const labelClass = 'text-[11px] font-semibold text-gray-500 uppercase tracking-wider';

interface Props {
  form:               RequirementFormData;
  errors:             RequirementFormErrors;
  submitting:         boolean;
  file:               File | null;
  pdfUrl:             string;
  clientOptions:      { value: string; label: string }[];
  selectedClientName: string;
  selectedLocations:  string[];
  statusOptions:      { id: number; statusName: string }[];
  onChange:           (key: keyof RequirementFormData, val: string | string[]) => void;
  onFileChange:       (f: File | null) => void;
  onSubmit:           () => void;
  onBack:             () => void;
  onClear:            () => void;
  registerField:      (key: string) => (el: HTMLElement | null) => void; // 👈 add
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  jrfSkipped:         boolean;
}

// ── Fields before Status ──────────────────────────────────────────────
const FIELDS_BEFORE_STATUS: {
  id:          keyof RequirementFormData;
  label:       string;
  required:    boolean;
  placeholder: string;
  type?:       string;
}[] = [
  { id: 'position', label: 'Position', required: true, placeholder: 'e.g. Software Developer' },
];

// ── Fields after Status ───────────────────────────────────────────────
const FIELDS_AFTER_STATUS: {
  id:          keyof RequirementFormData;
  label:       string;
  required:    boolean;
  placeholder: string;
  type?:       string;
}[] = [
  { id: 'noOfPositions',    label: 'No. of Positions', required: true, placeholder: 'e.g. 2' },
  { id: 'experience',       label: 'Experience (years)', required: true, placeholder: 'e.g. 3' },
  { id: 'startDate',        label: 'Start Date',         required: false, placeholder: '', type: 'date' },
  { id: 'endDate',          label: 'End Date',           required: false, placeholder: '', type: 'date' },
  { id: 'salaryBudget',     label: 'Salary Budget', required: false, placeholder: 'e.g. 8-12 LPA' },
  { id: 'accountManager',   label: 'Account Manager',    required: false, placeholder: 'e.g. Account Manager Name ' },
  { id: 'approvedBy',       label: 'Approved By',        required: false, placeholder: 'e.g. Approver Name' },
  { id: 'reportingManager', label: 'Reporting Manager in Tringapps',  required: false, placeholder: 'e.g. Reporting Manager Name' },
];

// ── Select fields ─────────────────────────────────────────────────────
const SELECT_FIELDS: {
  id:          keyof RequirementFormData;
  label:       string;
  placeholder: string;
  options:     { value: string; label: string }[];
}[] = [
  {
    id:          'roleType',
    label:       'Role Type',
    placeholder: 'Select role type…',
    options: [
      { value: 'Full Time',   label: 'Full Time' },
      { value: 'Freelancing', label: 'Freelancing' },
      { value: 'Contract',    label: 'Contract' },
      { value: 'Part Time',   label: 'Part Time' },
    ],
  },
  {
    id:          'modeOfWork',
    label:       'Mode of Work',
    placeholder: 'Select mode of work…',
    options: [
      { value: 'WFH',    label: 'WFH' },
      { value: 'WFO',    label: 'WFO' },
      { value: 'HYBRID', label: 'Hybrid' },
      { value: 'REMOTE', label: 'Remote' },
    ],
  },
  {
    id:          'modeOfInterview',
    label:       'Mode of Interview',
    placeholder: 'Select mode of interview…',
    options: [
      { value: 'Virtual',      label: 'Virtual' },
      { value: 'In Person',    label: 'In Person' },
      { value: 'Telephonic',   label: 'Telephonic' },
      { value: 'Face to Face', label: 'Face to Face' },
    ],
  },
  {
    id: 'priority',
    label: 'Todays Priority',
    placeholder: 'Select priority…',
    options: [
      { value:'Yes', label: 'Yes' },
      { value:'No',  label: 'No' },
    ],
  },
  {
    id: 'positionType',
    label: 'Position Type',
    placeholder: 'Select position type…',
    options: [
      { value: 'New', label: 'New' },
      { value: 'Replacement', label: 'Replacement' },
    ],
  },
];

// ── Reusable renderer ─────────────────────────────────────────────────
const renderInputField = (
  field: (typeof FIELDS_AFTER_STATUS)[0],
  form: RequirementFormData,
  errors: RequirementFormErrors,
  onChange: Props['onChange'],
) =>{
  if (field.type === 'date') {
    return (
      <div key={field.id} style={{ position: 'relative' }}>
        <DateField
          id={field.id}
          label={field.label}
          value={(form[field.id] as string) ?? ''}
          error={errors[field.id as keyof RequirementFormErrors]}
          onChange={(val) => onChange(field.id, val)}
        />
      </div>
    );
} 
 return (
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
    error={errors[field.id as keyof RequirementFormErrors]}
    onChange={(val) => onChange(field.id, val)}
  />
);
};

const RequirementForm: React.FC<Props> = ({
  form, errors, submitting,
  file, pdfUrl,
  selectedClientName, selectedLocations, statusOptions,
  onChange, onFileChange, onSubmit, onBack, onClear,
  registerField,      
  jrfSkipped,
  scrollContainerRef,
}) => {
  return (
    <main className="flex-1 min-h-0 overflow-hidden p-5 pt-1">
      <ResizableSplitPane
        className="h-full"
        defaultRatio={0.45}
        minLeftPx={320}
        minRightPx={320}
        left={
          <section className="flex flex-col gap-3 overflow-hidden h-full">

            {/* Client Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Client:</span>
                  <span className="font-medium text-gray-900">{selectedClientName || '-'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 mt-[2px]">Locations:</span>
                  {selectedLocations.length === 0 ? (
                    <span className="text-gray-400 text-xs">None</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {selectedLocations.map((loc, i) => (
                        <span
                          key={i}
                          className="px-2 py-[2px] bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-full"
                        >
                          {loc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto pr-1" ref={scrollContainerRef}>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mt-2">
                <div className="grid grid-cols-2 gap-3">

                  {/* Position */}
                  <div ref={registerField('position')}>
                  {FIELDS_BEFORE_STATUS.map((f) => renderInputField(f, form, errors, onChange))}
                  </div>

                  {/* Status — right after Position */}
                  <div ref={registerField('status')}>
                  <SelectField
                    id="status"
                    label={<span className="required">Source</span>}
                    placeholder="Select status…"
                    value={form.status ?? ''}
                    error={errors.status}
                    options={statusOptions.map((s) => ({
                      value: String(s.id),
                      label: s.statusName,
                    }))}
                    onChange={(val) => onChange('status', val)}
                  />
                  </div>

                  {/* Remaining input fields */}
                  {FIELDS_AFTER_STATUS.map((f) => {
                  const isMandatory = ['noOfPositions', 'experience'].includes(f.id);
                  return isMandatory ? (
                    <div key={f.id} ref={registerField(f.id)}>
                      {renderInputField(f, form, errors, onChange)}
                    </div>
                     ) : renderInputField(f, form, errors, onChange);
                    })}

                  {/* Select fields */}
                  {SELECT_FIELDS.map((field) => (
                    <SelectField
                      key={field.id}
                      id={field.id}
                      label={field.label}
                      placeholder={field.placeholder}
                      value={(form[field.id] as string) ?? ''}
                      error={errors[field.id as keyof RequirementFormErrors]}
                      options={field.options}
                      onChange={(val) => onChange(field.id, val)}
                    />
                  ))}

                  {/* Skills — full width */}
                  <div className="col-span-2" ref={registerField('skill')}>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider required">
        Skill Set
      </label>
                    <SkillInput
                      skills={form.skill}
                      error={errors.skill}
                      onAdd={(skill) => onChange('skill', [...form.skill, skill])}
                      onRemove={(skill) => onChange('skill', form.skill.filter((s) => s !== skill))}
                    />
                  </div>

                  {/* Remarks — full width */}
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className={labelClass}>Remarks (Optional)</label>
                    <textarea
                      value={form.remarks ?? ''}
                      onChange={(e) => onChange('remarks', e.target.value)}
                      placeholder="Add any notes or remarks about this requirement…"
                      rows={3}
                      className={`px-3 py-2 text-sm border rounded-lg bg-white resize-none
                        focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/20
                        placeholder:text-gray-400 text-gray-700
                        ${errors.remarks ? 'border-red-400' : 'border-gray-200'}`}
                    />
                    {errors.remarks && (
                      <span className="text-[11px] text-red-500">{errors.remarks}</span>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl
                  text-gray-600 text-sm font-medium hover:bg-gray-50 transition-all"
              >
                Back
              </button>
              <button
                onClick={onSubmit}
                disabled={submitting}
                className={`flex-1 py-2.5 text-white text-sm font-semibold rounded-xl
                  transition-all shadow-sm
                  ${submitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-[var(--brand)] hover:bg-[#1a4a7a]'}`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting…
                  </span>
                ) : 'Submit'}
              </button>
            </div>
          </section>
        }
        right={
            jrfSkipped ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-2">
              <span className="text-4xl">📄</span>
              <p>No JRF uploaded</p>
              <p className="text-xs text-gray-300">You have opted for manual input</p>
            </div>
          ) : (
          <ResumePreview
            file={file}
            previewUrl={pdfUrl}
            error=""
            parsed={false}
            processing={false}
            onFile={(f) => onFileChange(f)}
            onClear={onClear}
            infoDots={['Position & Skills', 'Experience', 'Client Info']}
          />
          )
        }
      />
    </main>
  );
};

export default RequirementForm;