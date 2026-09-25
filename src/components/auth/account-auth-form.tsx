"use client";

import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  ArrowRight,
  AtSign,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MailCheck,
  RotateCw,
  UserRound,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";

type AuthMode = "signin" | "signup";
type SignupStep = "credentials" | "verification" | "profile";
type SessionResult = "redirected" | "verification" | "profile";

interface ApiResponse {
  code?: string;
  isAdmin?: boolean;
  message?: string;
}

type AuthErrorKey =
  | "errors.emailInUse"
  | "errors.invalidEmail"
  | "errors.weakPassword"
  | "errors.invalidCredential"
  | "errors.tooManyRequests"
  | "errors.network"
  | "errors.unavailable"
  | "errors.unexpected";

function getAuthMessage(error: unknown, translate: (key: AuthErrorKey) => string) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return translate("errors.emailInUse");
      case "auth/invalid-email":
        return translate("errors.invalidEmail");
      case "auth/weak-password":
        return translate("errors.weakPassword");
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return translate("errors.invalidCredential");
      case "auth/too-many-requests":
        return translate("errors.tooManyRequests");
      case "auth/network-request-failed":
        return translate("errors.network");
      default:
        return translate("errors.unavailable");
    }
  }

  return error instanceof Error ? error.message : translate("errors.unexpected");
}

async function initializeAccount(user: User, fallbackMessage: string) {
  const idToken = await user.getIdToken(true);
  const response = await fetch("/api/auth/onboarding", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "initialize", idToken }),
  });

  if (!response.ok) {
    throw new Error(fallbackMessage);
  }
}

export function AccountAuthForm({ initialMode }: { initialMode: AuthMode }) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();
  const authActionRunning = useRef(false);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [signupStep, setSignupStep] =
    useState<SignupStep>("credentials");
  const [accountEmail, setAccountEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const establishSession = useCallback(
    async (user: User): Promise<SessionResult> => {
      const idToken = await user.getIdToken(true);
      const response = await fetch("/api/auth/user-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const body = (await response.json()) as ApiResponse;

      if (body.code === "EMAIL_NOT_VERIFIED") {
        setMode("signup");
        setSignupStep("verification");
        setAccountEmail(user.email ?? "");
        return "verification";
      }
      if (body.code === "ONBOARDING_REQUIRED") {
        setMode("signup");
        setSignupStep("profile");
        setAccountEmail(user.email ?? "");
        return "profile";
      }
      if (!response.ok) {
        throw new Error(t("errors.sessionCreation"));
      }

      router.replace(body.isAdmin ? "/admin" : "/account");
      router.refresh();
      return "redirected";
    },
    [router, t],
  );

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      if (!user || authActionRunning.current) return;

      authActionRunning.current = true;
      setPending(true);
      setAccountEmail(user.email ?? "");

      void initializeAccount(user, t("errors.accountInitialization"))
        .then(async () => {
          if (!user.emailVerified) {
            setMode("signup");
            setSignupStep("verification");
            return;
          }
          await establishSession(user);
        })
        .catch((authError: unknown) =>
          setError(getAuthMessage(authError, (key) => t(key))),
        )
        .finally(() => {
          authActionRunning.current = false;
          setPending(false);
        });
    });
  }, [establishSession, t]);

  async function selectMode(nextMode: AuthMode) {
    if (mode === nextMode && signupStep === "credentials") return;

    authActionRunning.current = true;
    await signOut(getFirebaseAuth()).catch(() => undefined);
    authActionRunning.current = false;
    setMode(nextMode);
    setSignupStep("credentials");
    setAccountEmail("");
    setError("");
    setNotice("");
  }

  async function handleCredentials(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setNotice("");
    authActionRunning.current = true;

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const passwordConfirmation = String(
      formData.get("passwordConfirmation") ?? "",
    );

    if (
      mode === "signup" &&
      (password.length < 8 ||
        !/[a-zA-ZÀ-ÿ]/.test(password) ||
        !/[0-9]/.test(password))
    ) {
      setError(
        t("validation.weakPassword"),
      );
      setPending(false);
      authActionRunning.current = false;
      return;
    }
    if (mode === "signup" && password !== passwordConfirmation) {
      setError(t("validation.passwordMismatch"));
      setPending(false);
      authActionRunning.current = false;
      return;
    }

    const auth = getFirebaseAuth();
    auth.languageCode = locale;

    try {
      const credential =
        mode === "signup"
          ? await createUserWithEmailAndPassword(auth, email, password)
          : await signInWithEmailAndPassword(auth, email, password);

      await initializeAccount(credential.user, t("errors.accountInitialization"));
      setAccountEmail(credential.user.email ?? email);

      if (mode === "signup") {
        await sendEmailVerification(credential.user);
        setSignupStep("verification");
        setNotice(t("notices.verificationSent"));
      } else if (!credential.user.emailVerified) {
        setMode("signup");
        setSignupStep("verification");
      } else {
        await establishSession(credential.user);
      }
    } catch (authError) {
      setError(getAuthMessage(authError, (key) => t(key)));
    } finally {
      setPending(false);
      authActionRunning.current = false;
    }
  }

  async function confirmEmailVerification() {
    const user = getFirebaseAuth().currentUser;

    if (!user) {
      setError(t("errors.sessionExpired"));
      return;
    }

    setPending(true);
    setError("");
    setNotice("");
    authActionRunning.current = true;

    try {
      await reload(user);
      if (!user.emailVerified) {
        setError(
          t("errors.emailNotVerified"),
        );
        return;
      }

      await user.getIdToken(true);
      await initializeAccount(user, t("errors.accountInitialization"));
      await establishSession(user);
    } catch (authError) {
      setError(getAuthMessage(authError, (key) => t(key)));
    } finally {
      setPending(false);
      authActionRunning.current = false;
    }
  }

  async function resendVerificationEmail() {
    const auth = getFirebaseAuth();
    auth.languageCode = locale;
    const user = auth.currentUser;

    if (!user) {
      setError(t("errors.sessionExpired"));
      return;
    }

    setPending(true);
    setError("");
    setNotice("");

    try {
      await sendEmailVerification(user);
      setNotice(t("notices.verificationResent"));
    } catch (authError) {
      setError(getAuthMessage(authError, (key) => t(key)));
    } finally {
      setPending(false);
    }
  }

  async function completeProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const user = getFirebaseAuth().currentUser;

    if (!user) {
      setError(t("errors.sessionExpired"));
      return;
    }

    const formData = new FormData(event.currentTarget);
    const pseudonym = String(formData.get("pseudonym") ?? "").trim();
    const displayName = String(formData.get("displayName") ?? "").trim();

    setPending(true);
    setError("");
    setNotice("");
    authActionRunning.current = true;

    try {
      await reload(user);
      if (!user.emailVerified) {
        setSignupStep("verification");
        setError(t("errors.emailRequired"));
        return;
      }

      const idToken = await user.getIdToken(true);
      const response = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          idToken,
          pseudonym,
          displayName,
        }),
      });
      const body = (await response.json()) as ApiResponse;

      if (body.code === "PSEUDONYM_TAKEN") {
        setError(t("errors.pseudonymTaken"));
        return;
      }
      if (body.code === "DISPLAY_NAME_TAKEN") {
        setError(t("errors.displayNameTaken"));
        return;
      }
      if (!response.ok) {
        throw new Error(t("errors.profileSave"));
      }

      await reload(user);
      await user.getIdToken(true);
      await establishSession(user);
    } catch (authError) {
      setError(getAuthMessage(authError, (key) => t(key)));
    } finally {
      setPending(false);
      authActionRunning.current = false;
    }
  }

  async function handlePasswordReset(form: HTMLFormElement) {
    const email = String(new FormData(form).get("email") ?? "").trim();

    if (!email) {
      setError(t("validation.emailRequiredForReset"));
      return;
    }

    setPending(true);
    setError("");
    setNotice("");

    try {
      const auth = getFirebaseAuth();
      auth.languageCode = locale;
      await sendPasswordResetEmail(auth, email);
      setNotice(t("notices.passwordReset"));
    } catch (resetError) {
      setError(getAuthMessage(resetError, (key) => t(key)));
    } finally {
      setPending(false);
    }
  }

  const title =
    mode === "signin"
      ? t("headings.signinTitle")
      : signupStep === "credentials"
        ? t("headings.signupTitle")
        : signupStep === "verification"
          ? t("headings.verificationTitle")
          : t("headings.profileTitle");
  const description =
    mode === "signin"
      ? t("headings.signinDescription")
      : signupStep === "credentials"
        ? t("headings.signupDescription")
        : signupStep === "verification"
          ? t("headings.verificationDescription", { email: accountEmail })
          : t("headings.profileDescription");

  return (
    <div>
      <div
        className="grid grid-cols-2 border-b"
        role="tablist"
        aria-label={t("tabs.label")}
      >
        {([
          ["signin", t("tabs.signin")],
          ["signup", t("tabs.signup")],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => void selectMode(value)}
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
        {mode === "signup" ? (
          <div className="mb-7 grid grid-cols-3 gap-2" aria-label={t("steps.label")}>
            {[
              ["credentials", t("steps.credentials")],
              ["verification", t("steps.verification")],
              ["profile", t("steps.profile")],
            ].map(([step, label], index) => {
              const steps: SignupStep[] = [
                "credentials",
                "verification",
                "profile",
              ];
              const currentIndex = steps.indexOf(signupStep);
              const stepIndex = steps.indexOf(step as SignupStep);
              return (
                <div key={step} className="min-w-0">
                  <span
                    className={cn(
                      "mb-2 block h-0.5 bg-border",
                      stepIndex <= currentIndex && "bg-safir",
                    )}
                  />
                  <p
                    className={cn(
                      "truncate text-[0.62rem] font-semibold text-muted-foreground",
                      stepIndex === currentIndex && "text-foreground",
                    )}
                  >
                    0{index + 1} {label}
                  </p>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="mb-7">
          <p className="mb-2 text-xs font-semibold tracking-[0.08em] text-safir uppercase">
            {mode === "signin" ? t("headings.signinEyebrow") : t("headings.signupEyebrow")}
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>

        {mode === "signup" && signupStep === "verification" ? (
          <div className="space-y-4">
            <div className="grid min-h-32 place-items-center rounded-lg border bg-muted/35 text-center">
              <div>
                <span className="mx-auto mb-3 grid size-10 place-items-center rounded-lg bg-safir/10 text-safir">
                  <MailCheck className="size-5" />
                </span>
                <p className="text-sm font-semibold">{t("verification.inbox")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("verification.spam")}</p>
              </div>
            </div>
            <Button
              type="button"
              className="h-11 w-full"
              disabled={pending}
              onClick={confirmEmailVerification}
            >
              {pending ? <LoaderCircle className="animate-spin" /> : <Check />}
              {t("actions.verified")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full"
              disabled={pending}
              onClick={resendVerificationEmail}
            >
              <RotateCw /> {t("actions.resend")}
            </Button>
          </div>
        ) : mode === "signup" && signupStep === "profile" ? (
          <form className="space-y-4" onSubmit={completeProfile}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="pseudonym">
                {t("fields.pseudonym")}
              </label>
              <div className="relative">
                <AtSign className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="admin-input h-11 pl-10"
                  id="pseudonym"
                  name="pseudonym"
                  autoComplete="username"
                  minLength={3}
                  maxLength={24}
                  pattern="[A-Za-zÀ-ÿ0-9._-]+"
                  required
                  disabled={pending}
                  placeholder={t("fields.pseudonymPlaceholder")}
                />
              </div>
              <p className="text-[0.68rem] leading-5 text-muted-foreground">
                {t("fields.pseudonymHelp")}
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="displayName">
                {t("fields.displayName")}
              </label>
              <div className="relative">
                <UserRound className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="admin-input h-11 pl-10"
                  id="displayName"
                  name="displayName"
                  autoComplete="name"
                  minLength={2}
                  maxLength={40}
                  required
                  disabled={pending}
                  placeholder={t("fields.displayNamePlaceholder")}
                />
              </div>
              <p className="text-[0.68rem] leading-5 text-muted-foreground">
                {t("fields.displayNameHelp")}
              </p>
            </div>
            <Button className="mt-2 h-11 w-full" type="submit" disabled={pending}>
              {pending ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}
              {t("actions.complete")}
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleCredentials}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="email">
                {t("fields.email")}
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
                  placeholder={t("fields.emailPlaceholder")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-4">
                <label className="text-sm font-medium" htmlFor="password">
                  {t("fields.password")}
                </label>
                {mode === "signin" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={(event) => handlePasswordReset(event.currentTarget.form!)}
                    className="text-xs font-medium text-safir hover:underline disabled:pointer-events-none disabled:opacity-50"
                  >
                    {t("actions.forgotPassword")}
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
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  minLength={mode === "signup" ? 8 : undefined}
                  required
                  disabled={pending}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute top-1/2 right-2.5 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label={showPassword ? t("fields.hidePassword") : t("fields.showPassword")}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {mode === "signup" ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="passwordConfirmation">
                    {t("fields.passwordConfirmation")}
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
                  {t("fields.passwordHelp")}
                </p>
              </>
            ) : null}

            <Button className="mt-2 h-11 w-full" type="submit" disabled={pending}>
              {pending ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}
              {pending
                ? t("actions.pending")
                : mode === "signin"
                  ? t("actions.signin")
                  : t("actions.signup")}
            </Button>
          </form>
        )}

        <div className="mt-4" aria-live="polite">
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

        {mode === "signup" ? (
          <p className="mt-5 text-center text-[0.68rem] leading-5 text-muted-foreground">
            {t("securityNote")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
