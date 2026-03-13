import React from "react";

interface InputProps {
  type?: "text" | "email" | "password" | "number" | "tel";
  name?: string;
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  maxLength?: number;
  min?: string | number;
  max?: string | number;
  autoFocus?: boolean;
}

export const Input: React.FC<InputProps> = ({
  type = "text",
  name,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  maxLength,
  min,
  max,
  autoFocus = false,
}) => {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        min={min}
        max={max}
        className={`form-input ${error ? "error" : ""}`}
        required={required}
        autoFocus={autoFocus}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};
