import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { checkResetTokenAction } from "@/lib/auth/password-reset";

// specs/033-search-engine-indexing-control FR-009.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Pre-validates the token server-side (checkResetTokenAction — the same
// read-only validity check resetPasswordAction consumes from) before ever
// rendering the password form, matching /confirm-email's own
// ConfirmEmailStatus convention. Without this, an expired/used/invalid
// token still rendered the full form and the owner only learned it was bad
// after typing a new password and submitting.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <ResetPasswordShell>
        <p className="mt-6 text-center text-sm text-destructive">
          This reset link is missing its token. Please request a new one from the{" "}
          <Link href="/forgot-password" className="text-accent">
            forgot password
          </Link>{" "}
          page.
        </p>
      </ResetPasswordShell>
    );
  }

  const tokenCheck = await checkResetTokenAction(token);

  if (!tokenCheck.ok) {
    return (
      <ResetPasswordShell>
        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-destructive">{tokenCheck.message}</p>
          <Link href="/forgot-password" className="text-sm text-accent underline-offset-4 hover:underline">
            Back to forgot password
          </Link>
        </div>
      </ResetPasswordShell>
    );
  }

  return (
    <ResetPasswordShell>
      <ResetPasswordForm token={token} />
    </ResetPasswordShell>
  );
}

function ResetPasswordShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-16 pb-10">
        <div className="flex flex-col items-center text-center">
          <Link href="/">
            <Image src="/logo.png" alt="Hapag" width={128} height={128} priority />
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">Set a new password</p>
        </div>

        {children}
      </div>
    </div>
  );
}
