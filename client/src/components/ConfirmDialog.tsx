"use client";

import { Modal } from "./Modal";
import { Icon } from "./Icon";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel, busy, onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} narrow role="alertdialog">
      <div className="dialog-body">
        <div className="danger-icon"><Icon name="trash" size={24} /></div>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--muted)" }}>{message}</p>
        <div className="actions" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} data-autofocus>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy && <span className="spinner" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
