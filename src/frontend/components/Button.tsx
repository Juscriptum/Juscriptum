import React from "react";

interface ButtonProps {
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "small" | "medium" | "large";
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  type = "button",
  variant = "primary",
  size = "medium",
  children,
  onClick,
  disabled = false,
  className = "",
}) => {
  const classes = `btn btn-${variant} btn-${size} ${className}`;

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
