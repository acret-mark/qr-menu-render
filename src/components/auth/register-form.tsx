"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { registerAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Partial<
  Record<"businessName" | "email" | "password" | "confirmPassword", string>
>;

function validate(values: {
  businessName: string;
  email: string;
  password: string;
  confirmPassword: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.businessName.trim()) {
    errors.businessName = "Business name is required.";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export function RegisterForm() {
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validate({ businessName, email, password, confirmPassword });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    // registerAction redirects on success; only returns here on failure.
    const result = await registerAction({
      businessName: businessName.trim(),
      email: email.trim(),
      password,
    });
    setSubmitting(false);

    if (!result.ok) {
      if (result.stage === "duplicate-email") {
        setFieldErrors({ email: result.message });
      } else {
        setFormError(result.message);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex w-full flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="biz-name" className="text-sm font-medium">
          Business name
        </label>
        <input
          id="biz-name"
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="e.g. The Manila Table"
          className={cn(
            "h-11 rounded-lg border border-border bg-background px-3.5 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            fieldErrors.businessName && "border-destructive"
          )}
          aria-invalid={!!fieldErrors.businessName}
        />
        {fieldErrors.businessName && (
          <span className="text-xs text-destructive">{fieldErrors.businessName}</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@business.com"
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
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm-password" className="text-sm font-medium">
          Confirm password
        </label>
        <input
          id="confirm-password"
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
          className={cn(
            "h-11 rounded-lg border border-border bg-background px-3.5 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            fieldErrors.confirmPassword && "border-destructive"
          )}
          aria-invalid={!!fieldErrors.confirmPassword}
        />
        {fieldErrors.confirmPassword && (
          <span className="text-xs text-destructive">{fieldErrors.confirmPassword}</span>
        )}
      </div>

      {formError && (
        <div className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {formError}
        </div>
      )}

      <Button type="submit" size="lg" disabled={submitting} className="mt-2 h-11 w-full">
        {submitting ? "Creating account…" : "Create Account"}
      </Button>

      <div className="mt-2 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </div>
    </form>
  );
}
