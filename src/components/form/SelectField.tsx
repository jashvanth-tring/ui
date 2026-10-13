import React from "react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  id:          string;
  label:       React.ReactNode;
  value:       string;
  options:     Option[];
  placeholder?: string;
  error?:      string;
  onChange:    (val: string) => void;
  disabled?: boolean;
}

const SelectField: React.FC<Props> = ({
  id, label, value, options,
  placeholder = "Select...", error, onChange, disabled = false,
}) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id}
      className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
      {label}
    </label>
    <select
      id={id} value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-white border rounded-lg px-3 py-2 text-sm
        text-gray-900 outline-none transition-all
        ${disabled
          ? "cursor-not-allowed opacity-50 bg-gray-50 border-gray-200"
          : "cursor-pointer"
        }
        ${error
          ? "border-red-400 focus:border-red-500"
          : value
          ? "border-blue-400 bg-blue-50 focus:border-blue-500"
          : "border-gray-300 focus:border-blue-500"
        }`}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    {error && <span className="text-[11px] text-red-500 mt-0.5">{error}</span>}
  </div>
);

export default SelectField;