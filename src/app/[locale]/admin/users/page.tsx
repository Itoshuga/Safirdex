import {
  ArrowUpRight,
  Search,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
  X,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from "@/components/admin/admin-table";
import { Pagination } from "@/components/admin/pagination";
import { ProfileAvatar } from "@/components/community/profile-avatar";
import { Badge } from "@/components/ui/badge";
import { getAdminUsersPage } from "@/features/admin/users/server/user-moderation-service";
import { Link } from "@/i18n/navigation";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { LOCALE_CONFIG } from "@/lib/i18n/locales";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

function formatDate(value: string | null, locale: keyof typeof LOCALE_CONFIG) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(LOCALE_CONFIG[locale].dateLocale, {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = one(params.q).trim();
  const requestedPage = Number(one(params.page) || 1);
  const [t, locale, data] = await Promise.all([
    getTranslations("Admin.users"),
    getAdminLocale(),
    getAdminUsersPage({ query, page: requestedPage }),
  ]);
  const makeHref = (page: number) => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    next.set("page", String(page));
    return `/admin/users?${next.toString()}`;
  };

  return (
    <>
      <AdminPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />

      <form
        className="mb-4 flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row"
        method="get"
      >
        <label className="relative min-w-0 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <span className="sr-only">{t("searchLabel")}</span>
          <input
            className="admin-input pl-9"
            name="q"
            defaultValue={query}
            placeholder={t("searchPlaceholder")}
          />
        </label>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/80"
          type="submit"
        >
          <Search className="size-4" />
          {t("searchAction")}
        </button>
        {query ? (
          <Link
            href="/admin/users"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
            {t("clearSearch")}
          </Link>
        ) : null}
      </form>

      {data.items.length === 0 ? (
        <div className="grid min-h-72 place-items-center rounded-xl border border-dashed bg-card/45 px-6 py-12 text-center">
          <div>
            <span className="mx-auto mb-4 grid size-11 place-items-center rounded-xl bg-safir/10 text-safir">
              <UsersRound className="size-5" />
            </span>
            <h2 className="font-heading text-xl font-semibold">
              {query ? t("noResultsTitle") : t("emptyTitle")}
            </h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
              {query ? t("noResultsDescription") : t("emptyDescription")}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <AdminTable>
              <AdminTableHead>
                <tr>
                  <AdminTableHeader>{t("table.user")}</AdminTableHeader>
                  <AdminTableHeader>{t("table.email")}</AdminTableHeader>
                  <AdminTableHeader>{t("table.role")}</AdminTableHeader>
                  <AdminTableHeader>{t("table.status")}</AdminTableHeader>
                  <AdminTableHeader>{t("table.collection")}</AdminTableHeader>
                  <AdminTableHeader>{t("table.lastSignIn")}</AdminTableHeader>
                  <AdminTableHeader className="text-right">
                    {t("table.open")}
                  </AdminTableHeader>
                </tr>
              </AdminTableHead>
              <tbody>
                {data.items.map((user) => (
                  <AdminTableRow key={user.uid}>
                    <AdminTableCell>
                      <div className="flex items-center gap-3">
                        <ProfileAvatar
                          src={user.avatarUrl}
                          name={user.displayName}
                          className="size-10 border-2"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/admin/users/${user.uid}`}
                            className="block max-w-52 truncate font-medium hover:text-safir hover:underline"
                          >
                            {user.displayName}
                          </Link>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {user.username ? `@${user.username}` : t("missingUsername")}
                          </p>
                        </div>
                      </div>
                    </AdminTableCell>
                    <AdminTableCell>
                      <p className="max-w-60 truncate">{user.email ?? "—"}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {user.emailVerified ? t("verified") : t("unverified")}
                      </p>
                    </AdminTableCell>
                    <AdminTableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role === "admin" ? <ShieldCheck /> : null}
                        {t(`roles.${user.role}`)}
                      </Badge>
                    </AdminTableCell>
                    <AdminTableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={user.disabled ? "destructive" : "outline"}>
                          {user.disabled ? t("disabled") : t("active")}
                        </Badge>
                        {!user.onboardingCompleted ? (
                          <Badge variant="outline">{t("onboardingPending")}</Badge>
                        ) : null}
                      </div>
                    </AdminTableCell>
                    <AdminTableCell>
                      {t("cardsCount", { count: user.collectionCardsCount })}
                    </AdminTableCell>
                    <AdminTableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(user.lastSignInAtIso, locale)}
                    </AdminTableCell>
                    <AdminTableCell className="text-right">
                      <Link
                        href={`/admin/users/${user.uid}`}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label={t("openUser", { name: user.displayName })}
                      >
                        <ArrowUpRight className="size-4" />
                      </Link>
                    </AdminTableCell>
                  </AdminTableRow>
                ))}
              </tbody>
            </AdminTable>
          </div>

          <div className="space-y-2 md:hidden">
            {data.items.map((user) => (
              <Link
                key={user.uid}
                href={`/admin/users/${user.uid}`}
                className="flex items-center gap-3 rounded-xl border bg-card p-3 transition hover:border-safir/30 hover:bg-safir/3"
              >
                <ProfileAvatar
                  src={user.avatarUrl}
                  name={user.displayName}
                  className="size-11 border-2"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{user.displayName}</p>
                    {user.role === "admin" ? (
                      <ShieldCheck className="size-3.5 shrink-0 text-safir" />
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.username ? `@${user.username}` : user.email ?? user.uid}
                  </p>
                </div>
                <UserRoundCheck className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>

          <Pagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            pageSize={data.pageSize}
            makeHref={makeHref}
          />
        </>
      )}

      {data.truncated ? (
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          {t("truncated")}
        </p>
      ) : null}
    </>
  );
}
