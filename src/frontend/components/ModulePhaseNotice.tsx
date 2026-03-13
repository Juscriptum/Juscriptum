import React from "react";
import "./ModulePhaseNotice.css";

type ModulePhase = "launch" | "post_launch";

interface ModulePhaseNoticeProps {
  phase: ModulePhase;
  title: string;
  body: string;
}

const PHASE_LABELS: Record<ModulePhase, string> = {
  launch: "Launch Scope",
  post_launch: "Post-Launch Preview",
};

export const ModulePhaseNotice: React.FC<ModulePhaseNoticeProps> = ({
  phase,
  title,
  body,
}) => {
  return (
    <section
      className={`module-phase-notice module-phase-notice--${phase}`}
      aria-label={`${PHASE_LABELS[phase]} notice`}
    >
      <div className="module-phase-notice__badge">{PHASE_LABELS[phase]}</div>
      <div className="module-phase-notice__content">
        <strong>{title}</strong>
        <p>{body}</p>
      </div>
    </section>
  );
};

export default ModulePhaseNotice;
