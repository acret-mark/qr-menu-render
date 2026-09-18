"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { adminLoginAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FieldErrors = Partial<Record<"email" | "password", string>>;

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
          placeholder="you@acret-ph.com"
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
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className={cn(
              "h-11 w-full rounded-lg border border-border bg-background px-3.5 pr-11 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              fieldErrors.password && "border-destructive"
            )}
            aria-invalid={!!fieldErrors.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {fieldErrors.password && (
          <span className="text-xs text-destructive">{fieldErrors.password}</span>
        )}
      </div>

      {formError && (
        <div className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {formError}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        aria-busy={submitting}
        className="mt-2 h-11 w-full gap-2"
      >
        {submitting && <Loader2 size={16} className="animate-spin" aria-hidden />}
        {submitting ? "Signing in…" : "Sign In"}
      </Button>

      <p className="mt-2 text-center text-xs text-muted-foreground">
        Internal ACRET staff access only.
      </p>
    </form>
  );
}
