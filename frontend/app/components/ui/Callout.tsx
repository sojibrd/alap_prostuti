import React from "react";

type Tone = "note" | "accent" | "alert";

const toneClasses: Record<Tone, string> = {
  note: "callout",
  accent: "callout callout--accent",
  alert: "callout callout--alert",
};

/** A labelled block of explanation: a caption strip above its body text. */
export const Callout: React.FC<{
  label: string;
  icon?: React.ReactNode;
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}> = ({ label, icon, tone = "note", className = "", children }) => (
  <div className={`${toneClasses[tone]} ${className}`}>
    <div className="flex items-center gap-1.5 mb-1 t-label">
      {icon}
      <span>{label}</span>
    </div>
    <div className="t-body text-xs md:text-sm">{children}</div>
  </div>
);
