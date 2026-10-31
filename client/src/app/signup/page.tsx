"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignupMutation } from "@/store/api";
import { errorMessage, fieldErrors } from "@/lib/errors";
import { AuthLayout } from "@/components/AuthLayout";
import { Icon } from "@/components/Icon";

/** 0–4 bars: length 8+, length 12+, mixed case, digit or symbol. */
function strength(pw: string) {
  if (pw.length < 8) return { score: pw ? 1 : 0, label: pw ? "Too short · at least 8 characters" : "At least 8 characters" };
  const score = 1 + Number(pw.length >= 12) + Number(/[a-z]/.test(pw) && /[A-Z]/.test(pw)) + Number(/[\d\W]/.test(pw));
  return { score, label: ["", "Weak", "Fair", "Good", "Strong"][score] + " · at least 8 characters" };
}

export default function SignupPage() {
  const router = useRouter();
  const [signup, { isLoading, error }] = useSignupMutation();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const fields = { ...fieldErrors(error), ...localErrors };
  const pw = strength(form.password);
  const barColor = pw.score <= 1 ? "#b91c1c" : pw.score === 2 ? "#b45309" : "#15803d";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email address";
    if (form.password.length < 8) errs.password = "Password must be at least 8 characters";
    setLocalErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await signup(form).unwrap();
      router.replace("/projects");
      router.refresh();
    } catch {
      // Shown from `error` below.
    }
  }

  const formError = error && !Object.keys(fieldErrors(error)).length ? errorMessage(error) : null;
  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setLocalErrors((errs) => ({ ...errs, [key]: "" }));
  };

  return (
    <AuthLayout variant="signup">
      <form className="auth-form" onSubmit={submit} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2>Create your account</h2>
          <p style={{ fontSize: 15, color: "var(--muted)" }}>It takes less than a minute.</p>
        </div>

        <div className="field">
          <label htmlFor="name" className="label">Full name</label>
          <input id="name" className="input" autoComplete="name" value={form.name} onChange={update("name")}
            aria-invalid={!!fields.name} aria-describedby={fields.name ? "name-err" : undefined} />
          {fields.name && <span id="name-err" className="error-text">{fields.name}</span>}
        </div>

        <div className="field">
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" className="input" autoComplete="email" value={form.email} onChange={update("email")}
            aria-invalid={!!fields.email} aria-describedby={fields.email ? "email-err" : undefined} />
          {fields.email && (
            <span id="email-err" className="error-text">
              {fields.email}
              {fields.email.includes("already registered") && <> <Link href="/login" style={{ color: "inherit", fontWeight: 600 }}>Log in instead</Link></>}
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" className="input" autoComplete="new-password" value={form.password}
            onChange={update("password")} aria-invalid={!!fields.password} aria-describedby="pw-hint" />
          <div className="strength" aria-hidden="true">
            {[1, 2, 3, 4].map((i) => <span key={i} style={i <= pw.score ? { background: barColor } : undefined} />)}
          </div>
          <span id="pw-hint" className={fields.password ? "error-text" : "hint"}>{fields.password || pw.label}</span>
        </div>

        {formError && (
          <div className="alert" role="alert">
            <span style={{ flex: "none", display: "flex", color: "#b91c1c" }}><Icon name="alert" /></span>
            <span>{formError}</span>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
          {isLoading && <span className="spinner" aria-hidden="true" />}Create account
        </button>

        <p style={{ fontSize: 14, color: "var(--muted)", textAlign: "center" }}>
          Already have an account? <Link href="/login" style={{ fontWeight: 600 }}>Log in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
