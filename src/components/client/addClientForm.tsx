import React from "react";
import InputField    from "../form/InputField";
import PhoneField    from "../form/PhoneField";
import ResumePreview from "../resume-parser/ResumePreview";
import {
  AddClientFormData,
  AddClientFormErrors,
} from "./addClientForm.types";
import CityLocationAutocomplete from "./CityLocationAutocomplete";
import ResizableSplitPane from "../ui/ResizableSplitPane";
import { Label } from "../ui/label";

interface Props {
  form:         AddClientFormData;
  errors:       AddClientFormErrors;
  submitting:   boolean;
  file:         File | null;
  pdfUrl:       string;
  onChange:     (key: keyof AddClientFormData, val: string | string[]) => void;
  onFileChange: (f: File | null) => void;
  onNext:       () => void;
  onClear:      () => void;
  jrfSkipped:   boolean;
}

// ── Main form ─────────────────────────────────────────────────────────────────
const AddClientForm: React.FC<Props> = ({
  form, errors, submitting,
  file, pdfUrl,
  onChange, onFileChange, onNext, onClear, jrfSkipped,
}) => {

  const inputFields: {
    id:          keyof AddClientFormData;
    label:       string;
    required:    boolean;
    placeholder: string;
    type?:       string;
  }[] = [
    { id: "clientName", label: "Client Name", required: true, placeholder: "Enter client name"          },
    { id: "emailId",    label: "Email Address", required: false, placeholder: "Enter email", type: "email"  },
    { id: "spocName",   label: "SPOC Name",     required: true, placeholder: "Enter SPOC name"            },
  ];

  return (
    <main className="flex-1 min-h-0 overflow-hidden p-5 pt-1">
      <ResizableSplitPane
        className="h-full"
        defaultRatio={0.45}
        minLeftPx={320}
        minRightPx={320}
        left={
          <section className="flex flex-col gap-4 min-h-0 h-full">
            <div className="flex-1 overflow-y-auto pr-1 min-h-0">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="grid grid-cols-2 gap-3">

                  {inputFields.map((field) => (
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
                      value={(form[field.id] as string) ?? ""}
                      error={errors[field.id as keyof AddClientFormErrors]}
                      onChange={(val) => onChange(field.id, val)}
                    />
                  ))}
                  <div>
            <Label htmlFor="phone" className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ">Phone Number</Label>
                  <PhoneField
                    value={form.spocContactNumber}
                    error={errors.spocContactNumber}
                    autofilled={false}
                    onChange={(val) => onChange("spocContactNumber", val)}
                  />
                  </div>

                  <div className="col-span-2 req">
                    <CityLocationAutocomplete
                      locations={form.locations}
                      error={errors.locations}
                      onAdd={(city) => onChange("locations", [...form.locations, city])}
                      onRemove={(i) => onChange("locations", form.locations.filter((_, idx) => idx !== i))}
                    />
                  </div>

                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1 flex-shrink-0">
              <button
                onClick={onClear}
                className="flex-1 py-2.5 bg-white border border-gray-300
                  hover:border-gray-400 hover:bg-gray-50 text-gray-600
                  text-sm font-medium rounded-xl transition-all"
              >
                Clear All
              </button>
              <button
                onClick={onNext}
                disabled={submitting}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5
                  text-white text-sm font-semibold rounded-xl transition-all shadow-sm
                  ${submitting
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-[var(--brand)] hover:bg-[var(--brand)]"}`}
              >
                Next 
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
            onClear={() => onFileChange(null)}
            title="Client File Preview"
            infoDots={["Client Name", "SPOC Details", "Email", "Phone", "Location"]}
          />
      )
        }
      />
    </main>
  );
};

export default AddClientForm;
