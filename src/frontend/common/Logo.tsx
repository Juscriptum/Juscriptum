import React from "react";
import projectLogo from "../assets/project-logo.svg";
import "./Logo.css";

interface LogoProps {
  size?: "small" | "medium" | "large";
  variant?: "light" | "dark";
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = "medium",
  variant = "dark",
  className = "",
  showText = false,
}) => {
  const sizes = {
    small: { iconSize: 28, fontSize: 15 },
    medium: { iconSize: 34, fontSize: 18 },
    large: { iconSize: 56, fontSize: 22 },
  };

  const { iconSize, fontSize } = sizes[size];
  const color = variant === "light" ? "#ffffff" : "#1f2937";

  return (
    <div
      className={`brand-logo ${className}`.trim()}
      style={{
        ["--logo-icon-size" as string]: `${iconSize}px`,
        ["--logo-font-size" as string]: `${fontSize}px`,
        ["--logo-color" as string]: color,
      }}
    >
      <img
        className="brand-logo__image"
        src={projectLogo}
        alt="Law Organizer"
      />
      {showText && <span className="brand-logo__title">Law Organizer</span>}
    </div>
  );
};
