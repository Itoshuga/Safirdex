import {
  CalendarDays,
  CheckCircle2,
  CircleOff,
  CopyPlus,
  Eye,
  KeyRound,
  Languages,
  Mail,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AdminBreadcrumbTitle } from "@/components/admin/admin-breadcrumbs";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from "@/components/admin/admin-table";
import { AdminUserForm } from "@/components/admin/admin-user-form";
import { AdminUserPasswordReset } from "@/components/admin/admin-user-password-reset";
import { FormSection } from "@/components/admin/form-section";
import { StorageImage } from "@/components/admin/storage-image";
import { ProfileAvatar } from "@/components/community/profile-avatar";
import { Badge } from "@/components/ui/badge";
import { updateModeratedUserAction } from "@/features/admin/users/server/actions";
import { getAdminUserDetail } from "@/features/admin/users/server/user-moderation-service";
import { Link } from "@/i18n/navigation";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { LOCALE_CONFIG, type AppLocale } from "@/lib/i18n/locales";

function formatDate(
  value: string | null,
  locale: AppLocale,
  includeTime = false,
) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(LOCALE_CONFIG[locale].dateLocale, {
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short" } : {}),
  }).format(new Date(value));
}

function providerLabel(provider: string) {
  if (provider === "password") return "Email / Password";
  if (provider === "google.com") return "Google";
  return provider;
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getAdminLocale();
  const [t, user] = await Promise.all([
    getTranslations("Admin.users"),
    getAdminUserDetail(id, locale),
  ]);
  if (!user) notFound();
  const title = user.displayName || user.email || user.uid;

  return (
    <>
      <AdminBreadcrumbTitle title={title} />
      <AdminPageHeader
        eyebrow={t("detail.eyebrow")}
        title={title}
        description={t("detail.description")}
      />

      <section className="mb-6 overflow-hidden rounded-xl border bg-[linear-gradient(145deg,color-mix(in_oklch,var(--safir)_10%,var(--card)),var(--card)_66%)] p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <ProfileAvatar
            src={user.avatarUrl}
            name={title}
            className="size-20 border-4 shadow-md"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-heading text-2xl font-semibold tracking-[-0.03em]">
                {title}
              </h2>
              <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                {user.role === "admin" ? <ShieldCheck /> : <UserRound />}
                {t(`roles.${user.role}`)}
              </Badge>
              <Badge variant={user.disabled ? "destructive" : "outline"}>
                {user.disabled ? <CircleOff /> : <CheckCircle2 />}
                {user.disabled ? t("disabled") : t("active")}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {user.username ? `@${user.username}` : t("missingUsername")}
              {user.email ? ` · ${user.email}` : ""}
            </p>
            {user.username ? (
              <Link
                href={`/user/@${user.username}`}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-safir hover:underline"
              >
                <Eye className="size-3.5" />
                {t("detail.viewPublicProfile")}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">{t("stats.uniqueCards")}</p>
          <p className="mt-2 font-heading text-2xl font-semibold">{user.collection.uniqueOwnedCards}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("stats.completion", { value: user.collection.completionPercentage.toFixed(1) })}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">{t("stats.totalCopies")}</p>
          <p className="mt-2 font-heading text-2xl font-semibold">{user.collection.totalOwnedCopies}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("stats.duplicates", { count: user.collection.duplicateCopies })}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">{t("stats.decks")}</p>
          <p className="mt-2 font-heading text-2xl font-semibold">{user.profileStats.decksCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("stats.trades", { count: user.collection.tradeCopies })}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">{t("stats.community")}</p>
          <p className="mt-2 font-heading text-2xl font-semibold">{user.profileStats.followersCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("stats.following", { count: user.profileStats.followingCount })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
        <AdminUserForm
          action={updateModeratedUserAction.bind(null, user.uid)}
          initial={{
            username: user.username,
            displayName: user.displayName,
            bio: user.bio,
            role: user.role,
          }}
          isCurrentUser={user.isCurrentUser}
        />

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <FormSection title={t("detail.accountTitle")} description={t("detail.accountDescription")}>
            <dl className="divide-y rounded-lg border">
              <div className="flex items-start gap-3 px-3 py-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-safir" />
                <div className="min-w-0 flex-1">
                  <dt className="text-xs text-muted-foreground">{t("detail.email")}</dt>
                  <dd className="mt-0.5 break-all text-sm font-medium">{user.email ?? "—"}</dd>
                </div>
                <Badge variant="outline">
                  {user.emailVerified ? t("verified") : t("unverified")}
                </Badge>
              </div>
              <div className="flex items-start gap-3 px-3 py-3">
                <KeyRound className="mt-0.5 size-4 shrink-0 text-safir" />
                <div className="min-w-0 flex-1">
                  <dt className="text-xs text-muted-foreground">{t("detail.providers")}</dt>
                  <dd className="mt-0.5 text-sm font-medium">
                    {user.providers.map(providerLabel).join(" · ") || "—"}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3 px-3 py-3">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-safir" />
                <div className="min-w-0 flex-1">
                  <dt className="text-xs text-muted-foreground">{t("detail.createdAt")}</dt>
                  <dd className="mt-0.5 text-sm font-medium">{formatDate(user.createdAtIso, locale, true)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 px-3 py-3">
                <UserRound className="mt-0.5 size-4 shrink-0 text-safir" />
                <div className="min-w-0 flex-1">
                  <dt className="text-xs text-muted-foreground">{t("detail.lastSignIn")}</dt>
                  <dd className="mt-0.5 text-sm font-medium">{formatDate(user.lastSignInAtIso, locale, true)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 px-3 py-3">
                <Languages className="mt-0.5 size-4 shrink-0 text-safir" />
                <div className="min-w-0 flex-1">
                  <dt className="text-xs text-muted-foreground">{t("detail.locale")}</dt>
                  <dd className="mt-0.5 text-sm font-medium uppercase">{user.preferredLocale ?? "—"}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 px-3 py-3">
                <CopyPlus className="mt-0.5 size-4 shrink-0 text-safir" />
                <div className="min-w-0 flex-1">
                  <dt className="text-xs text-muted-foreground">UID</dt>
                  <dd className="mt-0.5 break-all font-mono text-[11px]">{user.uid}</dd>
                </div>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-1">
              {user.roles.map((role) => (
                <Badge key={role} variant="secondary">{role}</Badge>
              ))}
              {!user.onboardingCompleted ? (
                <Badge variant="outline">{t("onboardingPending")}</Badge>
              ) : null}
            </div>
          </FormSection>

          <FormSection title={t("security.title")} description={t("security.subtitle")}>
            <AdminUserPasswordReset
              email={user.email}
              supportsPassword={user.supportsPassword}
            />
          </FormSection>

          {user.visibility ? (
            <FormSection title={t("visibility.title")} description={t("visibility.description")}>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(["publicProfile", "decks", "collection", "activity"] as const).map((key) => {
                  const value = user.visibility?.[key];
                  const visible = value === true || value === "public";
                  return (
                    <div key={key} className="rounded-lg border p-3">
                      <p className="text-muted-foreground">{t(`visibility.fields.${key}`)}</p>
                      <p className="mt-1 font-semibold">
                        {visible ? t("visibility.public") : t("visibility.private")}
                      </p>
                    </div>
                  );
                })}
              </div>
            </FormSection>
          ) : null}
        </aside>
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-col justify-between gap-2 border-b px-5 py-4 sm:flex-row sm:items-end sm:px-6">
          <div>
            <h2 className="font-heading text-xl font-semibold">{t("collection.title")}</h2>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {t("collection.description")}
            </p>
          </div>
          <Badge variant="secondary">
            {t("cardsCount", { count: user.collection.uniqueOwnedCards })}
          </Badge>
        </div>
        {user.collection.items.length === 0 ? (
          <div className="grid min-h-44 place-items-center px-6 py-10 text-center">
            <div>
              <UsersRound className="mx-auto mb-3 size-6 text-muted-foreground" />
              <p className="font-medium">{t("collection.emptyTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("collection.emptyDescription")}</p>
            </div>
          </div>
        ) : (
          <AdminTable className="rounded-none border-0">
            <AdminTableHead>
              <tr>
                <AdminTableHeader>{t("collection.card")}</AdminTableHeader>
                <AdminTableHeader>{t("collection.season")}</AdminTableHeader>
                <AdminTableHeader>{t("collection.owned")}</AdminTableHeader>
                <AdminTableHeader>{t("collection.duplicates")}</AdminTableHeader>
                <AdminTableHeader>{t("collection.trades")}</AdminTableHeader>
              </tr>
            </AdminTableHead>
            <tbody>
              {user.collection.items.map((item) => (
                <AdminTableRow key={item.cardId}>
                  <AdminTableCell>
                    <div className="flex items-center gap-3">
                      <StorageImage
                        url={item.artworkUrl}
                        alt={item.name}
                        className="h-12 w-10 rounded-md border"
                      />
                      <div>
                        <p className="font-medium">
                          {item.number === null
                            ? item.name
                            : `#${String(item.number).padStart(3, "0")} — ${item.name}`}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                          {item.cardId}
                        </p>
                      </div>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>{item.seasonName ?? "—"}</AdminTableCell>
                  <AdminTableCell className="font-semibold">{item.ownedQuantity}</AdminTableCell>
                  <AdminTableCell>{item.duplicateQuantity}</AdminTableCell>
                  <AdminTableCell>{item.tradeQuantity}</AdminTableCell>
                </AdminTableRow>
              ))}
            </tbody>
          </AdminTable>
        )}
      </section>
    </>
  );
}
