"use client";

import React, { useCallback, useEffect, useRef } from "react";

/**
 * The stage's second region: the step walkthrough or the level's design notes.
 *
 * It is the SAME thing on every viewport — an ordinary region beside the
 * canvas, never a layer over it. That is the whole point of this app: you read
 * the step while watching the animation, so the explanation must never take
 * the diagram away. On a wide screen the stage splits into columns and this is
 * the narrow one; on a phone the stage splits into rows and this is the lower
 * one. Both splits are the parent grid's job — see `app/page.tsx`.
 *
 * Because it is never an overlay it claims no dialog role, traps no focus and
 * lays down no backdrop: nothing here is modal, and saying otherwise would
 * tell a screen-reader user they are stuck in something they are not.
 *
 * Escape still closes it — costs nothing and gives a keyboard user the exit
 * they expect from anything with a close button.
 *
 * Layout only — every visual value still comes from the theme contract.
 */
export const Sheet: React.FC<{
  open: boolean;
  onClose: () => void;
  label: string;
  className?: string;
  children: React.ReactNode;
}> = ({ open, onClose, label, className = "", children }) => {
  // Callers pass an inline arrow, so `onClose` is a new function on every
  // render of the page. Read it through a ref so the key handler below depends
  // on OPEN alone and does not tear down every time the step advances.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const close = useCallback(() => onCloseRef.current(), []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      role="region"
      aria-label={label}
      className={`min-h-0 h-full ${className}`}
    >
      {children}
    </div>
  );
};
