import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card empty" style={{ maxWidth: 440 }}>
        <span style={{ fontSize: 56, fontWeight: 700, color: "#c7d2fe", letterSpacing: "-0.03em" }}>404</span>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Page not found</h1>
        <p>The page you are looking for doesn&apos;t exist.</p>
        <Link href="/projects" style={{ fontWeight: 600 }}>Go to my projects</Link>
      </div>
    </main>
  );
}
