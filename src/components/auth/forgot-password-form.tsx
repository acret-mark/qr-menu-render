"use client";

import { useState } from "react";
import { requestPasswordResetAction } from "@/lib/auth/password-reset";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    setFieldError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFieldError("Email is required.");
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setFieldError("Enter a valid email address.");
      return;
    }

    setStatus("sending");
    const result = await requestPasswordResetAction(trimmedEmail);
    setMessage(result.message);
    setStatus("sent");
  }

  if (status === "sent") {
    return <p className="mt-6 text-center text-sm text-muted-foreground">{message}</p>;
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
          placeholder="you@business.com"
          className={cn(
            "h-11 rounded-lg border border-border bg-background px-3.5 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            fieldError && "border-destructive"
          )}
          aria-invalid={!!fieldError}
        />
        {fieldError && <span className="text-xs text-destructive">{fieldError}</span>}
      </div>

      <Button type="submit" size="lg" disabled={status === "sending"} className="mt-2 h-11 w-full">
        {status === "sending" ? "Sending…" : "Send Reset Link"}
      </Button>
    </form>
  );
}
