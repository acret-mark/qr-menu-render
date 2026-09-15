import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

// specs/033-search-engine-indexing-control FR-009.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-16 pb-10">
        <div className="flex flex-col items-center text-center">
          <Link href="/">
            <Image src="/logo.png" alt="Hapag" width={128} height={128} priority />
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">Set a new password</p>
        </div>

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p className="mt-6 text-center text-sm text-destructive">
            This reset link is missing its token. Please request a new one from the{" "}
            <Link href="/forgot-password" className="text-accent">
              forgot password
            </Link>{" "}
            page.
          </p>
        )}
      </div>
    </div>
  );
}
