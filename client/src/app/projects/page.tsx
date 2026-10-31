"use client";

import { useDeferredValue, useState } from "react";
import { useDeleteProjectMutation, useListProjectsQuery } from "@/store/api";
import { useAppDispatch } from "@/store/store";
import { toastShown } from "@/store/uiSlice";
import { errorMessage } from "@/lib/errors";
import type { Project } from "@/lib/types";
import { Icon } from "@/components/Icon";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectDialog } from "@/components/ProjectDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function ProjectsPage() {
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query.trim());
  // The unfiltered list drives the totals; the search list is fetched from the API with ?q=.
  const all = useListProjectsQuery();
  const search = useListProjectsQuery({ q }, { skip: !q });
  const list = q ? search : all;
  const [deleteProject, deleteState] = useDeleteProjectMutation();

  const [dialog, setDialog] = useState<{ open: boolean; project?: Project }>({ open: false });
  const [toDelete, setToDelete] = useState<Project | null>(null);

  const projects = list.data?.projects ?? [];
  const totals = (all.data?.projects ?? []).reduce(
    (t, p) => ({
      open: t.open + p.taskCounts.todo + p.taskCounts.inProgress,
      inProgress: t.inProgress + p.taskCounts.inProgress,
      done: t.done + p.taskCounts.done,
      overdue: t.overdue + p.taskCounts.overdue,
    }),
    { open: 0, inProgress: 0, done: 0, overdue: 0 },
  );
  const count = all.data?.projects.length ?? 0;

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deleteProject(toDelete.id).unwrap();
      dispatch(toastShown("success", `“${toDelete.title}” deleted`));
      setToDelete(null);
    } catch (err) {
      dispatch(toastShown("error", errorMessage(err as never)));
    }
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Projects</h1>
          <p className="sub">{all.isLoading ? "Loading…" : `${count} project${count === 1 ? "" : "s"}${q ? ` · ${projects.length} match` : ""}`}</p>
        </div>
        <div className="actions">
          {count > 0 && (
            <div className="search">
              <Icon name="search" />
              <label htmlFor="q" className="sr-only">Search projects</label>
              <input id="q" type="search" className="input" placeholder="Search projects" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          )}
          <button type="button" className="btn btn-primary" onClick={() => setDialog({ open: true })}>
            <Icon name="plus" strokeWidth={2.2} />New project
          </button>
        </div>
      </header>

      {count > 0 && (
        <section className="stats" aria-label="Overview">
          <div className="stat"><span>Open tasks</span><span>{totals.open}</span></div>
          <div className="stat"><span>In progress</span><span style={{ color: "var(--progress-fg)" }}>{totals.inProgress}</span></div>
          <div className="stat"><span>Done</span><span style={{ color: "var(--done-fg)" }}>{totals.done}</span></div>
          <div className="stat"><span>Overdue</span><span style={{ color: totals.overdue ? "var(--danger)" : undefined }}>{totals.overdue}</span></div>
        </section>
      )}

      {list.isLoading || (q && search.isFetching && !search.data) ? (
        <div className="grid-cards" aria-busy="true" aria-label="Loading projects">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card project-card">
              <div className="skeleton" style={{ height: 18, width: "60%" }} />
              <div className="skeleton" style={{ height: 14, width: "90%" }} />
              <div className="skeleton" style={{ height: 6, width: "100%" }} />
              <div className="skeleton" style={{ height: 22, width: "70%" }} />
            </div>
          ))}
        </div>
      ) : list.isError ? (
        <div className="card empty">
          <h2>Couldn&apos;t load your projects</h2>
          <p>{errorMessage(list.error)}</p>
          <button type="button" className="btn btn-secondary" onClick={() => list.refetch()}>Try again</button>
        </div>
      ) : count === 0 ? (
        <div className="card dashed empty">
          <div className="empty-icon"><Icon name="folderPlus" size={30} strokeWidth={1.8} /></div>
          <h2>No projects yet</h2>
          <p>Create your first project, then add tasks with a status and a due date.</p>
          <button type="button" className="btn btn-primary" onClick={() => setDialog({ open: true })}>
            <Icon name="plus" strokeWidth={2.2} />Create a project
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="card dashed empty">
          <h2>No projects match “{q}”</h2>
          <button type="button" className="btn btn-secondary" onClick={() => setQuery("")}>Clear search</button>
        </div>
      ) : (
        <section className="grid-cards" aria-label="Your projects">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onEdit={(project) => setDialog({ open: true, project })} onDelete={setToDelete} />
          ))}
        </section>
      )}

      <ProjectDialog open={dialog.open} project={dialog.project} onClose={() => setDialog({ open: false })} />
      <ConfirmDialog
        open={!!toDelete}
        title={`Delete “${toDelete?.title ?? ""}”?`}
        message={<>This deletes the project and its <strong style={{ color: "var(--ink)" }}>{toDelete?.taskCounts.total ?? 0} tasks</strong>. You can&apos;t undo this.</>}
        confirmLabel="Delete project"
        busy={deleteState.isLoading}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
