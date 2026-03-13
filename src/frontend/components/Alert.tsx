import React from "react";

interface AlertProps {
  type?: "info" | "success" | "warning" | "error";
  children?: React.ReactNode;
  message?: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  type = "info",
  children,
  message,
  className,
  onClose,
}) => {
  const typeClasses = {
    info: "alert-info",
    success: "alert-success",
    warning: "alert-warning",
    error: "alert-error",
  };
  const content = children ?? message;
  const classes = ["alert", typeClasses[type], className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <div className="alert-content">{content}</div>
      {onClose && (
        <button type="button" className="alert-close" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
};
