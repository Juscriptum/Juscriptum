import React from "react";
import { Search } from "lucide-react";
import { Spinner } from "../Spinner";
import "./RegistryLayout.css";

interface RegistryClassNameProps {
  className?: string;
  children: React.ReactNode;
}

interface RegistrySearchFieldProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  className?: string;
}

interface RegistryFilterGroupProps extends RegistryClassNameProps {
  label?: string;
}

interface RegistryEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

interface RegistryPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onPrevious: () => void;
  onNext: () => void;
}

const buildClassName = (...parts: Array<string | undefined | false>) =>
  parts.filter(Boolean).join(" ");

export const RegistrySurface: React.FC<RegistryClassNameProps> = ({
  className,
  children,
}) => (
  <section className={buildClassName("registry-surface", className)}>
    {children}
  </section>
);

export const RegistryFilterBar: React.FC<RegistryClassNameProps> = ({
  className,
  children,
}) => (
  <div className={buildClassName("registry-filter-bar", className)}>
    {children}
  </div>
);

export const RegistrySearchField: React.FC<RegistrySearchFieldProps> = ({
  value,
  placeholder,
  onChange,
  className,
}) => (
  <label className={buildClassName("registry-search-field", className)}>
    <Search size={18} aria-hidden="true" />
    <input
      type="search"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
);

export const RegistryFilterGroup: React.FC<RegistryFilterGroupProps> = ({
  label,
  className,
  children,
}) => (
  <div className={buildClassName("registry-filter-group", className)}>
    {label ? (
      <span className="registry-filter-group__label">{label}</span>
    ) : null}
    {children}
  </div>
);

export const RegistryTableShell: React.FC<RegistryClassNameProps> = ({
  className,
  children,
}) => (
  <div className={buildClassName("registry-table-shell", className)}>
    {children}
  </div>
);

export const RegistryLoadingState: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div className={buildClassName("registry-loading-state", className)}>
    <Spinner size="large" />
  </div>
);

export const RegistryEmptyState: React.FC<RegistryEmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => (
  <div className={buildClassName("registry-empty-state", className)}>
    {icon}
    <h3>{title}</h3>
    <p>{description}</p>
    {action}
  </div>
);

export const RegistryPagination: React.FC<RegistryPaginationProps> = ({
  page,
  totalPages,
  totalItems,
  onPrevious,
  onNext,
}) => (
  <div className="registry-pagination">
    <button
      className="btn btn-secondary"
      disabled={page === 1}
      onClick={onPrevious}
    >
      Попередня
    </button>
    <span className="registry-pagination__info">
      Сторінка {page} з {totalPages} ({totalItems} записів)
    </span>
    <button
      className="btn btn-secondary"
      disabled={page === totalPages}
      onClick={onNext}
    >
      Наступна
    </button>
  </div>
);
