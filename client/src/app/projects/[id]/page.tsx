"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useDeleteProjectMutation,
  useDeleteTaskMutation,
  useGetProjectQuery,
  useListTasksQuery,
  useUpdateTaskMutation,
} from "@/store/api";
import { useAppDispatch } from "@/store/store";
import { toastShown } from "@/store/uiSlice";
import { dueInfo, todayLocal } from "@/lib/dates";
import { errorMessage, errorStatus } from "@/lib/errors";
import { STATUSES, STATUS_META, type Task, type TaskSort, type TaskStatus } from "@/lib/types";
import { Icon } from "@/components/Icon";
import { TaskDialog } from "@/components/TaskDialog";
import { ProjectDialog } from "@/components/ProjectDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const SORT_OPTIONS: { value: TaskSort; label: string }[] = [
  { value: "due_asc", label: "Due date: soonest first" },
  { value: "due_desc", label: "Due date: latest first" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

const isStatus = (v: string | null): v is TaskStatus => !!v && (STATUSES as string[]).includes(v);
const isSort = (v: string | null): v is TaskSort => !!v && SORT_OPTIONS.some((o) => o.value === v);

function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const dispatch = useAppDispatch();

  // Filter, sort and view live in the URL, so a refresh or a shared link keeps them.
  const status = isStatus(params.get("status")) ? (params.get("status") as TaskStatus) : undefined;
  const sort: TaskSort = isSort(params.get("sort")) ? (params.get("sort") as TaskSort) : "due_asc";
  const view = params.get("view") === "board" ? "board" : "list";
  function setParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const projectQuery = useGetProjectQuery(id);
  const tasksQuery = useListTasksQuery({ projectId: id, status, sort }, { skip: !projectQuery.data });
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask, deleteTaskState] = useDeleteTaskMutation();
  const [deleteProject, deleteProjectState] = useDeleteProjectMutation();

  const [taskDialog, setTaskDialog] = useState<{ open: boolean; task?: Task }>({ open: false });
  const [editProject, setEditProject] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [confirmProjectDelete, setConfirmProjectDelete] = useState(false);

  if (projectQuery.isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading project" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="skeleton" style={{ height: 28, width: 320 }} />
        <div className="skeleton" style={{ height: 14, width: 480, maxWidth: "100%" }} />
        <div className="skeleton" style={{ height: 60, marginTop: 16 }} />
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }
  if (errorStatus(projectQuery.error) === 404) {
    return (
      <div className="card empty" style={{ marginTop: 40 }}>
        <span style={{ fontSize: 56, fontWeight: 700, color: "#c7d2fe", letterSpacing: "-0.03em" }}>404</span>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Project not found</h1>
        <p>It may have been deleted, or it belongs to another account.</p>
        <Link href="/projects" style={{ fontWeight: 600 }}>Back to my projects</Link>
      </div>
    );
  }
  if (!projectQuery.data) {
    return (
      <div className="card empty">
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Couldn&apos;t load this project</h1>
        <p>{errorMessage(projectQuery.error)}</p>
        <button type="button" className="btn btn-secondary" onClick={() => projectQuery.refetch()}>Try again</button>
      </div>
    );
  }

  const project = projectQuery.data.project;
  const counts = project.taskCounts;
  const pct = counts.total ? Math.round((counts.done / counts.total) * 100) : 0;
  const tasks = tasksQuery.data?.tasks ?? [];
  const today = todayLocal();

  async function changeStatus(task: Task, next: TaskStatus) {
    try {
      await updateTask({ id: task.id, projectId: id, body: { status: next } }).unwrap();
      dispatch(toastShown("success", `“${task.title}” moved to ${STATUS_META[next].label}`));
    } catch (err) {
      dispatch(toastShown("error", errorMessage(err as never)));
    }
  }

  async function confirmTaskDelete() {
    if (!taskToDelete) return;
    try {
      await deleteTask({ id: taskToDelete.id, projectId: id }).unwrap();
      dispatch(toastShown("success", "Task deleted"));
      setTaskToDelete(null);
      setTaskDialog({ open: false });
    } catch (err) {
      dispatch(toastShown("error", errorMessage(err as never)));
    }
  }

  async function confirmDeleteProject() {
    try {
      await deleteProject(id).unwrap();
      dispatch(toastShown("success", `“${project.title}” deleted`));
      router.replace("/projects");
    } catch (err) {
      dispatch(toastShown("error", errorMessage(err as never)));
    }
  }

  const chips: { key?: TaskStatus; label: string; count: number }[] = [
    { label: "All", count: counts.total },
    { key: "todo", label: "To do", count: counts.todo },
    { key: "in-progress", label: "In progress", count: counts.inProgress },
    { key: "done", label: "Done", count: counts.done },
  ];

  const statusSelect = (task: Task) => (
    <>
      <label htmlFor={`status-${task.id}`} className="sr-only">Status of {task.title}</label>
      <select id={`status-${task.id}`} className={`status-select ${STATUS_META[task.status].className}`} value={task.status}
        onChange={(e) => changeStatus(task, e.target.value as TaskStatus)}>
        {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
      </select>
    </>
  );

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/projects">Projects</Link>
        <Icon name="chevronRight" size={14} />
        <span aria-current="page">{project.title}</span>
      </nav>

      <header className="page-head" style={{ alignItems: "flex-start" }}>
        <div style={{ maxWidth: 640 }}>
          <h1>{project.title}</h1>
          {project.description && <p className="sub">{project.description}</p>}
          <div className="row" style={{ gap: 12, paddingTop: 10 }}>
            <div className="progress" style={{ width: 180, background: "var(--line)" }} role="progressbar"
              aria-label="Project progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div style={{ width: `${pct}%` }} />
            </div>
            <span style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}>
              {counts.done} of {counts.total} tasks done · {pct}%
              {counts.overdue > 0 && <span className="due-overdue"> · {counts.overdue} overdue</span>}
            </span>
          </div>
        </div>
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={() => setEditProject(true)}>
            <Icon name="edit" size={16} />Edit project
          </button>
          <button type="button" className="icon-btn bordered danger" aria-label="Delete project" title="Delete project"
            onClick={() => setConfirmProjectDelete(true)}>
            <Icon name="trash" />
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setTaskDialog({ open: true })}>
            <Icon name="plus" strokeWidth={2.2} />New task
          </button>
        </div>
      </header>

      <div className="toolbar">
        <div className="chips" role="group" aria-label="Filter by status">
          {chips.map((c) => (
            <button key={c.label} type="button" className="chip" aria-pressed={status === c.key}
              onClick={() => setParam("status", c.key)}>
              {c.label}<span className="count">{c.count}</span>
            </button>
          ))}
        </div>
        <div className="row" style={{ gap: 10 }}>
          <label htmlFor="sort" style={{ fontSize: 14, color: "var(--muted)" }}>Sort</label>
          <select id="sort" className="select" value={sort} onChange={(e) => setParam("sort", e.target.value === "due_asc" ? undefined : e.target.value)}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="segmented" role="group" aria-label="View">
            <button type="button" aria-pressed={view === "list"} onClick={() => setParam("view", undefined)}>List</button>
            <button type="button" aria-pressed={view === "board"} onClick={() => setParam("view", "board")}>Board</button>
          </div>
        </div>
      </div>

      {tasksQuery.isLoading ? (
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }} aria-busy="true" aria-label="Loading tasks">
          {[70, 60, 75].map((w) => (
            <div key={w} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="skeleton" style={{ height: 14, width: `${w}%` }} />
              <div className="skeleton" style={{ height: 12, width: `${w - 25}%` }} />
            </div>
          ))}
        </div>
      ) : tasksQuery.isError ? (
        <div className="card empty">
          <h2>Couldn&apos;t load tasks</h2>
          <p>{errorMessage(tasksQuery.error)}</p>
          <button type="button" className="btn btn-secondary" onClick={() => tasksQuery.refetch()}>Try again</button>
        </div>
      ) : counts.total === 0 ? (
        <div className="card dashed empty">
          <div className="empty-icon"><Icon name="list" size={30} strokeWidth={1.8} /></div>
          <h2>No tasks yet</h2>
          <p>Break this project into tasks. Give each one a status and a due date.</p>
          <button type="button" className="btn btn-primary" onClick={() => setTaskDialog({ open: true })}>
            <Icon name="plus" strokeWidth={2.2} />Add the first task
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="card empty">
          <h2>No tasks with this status</h2>
          <p>Try another filter, or show every task.</p>
          <button type="button" className="btn btn-secondary" onClick={() => setParam("status", undefined)}>Show all tasks</button>
        </div>
      ) : view === "list" ? (
        <div className="card table-wrap" style={{ opacity: tasksQuery.isFetching ? 0.7 : 1, transition: "opacity .15s" }}>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Task</th>
                <th scope="col" style={{ width: 160 }}>Status</th>
                <th scope="col" style={{ width: 180 }}>Due date</th>
                <th scope="col" style={{ width: 100 }}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const due = dueInfo(task, today);
                return (
                  <tr key={task.id}>
                    <td>
                      <button type="button" className={`task-title${task.status === "done" ? " done" : ""}`}
                        onClick={() => setTaskDialog({ open: true, task })}>{task.title}</button>
                      {task.description && <div className="task-desc">{task.description}</div>}
                    </td>
                    <td>{statusSelect(task)}</td>
                    <td className={`due-${due.tone}`}>{due.label}</td>
                    <td>
                      <div className="row" style={{ justifyContent: "flex-end", gap: 4, flexWrap: "nowrap" }}>
                        <button type="button" className="icon-btn" aria-label={`Edit ${task.title}`} onClick={() => setTaskDialog({ open: true, task })}>
                          <Icon name="edit" size={16} />
                        </button>
                        <button type="button" className="icon-btn danger" aria-label={`Delete ${task.title}`} onClick={() => setTaskToDelete(task)}>
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="board">
          {STATUSES.filter((s) => !status || s === status).map((s) => {
            const items = tasks.filter((t) => t.status === s);
            return (
              <section key={s} className="column" aria-label={STATUS_META[s].label}>
                <h2>{STATUS_META[s].label}<span style={{ color: "var(--muted)", fontWeight: 600 }}>{items.length}</span></h2>
                {items.map((task) => {
                  const due = dueInfo(task, today);
                  return (
                    <article key={task.id} className="task-card">
                      <button type="button" className={`task-title${task.status === "done" ? " done" : ""}`} style={{ fontSize: 14 }}
                        onClick={() => setTaskDialog({ open: true, task })}>{task.title}</button>
                      {task.description && <span style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{task.description}</span>}
                      <div className="between">
                        <span className={`due-${due.tone}`} style={{ fontSize: 12 }}>{due.label}</span>
                        {statusSelect(task)}
                      </div>
                    </article>
                  );
                })}
                {items.length === 0 && <p style={{ fontSize: 13, color: "var(--muted)", padding: "4px 6px" }}>Nothing here</p>}
              </section>
            );
          })}
        </div>
      )}

      <TaskDialog open={taskDialog.open} projectId={id} task={taskDialog.task} onClose={() => setTaskDialog({ open: false })}
        onDelete={(t) => setTaskToDelete(t)} />
      <ProjectDialog open={editProject} project={project} onClose={() => setEditProject(false)} />
      <ConfirmDialog
        open={!!taskToDelete}
        title="Delete this task?"
        message={<>“{taskToDelete?.title}” will be deleted. You can&apos;t undo this.</>}
        confirmLabel="Delete task"
        busy={deleteTaskState.isLoading}
        onConfirm={confirmTaskDelete}
        onClose={() => setTaskToDelete(null)}
      />
      <ConfirmDialog
        open={confirmProjectDelete}
        title={`Delete “${project.title}”?`}
        message={<>This deletes the project and its <strong style={{ color: "var(--ink)" }}>{counts.total} tasks</strong>. You can&apos;t undo this.</>}
        confirmLabel="Delete project"
        busy={deleteProjectState.isLoading}
        onConfirm={confirmDeleteProject}
        onClose={() => setConfirmProjectDelete(false)}
      />
    </>
  );
}

export default function ProjectPage() {
  return (
    <Suspense>
      <ProjectDetail />
    </Suspense>
  );
}
