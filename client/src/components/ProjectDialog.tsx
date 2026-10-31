"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateProjectMutation, useUpdateProjectMutation } from "@/store/api";
import { useAppDispatch } from "@/store/store";
import { toastShown } from "@/store/uiSlice";
import { errorMessage, fieldErrors } from "@/lib/errors";
import type { Project } from "@/lib/types";
import { Modal } from "./Modal";

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  /** Editing this project; omitted when creating one. */
  project?: Project;
}

export function ProjectDialog({ open, onClose, project }: ProjectDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={project ? "Edit project" : "New project"}>
      {/* Keyed so the form starts fresh each time it opens. */}
      <ProjectForm key={project?.id ?? "new"} project={project} onDone={onClose} />
    </Modal>
  );
}

function ProjectForm({ project, onDone }: { project?: Project; onDone: () => void }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [createProject, createState] = useCreateProjectMutation();
  const [updateProject, updateState] = useUpdateProjectMutation();
  const [title, setTitle] = useState(project?.title ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const busy = createState.isLoading || updateState.isLoading;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setErrors({ title: "Give the project a title" });
    setErrors({});
    try {
      if (project) {
        await updateProject({ id: project.id, title, description }).unwrap();
        dispatch(toastShown("success", "Project updated"));
        onDone();
      } else {
        const { project: created } = await createProject({ title, description }).unwrap();
        dispatch(toastShown("success", "Project created"));
        onDone();
        router.push(`/projects/${created.id}`);
      }
    } catch (err) {
      const fields = fieldErrors(err as never);
      setErrors(fields);
      if (!Object.keys(fields).length) dispatch(toastShown("error", errorMessage(err as never)));
    }
  }

  return (
    <form className="dialog-body" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="project-title" className="label">Title <span className="req">*</span></label>
        <input id="project-title" className="input" value={title} maxLength={80} data-autofocus placeholder="e.g. Website redesign"
          onChange={(e) => setTitle(e.target.value)} aria-invalid={!!errors.title} aria-describedby={errors.title ? "project-title-err" : undefined} />
        {errors.title && <span id="project-title-err" className="error-text">{errors.title}</span>}
      </div>
      <div className="field">
        <div className="field-row">
          <label htmlFor="project-desc" className="label">Description <span className="opt">(optional)</span></label>
          <span className="hint">{description.length} / 500</span>
        </div>
        <textarea id="project-desc" className="textarea" rows={4} maxLength={500} value={description}
          placeholder="What is this project about?" onChange={(e) => setDescription(e.target.value)}
          aria-invalid={!!errors.description} />
        {errors.description && <span className="error-text">{errors.description}</span>}
      </div>
      <div className="actions" style={{ justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-secondary" onClick={onDone}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy && <span className="spinner" aria-hidden="true" />}
          {project ? "Save changes" : "Create project"}
        </button>
      </div>
    </form>
  );
}
