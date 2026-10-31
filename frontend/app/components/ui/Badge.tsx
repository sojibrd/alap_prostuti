import React from "react";

type Tone = "neutral" | "accent" | "alert" | "confirm";

const toneClasses: Record<Tone, string> = {
  neutral: "chip",
  accent: "chip chip--accent",
  alert: "chip chip--alert",
  confirm: "chip chip--ok",
};

/** A small stamped annotation: specs, counts, category names. */
export const Badge: React.FC<{
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}> = ({ tone = "neutral", className = "", children }) => (
  <span className={`${toneClasses[tone]} ${className}`}>{children}</span>
);
