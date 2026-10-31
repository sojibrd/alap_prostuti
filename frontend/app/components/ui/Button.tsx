import React from "react";

type Variant = "primary" | "alert" | "ghost" | "outline";

// Variants name intent, not appearance. How a "primary" reads — a lit key, an
// inked block, a flat rule — is entirely the theme decision.
const variantClasses: Record<Variant, string> = {
  primary: "control control--primary",
  alert: "control control--alert",
  outline: "control",
  ghost: "control control--quiet",
};

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
> = ({ variant = "outline", className = "", children, ...rest }) => (
  <button
    type="button"
    className={`${variantClasses[variant]} px-4 py-2 text-xs md:text-sm ${className}`}
    {...rest}
  >
    {children}
  </button>
);

export const IconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
> = ({ variant = "outline", className = "", children, ...rest }) => (
  <button
    type="button"
    className={`${variantClasses[variant]} p-2 ${className}`}
    {...rest}
  >
    {children}
  </button>
);
