import { Icon, Logo } from "./Icon";

/** Split auth screen: dark brand panel on the left (stacks on top on phones), the form on the right. */
export function AuthLayout({ variant, children }: { variant: "login" | "signup"; children: React.ReactNode }) {
  return (
    <div className="auth">
      <section className="auth-brand">
        <Logo href="/login" />
        {variant === "login" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 520 }}>
            <h1>Plan the work.<br />Ship the project.</h1>
            <p>Keep every project and its tasks in one place. Filter by status, sort by due date, and see what is late at a glance.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 520 }}>
            <h1>Your projects,<br />one clear list.</h1>
            <ul className="feature-list">
              {["Create projects and break them into tasks", "Track status: To do, In progress, Done",
                "Sort by due date and spot late tasks", "Private to you: only you see your projects"].map((f) => (
                <li key={f}><span style={{ color: "#a5b4fc", display: "flex" }}><Icon name="check" size={20} strokeWidth={2.2} /></span>{f}</li>
              ))}
            </ul>
          </div>
        )}
        {variant === "login" ? (
          <div className="preview-card" aria-hidden="true">
            <div className="preview-row"><strong>Website redesign</strong><span style={{ color: "#d1d5db", fontSize: 13 }}>7 of 12 done</span></div>
            <div className="progress" style={{ background: "#374151" }}><div style={{ width: "58%", background: "#818cf8" }} /></div>
            <div className="preview-row"><span>Write homepage copy</span><span className="pill status-progress">In progress</span></div>
            <div className="preview-row"><span>Pick a colour palette</span><span className="pill status-done">Done</span></div>
            <div className="preview-row"><span>Set up staging server</span><span className="pill status-todo">To do</span></div>
          </div>
        ) : (
          <p className="fineprint" style={{ fontSize: 13, color: "#9ca3af" }}>Next.js · Redux Toolkit · Express · MongoDB</p>
        )}
      </section>
      <main className="auth-main">{children}</main>
    </div>
  );
}
