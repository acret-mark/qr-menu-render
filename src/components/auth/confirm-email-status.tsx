"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { confirmEmailAction, requestEmailConfirmation } from "@/lib/auth/email-confirmation";
import { completeEmailConfirmation } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

type Status = "confirming" | "invalid" | "transient";

// Consumes a confirmation link (specs/011-email-confirmation FR-004–FR-006a).
// confirmEmailAction (research.md Decision 6) is a read-only pre-check —
// the real consumption (delete token, set emailVerified, establish a
// session) happens inside completeEmailConfirmation -> auth.config.ts's
// authorize(), the single mutating step. A successful sign-in throws
// NEXT_REDIRECT to /business-profile, so this component only ever renders
// a failure state, never a "success" one.
export function ConfirmEmailStatus({ token }: { token: string }) {
  const [status, setStatus] = useState<Status>("confirming");
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const check = await confirmEmailAction(token);
      if (cancelled) return;

      if (!check.ok) {
        setStatus(check.reason);
        setResendEmail(check.email ?? null);
        return;
      }

      setResendEmail(check.email);
      const result = await completeEmailConfirmation(token, check.email);
      if (cancelled) return;
      // completeEmailConfirmation only ever returns on failure — success
      // throws NEXT_REDIRECT before reaching here.
      void result;
      setStatus("invalid");
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleResend() {
    if (!resendEmail) return;
    const result = await requestEmailConfirmation(resendEmail);
    setResendMessage(result.message);
  }

  if (status === "confirming") {
    return (
      <p className="mt-6 text-center text-sm text-muted-foreground">Confirming your account…</p>
    );
  }

  if (status === "transient") {
    return (
      <div className="mt-6 flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col items-center gap-4 text-center">
      <p className="text-sm text-destructive">
        This confirmation link is no longer valid.
      </p>
      {resendEmail && (
        <Button type="button" variant="outline" size="lg" onClick={handleResend} className="h-11 w-full">
          Resend email
        </Button>
      )}
      {resendMessage && <p className="text-sm text-muted-foreground">{resendMessage}</p>}
      <Link href="/register" className="text-sm text-accent underline-offset-4 hover:underline">
        Back to registration
      </Link>
    </div>
  );
}
