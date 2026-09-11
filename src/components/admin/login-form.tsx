"use client";

import { useState } from "react";
import { adminLoginAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FieldErrors = Partial<Record<"email" | "password", string>>;

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);

    const errors: FieldErrors = {};
    if (!email.trim()) errors.email = "Email is required.";
    if (!password) errors.password = "Password is required.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    const result = await adminLoginAction(email.trim(), password);
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex w-full flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={cn(
            "h-11 rounded-lg border border-border bg-background px-3.5 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            fieldErrors.email && "border-destructive"
          )}
          aria-invalid={!!fieldErrors.email}
        />
        {fieldErrors.email && <span className="text-xs text-destructive">{fieldErrors.email}</span>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={cn(
            "h-11 rounded-lg border border-border bg-background px-3.5 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            fieldErrors.password && "border-destructive"
          )}
          aria-invalid={!!fieldErrors.password}
        />
        {fieldErrors.password && (
          <span className="text-xs text-destructive">{fieldErrors.password}</span>
        )}
      </div>

      {formError && (
        <div className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {formError}
        </div>
      )}

      <Button type="submit" size="lg" disabled={submitting} className="mt-2 h-11 w-full">
        {submitting ? "Signing in…" : "Log In"}
      </Button>
    </form>
  );
}
