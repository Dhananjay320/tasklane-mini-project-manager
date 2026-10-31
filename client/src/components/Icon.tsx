import Link from "next/link";

const PATHS = {
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  logout: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /></>,
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4z" />,
  trash: <><path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></>,
  close: <><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>,
  check: <path d="M5 12l5 5L20 7" />,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  folderPlus: <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M12 11v5" /><path d="M9.5 13.5h5" /></>,
  list: <><path d="M4 7h10" /><path d="M4 12h16" /><path d="M4 17h7" /></>,
} as const;

export type IconName = keyof typeof PATHS | "dots";

/** Inline stroke icons, decorative by default (the control around them carries the label). */
export function Icon({ name, size = 18, strokeWidth = 2 }: { name: IconName; size?: number; strokeWidth?: number }) {
  if (name === "dots") {
    return (
      <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </svg>
  );
}

export function Logo({ href = "/projects" }: { href?: string }) {
  return (
    <Link href={href} className="logo">
      <span className="logo-mark"><span style={{ color: "#fff", display: "flex" }}><Icon name="list" strokeWidth={2.2} /></span></span>
      Tasklane
    </Link>
  );
}
