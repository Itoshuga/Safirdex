import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = {
  title: "Connexion administration | Safirdex",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await getAdminSession()) {
    redirect("/admin");
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-12">
      <div className="surface-grid pointer-events-none absolute inset-0 opacity-35" />
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>
      <section className="relative w-full max-w-md rounded-xl border bg-card/95 p-7 shadow-[0_28px_80px_-40px_rgba(15,23,42,0.5)] backdrop-blur sm:p-9">
        <div className="mb-8">
          <Link
            href="/"
            className="relative mb-6 block size-11 overflow-hidden bg-foreground"
            aria-label="Retour à Safirdex"
          >
            <span className="absolute -right-3 -bottom-3 size-8 rotate-45 bg-safir" />
          </Link>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.08em] text-safir uppercase">
            <ShieldCheck className="size-4" /> Zone sécurisée
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-[-0.04em]">
            Safirdex Admin
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Connecte-toi avec un compte disposant du rôle administrateur Firebase.
          </p>
        </div>
        <AdminLoginForm />
      </section>
    </main>
  );
}

