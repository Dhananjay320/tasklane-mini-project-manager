"use client";

import { useEffect, useRef } from "react";
import { Icon } from "./Icon";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  narrow?: boolean;
  role?: "dialog" | "alertdialog";
  children: React.ReactNode;
}

/**
 * A native <dialog> shown with showModal(): the browser traps focus, makes the page behind inert,
 * closes on Escape and returns focus to the button that opened it.
 */
export function Modal({ open, onClose, title, narrow, role = "dialog", children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = `dlg-${title.replace(/\W+/g, "-").toLowerCase()}`;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // showModal() focuses the first focusable element (the close button); move focus to the field marked for it.
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`dialog${narrow ? " narrow" : ""}`}
      role={role}
      aria-labelledby={titleId}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      {open && (
        <>
          <div className="dialog-head">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="close" /></button>
          </div>
          {children}
        </>
      )}
    </dialog>
  );
}
