"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { resetPasswordAction } from "@/lib/auth/password-reset";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MIN_PASSWORD_LENGTH = 8;

type FieldErrors = Partial<Record<"password" | "confirmPassword", string>>;

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);

    const errors: FieldErrors = {};
    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (confirmPassword !== password) {
      errors.confirmPassword = "Passwords do not match.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    const result = await resetPasswordAction(token, password);
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    // FR-004a already revoked every session (including any that existed
    // before this reset) inside resetPasswordAction — send the owner to a
    // fresh sign-in rather than assuming any session survives.
    router.push("/login");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex w-full flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          New password
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
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your new password"
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
        {submitting ? "Updating…" : "Reset Password"}
      </Button>
    </form>
  );
}
