"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useListProjectsQuery, useLogoutMutation, useMeQuery } from "@/store/api";
import { errorStatus } from "@/lib/errors";
import { projectColor } from "@/lib/projectColor";
import { Icon, Logo } from "@/components/Icon";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
}

/** Signed-in area: sidebar (a top bar on phones) + page content. */
export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const me = useMeQuery();
  const projects = useListProjectsQuery();
  const [logout] = useLogoutMutation();

  // The proxy only does an optimistic check; if the API says the session is gone, clear the cookie and go to login.
  useEffect(() => {
    if (errorStatus(me.error) === 401) {
      logout().finally(() => router.replace(`/login?next=${encodeURIComponent(pathname)}`));
    }
  }, [me.error, logout, router, pathname]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
    router.refresh();
  }

  const user = me.data?.user;
  const recent = projects.data?.projects.slice(0, 6) ?? [];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div style={{ padding: "0 8px" }}><Logo /></div>
        <nav className="nav" aria-label="Main">
          <Link href="/projects" className="nav-link" aria-current={pathname === "/projects" ? "page" : undefined}>
            <Icon name="grid" />Projects
          </Link>
          {recent.length > 0 && <div className="nav-heading">Recent</div>}
          {recent.map((p) => {
            const href = `/projects/${p.id}`;
            return (
              <Link key={p.id} href={href} className="nav-link" aria-current={pathname === href ? "page" : undefined}>
                <span className="dot" style={{ background: projectColor(p.id) }} />
                <span className="text">{p.title}</span>
              </Link>
            );
          })}
        </nav>
        <div className="user-box">
          <div className="avatar" aria-hidden="true">{user ? initials(user.name) : ""}</div>
          <div className="who">
            <span>{user?.name ?? " "}</span>
            <span>{user?.email ?? " "}</span>
          </div>
          <button type="button" className="icon-btn" aria-label="Log out" title="Log out" onClick={handleLogout}>
            <Icon name="logout" />
          </button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
