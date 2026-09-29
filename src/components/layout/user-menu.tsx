"use client";

import { ChevronDown, Library, LogOut, Settings, ShieldCheck, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { signOut } from "firebase/auth";

import {
  ADMIN_TRANSITION_STARTED_AT_KEY,
  AdminLoadingOverlay,
} from "@/components/admin/admin-entry-transition";
import { ProfileAvatar } from "@/components/community/profile-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "@/i18n/navigation";
import { getFirebaseAuth } from "@/lib/firebase/client";

export function UserMenu({
  name,
  username,
  email,
  avatarUrl,
  isAdmin,
}: {
  name?: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
  isAdmin: boolean;
}) {
  const t = useTranslations("Navigation");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [enteringAdmin, setEnteringAdmin] = useState(false);
  const label = username ? `@${username}` : name || email?.split("@")[0] || t("account");
  const avatarName = name || username || label;

  async function handleSignOut() {
    setPending(true);
    await fetch("/api/auth/user-session", { method: "DELETE" });
    await signOut(getFirebaseAuth()).catch(() => undefined);
    router.replace("/");
    router.refresh();
  }

  function handleAdminAccess() {
    window.sessionStorage.setItem(ADMIN_TRANSITION_STARTED_AT_KEY, String(Date.now()));
    setEnteringAdmin(true);
    router.push("/admin");
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="ml-2 inline-flex h-10 items-center gap-2 border-l pl-4 text-xs font-semibold outline-none transition hover:text-safir focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t("userMenu")}
        >
          <ProfileAvatar
            src={avatarUrl}
            name={avatarName}
            className="size-7 border-0 shadow-none"
          />
          <span className="hidden max-w-28 truncate sm:inline">{label}</span>
          <ChevronDown className="hidden size-3 text-muted-foreground sm:block" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2 py-2">
              <span className="block truncate text-sm font-semibold text-foreground">{label}</span>
              {email ? <span className="mt-0.5 block truncate text-[0.68rem] font-normal">{email}</span> : null}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="px-2.5 py-2" onClick={() => router.push("/account")}>
              <UserRound aria-hidden="true" /> {t("profile")}
            </DropdownMenuItem>
            <DropdownMenuItem className="px-2.5 py-2" onClick={() => router.push("/collection")}>
              <Library aria-hidden="true" /> {t("collection")}
            </DropdownMenuItem>
            <DropdownMenuItem className="px-2.5 py-2" onClick={() => router.push("/settings/profile")}>
              <Settings aria-hidden="true" /> {t("settings")}
            </DropdownMenuItem>
            {isAdmin ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="px-2.5 py-2 font-medium text-safir focus:text-safir"
                  onClick={handleAdminAccess}
                >
                  <ShieldCheck aria-hidden="true" /> {t("admin")}
                </DropdownMenuItem>
              </>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className="px-2.5 py-2" disabled={pending} onClick={() => void handleSignOut()}>
              <LogOut aria-hidden="true" /> {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {enteringAdmin ? <AdminLoadingOverlay label={t("adminLoading")} /> : null}
    </>
  );
}
