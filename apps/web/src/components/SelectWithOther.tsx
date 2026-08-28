import { useState, useEffect } from 'react';

interface SelectWithOtherProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  className?: string;
}

/**
 * A <select> that shows predefined options plus "Other (type below)".
 * When "Other" is selected, a text input appears for free-form entry.
 */
export default function SelectWithOther({ label, value, onChange, options, placeholder, required, className }: SelectWithOtherProps) {
  const isPredefined = options.includes(value);
  const [showCustom, setShowCustom] = useState(!isPredefined && !!value);

  useEffect(() => {
    setShowCustom(!isPredefined && !!value);
  }, [value, isPredefined]);

  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}{required && ' *'}</label>
      <select
        value={isPredefined ? value : '__OTHER__'}
        onChange={(e) => {
          if (e.target.value === '__OTHER__') {
            setShowCustom(true);
            onChange('');
          } else {
            setShowCustom(false);
            onChange(e.target.value);
          }
        }}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-g-navy focus:ring-1 focus:ring-g-navy"
      >
        {!isPredefined && value && <option value={value}>{value}</option>}
        <option value="">Select...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
        <option value="__OTHER__">Other (type below)</option>
      </select>
      {showCustom && (
        <input
          type="text"
          value={isPredefined ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || `Type custom ${label.toLowerCase()}`}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-g-navy focus:ring-1 focus:ring-g-navy"
        />
      )}
    </div>
  );
}
