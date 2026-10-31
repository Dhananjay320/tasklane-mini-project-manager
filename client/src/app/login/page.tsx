"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLoginMutation } from "@/store/api";
import { errorMessage, fieldErrors } from "@/lib/errors";
import { AuthLayout } from "@/components/AuthLayout";
import { Icon } from "@/components/Icon";

/** Only same-site paths are accepted as a post-login destination (no open redirects). */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/projects";
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [login, { isLoading, error }] = useLoginMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const fields = fieldErrors(error);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login({ email, password }).unwrap();
      router.replace(safeNext(params.get("next")));
      router.refresh();
    } catch {
      // Shown from `error` below.
    }
  }

  const formError = error && !Object.keys(fields).length ? errorMessage(error) : null;

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2>Welcome back</h2>
        <p style={{ fontSize: 15, color: "var(--muted)" }}>Log in to see your projects.</p>
      </div>

      <div className="field">
        <label htmlFor="email" className="label">Email</label>
        <input id="email" type="email" className="input" autoComplete="email" required value={email}
          onChange={(e) => setEmail(e.target.value)} aria-invalid={!!fields.email} aria-describedby={fields.email ? "email-err" : undefined} />
        {fields.email && <span id="email-err" className="error-text">{fields.email}</span>}
      </div>

      <div className="field">
        <label htmlFor="password" className="label">Password</label>
        <input id="password" type="password" className="input" autoComplete="current-password" required value={password}
          onChange={(e) => setPassword(e.target.value)} aria-invalid={!!fields.password} />
        {fields.password && <span className="error-text">{fields.password}</span>}
      </div>

      {formError && (
        <div className="alert" role="alert">
          <span style={{ flex: "none", display: "flex", color: "#b91c1c" }}><Icon name="alert" /></span>
          <span>{formError}</span>
        </div>
      )}

      <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
        {isLoading && <span className="spinner" aria-hidden="true" />}Log in
      </button>

      <p style={{ fontSize: 14, color: "var(--muted)", textAlign: "center" }}>
        New to Tasklane? <Link href="/signup" style={{ fontWeight: 600 }}>Create an account</Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout variant="login">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
