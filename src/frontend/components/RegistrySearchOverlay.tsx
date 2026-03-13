import React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { DateRangePicker } from "./DateRangePicker";
import "./RegistrySearchOverlay.css";

interface RegistrySearchOverlayProps {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  isLoading?: boolean;
  queryValue: string;
  dateFromValue: string;
  dateToValue: string;
  emptyState: string;
  resultCount: number;
  onClose: () => void;
  onQueryChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onSearch: () => void;
  children?: React.ReactNode;
}

export const RegistrySearchOverlay: React.FC<RegistrySearchOverlayProps> = ({
  title,
  subtitle,
  isOpen,
  isLoading = false,
  queryValue,
  dateFromValue,
  dateToValue,
  emptyState,
  resultCount,
  onClose,
  onQueryChange,
  onDateFromChange,
  onDateToChange,
  onSearch,
  children,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="registry-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="registry-overlay__backdrop" onClick={onClose} />
      <section className="registry-overlay__panel">
        <header className="registry-overlay__header">
          <div>
            <span className="registry-overlay__eyebrow">Реєстри</span>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            type="button"
            className="registry-overlay__close"
            onClick={onClose}
            disabled={isLoading}
          >
            <X size={18} />
          </button>
        </header>

        <div className="registry-overlay__controls">
          <label className="registry-overlay__search">
            <Search size={18} />
            <input
              type="text"
              className="form-input"
              placeholder="Введіть пошуковий запит"
              value={queryValue}
              onChange={(event) => onQueryChange(event.target.value)}
              disabled={isLoading}
            />
          </label>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onSearch}
            disabled={isLoading}
          >
            <Search size={18} />
            {isLoading ? "Пошук..." : "Знайти"}
          </button>
        </div>

        <div className="registry-overlay__filters">
          <div className="registry-overlay__filter-title">
            <SlidersHorizontal size={16} />
            <span>Фільтри періоду</span>
          </div>
          <DateRangePicker
            fromValue={dateFromValue}
            toValue={dateToValue}
            onFromChange={onDateFromChange}
            onToChange={onDateToChange}
            disabled={isLoading}
            max={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div className="registry-overlay__results">
          <div className="registry-overlay__results-meta">
            {resultCount > 0 ? `Знайдено записів: ${resultCount}` : emptyState}
          </div>
          <div className="registry-overlay__results-content">{children}</div>
        </div>
      </section>
    </div>
  );
};

export default RegistrySearchOverlay;
