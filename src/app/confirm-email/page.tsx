import Image from "next/image";
import Link from "next/link";
import { ConfirmationPending } from "@/components/auth/confirmation-pending";
import { ConfirmEmailStatus } from "@/components/auth/confirm-email-status";

// specs/011-email-confirmation. Single page, branching on searchParams —
// matches /reset-password's own query-param convention (research.md
// Decision 7) rather than a separate /confirm-email/[token] route:
// ?token=... consumes a link (US2/US3); ?email=... shows the
// confirmation-pending screen right after registration (US1); neither
// falls back to pointing the visitor at registration (FR-009).
export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const { email, token } = await searchParams;

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-16 pb-10">
        <div className="flex flex-col items-center text-center">
          <Link href="/">
            <Image src="/logo.png" alt="Hapag" width={128} height={128} priority />
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">Confirm your account</p>
        </div>

        {token ? (
          <ConfirmEmailStatus token={token} />
        ) : email ? (
          <ConfirmationPending email={email} />
        ) : (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Nothing to confirm here. If you just registered, check your email for a confirmation
            link, or{" "}
            <Link href="/register" className="text-accent">
              start over
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
