import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-16 pb-10">
        <div className="flex flex-col items-center text-center">
          <Link href="/">
            <Image src="/logo.png" alt="Hapag" width={128} height={128} priority />
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">Welcome back</p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to Hapag?{" "}
          <Link href="/register" className="text-accent">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
