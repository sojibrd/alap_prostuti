import React from "react";

type PanelTone = "raised" | "sunken" | "flat";

// The component names the ROLE of the surface; the theme decides what a
// surface of that role looks like.
const toneClasses: Record<PanelTone, string> = {
  raised: "surface-panel",
  sunken: "surface-well",
  flat: "surface-app",
};

export const Panel: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { tone?: PanelTone }
> = ({ tone = "raised", className = "", children, ...rest }) => (
  <div className={`relative ${toneClasses[tone]} ${className}`} {...rest}>
    {children}
  </div>
);

/** A labelled strip at the top of a panel, separated by a seam. */
export const PanelHeader: React.FC<{
  label: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}> = ({ label, icon, right, className = "" }) => (
  <div
    className={`flex items-center justify-between gap-2 pb-2 mb-2 seam-b-heavy ${className}`}
  >
    <div className="flex items-center gap-1.5 min-w-0">
      {icon}
      <span className="t-label truncate">{label}</span>
    </div>
    {right}
  </div>
);
