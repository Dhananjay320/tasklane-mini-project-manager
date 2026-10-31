import type { Task } from "./types";

// Due dates are calendar days. The API stores them at midnight UTC, so the first
// 10 characters ("2026-11-04") are the day the user picked, in any time zone.
export const dayOf = (iso: string) => iso.slice(0, 10);

export function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const shortFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export const formatDay = (day: string) => formatter.format(new Date(`${day}T00:00:00Z`));

export type DueTone = "none" | "normal" | "today" | "overdue";

/** How a task's due date is shown: label plus a tone that drives its colour. Done tasks are never late. */
export function dueInfo(task: Pick<Task, "dueDate" | "status">, today = todayLocal()): { label: string; tone: DueTone } {
  if (!task.dueDate) return { label: "No due date", tone: "none" };
  const day = dayOf(task.dueDate);
  if (task.status !== "done" && day < today) {
    return { label: `Overdue · ${shortFormatter.format(new Date(`${day}T00:00:00Z`))}`, tone: "overdue" };
  }
  if (task.status !== "done" && day === today) return { label: "Due today", tone: "today" };
  return { label: formatDay(day), tone: "normal" };
}

export function timeAgo(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return shortFormatter.format(new Date(iso));
}
