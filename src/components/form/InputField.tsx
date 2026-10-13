import React from "react";

interface Props {
  id:           string;
  label:        React.ReactNode;
  value:        string;
  placeholder?: string;
  type?:        string;
  error?:       string;
  autofilled?:  boolean;
  onChange:     (val: string) => void;
  disabled?:    boolean;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  onBlur?: () => void;
}

const InputField: React.FC<Props> = ({
  id, label, value, placeholder, 
  type = "text", error, autofilled, onChange, onBlur,
}) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id}
      className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
      {label}
    </label>
    <input
      id={id} type={type} value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={`w-full bg-white border rounded-lg px-3 py-2 text-sm
        text-gray-900 placeholder-gray-400 outline-none transition-all
        ${error
          ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-100"
          : autofilled
          ? "border-blue-400 bg-blue-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
          : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
        }`}
    />
    {error && <span className="text-[11px] text-red-500 mt-0.5">{error}</span>}
  </div>
);

export default InputField;