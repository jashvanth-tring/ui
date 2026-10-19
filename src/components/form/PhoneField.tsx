import React from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

interface Props {
  id?:  string;
  value:     string;
  error?:    string;
  autofilled?: boolean;
  onChange:  (val: string) => void;
}

const PhoneField: React.FC<Props> = ({ id ,value, error, autofilled, onChange }) => {
    // Strip +91 prefix if already stored with it, show only the 10-digit number
    const normalizePhone = (raw: string): string => {
      if (!raw) return '91';
      let digits = raw.replace(/^\+/, '');
      if (digits.startsWith('91') && digits.length > 2) {
        return `91${digits.slice(2)}`;
      }
      return digits.startsWith('91') ? digits : `91${digits}`;
    };
``
  const phoneValue = normalizePhone(value);

    return (
  <div className="flex flex-col gap-1">
    <PhoneInput
        country="in"
        value={phoneValue}
        inputProps={{
  id: id,
}}
        onChange={(phone) => {
          onChange(`+${phone}`);
        }}
        enableSearch
        disableSearchIcon
        countryCodeEditable={false}
        inputStyle={{
          width: '100%',
          height: '38px',
          fontSize: '14px',
          borderRadius: '8px',
          border: error
            ? '1px solid #f87171'
            : autofilled
            ? '1px solid #60a5fa'
            : '1px solid #d1d5db',
          backgroundColor: autofilled ? '#eff6ff' : '#ffffff',
          paddingLeft: '48px',
          color: '#111827',
        }}
        buttonStyle={{
          borderRadius: '8px 0 0 8px',
          border: error
            ? '1px solid #f87171'
            : autofilled
            ? '1px solid #60a5fa'
            : '1px solid #d1d5db',
          backgroundColor: autofilled ? '#eff6ff' : '#f9fafb',
        }}
        dropdownStyle={{
          borderRadius: '8px',
          fontSize: '13px',
          zIndex: 9999,
        }}
        searchStyle={{
          width: '100%',
          fontSize: '13px',
          padding: '6px 8px',
          borderRadius: '6px',
          border: '1px solid #d1d5db',
          marginBottom: '4px',
        }}
        placeholder="9876543210"
      />
      {error && (
        <span className="text-[11px] text-red-500 mt-0.5">{error}</span>
      )}
    </div>
  );
};

export default PhoneField;