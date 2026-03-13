import React from "react";
import { CalendarDays, RotateCcw } from "lucide-react";
import "./DatePicker.css";

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  min?: string;
  max?: string;
  required?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = "Оберіть дату",
  disabled = false,
  error,
  min,
  max,
  required = false,
  allowClear = false,
  clearLabel = "Скинути",
}) => (
  <div className="date-picker-field">
    {label && (
      <label className="form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
    )}

    <div className={`date-picker-control ${error ? "error" : ""}`}>
      <CalendarDays size={18} className="date-picker-icon" />
      <input
        type="date"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        min={min}
        max={max}
        aria-label={label || placeholder}
        className="date-picker-native"
      />
      {allowClear && value && !disabled && (
        <button
          type="button"
          className="date-picker-clear"
          onClick={() => onChange("")}
          aria-label={clearLabel}
        >
          <RotateCcw size={14} />
          <span>{clearLabel}</span>
        </button>
      )}
    </div>

    {error && <span className="error-message">{error}</span>}
  </div>
);
