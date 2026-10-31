export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskSort = "due_asc" | "due_desc" | "newest" | "oldest";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface TaskCounts {
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
  total: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  taskCounts: TaskCounts;
}

export interface Task {
  id: string;
  project: string;
  title: string;
  description: string;
  status: TaskStatus;
  /** ISO timestamp at midnight UTC of the chosen day, or null. */
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> };
}

export const STATUS_META: Record<TaskStatus, { label: string; className: string }> = {
  todo: { label: "To do", className: "status-todo" },
  "in-progress": { label: "In progress", className: "status-progress" },
  done: { label: "Done", className: "status-done" },
};

export const STATUSES: TaskStatus[] = ["todo", "in-progress", "done"];
