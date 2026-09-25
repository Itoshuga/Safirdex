"use client";

import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";

type AuthMode = "signin" | "signup";

function getAuthMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "Un compte utilise déjà cette adresse e-mail.";
      case "auth/invalid-email":
        return "Cette adresse e-mail n’est pas valide.";
      case "auth/weak-password":
        return "Le mot de passe n’est pas assez robuste.";
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "L’adresse e-mail ou le mot de passe est incorrect.";
      case "auth/too-many-requests":
        return "Trop de tentatives. Réessaie dans quelques minutes.";
      case "auth/network-request-failed":
        return "La connexion au service est impossible. Vérifie ton réseau.";
      default:
        return "L’authentification est momentanément indisponible.";
    }
  }

  return error instanceof Error
    ? error.message
    : "Une erreur inattendue est survenue.";
}

export function AccountAuthForm({ initialMode }: { initialMode: AuthMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function selectMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setNotice("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setNotice("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const displayName = String(formData.get("displayName") ?? "").trim();
    const passwordConfirmation = String(
      formData.get("passwordConfirmation") ?? "",
    );

    if (mode === "signup") {
      if (displayName.length < 2) {
        setError("Ton nom doit contenir au moins 2 caractères.");
        setPending(false);
        return;
      }
      if (
        password.length < 8 ||
        !/[a-zA-ZÀ-ÿ]/.test(password) ||
        !/[0-9]/.test(password)
      ) {
        setError(
          "Choisis un mot de passe d’au moins 8 caractères avec une lettre et un chiffre.",
        );
        setPending(false);
        return;
      }
      if (password !== passwordConfirmation) {
        setError("Les deux mots de passe ne correspondent pas.");
        setPending(false);
        return;
      }
    }

    const auth = getFirebaseAuth();

    try {
      const credential =
        mode === "signup"
          ? await createUserWithEmailAndPassword(auth, email, password)
          : await signInWithEmailAndPassword(auth, email, password);

      if (mode === "signup") {
        await updateProfile(credential.user, { displayName });
        await sendEmailVerification(credential.user).catch(() => undefined);
      }

      const idToken = await credential.user.getIdToken(true);
      const response = await fetch("/api/auth/user-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idToken,
          ...(mode === "signup" ? { displayName } : {}),
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        await signOut(auth);
        throw new Error(body.message ?? "La session n’a pas pu être créée.");
      }

      router.replace(mode === "signup" ? "/account?welcome=1" : "/account");
      router.refresh();
    } catch (authError) {
      setError(getAuthMessage(authError));
      setPending(false);
    }
  }

  async function handlePasswordReset(form: HTMLFormElement) {
    const email = String(new FormData(form).get("email") ?? "").trim();

    if (!email) {
      setError("Saisis ton adresse e-mail avant de continuer.");
      return;
    }

    setPending(true);
    setError("");
    setNotice("");

    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email);
      setNotice(
        "Si un compte correspond à cette adresse, un lien de réinitialisation vient d’être envoyé.",
      );
    } catch (resetError) {
      setError(getAuthMessage(resetError));
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div
        className="grid grid-cols-2 border-b"
        role="tablist"
        aria-label="Choisir le mode d’authentification"
      >
        {([
          ["signin", "Connexion"],
          ["signup", "Créer un compte"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => selectMode(value)}
            className={cn(
              "relative h-14 px-4 text-sm font-semibold text-muted-foreground transition hover:text-foreground",
              mode === value &&
                "text-foreground after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:bg-safir",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-6 sm:p-8">
        <div className="mb-7">
          <p className="mb-2 text-xs font-semibold tracking-[0.08em] text-safir uppercase">
            {mode === "signin" ? "Heureux de te revoir" : "Rejoins le Codex"}
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            {mode === "signin" ? "Connecte-toi" : "Crée ton compte"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {mode === "signin"
              ? "Retrouve ta collection Safir sur tous tes appareils."
              : "Prépare ta collection personnelle et retrouve tes cartes en un instant."}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "signup" ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="displayName">
                Nom affiché
              </label>
              <div className="relative">
                <UserRound className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="admin-input h-11 pl-10"
                  id="displayName"
                  name="displayName"
                  autoComplete="name"
                  minLength={2}
                  maxLength={80}
                  required
                  disabled={pending}
                  placeholder="Ton nom ou pseudo"
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="email">
              Adresse e-mail
            </label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="admin-input h-11 pl-10"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={pending}
                placeholder="nom@exemple.fr"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium" htmlFor="password">
                Mot de passe
              </label>
              {mode === "signin" ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={(event) =>
                    handlePasswordReset(event.currentTarget.form!)
                  }
                  className="text-xs font-medium text-safir hover:underline disabled:pointer-events-none disabled:opacity-50"
                >
                  Mot de passe oublié ?
                </button>
              ) : null}
            </div>
            <div className="relative">
              <LockKeyhole className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="admin-input h-11 px-10"
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                minLength={mode === "signup" ? 8 : undefined}
                required
                disabled={pending}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute top-1/2 right-2.5 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          {mode === "signup" ? (
            <>
              <div className="space-y-1.5">
                <label
                  className="text-sm font-medium"
                  htmlFor="passwordConfirmation"
                >
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Check className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className="admin-input h-11 pl-10"
                    id="passwordConfirmation"
                    name="passwordConfirmation"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    disabled={pending}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                8 caractères minimum, avec au moins une lettre et un chiffre.
              </p>
            </>
          ) : null}

          <div aria-live="polite">
            {error ? (
              <p className="rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            {notice ? (
              <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/8 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-300">
                {notice}
              </p>
            ) : null}
          </div>

          <Button
            className="mt-2 h-11 w-full text-sm"
            type="submit"
            disabled={pending}
          >
            {pending ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <ArrowRight />
            )}
            {pending
              ? "Un instant…"
              : mode === "signin"
                ? "Se connecter"
                : "Créer mon compte"}
          </Button>

          {mode === "signup" ? (
            <p className="text-center text-[0.68rem] leading-5 text-muted-foreground">
              Tes identifiants sont protégés et gérés par Firebase Authentication.
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
