"use client";

import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useCallback, useState } from "react";

import { FormActions } from "@/components/admin/form-actions";
import { FormSection } from "@/components/admin/form-section";
import type { AdminActionState } from "@/features/admin/action-state";
import { INITIAL_ADMIN_ACTION_STATE } from "@/features/admin/action-state";
import type { ModeratedUserRole } from "@/features/admin/users/types";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useRouter } from "@/i18n/navigation";

type UserAction = (
  state: AdminActionState,
  formData: FormData,
) => Promise<AdminActionState>;

export function AdminUserForm({
  action,
  initial,
  isCurrentUser,
}: {
  action: UserAction;
  initial: {
    username: string;
    displayName: string;
    bio: string;
    role: ModeratedUserRole;
  };
  isCurrentUser: boolean;
}) {
  const t = useTranslations("Admin.users.form");
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  const submitAction = useCallback(
    async (previous: AdminActionState, formData: FormData) => {
      const result = await action(previous, formData);
      if (result.status === "success") {
        setDirty(false);
        router.refresh();
      }
      return result;
    },
    [action, router],
  );
  const [state, formAction, pending] = useActionState(
    submitAction,
    INITIAL_ADMIN_ACTION_STATE,
  );
  useUnsavedChanges(dirty && !pending);

  return (
    <form
      action={formAction}
      className="space-y-5"
      onChangeCapture={() => setDirty(true)}
    >
      {state.status === "error" ? (
        <div
          className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/7 p-3 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </div>
      ) : null}
      {state.status === "success" ? (
        <div
          className="flex items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/7 p-3 text-sm text-emerald-700 dark:text-emerald-400"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </div>
      ) : null}

      <FormSection title={t("identityTitle")} description={t("identityDescription")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="admin-label" htmlFor="admin-user-username">
              {t("username")}
            </label>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">@</span>
              <input
                id="admin-user-username"
                name="username"
                className="admin-input pl-8"
                defaultValue={initial.username}
                minLength={3}
                maxLength={24}
                pattern="[A-Za-z0-9._-]+"
                required
                aria-invalid={Boolean(state.fieldErrors?.username)}
              />
            </div>
            <p className={state.fieldErrors?.username ? "admin-error" : "admin-help"}>
              {state.fieldErrors?.username ?? t("usernameHelp")}
            </p>
          </div>
          <div className="space-y-2">
            <label className="admin-label" htmlFor="admin-user-display-name">
              {t("displayName")}
            </label>
            <input
              id="admin-user-display-name"
              name="displayName"
              className="admin-input"
              defaultValue={initial.displayName}
              minLength={2}
              maxLength={40}
              required
              aria-invalid={Boolean(state.fieldErrors?.displayName)}
            />
            {state.fieldErrors?.displayName ? (
              <p className="admin-error">{state.fieldErrors.displayName}</p>
            ) : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <label className="admin-label" htmlFor="admin-user-bio">
                {t("bio")}
              </label>
              <span className="text-[11px] text-muted-foreground">{t("bioLimit")}</span>
            </div>
            <textarea
              id="admin-user-bio"
              name="bio"
              className="admin-input min-h-28 resize-y py-3"
              defaultValue={initial.bio}
              maxLength={280}
              aria-invalid={Boolean(state.fieldErrors?.bio)}
            />
            {state.fieldErrors?.bio ? (
              <p className="admin-error">{state.fieldErrors.bio}</p>
            ) : null}
          </div>
        </div>
      </FormSection>

      <FormSection title={t("roleTitle")} description={t("roleDescription")}>
        <div className="max-w-md space-y-2">
          <label className="admin-label" htmlFor="admin-user-role">
            {t("role")}
          </label>
          <select
            id="admin-user-role"
            name="role"
            className="admin-input"
            defaultValue={initial.role}
          >
            <option value="user">{t("roles.user")}</option>
            <option value="admin">{t("roles.admin")}</option>
          </select>
          <p className="admin-help">{t("roleHelp")}</p>
          {isCurrentUser ? (
            <p className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/7 p-3 text-xs leading-5 text-amber-800 dark:text-amber-300">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              {t("selfRoleWarning")}
            </p>
          ) : null}
        </div>
      </FormSection>

      <FormActions
        cancelHref="/admin/users"
        pending={pending}
        label={t("save")}
      />
    </form>
  );
}
