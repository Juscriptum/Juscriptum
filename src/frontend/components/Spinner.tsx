import React from "react";

interface SpinnerProps {
  size?: "small" | "medium" | "large";
}

export const Spinner: React.FC<SpinnerProps> = ({ size = "medium" }) => {
  return (
    <div className={`spinner spinner-${size}`}>
      <div className="spinner-blade"></div>
      <div className="spinner-blade"></div>
      <div className="spinner-blade"></div>
    </div>
  );
};
