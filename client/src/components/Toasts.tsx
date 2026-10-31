"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { toastDismissed, type Toast } from "@/store/uiSlice";
import { Icon } from "./Icon";

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const timer = setTimeout(() => dispatch(toastDismissed(toast.id)), toast.kind === "error" ? 6000 : 3500);
    return () => clearTimeout(timer);
  }, [dispatch, toast]);

  return (
    <div className={`toast toast-${toast.kind}`} role={toast.kind === "error" ? "alert" : "status"}>
      <span style={{ flex: "none", display: "flex", color: toast.kind === "error" ? "#b91c1c" : "#86efac" }}>
        <Icon name={toast.kind === "error" ? "alert" : "check"} strokeWidth={2.4} />
      </span>
      <span>{toast.message}</span>
      <button type="button" aria-label="Dismiss" onClick={() => dispatch(toastDismissed(toast.id))}>
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

export function Toasts() {
  const toasts = useAppSelector((s) => s.ui.toasts);
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
}
