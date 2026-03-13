import React from "react";
import "./FormActionBar.css";

interface FormActionBarProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const FormActionBar: React.FC<FormActionBarProps> = ({
  title,
  description,
  children,
}) => {
  const hasMeta = Boolean(title || description);

  return (
    <div className="form-action-bar">
      {hasMeta && (
        <div className="form-action-bar__meta">
          {title && <strong>{title}</strong>}
          {description && <span>{description}</span>}
        </div>
      )}
      <div className="form-action-bar__actions">{children}</div>
    </div>
  );
};

export default FormActionBar;
