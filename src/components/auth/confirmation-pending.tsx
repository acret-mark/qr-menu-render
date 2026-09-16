"use client";

import { useState } from "react";
import Link from "next/link";
import { requestEmailConfirmation } from "@/lib/auth/email-confirmation";
import { Button } from "@/components/ui/button";

// "Check your email" screen (specs/011-email-confirmation FR-001/FR-002).
// No email in context (FR-009) is handled by the parent page, which never
// renders this component in that case.
export function ConfirmationPending({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleResend() {
    if (status === "sending") return;
    setStatus("sending");
    setMessage(null);

    const result = await requestEmailConfirmation(email);

    setStatus("idle");
    setMessage(result.message);
  }

  return (
    <div className="mt-6 flex flex-col items-center gap-4 text-center">
      <p className="text-sm text-muted-foreground">
        We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>
        . Follow it to finish setting up your account.
      </p>

      <Button
        type="button"
        variant="outline"
        size="lg"
        disabled={status === "sending"}
        onClick={handleResend}
        className="h-11 w-full"
      >
        {status === "sending" ? "Sending…" : "Resend email"}
      </Button>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Link href="/login" className="text-sm text-accent underline-offset-4 hover:underline">
        Back to login
      </Link>
    </div>
  );
}
