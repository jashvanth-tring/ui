import React from "react";
import InputField from "../form/InputField";
import SelectField from "../form/SelectField";
import SkillInput from "../form/SkillInput";
import ResumePreview from "../resume-parser/ResumePreview";
import PositionAutocomplete from "../client/PositionAutocomplete";
import ResizableSplitPane from "../ui/ResizableSplitPane";

export interface RequirementFormData {
  noOfPositions: string;
  skill: string[];
  experience: string;
  client_id: string;
  position_detail_id: string;
  position: string;
}

export interface RequirementFormErrors {
  noOfPositions: string;
  skill: string;
  experience: string;
  client_id: string;
  position_detail_id: string;
  position: string;
}

export const EMPTY_REQUIREMENT_ERRORS: RequirementFormErrors = {
  noOfPositions: "",
  skill: "",
  experience: "",
  client_id: "",
  position_detail_id: "",
  position:"",
};

interface Props {
  form: RequirementFormData;
  errors: RequirementFormErrors;
  submitting: boolean;
  file: File | null;
  pdfUrl: string;
  clientOptions: { value: string; label: string }[];
  positionOptions: { value: string; label: string }[];
  onChange: (key: keyof RequirementFormData, val: string | string[]) => void;
  onFileChange: (f: File | null) => void;
  onSubmit: () => void;
  onClose: () => void;
  onClear: () => void;
}

const RequirementForm: React.FC<Props> = ({
  form,
  errors,
  submitting,
  file,
  pdfUrl,
  clientOptions,
  onChange,
  onFileChange,
  onSubmit,
  onClose,
  onClear,
}) => {
  // ✅ FIXED TYPES HERE
  const selectFields: {
    id: keyof RequirementFormData;
    label: string;
    placeholder: string;
    options: { value: string; label: string }[];
  }[] = [
    {
      id: "client_id",
      label: "Client",
      placeholder: "Select client",
      options: clientOptions,
    },
  ];

  const inputFields: {
    id: keyof RequirementFormData;
    label: string;
    placeholder: string;
  }[] = [
    {
      id: "noOfPositions",
      label: "No. of Positions",
      placeholder: "e.g. 2",
    },
    {
      id: "experience",
      label: "Experience (years)",
      placeholder: "e.g. 3",
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="flex flex-col h-full">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col overflow-hidden relative">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Add New Requirement
              </h2>
              <p className="text-xs text-gray-400">
                Upload JD to autofill or fill manually
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          </div>

          {/* BODY */}
          <main className="flex-1 min-h-0 overflow-hidden p-5">
            <ResizableSplitPane
              className="h-full"
              defaultRatio={0.4}
              minLeftPx={300}
              minRightPx={340}
              left={
                <section className="flex flex-col gap-4 overflow-hidden h-full">
                  <div className="flex-1 overflow-y-auto pr-1">
                    <div className="bg-white border rounded-xl p-4 shadow-sm">
                      <div className="grid grid-cols-2 gap-3">

                        {/* CLIENT */}
                        {selectFields.map((field) => (
                          <SelectField
                            key={field.id}
                            id={field.id}
                            label={field.label}
                            placeholder={field.placeholder}
                            options={field.options}
                            value={form[field.id] as string}
                            error={errors[field.id]}
                            onChange={(val) => onChange(field.id, val)}
                          />
                        ))}

                        {/* POSITION AUTOCOMPLETE */}
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-gray-700">
                            Position
                          </label>

                          <PositionAutocomplete
                            value={form.position_detail_id ? Number(form.position_detail_id) : undefined}
                            positionName={form.position}  // 👈 pass the string here
                            onChange={(id, name) => {
                              onChange("position_detail_id", String(id));
                              onChange("position", name);
                            }}
                          />

                          {errors.position_detail_id && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.position_detail_id}
                            </p>
                          )}
                        </div>

                        {/* INPUTS */}
                        {inputFields.map((field) => (
                          <InputField
                            key={field.id}
                            id={field.id}
                            label={field.label}
                            placeholder={field.placeholder}
                            value={form[field.id] as string}
                            error={errors[field.id]}
                            onChange={(val) => onChange(field.id, val)}
                          />
                        ))}

                        {/* SKILLS */}
                        <div className="col-span-2">
                          <SkillInput
                            skills={form.skill}
                            error={errors.skill}
                            onAdd={(skill) =>
                              onChange("skill", [...form.skill, skill])
                            }
                            onRemove={(skill) =>
                              onChange(
                                "skill",
                                form.skill.filter((s) => s !== skill)
                              )
                            }
                          />
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-3">
                    <button
                      onClick={onClear}
                      className="flex-1 py-2.5 border rounded-xl"
                    >
                      Clear All
                    </button>

                    <button
                      onClick={onSubmit}
                      disabled={submitting}
                      className="flex-1 py-2.5 text-white bg-[var(--brand)] rounded-xl"
                    >
                      {submitting ? "Submitting…" : "Add Requirement"}
                    </button>
                  </div>
                </section>
              }
              right={
                <ResumePreview
                  file={file}
                  previewUrl={pdfUrl}
                  error=""
                  parsed={false}
                  processing={false}
                  onFile={(f) => onFileChange(f)}
                  onClear={onClear}
                  infoDots={["Position & Skills", "Experience", "Client Info"]}
                />
              }
            />
          </main>
        </div>
      </div>
    </>
  );
};

export default RequirementForm;