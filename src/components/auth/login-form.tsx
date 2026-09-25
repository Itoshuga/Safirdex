"use client";

import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ArrowRight, KeyRound, LoaderCircle, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getFirebaseAuth } from "@/lib/firebase/client";

function getLoginMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password"
    ) {
      return "Email or password is incorrect.";
    }

    if (error.code === "auth/too-many-requests") {
      return "Too many attempts. Please wait before trying again.";
    }

    return "Sign in is temporarily unavailable. Please try again.";
  }

  return error instanceof Error
    ? error.message
    : "Sign in failed. Please try again.";
}

export function AdminLoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    try {
      const credential = await signInWithEmailAndPassword(
        getFirebaseAuth(),
        String(formData.get("email")),
        String(formData.get("password")),
      );
      const idToken = await credential.user.getIdToken(true);
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message ?? "Administrator access was refused.");
      }

      router.replace("/admin");
      router.refresh();
    } catch (loginError) {
      setError(getLoginMessage(loginError));
      setPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="admin-input pl-10"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <KeyRound className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="admin-input pl-10"
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={pending}
          />
        </div>
      </div>
      {error ? (
        <p className="rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button className="h-11 w-full" type="submit" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}
        {pending ? "Signing in…" : "Sign in to Admin"}
      </Button>
    </form>
  );
}
