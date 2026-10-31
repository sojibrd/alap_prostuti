import React from "react";

/** A divider between two regions of a panel. */
export const Rule: React.FC<{
  weight?: "hair" | "heavy";
  className?: string;
}> = ({ weight = "hair", className = "" }) => (
  <div className={`${weight === "heavy" ? "seam-b-heavy" : "seam"} ${className}`} />
);
