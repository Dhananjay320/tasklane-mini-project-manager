"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { timeAgo } from "@/lib/dates";
import { projectColor } from "@/lib/projectColor";
import type { Project } from "@/lib/types";
import { Icon } from "./Icon";

interface ProjectCardProps {
  project: Project;
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const { todo, inProgress, done, overdue, total } = project.taskCounts;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menuOpen]);

  return (
    <article className="card project-card">
      <div className="between" style={{ alignItems: "flex-start" }}>
        <div className="row" style={{ gap: 10, minWidth: 0, flexWrap: "nowrap" }}>
          <span style={{ flex: "none", width: 10, height: 10, borderRadius: 99, background: projectColor(project.id) }} />
          <h2><Link href={`/projects/${project.id}`}>{project.title}</Link></h2>
        </div>
        <div className="menu-wrap" ref={menuRef}>
          <button type="button" className="icon-btn" aria-label={`Options for ${project.title}`} aria-haspopup="menu"
            aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
            <Icon name="dots" />
          </button>
          {menuOpen && (
            <div className="menu" role="menu">
              <button type="button" role="menuitem" autoFocus onClick={() => { setMenuOpen(false); onEdit(project); }}>
                <Icon name="edit" size={16} />Edit project
              </button>
              <button type="button" role="menuitem" className="danger" onClick={() => { setMenuOpen(false); onDelete(project); }}>
                <Icon name="trash" size={16} />Delete project
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="desc">{project.description || "No description"}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="between" style={{ fontSize: 13 }}>
          <span style={{ color: "var(--ink-2)", fontWeight: 500 }}>
            {total ? `${done} of ${total} tasks done` : "No tasks yet"}
          </span>
          <span style={{ color: "var(--muted)" }}>{pct}%</span>
        </div>
        <div className="progress" role="progressbar" aria-label={`${project.title} progress`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="row">
        <span className="pill status-todo">To do {todo}</span>
        <span className="pill status-progress">In progress {inProgress}</span>
        <span className="pill status-done">Done {done}</span>
        {overdue > 0 && (
          <span className="row due-overdue" style={{ fontSize: 12, gap: 4 }}>
            <Icon name="clock" size={14} strokeWidth={2.2} />{overdue} overdue
          </span>
        )}
      </div>

      <div className="card-foot">Updated {timeAgo(project.updatedAt)}</div>
    </article>
  );
}
