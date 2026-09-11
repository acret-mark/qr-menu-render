import Image from "next/image";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/login-form";

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-16 pb-10">
        <div className="flex flex-col items-center text-center">
          <Link href="/">
            <Image src="/logo.png" alt="Hapag" width={128} height={128} priority />
          </Link>
          <h1 className="mt-3 font-heading text-2xl font-semibold">Admin</h1>
        </div>

        <AdminLoginForm />
      </div>
    </div>
  );
}
