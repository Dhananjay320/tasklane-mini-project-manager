"use client";

import { useState } from "react";
import { useCreateTaskMutation, useUpdateTaskMutation, type TaskInput } from "@/store/api";
import { useAppDispatch } from "@/store/store";
import { toastShown } from "@/store/uiSlice";
import { addDays, dayOf, todayLocal } from "@/lib/dates";
import { errorMessage, fieldErrors } from "@/lib/errors";
import { STATUSES, STATUS_META, type Task, type TaskStatus } from "@/lib/types";
import { Modal } from "./Modal";
import { Icon } from "./Icon";

interface TaskDialogProps {
  open: boolean;
  projectId: string;
  /** Editing this task; omitted when creating one. */
  task?: Task;
  onClose: () => void;
  onDelete?: (task: Task) => void;
}

export function TaskDialog({ open, projectId, task, onClose, onDelete }: TaskDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={task ? "Edit task" : "New task"}>
      <TaskForm key={task?.id ?? "new"} projectId={projectId} task={task} onDone={onClose} onDelete={onDelete} />
    </Modal>
  );
}

const OPTION_CLASS: Record<TaskStatus, string> = { todo: "opt-todo", "in-progress": "opt-progress", done: "opt-done" };

function TaskForm({ projectId, task, onDone, onDelete }: { projectId: string; task?: Task; onDone: () => void; onDelete?: (t: Task) => void }) {
  const dispatch = useAppDispatch();
  const [createTask, createState] = useCreateTaskMutation();
  const [updateTask, updateState] = useUpdateTaskMutation();
  const [form, setForm] = useState<TaskInput>({
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: task?.status ?? "todo",
    dueDate: task?.dueDate ? dayOf(task.dueDate) : null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const busy = createState.isLoading || updateState.isLoading;
  const set = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return setErrors({ title: "Give the task a title" });
    setErrors({});
    try {
      if (task) await updateTask({ id: task.id, projectId, body: form }).unwrap();
      else await createTask({ projectId, body: form }).unwrap();
      dispatch(toastShown("success", task ? "Task updated" : "Task created"));
      onDone();
    } catch (err) {
      const fields = fieldErrors(err as never);
      setErrors(fields);
      if (!Object.keys(fields).length) dispatch(toastShown("error", errorMessage(err as never)));
    }
  }

  const today = todayLocal();
  return (
    <form className="dialog-body" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="task-title" className="label">Title <span className="req">*</span></label>
        <input id="task-title" className="input" value={form.title} maxLength={120} data-autofocus placeholder="e.g. Write homepage copy"
          onChange={(e) => set("title", e.target.value)} aria-invalid={!!errors.title} aria-describedby={errors.title ? "task-title-err" : undefined} />
        {errors.title && <span id="task-title-err" className="error-text">{errors.title}</span>}
      </div>

      <div className="field">
        <div className="field-row">
          <label htmlFor="task-desc" className="label">Description <span className="opt">(optional)</span></label>
          <span className="hint">{form.description.length} / 1000</span>
        </div>
        <textarea id="task-desc" className="textarea" rows={4} maxLength={1000} value={form.description}
          onChange={(e) => set("description", e.target.value)} aria-invalid={!!errors.description} />
        {errors.description && <span className="error-text">{errors.description}</span>}
      </div>

      <fieldset style={{ margin: 0, padding: 0, border: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        <legend className="label" style={{ padding: 0, marginBottom: 8 }}>Status</legend>
        <div className="status-options">
          {STATUSES.map((s) => (
            <label key={s} className={`status-option ${OPTION_CLASS[s]}`}>
              <input type="radio" name="status" value={s} checked={form.status === s} onChange={() => set("status", s)} />
              {STATUS_META[s].label}
            </label>
          ))}
        </div>
        {errors.status && <span className="error-text">{errors.status}</span>}
      </fieldset>

      <div className="field">
        <label htmlFor="task-due" className="label">Due date <span className="opt">(optional)</span></label>
        <div className="row" style={{ gap: 10 }}>
          <input id="task-due" type="date" className="input" style={{ width: "auto" }} value={form.dueDate ?? ""}
            onChange={(e) => set("dueDate", e.target.value || null)} aria-invalid={!!errors.dueDate} />
          <button type="button" className="quick" onClick={() => set("dueDate", today)}>Today</button>
          <button type="button" className="quick" onClick={() => set("dueDate", addDays(today, 7))}>+1 week</button>
          {form.dueDate && <button type="button" className="quick" onClick={() => set("dueDate", null)}>Clear</button>}
        </div>
        {errors.dueDate && <span className="error-text">{errors.dueDate}</span>}
      </div>

      <div className="dialog-foot">
        {task && onDelete ? (
          <button type="button" className="btn btn-ghost-danger" onClick={() => onDelete(task)}>
            <Icon name="trash" size={16} />Delete task
          </button>
        ) : <span />}
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={onDone}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy && <span className="spinner" aria-hidden="true" />}
            {task ? "Save changes" : "Create task"}
          </button>
        </div>
      </div>
    </form>
  );
}
